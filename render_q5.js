/**
 * render_q5.js — Render q5 using fixed layout (no upload)
 * Uses q5_content.json + LLM diagram refinement → Remotion render
 */
const fs = require('fs');
const path = require('path');
const { assembleVideo } = require('./scripts/assembler');

async function run() {
    const NUMBER = 5;
    const contentPath = path.join(__dirname, 'output_prod', 'q5_content.json');
    const metadataPath = path.join(__dirname, 'output_prod', 'q5_metadata.json');

    const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

    console.log('📐 Refining diagrams via LLM → Remotion native JSON...\n');
    const { askJSON } = require('./providers/llm');
    const { remotionDslRefinementPrompt } = require('./prompts/index');

    const refinedDiagrams = [];
    for (const diag of content.diagrams || []) {
        const section = content.answer_sections.find(s => String(s.id) === String(diag.section_id));
        console.log(`  🔎 Refining: "${diag.title}" (${JSON.stringify(diag).includes('->') ? 'DSL string' : 'structured spec'
            })`);
        const remotionDsl = await askJSON(
            remotionDslRefinementPrompt(diag, section?.text || section?.spoken_audio, content.domain || 'Generative AI')
        );
        console.log(`     → ${remotionDsl.nodes?.length ?? 0} nodes, direction: ${remotionDsl.direction}`);
        refinedDiagrams.push({ ...diag, dsl: remotionDsl, isNative: true });
    }

    console.log('\n🎬 Rendering Q5 video with Remotion (meta platform)...\n');

    const result = await assembleVideo(content, refinedDiagrams, metadata, NUMBER, true, {
        platform: 'meta',
        animStyle: 'highlight',
        pauseFrames: 30,
    });

    console.log(`\n🎉 Done!`);
    console.log(`   Video    → ${result.videoPath}`);
    console.log(`   Thumbnail→ ${result.thumbnailPath}`);
}

run().catch(err => {
    console.error('❌ Render failed:', err.message || err);
    process.exit(1);
});
