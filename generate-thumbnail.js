const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const questionNum = process.argv[2] || '7';

// We look for an existing props json file (from a previous pipeline run) to base the thumbnail on
const propsFile = path.join(__dirname, 'remotion', `thumb_props_q${questionNum}.json`);

if (!fs.existsSync(propsFile)) {
    console.error(`❌ Props file not found for Q${questionNum}: ${propsFile}`);
    console.error("Please run the main pipeline.js at least once for this question first.");
    process.exit(1);
}

const propsPayload = JSON.parse(fs.readFileSync(propsFile, 'utf8'));
const domainSlug = (propsPayload.content?.domain || 'GCP').replace(/[\s/]+/g, '_').replace(/[^\w-]/g, '');
const topicSlug = (propsPayload.content?.topic || 'video').replace(/[\s/]+/g, '_').replace(/[^\w-]/g, '');
const baseSlug = `${domainSlug}_${topicSlug}`;

const outputPath = path.join(__dirname, 'output_prod', 'thumbnails', `q${questionNum}_${baseSlug}_thumbnail.png`);

console.log(`📸 Regenerating Official Thumbnail for Q${questionNum}...`);

try {
    execSync(`npx remotion still src/index.ts Thumbnail "${outputPath}" --props="${propsFile}" --frame=0 -y`, {
        cwd: path.join(__dirname, 'remotion'),
        stdio: 'inherit'
    });
    console.log(`\n✅ Thumbnail saved successfully!`);
    console.log(`   📂 View it at: ${outputPath}`);
} catch (e) {
    console.warn(`\n⚠️  Failed to generate thumbnail:`, e.message);
}
