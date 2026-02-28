require('dotenv').config();
const { postToAllPlatforms } = require('./scripts/post');
const { initDB } = require('./scripts/db');
const metadata = require('./output_prod/q4_metadata.json');

const renderedVideos = {
    youtube: '/Users/hemanthvasi/Documents/Developer/education_video/output_prod/video/q4_Generative_AI_Long_Running_Agentic_Workflows_youtube.mp4',
    meta: '/Users/hemanthvasi/Documents/Developer/education_video/output_prod/video/q4_Generative_AI_Long_Running_Agentic_Workflows_meta.mp4'
};

async function go() {
    await initDB();
    await postToAllPlatforms(4, renderedVideos, metadata);
}
go();
