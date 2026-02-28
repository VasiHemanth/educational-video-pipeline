require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const IG_ACCOUNT_ID = process.env.IG_ACCOUNT_ID;
const FB_PAGE_ID = process.env.FB_PAGE_ID;
const TOKEN = process.env.META_ACCESS_TOKEN;

async function testUpload() {
    const videoUrl = 'https://res.cloudinary.com/deudtwqqk/video/upload/v1772129452/gcp_reel_1772129447578.mp4';

    // Load existing metadata from the previous generation
    const metadataPath = path.join(__dirname, 'output_prod', 'q2_metadata.json');
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

    console.log('Testing Facebook Upload...');
    try {
        const FormData = require('form-data');
        const form = new FormData();
        form.append('access_token', TOKEN);
        form.append('description', metadata.instagram.caption);
        const filePath = path.join(__dirname, 'output_prod', 'video', 'q2_GCP_Serverless_Architecture_on_GCP_meta.mp4');
        form.append('source', fs.createReadStream(filePath));

        const fbRes = await axios.post(`https://graph.facebook.com/v20.0/${FB_PAGE_ID}/videos`, form, {
            headers: form.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        });
        console.log(`✅ Facebook Upload Complete! Video ID: ${fbRes.data.id}`);
    } catch (err) {
        console.error('❌ Facebook Upload Failed:', err.response?.data?.error || err.message);
    }

    console.log('\nTesting Instagram Upload...');
    try {
        const encodedVideo = encodeURIComponent(videoUrl);
        const encodedCaption = encodeURIComponent(metadata.instagram.caption);
        const createUrl = `https://graph.facebook.com/v20.0/${IG_ACCOUNT_ID}/media?access_token=${TOKEN}&media_type=REELS&video_url=${encodedVideo}&caption=${encodedCaption}`;
        const containerRes = await axios.post(createUrl);
        const containerId = containerRes.data.id;
        console.log(`⏳ Container created (${containerId}). Polling...`);

        let isReady = false;
        for (let i = 0; i < 20; i++) {
            await new Promise(r => setTimeout(r, 5000));
            const statusRes = await axios.get(`https://graph.facebook.com/v20.0/${containerId}?fields=status_code&access_token=${TOKEN}`);
            console.log(`   Status: ${statusRes.data.status_code}`);
            if (statusRes.data.status_code === 'FINISHED') {
                isReady = true;
                break;
            } else if (statusRes.data.status_code === 'ERROR') {
                console.error(statusRes.data);
                throw new Error('Video processing failed on Meta servers.');
            }
        }
        if (!isReady) throw new Error('Timeout');

        const publishUrl = `https://graph.facebook.com/v20.0/${IG_ACCOUNT_ID}/media_publish?creation_id=${containerId}&access_token=${TOKEN}`;
        const publishRes = await axios.post(publishUrl);
        console.log(`✅ Instagram Upload Complete! Media ID: ${publishRes.data.id}`);
    } catch (err) {
        console.error('❌ Instagram Upload Failed:', err.response?.data?.error || err.message);
    }
}

testUpload();
