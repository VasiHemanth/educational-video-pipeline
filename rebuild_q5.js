const fs = require('fs');
const path = require('path');
const { assembleVideo } = require('./scripts/assembler');
const { postToAllPlatforms } = require('./scripts/post');
const { initDB } = require('./scripts/db');

async function run() {
    await initDB();

    const NUMBER = 5;
    const contentPath = path.join(__dirname, 'output_prod', 'q5_content.json');
    const metadataPath = path.join(__dirname, 'output_prod', 'q5_metadata.json');

    if (!fs.existsSync(contentPath)) {
        throw new Error(`Content file not found: ${contentPath}`);
    }
    if (!fs.existsSync(metadataPath)) {
        throw new Error(`Metadata file not found: ${metadataPath}`);
    }

    const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

    console.log('📐 Refining diagrams for Remotion native rendering...');
    const { askJSON } = require('./providers/llm');
    const { remotionDslRefinementPrompt } = require('./prompts/index');
    
    const refinedDiagrams = [];
    for (const diag of content.diagrams || []) {
        console.log(`  Refining: ${diag.title}`);
        const section = content.answer_sections.find(s => s.id === diag.section_id);
        const remotionDsl = await askJSON(remotionDslRefinementPrompt(diag, section?.text, content.domain || 'GCP'));
        refinedDiagrams.push({
            ...diag,
            dsl: remotionDsl,
            isNative: true
        });
    }

    console.log('🎬 Re-assembling video for Q5 with new styles (META)...');
    
    // We use Remotion for the new styles
    const result = await assembleVideo(content, refinedDiagrams, metadata, NUMBER, true, {
        platform: 'meta',
        animStyle: 'highlight'
    });

    console.log(`✅ Video rendered: ${result.videoPath}`);
    console.log(`📸 Thumbnail ready: ${result.thumbnailPath}`);

    const renderedVideos = {
        meta: result.videoPath
    };

    console.log('🚀 Triggering upload to Meta platforms...');
    await postToAllPlatforms(NUMBER, renderedVideos, metadata, result.thumbnailPath);
    console.log('🎉 Done!');
}

run().catch(err => {
    console.error('❌ Error during rebuild/upload:', err);
    process.exit(1);
});
