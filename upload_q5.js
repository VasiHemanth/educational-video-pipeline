require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { postToAllPlatforms } = require('./scripts/post');
const { initDB } = require('./scripts/db');

async function run() {
    await initDB();

    const NUMBER = 5;
    const content = JSON.parse(fs.readFileSync('output_prod/q5_content.json', 'utf8'));

    // Use Q6001 metadata if Q5 is missing
    const metaPath = fs.existsSync('output_prod/q5_metadata.json')
        ? 'output_prod/q5_metadata.json'
        : 'output_prod/q6001_metadata.json';

    const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

    const renderedVideos = {
        youtube: 'output_prod/video/q5_Generative_AI_Managing_large_scale_Gen_AI_Project_youtube.mp4',
        meta: 'output_prod/video/q5_Generative_AI_Managing_large_scale_Gen_AI_Project_meta.mp4'
    };

    const thumbnailPath = 'output_prod/thumbnails/q5_Generative_AI_Managing_large_scale_Gen_AI_Project_meta_thumbnail.png';

    console.log('🚀 Manually triggering upload for Q5...');
    await postToAllPlatforms(NUMBER, renderedVideos, metadata, thumbnailPath);
    console.log('✅ Upload triggered!');
}

run().catch(console.error);
