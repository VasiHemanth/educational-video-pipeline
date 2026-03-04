#!/usr/bin/env node
/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║   AI Cloud Architect — Carousel Generation Pipeline          ║
 * ║                                                              ║
 * ║   Two carousel types:                                        ║
 * ║     insight   → from a blog URL or topic (thought leadership)║
 * ║     technical → from existing qX_content.json               ║
 * ║                                                              ║
 * ║   Themes:                                                    ║
 * ║     insight   → Midnight Purple                              ║
 * ║     technical → Clean White Purple                           ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Usage:
 *   # Insight: from blog URL
 *   node carousel_pipeline.js --type insight --url "https://..." --id cpo-2026
 *
 *   # Insight: from topic (LLM generates content)
 *   node carousel_pipeline.js --type insight --topic "Chief Prompting Officer"
 *
 *   # Technical: reuse existing video content JSON
 *   node carousel_pipeline.js --type technical --number 5
 *
 *   # + auto-post to Instagram and Facebook
 *   node carousel_pipeline.js --type insight --url "..." --post
 *
 *   # Dry run (skip render & post — just generate JSON)
 *   node carousel_pipeline.js --type insight --topic "AI Agents" --dry-run
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { ask, askJSON } = require('./providers/llm');
const { insightCarouselPrompt, technicalCarouselPrompt, carouselMetadataPrompt } = require('./prompts/carousel');
const { renderCarousel } = require('./scripts/carousel_renderer');
const { postCarousel } = require('./scripts/carousel_post');
const { getArg, hasFlag } = require('./utils/cli');
const { ENV_NAME, OUT_DIR: BASE_OUT_DIR } = require('./utils/env');

// ── CLI args ──────────────────────────────────────────────────────────────────
const TYPE = getArg('--type') || 'insight';        // 'insight' | 'technical'
const URL_SRC = getArg('--url') || null;              // blog URL to distill
const TOPIC = getArg('--topic') || null;              // topic for LLM generation
const NUMBER = getArg('--number') || null;              // question # for technical type
const CAROUSEL_ID = getArg('--id') || `carousel_${Date.now()}`;
const DOMAIN = getArg('--domain') || 'AI';
const PROVIDER = getArg('--provider') || process.env.LLM_PROVIDER || 'gemini';
const DRY_RUN = hasFlag('--dry-run');
const AUTO_POST = hasFlag('--post');
const PLATFORMS = (getArg('--platforms') || 'instagram,facebook').split(',').map(p => p.trim());

const THEME = TYPE === 'technical' ? 'white' : 'purple';

const OUT_DIR = path.join(BASE_OUT_DIR, 'carousels', CAROUSEL_ID);
const SLIDES_PATH = path.join(OUT_DIR, 'slides.json');
const META_PATH = path.join(OUT_DIR, 'metadata.json');

if (getArg('--provider')) process.env.LLM_PROVIDER = PROVIDER;

// ── Helpers ───────────────────────────────────────────────────────────────────
async function fetchUrlContent(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                // Strip HTML tags for plain text
                const text = data
                    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .substring(0, 5000);
                resolve(text);
            });
        }).on('error', reject);
    });
}

