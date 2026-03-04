/**
 * carousel_renderer.js
 * Puppeteer-based renderer: takes slide JSON → generates 1080x1080 PNG per slide
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { OUT_DIR } = require('../utils/env');

const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'carousel_slide.html');
const OUT_BASE = path.join(OUT_DIR, 'carousels');

/**
 * Render all slides for a carousel to PNG files.
 *
 * @param {string} carouselId  - unique ID e.g. "insight_cpo_1" or "q5_technical"
 * @param {Array}  slides      - array of slide objects from LLM prompt output
 * @param {string} theme       - 'purple' (insight) or 'white' (technical)
 * @returns {string[]}         - absolute paths to generated PNG files
 */
async function renderCarousel(carouselId, slides, theme = 'purple') {
    const outDir = path.join(OUT_BASE, carouselId);
    fs.mkdirSync(outDir, { recursive: true });

    const templateHtml = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
    const outputPaths = [];

    console.log(`\n🎨 Rendering ${slides.length} slides [theme: ${theme}] → ${outDir}`);

    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--font-render-hinting=none',
        ],
    });

    try {
        const page = await browser.newPage();

        // Set exact 1080×1080 viewport
        await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });

        for (const slide of slides) {
            const slideIndex = slide.slide_index;
            const outPath = path.join(outDir, `slide_${String(slideIndex).padStart(2, '0')}.png`);

            // Safely inject slide data via a <script type="application/json"> block.
            // Direct JSON.stringify substitution breaks when content contains & < > characters.
            const slideData = { slide, theme, totalSlides: slides.length };
            const safeJson = JSON.stringify(slideData)
                .replace(/</g, '\\u003c')
                .replace(/>/g, '\\u003e')
                .replace(/&/g, '\\u0026');
            const dataScript = `<script type="application/json" id="slide-data">${safeJson}<\/script>`;
            const injectedHtml = templateHtml
                .replace('</head>', `${dataScript}\n</head>`)
                .replace('window.__SLIDE_DATA__ || {}', 'JSON.parse(document.getElementById("slide-data").textContent)');

            await page.setContent(injectedHtml, { waitUntil: 'networkidle0', timeout: 15000 });

            // Wait for Google Fonts to load
            await page.waitForFunction(() => document.fonts.ready).catch(() => { });
            await new Promise(r => setTimeout(r, 300)); // extra settle time

            await page.screenshot({
                path: outPath,
                type: 'png',
                clip: { x: 0, y: 0, width: 1080, height: 1080 },
            });

            outputPaths.push(outPath);
            console.log(`   ✅ Slide ${slideIndex}/${slides.length}: ${path.basename(outPath)}`);
        }
    } finally {
        await browser.close();
    }

    console.log(`\n✅ All ${slides.length} slides rendered → ${outDir}`);
    return outputPaths;
}

module.exports = { renderCarousel };
