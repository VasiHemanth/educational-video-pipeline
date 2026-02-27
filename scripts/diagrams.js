/**
 * Diagram Renderer
 * Supports two backends:
 *   1. Excalidraw: LLM-generated DSL → excalidraw-flowchart CLI → .excalidraw → PNG
 *   2. Mermaid:    LLM-generated Mermaid DSL → mmdc CLI → PNG (colorful, reliable)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'output_prod', 'diagrams');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
const MERMAID_CONFIG = path.join(__dirname, 'mermaid-config.json');

// ══════════════════════════════════════════════════════════════════════════════
// EXCALIDRAW BACKEND (original)
// ══════════════════════════════════════════════════════════════════════════════

function dslToExcalidraw(dsl, outputName) {
  const outPath = path.join(OUTPUT_DIR, `${outputName}.excalidraw`);

  const tmpDsl = `/tmp/diagram_${outputName}.dsl`;
  fs.writeFileSync(tmpDsl, dsl, 'utf8');

  console.log(`  📐 Rendering diagram: ${outputName}`);
  try {
    execSync(
      `npx @swiftlysingh/excalidraw-cli create --stdin -o "${outPath}"`,
      { input: dsl, stdio: ['pipe', 'pipe', 'pipe'], timeout: 30000 }
    );
    console.log(`  ✅ Excalidraw file: ${outPath}`);
    return outPath;
  } catch (err) {
    console.error(`  ❌ Excalidraw CLI error:`, err.stderr?.toString() || err.message);
    throw err;
  } finally {
    if (fs.existsSync(tmpDsl)) fs.unlinkSync(tmpDsl);
  }
}

async function excalidrawToPng(excalidrawPath, outputName) {
  const pngPath = path.join(OUTPUT_DIR, `${outputName}.png`);

  try {
    const puppeteer = require('puppeteer');
    const excalidrawData = fs.readFileSync(excalidrawPath, 'utf8');

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 2 });
    await page.goto('https://excalidraw.com', { waitUntil: 'networkidle2', timeout: 30000 });

    const pngBase64 = await page.evaluate(async (data) => {
      const { exportToBlob } = await import('https://esm.sh/@excalidraw/excalidraw');
      const parsed = JSON.parse(data);
      const blob = await exportToBlob({
        elements: parsed.elements,
        appState: { ...parsed.appState, exportWithDarkMode: false },
        files: parsed.files || {}
      });
      return new Promise(res => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result.split(',')[1]);
        reader.readAsDataURL(blob);
      });
    }, excalidrawData);

    await browser.close();
    fs.writeFileSync(pngPath, Buffer.from(pngBase64, 'base64'));
    console.log(`  🖼️  PNG exported: ${pngPath}`);
    return pngPath;

  } catch (puppeteerErr) {
    console.log(`  ⚠️  Puppeteer failed (${puppeteerErr.message}), trying CLI export...`);
    try {
      execSync(
        `npx @swiftlysingh/excalidraw-cli export "${excalidrawPath}" -o "${pngPath}" --format png`,
        { timeout: 30000 }
      );
      return pngPath;
    } catch {
      console.warn(`  ⚠️  PNG export failed. Using placeholder.`);
      createPlaceholderPng(pngPath, outputName);
      return pngPath;
    }
  }
}

function createPlaceholderPng(pngPath, label) {
  // Create a simple PNG using canvas if available, or generate SVG for reference
  try {
    const { createCanvas } = require('canvas');
    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#E8F0FE';
    ctx.beginPath();
    ctx.roundRect(0, 0, 800, 400, 16);
    ctx.fill();

    // Title
    ctx.fillStyle = '#4285F4';
    ctx.font = 'bold 28px Roboto, Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, 400, 180);

    // Subtitle
    ctx.fillStyle = '#5F6368';
    ctx.font = '16px Roboto, Arial';
    ctx.fillText('Diagram rendering in progress', 400, 230);

    fs.writeFileSync(pngPath, canvas.toBuffer('image/png'));
  } catch {
    // Canvas not available — write SVG as reference
    const svgPath = pngPath.replace('.png', '_placeholder.svg');
    const svg = `<svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="400" fill="#E8F0FE" rx="16"/>
  <text x="400" y="190" text-anchor="middle" font-family="Roboto, Arial" font-size="28" fill="#4285F4" font-weight="bold">${label}</text>
  <text x="400" y="230" text-anchor="middle" font-family="Roboto, Arial" font-size="16" fill="#5F6368">Diagram rendering in progress</text>
</svg>`;
    fs.writeFileSync(svgPath, svg);
    // Try converting with ffmpeg
    try {
      execSync(`/opt/homebrew/bin/ffmpeg -i "${svgPath}" "${pngPath}" -y 2>/dev/null`);
    } catch {
      // PNG won't exist — assembler will skip it gracefully
    }
  }
}

async function excalidrawDslToPng(dsl, outputName) {
  const excalidrawPath = dslToExcalidraw(dsl, outputName);
  return excalidrawToPng(excalidrawPath, outputName);
}

// ══════════════════════════════════════════════════════════════════════════════
// MERMAID BACKEND (new, colorful, reliable)
// ══════════════════════════════════════════════════════════════════════════════

async function mermaidToPng(dsl, outputName) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const mmdPath = path.join(OUTPUT_DIR, `${outputName}.mmd`);
  const pngPath = path.join(OUTPUT_DIR, `${outputName}.png`);

  // Clean DSL: strip markdown fences if LLM wrapped them
  let cleanDsl = dsl.trim();
  if (cleanDsl.startsWith('```')) {
    cleanDsl = cleanDsl.replace(/^```(?:mermaid)?\n?/i, '').replace(/\n?```$/i, '').trim();
  }

  // Auto-detect non-Mermaid DSL and convert to valid Mermaid
  if (!cleanDsl.startsWith('flowchart') && !cleanDsl.startsWith('graph') && !cleanDsl.startsWith('sequenceDiagram')) {
    console.log(`  ⚠️  DSL is not valid Mermaid, auto-converting...`);
    // Parse Excalidraw-style DSL: (A) -> [B] -> [[C]]
    const nodes = [];
    const arrows = [];
    // Extract labels from brackets: [Label], (Label), [[Label]], {Label}
    const labelRegex = /[\[\(\{]+([^\]\)\}]+)[\]\)\}]+/g;
    let match;
    while ((match = labelRegex.exec(cleanDsl)) !== null) {
      const label = match[1].replace(/[\[\]\(\)\{\}]/g, '').trim();
      if (label && !nodes.includes(label)) nodes.push(label);
    }

    // Build flowchart with auto-detected nodes
    const colors = ['#4285F4', '#EA4335', '#34A853', '#FBBC04', '#4285F4'];
    const strokes = ['#2A6DD9', '#C5221F', '#1E8E3E', '#E8A400', '#2A6DD9'];
    let mermaid = 'flowchart LR\n';
    const ids = nodes.map((_, i) => String.fromCharCode(65 + i));

    for (let i = 0; i < nodes.length; i++) {
      const shape = i === 0 ? `([${nodes[i]}])` :
        i === nodes.length - 1 ? `[(${nodes[i]})]` :
          `[${nodes[i]}]`;
      if (i > 0) {
        mermaid += `  ${ids[i - 1]} --> ${ids[i]}${shape}\n`;
      } else {
        mermaid += `  ${ids[i]}${shape}\n`;
      }
    }
    // Add styles
    for (let i = 0; i < nodes.length; i++) {
      const ci = i % colors.length;
      mermaid += `  style ${ids[i]} fill:${colors[ci]},stroke:${strokes[ci]},color:#fff\n`;
    }
    cleanDsl = mermaid;
  }

  fs.writeFileSync(mmdPath, cleanDsl, 'utf8');
  console.log(`  📐 Rendering Mermaid diagram: ${outputName}`);

  try {
    execSync(
      `npx mmdc -i "${mmdPath}" -o "${pngPath}" -c "${MERMAID_CONFIG}" -w 1200 -H 800 -b white -s 2`,
      { stdio: ['pipe', 'pipe', 'pipe'], timeout: 30000 }
    );
    console.log(`  🖼️  Mermaid PNG exported: ${pngPath}`);
    return pngPath;
  } catch (err) {
    console.error(`  ❌ Mermaid CLI error:`, err.stderr?.toString() || err.message);
    console.warn(`  ⚠️  Falling back to placeholder.`);
    createPlaceholderPng(pngPath, outputName);
    return pngPath;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// DISPATCHER
// ══════════════════════════════════════════════════════════════════════════════

async function dslToPng(dsl, outputName, mode = 'excalidraw') {
  if (mode === 'mermaid') {
    return mermaidToPng(dsl, outputName);
  }
  return excalidrawDslToPng(dsl, outputName);
}

async function renderAllDiagrams(content, mode = 'excalidraw') {
  const results = [];
  for (const diagram of content.diagrams || []) {
    const name = `q${content.question_number}_diagram_${diagram.id}`;
    console.log(`\n📊 Rendering: ${diagram.title}`);
    const pngPath = await dslToPng(diagram.dsl, name, mode);
    results.push({ ...diagram, png_path: pngPath });
  }
  return results;
}

module.exports = { dslToExcalidraw, excalidrawToPng, dslToPng, mermaidToPng, renderAllDiagrams };
