const fs = require('fs');
const path = require('path');
const { assembleVideo } = require('./scripts/assembler');

async function test() {
    const contentPath = path.join(__dirname, 'output', 'q3_content.json');
    const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));

    // mock missing domain
    if (!content.domain) content.domain = 'GCP';

    for (const plat of ['youtube', 'meta']) {
        console.log(`\n================================`);
        console.log(`Building MP4 for ${plat.toUpperCase()}...`);
        console.log(`================================`);

        await assembleVideo(content, content.diagrams || [], null, 3, true, {
            animStyle: 'highlight',
            pauseFrames: 30,
            useHook: false,
            platform: plat
        });
    }
}

test().catch(console.error);
