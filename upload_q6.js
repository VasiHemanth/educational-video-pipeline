require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { postToAllPlatforms } = require('./scripts/post');
const { initDB } = require('./scripts/db');

async function run() {
    await initDB();

    const NUMBER = 6;
    const metadata = JSON.parse(fs.readFileSync('output_prod/q6_metadata.json', 'utf8'));

    const renderedVideos = {
        youtube: 'output_prod/video/q6_Generative_AI_Large-Scale_Foundation_Model_Training_on_Google_Cloud_GPT-scale_youtube.mp4'
    };

    const thumbnailPath = 'output_prod/thumbnails/q6_Generative_AI_Large-Scale_Foundation_Model_Training_on_Google_Cloud_GPT-scale_youtube_thumbnail.png';

    console.log('🚀 Manually triggering upload for Q6 on YouTube...');
    await postToAllPlatforms(NUMBER, renderedVideos, metadata, thumbnailPath);
    console.log('✅ Upload triggered!');
}

run().catch(console.error);
