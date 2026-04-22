#!/usr/bin/env node
/**
 * research.js — Automated content research helper
 *
 * Queries the DB for domain coverage gaps, reads the domain reference file,
 * and writes a q{N}_research.json brief for the AI harness to consume before
 * calling /generate-video.
 *
 * Usage:
 *   node scripts/research.js --domain GCP
 *   node scripts/research.js --domain AWS --number 42 --suggest 5
 *   node scripts/research.js --domain Kubernetes --env test
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ── Arg parsing ──────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (flag) => {
    const i = args.indexOf(flag);
    return i !== -1 && args[i + 1] ? args[i + 1] : null;
};
const hasFlag = (flag) => args.includes(flag);

const domain = getArg('--domain');
const forcedNumber = getArg('--number');
const suggestCount = parseInt(getArg('--suggest') || '8', 10);
const env = getArg('--env') || 'prod';

if (!domain) {
    console.error('\nUsage: node scripts/research.js --domain <DOMAIN> [--number N] [--suggest N] [--env test]\n');
    console.error('Domains: GCP, AWS, Azure, Kubernetes, Terraform, GenAI, SystemDesign, DevOps\n');
    process.exit(1);
}

const dbPath = env === 'test' ? 'content_tracker.sqlite' : 'prod_tracker.sqlite';
const outputDir = env === 'test' ? 'output' : 'output_prod';
const domainSlug = domain.toLowerCase()
    .replace(/generative\s*ai/i, 'genai')
    .replace(/system\s*design/i, 'system_design')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
const domainFile = path.join('domains', `${domainSlug}.md`);

// ── Read domain reference ────────────────────────────────────────────────────
let domainContext = '';
const domainFileExists = fs.existsSync(domainFile);
if (domainFileExists) {
    domainContext = fs.readFileSync(domainFile, 'utf8');
}

// ── Query DB for covered topics ──────────────────────────────────────────────
let coveredTopics = [];
let dbAvailable = false;

if (fs.existsSync(dbPath)) {
    try {
        const result = execSync(
            `sqlite3 "${dbPath}" "SELECT question_number, topic FROM videos WHERE LOWER(domain)=LOWER('${domain}') ORDER BY question_number"`,
            { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
        ).trim();

        if (result) {
            coveredTopics = result.split('\n')
                .filter(Boolean)
                .map(line => {
                    const parts = line.split('|');
                    return { number: parts[0]?.trim(), topic: parts[1]?.trim() };
                })
                .filter(t => t.topic);
        }
        dbAvailable = true;
    } catch {
        // sqlite3 not installed or DB locked — non-fatal
    }
}

// ── Get next available question number ───────────────────────────────────────
let nextNumber = forcedNumber;
if (!nextNumber && dbAvailable) {
    try {
        const maxNum = execSync(
            `sqlite3 "${dbPath}" "SELECT MAX(CAST(question_number AS INTEGER)) FROM videos"`,
            { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
        ).trim();
        nextNumber = maxNum && maxNum !== 'NULL' ? String(parseInt(maxNum, 10) + 1) : '1';
    } catch {
        nextNumber = '1';
    }
} else if (!nextNumber) {
    // Scan output_prod for the highest existing q{N}_content.json
    try {
        const files = fs.readdirSync(outputDir).filter(f => /^q\d+_content\.json$/.test(f));
        if (files.length > 0) {
            const nums = files.map(f => parseInt(f.match(/^q(\d+)/)[1], 10));
            nextNumber = String(Math.max(...nums) + 1);
        } else {
            nextNumber = '1';
        }
    } catch {
        nextNumber = '1';
    }
}

// ── Extract topic suggestions from domain file ───────────────────────────────
const coveredSet = new Set(coveredTopics.map(t => t.topic?.toLowerCase()));

const suggestedTopics = [];
if (domainContext) {
    const lines = domainContext.split('\n');
    for (const line of lines) {
        // Match bullet items: "- **Topic Name** ..." or "- Topic Name |..."
        const patterns = [
            /^[-*]\s+\*\*([^*|]+)\*\*\s*[|:—–]/,     // **Bold** with separator
            /^[-*]\s+`([^`]+)`\s*[|:—–]/,              // `code` with separator
            /^#{2,3}\s+(.+)$/,                           // ## Heading topics
        ];
        for (const pattern of patterns) {
            const match = line.match(pattern);
            if (match) {
                const topic = match[1].trim();
                if (topic.length > 2 && topic.length < 80 && !coveredSet.has(topic.toLowerCase())) {
                    suggestedTopics.push(topic);
                }
                break;
            }
        }
    }
}

// ── Extract key services and patterns from domain file ───────────────────────
const keyServices = [];
if (domainContext) {
    const serviceSection = domainContext.match(/##\s*(?:Key\s*Services|Services|Core\s*Services)([\s\S]*?)(?=\n##|\n#|$)/i);
    if (serviceSection) {
        const serviceLines = serviceSection[1].split('\n');
        for (const line of serviceLines) {
            const match = line.match(/[-*]\s+\*?\*?([A-Za-z0-9 /\-_]+)\*?\*?/);
            if (match && match[1].trim().length > 2) {
                keyServices.push(match[1].trim());
            }
        }
    }
}

// ── Compute coverage stats ───────────────────────────────────────────────────
const totalSuggested = suggestedTopics.length;
const coveragePct = totalSuggested > 0
    ? Math.round((coveredTopics.length / (coveredTopics.length + totalSuggested)) * 100)
    : null;

// ── Build research brief ─────────────────────────────────────────────────────
const brief = {
    generated_at: new Date().toISOString(),
    domain,
    suggested_question_number: nextNumber,
    coverage: {
        domain_topics_covered: coveredTopics.length,
        covered_topics: coveredTopics,
        coverage_percent: coveragePct,
        db_available: dbAvailable,
        db_path: dbPath,
    },
    suggested_topics: suggestedTopics.slice(0, suggestCount),
    all_uncovered_topics: suggestedTopics,
    key_services: keyServices.slice(0, 20),
    domain_reference: {
        available: domainFileExists,
        path: domainFile,
    },
    next_steps_for_agent: [
        `1. Pick a topic from suggested_topics (or a fresh angle not listed)`,
        `2. Run web search: "<topic> ${domain} 2025 best practices" to verify current info`,
        `3. Check for deprecated services before writing content`,
        `4. Read domain reference: ${domainFile}`,
        `5. Generate: ${outputDir}/q${nextNumber}_content.json`,
        `6. Generate: ${outputDir}/q${nextNumber}_metadata.json`,
        `7. Generate: ${outputDir}/q${nextNumber}_design.json`,
        `8. Run: node scripts/render.js --number ${nextNumber} --platform youtube --voice`,
        `9. Run: node scripts/track.js --number ${nextNumber} --domain "${domain}" --topic "<chosen topic>"`,
    ],
};

// ── Write brief ──────────────────────────────────────────────────────────────
fs.mkdirSync(outputDir, { recursive: true });
const briefPath = path.join(outputDir, `q${nextNumber}_research.json`);
fs.writeFileSync(briefPath, JSON.stringify(brief, null, 2));

// ── Print summary ────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(60)}`);
console.log(`  Research Brief — ${domain}`);
console.log(`${'─'.repeat(60)}`);
console.log(`  Brief written to : ${briefPath}`);
console.log(`  Next video #     : ${nextNumber}`);
console.log(`  Topics covered   : ${coveredTopics.length}${coveragePct !== null ? ` (${coveragePct}% of known topics)` : ''}`);
console.log(`  DB available     : ${dbAvailable ? '✓' : '✗ (will estimate from output files)'}`);
console.log(`  Domain ref file  : ${domainFileExists ? '✓ ' + domainFile : '✗ not found — agent will use web search'}`);

if (suggestedTopics.length > 0) {
    console.log(`\n  Suggested topics (uncovered):`);
    suggestedTopics.slice(0, suggestCount).forEach((t, i) => {
        console.log(`    ${String(i + 1).padStart(2)}. ${t}`);
    });
} else if (!domainFileExists) {
    console.log(`\n  No domain reference file found. Agent will determine topics via web search.`);
} else {
    console.log(`\n  All known topics in the domain file are covered. Time for fresh angles!`);
}

console.log(`\n  Next: /generate-video --number ${nextNumber} --domain ${domain}`);
console.log(`${'─'.repeat(60)}\n`);