// ── Pipeline ──────────────────────────────────────────────────────────────────
async function run() {
    fs.mkdirSync(OUT_DIR, { recursive: true });

    console.log('');
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║   Carousel Pipeline Starting                     ║');
    console.log(`║   Type      : ${TYPE.padEnd(34)}║`);
    console.log(`║   Theme     : ${THEME.padEnd(34)}║`);
    console.log(`║   Provider  : ${PROVIDER.padEnd(34)}║`);
    console.log(`║   Carousel ID: ${CAROUSEL_ID.substring(0, 33).padEnd(33)}║`);
    console.log(`║   Dry Run   : ${String(DRY_RUN).padEnd(34)}║`);
    console.log(`║   Auto-Post : ${String(AUTO_POST).padEnd(34)}║`);
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('');

    // ── STEP 1: Get source content ────────────────────────────────────────────
    let slides;

    if (TYPE === 'technical') {
        // Reuse existing video pipeline content JSON
        if (!NUMBER) {
            console.error('❌ --number is required for --type technical');
            process.exit(1);
        }
        const contentPath = path.join(BASE_OUT_DIR, `q${NUMBER}_content.json`);
        if (!fs.existsSync(contentPath)) {
            console.error(`❌ Content JSON not found: ${contentPath}`);
            console.error('   Run the video pipeline first to generate this file.');
            process.exit(1);
        }
        const contentJson = JSON.parse(fs.readFileSync(contentPath, 'utf-8'));

        console.log(`📝 STEP 1 — Generating technical carousel slides from q${NUMBER}_content.json...`);
        slides = await askJSON(technicalCarouselPrompt(contentJson, contentJson.domain || DOMAIN));

    } else {
        // Insight carousel
        let sourceText = '';

        if (URL_SRC) {
            console.log(`🌐 STEP 1 — Fetching content from URL: ${URL_SRC}`);
            sourceText = await fetchUrlContent(URL_SRC);
            console.log(`   Fetched ${sourceText.length} characters of text content.`);
        } else if (TOPIC) {
            console.log(`✍️  STEP 1 — Generating original insight content for topic: "${TOPIC}"`);
            sourceText = ''; // insightCarouselPrompt handles empty sourceText as topic-only mode
        } else {
            console.error('❌ Insight type requires either --url or --topic');
            process.exit(1);
        }

        slides = await askJSON(insightCarouselPrompt(sourceText, TOPIC || 'AI Leadership', DOMAIN));
    }

    // Validate + save slides JSON
    if (!Array.isArray(slides)) {
        console.error('❌ LLM returned invalid slides (expected JSON array). Check prompt.');
        process.exit(1);
    }
    fs.writeFileSync(SLIDES_PATH, JSON.stringify(slides, null, 2));
    console.log(`✅ Slides JSON saved: ${SLIDES_PATH} (${slides.length} slides)`);

    if (DRY_RUN) {
        console.log('\n🏁 Dry run complete. Slides JSON ready. Re-run without --dry-run to render.');
        return;
    }

    // ── STEP 2: Generate social metadata ────────────────────────────────────────
    console.log('\n📱 STEP 2 — Generating social media metadata...');
    const metadata = await askJSON(carouselMetadataPrompt(slides, TYPE, DOMAIN));
    fs.writeFileSync(META_PATH, JSON.stringify(metadata, null, 2));
    console.log(`✅ Metadata saved: ${META_PATH}`);

    // ── STEP 3: Render slides to PNG ─────────────────────────────────────────────
    console.log('\n🎨 STEP 3 — Rendering slides via Puppeteer...');
    const { renderCarousel: render } = require('./scripts/carousel_renderer');
    const imagePaths = await render(CAROUSEL_ID, slides, THEME);
    console.log(`✅ ${imagePaths.length} slides rendered.`);

    // ── STEP 4: Post (optional) ───────────────────────────────────────────────────
    if (AUTO_POST) {
        console.log('\n🚀 STEP 4 — Auto-posting to social platforms...');
        await postCarousel(imagePaths, metadata, CAROUSEL_ID, PLATFORMS);
    } else {
        console.log('\n⏭️  Skipping auto-post (no --post flag). Run with --post to publish.');
    }

    // ── Summary ──────────────────────────────────────────────────────────────────
    console.log('\n');
    console.log('🎉 Carousel Pipeline Complete!');
    console.log('─────────────────────────────────────────────────────────');
    console.log(`📄 Slides JSON  : ${SLIDES_PATH}`);
    console.log(`📱 Metadata     : ${META_PATH}`);
    console.log(`🖼️  Images       : ${OUT_DIR}/slide_01.png ... slide_${String(slides.length).padStart(2, '0')}.png`);
    console.log(`🎨 Theme        : ${THEME === 'purple' ? 'Midnight Purple (Insight)' : 'White Purple (Technical)'}`);
    console.log('─────────────────────────────────────────────────────────');
    console.log('');
    console.log('Next steps:');
    console.log('  • Review the generated PNGs in output_prod/carousels/');
    console.log('  • Post with: node carousel_pipeline.js [...same flags] --post');
    console.log('');
}

run().catch(err => {
    console.error('\n❌ Carousel pipeline failed:', err.message);
    if (process.env.DEBUG) console.error(err.stack);
    process.exit(1);
});
