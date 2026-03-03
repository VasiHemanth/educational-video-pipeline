/**
 * Provider-agnostic LLM wrapper
 * 
 * SWAP PROVIDERS by changing LLM_PROVIDER in .env:
 *   LLM_PROVIDER=gemini     → Google Gemini CLI (free)
 *   LLM_PROVIDER=ollama     → Local Ollama (e.g. llama3, mistral)
 *   LLM_PROVIDER=claude     → Claude via claude CLI / Claude Code
 *   LLM_PROVIDER=anthropic  → Anthropic API directly
 */

const { execSync, exec } = require('child_process');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PROVIDER = process.env.LLM_PROVIDER || 'gemini';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1';
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3-flash';

// ─────────────────────────────────────────────
// GEMINI CLI  (google/gemini-cli — free tier)
// Install: npm install -g @google/gemini-cli
// Auth:    gemini auth login
// ─────────────────────────────────────────────
async function askGemini(prompt) {
  try {
    const { execFileSync } = require('child_process');
    const result = execFileSync('gemini', ['--model', GEMINI_MODEL, '-y', '-p', prompt], {
      maxBuffer: 10 * 1024 * 1024,
      timeout: 300000,
      encoding: 'utf8'
    }).trim();
    return result;
  } catch (error) {
    console.error("Gemini invocation failed:", error.message);
    throw error;
  }
}

// ─────────────────────────────────────────────
// OLLAMA  (local, free, privacy-first)
// Install: https://ollama.ai
// Run:     ollama pull llama3.1
// ─────────────────────────────────────────────
async function askOllama(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      options: { temperature: 0.7, num_predict: 2048 }
    });

    const url = new URL(`${OLLAMA_HOST}/api/generate`);
    const req = require(url.protocol === 'https:' ? 'https' : 'http').request({
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 11434),
      path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data).response || ''); }
        catch { reject(new Error('Ollama parse error: ' + data)); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─────────────────────────────────────────────
// CLAUDE CLI  (claude code / claude cli)
// Install: npm install -g @anthropic-ai/claude-code
// ─────────────────────────────────────────────
async function askClaude(prompt) {
  const tmpFile = `/tmp/claude_prompt_${Date.now()}.txt`;
  fs.writeFileSync(tmpFile, prompt, 'utf8');
  try {
    const result = execSync(
      `claude -p "$(cat ${tmpFile})"`,
      { maxBuffer: 10 * 1024 * 1024, timeout: 90000 }
    ).toString().trim();
    return result;
  } finally {
    fs.unlinkSync(tmpFile);
  }
}

// ─────────────────────────────────────────────
// ANTHROPIC API  (direct, needs API key)
// ─────────────────────────────────────────────
async function askAnthropic(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }]
    });
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.content?.[0]?.text || '');
        } catch { reject(new Error('Anthropic parse error: ' + data)); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─────────────────────────────────────────────
// UNIFIED INTERFACE
// ─────────────────────────────────────────────
async function ask(prompt) {
  console.log(`\n🤖 [${PROVIDER.toUpperCase()}] Generating...`);
  switch (PROVIDER) {
    case 'gemini': return askGemini(prompt);
    case 'ollama': return askOllama(prompt);
    case 'claude': return askClaude(prompt);
    case 'anthropic': return askAnthropic(prompt);
    default: throw new Error(`Unknown provider: ${PROVIDER}. Use: gemini | ollama | claude | anthropic`);
  }
}

/**
 * Ask for JSON output — strips markdown fences and parses safely
 */
async function askJSON(prompt, schema = '') {
  const jsonPrompt = `${prompt}

CRITICAL: Respond with ONLY valid JSON. No markdown, no backticks, no explanation.
${schema ? `Schema:\n${schema}` : ''}`;

  const raw = await ask(jsonPrompt);
  // Strip ```json ... ``` fences if present
  let cleaned = raw.replace(/^```(?:json)?\n?/gm, '').replace(/\n?```/gm, '').trim();
  // Fallback: extract JSON object between first { and last }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('JSON parse failed. Raw output:\n', raw);
    throw new Error('LLM did not return valid JSON. Try a more capable model.');
  }
}

/**
 * Dynamically fetch the latest Google Gemini / Vertex AI model names via web search.
 * Returns a plain-text summary string to inject into prompts.
 * Gracefully returns an empty string on any failure so the pipeline never breaks.
 */
async function askLatestModels() {
  const today = new Date().toISOString().split('T')[0];
  const searchPrompt = `
Today is ${today}.
Use your web search tool to find: "What are the latest generally available and preview Google Gemini models on Vertex AI right now?"
Return a concise bullet list (plain text, no JSON, no markdown) of model names and their approximate release dates.
Focus only on Gemini models. Do NOT include deprecated models like Gemini 1.5 Pro or PaLM.
Maximum 6 bullet points.
`;
  try {
    console.log('  🔍 Fetching latest Gemini model list via web search...');
    const result = await askGemini(searchPrompt);
    // Sanity check — must mention "Gemini" at least once and be reasonably short
    if (result && result.toLowerCase().includes('gemini') && result.length < 2000) {
      console.log('  ✅ Live model list fetched successfully.');
      return result.trim();
    }
    console.warn('  ⚠️  Web search returned unexpected content, using fallback model list.');
    return '';
  } catch (e) {
    console.warn('  ⚠️  Could not fetch latest models via web search:', e.message);
    return '';
  }
}

module.exports = { ask, askJSON, askLatestModels, PROVIDER };
