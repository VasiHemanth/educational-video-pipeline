const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { v2: cloudinary } = require('cloudinary');

// Load .env manually
const envPath = path.join(__dirname, '.env');
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const idx = line.indexOf('=');
    if (idx > 0 && !line.startsWith('#')) {
        process.env[line.substring(0, idx).trim()] = line.substring(idx + 1).trim();
    }
});

const VIDEO_PATH = path.join(__dirname, 'output_prod/video/q2_GCP_Serverless_Architecture_on_GCP_meta.mp4');
const CAPTION = '☁️ GCP Serverless Architecture explained! Learn how to build scalable serverless apps on Google Cloud Platform. #GCP #Serverless #CloudArchitecture #GoogleCloud #TechEducation';

async function run() {
    const USER_TOKEN = process.env.META_ACCESS_TOKEN;
    const PAGE_ID = process.env.FB_PAGE_ID;
    const IG_ID = process.env.IG_ACCOUNT_ID;

    // ============ Step 0: Get Page Access Token ============
    console.log('🔑 Step 0: Getting Page Access Token...');
    const accountsRes = await axios.get(`https://graph.facebook.com/v21.0/me/accounts?access_token=${USER_TOKEN}`);
    const pageData = accountsRes.data.data.find(p => p.id === PAGE_ID);

    if (!pageData) {
        console.error('❌ Could not find Page in /me/accounts. Available pages:', accountsRes.data.data);
        process.exit(1);
    }

    const PAGE_TOKEN = pageData.access_token;
    console.log(`✅ Got Page Access Token for "${pageData.name}"\n`);

    // ============ Step 1: Upload to Cloudinary (for Instagram) ============
    console.log('📤 Step 1: Uploading video to Cloudinary...');
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    const uploadResult = await cloudinary.uploader.upload(VIDEO_PATH, {
        resource_type: 'video',
        public_id: `gcp_reel_q2_${Date.now()}`,
        overwrite: true,
    });
    const publicUrl = uploadResult.secure_url;
    console.log(`✅ Cloudinary URL: ${publicUrl}\n`);

    // ============ Step 2: Post to Facebook Page (using PAGE token) ============
    console.log('📤 Step 2: Posting video to Facebook Page...');
    const FormData = require('form-data');
    const form = new FormData();
    form.append('access_token', PAGE_TOKEN);
    form.append('description', CAPTION);
    form.append('source', fs.createReadStream(VIDEO_PATH));

    const fbRes = await axios.post(`https://graph.facebook.com/v21.0/${PAGE_ID}/videos`, form, {
        headers: form.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
    });
    console.log(`✅ Facebook Video ID: ${fbRes.data.id}\n`);

    // ============ Step 3: Post to Instagram as Reel (using USER token) ============
    console.log('📤 Step 3: Creating Instagram Reel container...');
    const encodedVideo = encodeURIComponent(publicUrl);
    const encodedCaption = encodeURIComponent(CAPTION);
    const createUrl = `https://graph.facebook.com/v21.0/${IG_ID}/media?access_token=${USER_TOKEN}&media_type=REELS&video_url=${encodedVideo}&caption=${encodedCaption}`;

    const containerRes = await axios.post(createUrl);
    const containerId = containerRes.data.id;
    console.log(`⏳ Container created: ${containerId}. Polling for readiness...`);

    for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const statusRes = await axios.get(`https://graph.facebook.com/v21.0/${containerId}?fields=status_code&access_token=${USER_TOKEN}`);
        console.log(`   Poll ${i + 1}: ${statusRes.data.status_code}`);
        if (statusRes.data.status_code === 'FINISHED') {
            console.log('📤 Publishing Instagram Reel...');
            const publishRes = await axios.post(`https://graph.facebook.com/v21.0/${IG_ID}/media_publish?creation_id=${containerId}&access_token=${USER_TOKEN}`);
            console.log(`✅ Instagram Media ID: ${publishRes.data.id}`);
            console.log(`\n🎉 All done! Video posted to both Facebook and Instagram!`);
            return;
        } else if (statusRes.data.status_code === 'ERROR') {
            throw new Error('Video processing failed on Meta servers.');
        }
    }
    throw new Error('Video processing timed out after 150 seconds.');
}

run().catch(err => {
    console.error('❌ Error:', err.response?.data?.error || err.message);
    process.exit(1);
});
