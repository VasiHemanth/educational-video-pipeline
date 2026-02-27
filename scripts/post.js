const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const readline = require('readline');
const { trackPosting } = require('./db');
const axios = require('axios'); // For Meta API calls
const { v2: cloudinary } = require('cloudinary');

// YouTube Setup
const SCOPES = ['https://www.googleapis.com/auth/youtube.upload'];
const TOKEN_PATH = path.join(__dirname, '..', 'youtube_tokens.json');

/**
 * Initializes the YouTube API client
 * Will trigger an interactive terminal prompt on the very first run to authorize the app.
 */
async function authorize() {
    return new Promise((resolve, reject) => {
        const credentialsFile = process.env.YOUTUBE_CLIENT_SECRET_FILE || './client_secret.json';
        const credPath = path.resolve(__dirname, '..', credentialsFile);

        if (!fs.existsSync(credPath)) {
            console.error(`❌ Missing YouTube credentials at ${credPath}`);
            return resolve(null);
        }

        const credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
        const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

        // Check if we have previously stored a token.
        fs.readFile(TOKEN_PATH, (err, token) => {
            if (err) {
                return getNewToken(oAuth2Client, resolve, reject);
            }
            oAuth2Client.setCredentials(JSON.parse(token));
            resolve(oAuth2Client);
        });
    });
}

function getNewToken(oAuth2Client, resolve, reject) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('\n======================================================');
    console.log('🔗 YOUTUBE AUTHORIZATION REQUIRED');
    console.log('Authorize this app by visiting this url:');
    console.log(authUrl);
    console.log('======================================================\n');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) {
                console.error('Error retrieving access token', err);
                return reject(err);
            }
            oAuth2Client.setCredentials(token);
            fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
            console.log(`✅ Token stored to ${TOKEN_PATH}`);
            resolve(oAuth2Client);
        });
    });
}

/**
 * Uploads a video to YouTube Shorts using the Data API v3
 */
async function uploadToYouTubeShorts(auth, filePath, metadata) {
    const youtube = google.youtube({ version: 'v3', auth });

    console.log('   📤 Uploading to YouTube Shorts...');

    try {
        const res = await youtube.videos.insert(
            {
                part: 'id,snippet,status',
                notifySubscribers: false,
                requestBody: {
                    snippet: {
                        title: metadata.youtube?.title || 'Daily Architecture Question #Shorts',
                        description: metadata.youtube?.description || 'Another great cloud architecture video!',
                        tags: metadata.youtube?.tags || ['Shorts', 'Cloud'],
                        categoryId: '27', // Education
                    },
                    status: {
                        privacyStatus: 'public', // Auto-publish directly to shorts feed
                        selfDeclaredMadeForKids: false,
                    },
                },
                media: {
                    body: fs.createReadStream(filePath),
                },
            },
            {
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            }
        );

        const shortUrl = `https://youtube.com/shorts/${res.data.id}`;
        console.log(`   ✅ YouTube Upload Complete! URL: ${shortUrl}`);
        return { status: 'SUCCESS', url: shortUrl };
    } catch (err) {
        console.error('   ❌ YouTube Upload Failed:');
        console.error(err.response?.data?.error?.message || err.message);
        return { status: 'FAILED', url: null };
    }
}

/**
 * Meta/Facebook Video API integration
 */
async function uploadToFacebook(filePath, metadata) {
    const PAGE_ID = process.env.FB_PAGE_ID;
    const USER_TOKEN = process.env.META_ACCESS_TOKEN;

    if (!PAGE_ID || !USER_TOKEN) {
        console.log('   ⏭️  Skipping Facebook (Missing FB_PAGE_ID or META_ACCESS_TOKEN in .env)');
        return { status: 'SKIPPED', url: null };
    }

    console.log('   📤 Uploading to Facebook Page...');
    try {
        // Step 0: Get Page Access Token from /me/accounts
        console.log('   🔑 Fetching Page Access Token...');
        const accountsRes = await axios.get(`https://graph.facebook.com/v21.0/me/accounts?access_token=${USER_TOKEN}`);
        const pageData = accountsRes.data.data.find(p => p.id === PAGE_ID);

        if (!pageData) {
            console.error('   ❌ Page not found in /me/accounts. Falling back to User token.');
        }
        const TOKEN = pageData ? pageData.access_token : USER_TOKEN;

        // Build FormData
        const FormData = require('form-data');
        const form = new FormData();
        form.append('access_token', TOKEN);
        form.append('description', metadata.instagram?.caption || 'New architecture video!');
        form.append('source', fs.createReadStream(filePath));

        // Start upload
        const response = await axios.post(`https://graph.facebook.com/v21.0/${PAGE_ID}/videos`, form, {
            headers: form.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        });

        const videoId = response.data.id;
        console.log(`   ✅ Facebook Upload Complete! Video ID: ${videoId}`);
        return { status: 'SUCCESS', url: `https://facebook.com/${PAGE_ID}/videos/${videoId}` };
    } catch (err) {
        console.error('   ❌ Facebook Upload Failed:', err.response?.data?.error || err.message);
        return { status: 'FAILED', url: null };
    }
}

/**
 * Meta/Instagram Graph API integration (Reels)
 */
async function uploadToInstagram(videoUrl, metadata) {
    const IG_ACCOUNT_ID = process.env.IG_ACCOUNT_ID;
    const TOKEN = process.env.META_ACCESS_TOKEN;

    if (!IG_ACCOUNT_ID || !TOKEN) {
        console.log('   ⏭️  Skipping Instagram (Missing IG_ACCOUNT_ID or META_ACCESS_TOKEN in .env)');
        return { status: 'SKIPPED', url: null };
    }

    // IMPORTANT: The Instagram Graph API requires the video to be hosted at a publicly 
    // accessible URL. Local files cannot be sent directly via multipart/form-data.
    if (!videoUrl || !videoUrl.startsWith('http')) {
        console.log('   ⏭️  Skipping Instagram (Graph API requires a public video URL, but none was provided)');
        return { status: 'SKIPPED', url: null };
    }

    console.log('   📤 Initiating Instagram Reel Upload...');
    try {
        // Step 1: Create media container
        // Build raw URL string to guarantee parameter delivery to Facebook bounds
        const encodedVideo = encodeURIComponent(videoUrl);
        const encodedCaption = encodeURIComponent(metadata.instagram?.caption || 'New architecture reel!');
        const createUrl = `https://graph.facebook.com/v21.0/${IG_ACCOUNT_ID}/media?access_token=${TOKEN}&media_type=REELS&video_url=${encodedVideo}&caption=${encodedCaption}`;

        const containerRes = await axios.post(createUrl);
        const containerId = containerRes.data.id;
        console.log(`   ⏳ Container created (${containerId}). Polling for readiness...`);

        // Step 2: Poll container status
        let isReady = false;
        for (let i = 0; i < 20; i++) { // Poll for up to ~100 seconds
            await new Promise(r => setTimeout(r, 5000));
            const statusRes = await axios.get(`https://graph.facebook.com/v21.0/${containerId}?fields=status_code&access_token=${TOKEN}`);
            if (statusRes.data.status_code === 'FINISHED') {
                isReady = true;
                break;
            } else if (statusRes.data.status_code === 'ERROR') {
                throw new Error('Video processing failed on Meta servers.');
            }
        }

        if (!isReady) throw new Error('Video processing timed out.');

        // Step 3: Publish container
        const publishUrl = `https://graph.facebook.com/v21.0/${IG_ACCOUNT_ID}/media_publish?creation_id=${containerId}&access_token=${TOKEN}`;
        const publishRes = await axios.post(publishUrl);

        console.log(`   ✅ Instagram Upload Complete! Media ID: ${publishRes.data.id}`);
        return { status: 'SUCCESS', url: `https://instagram.com/p/${publishRes.data.id}` };
    } catch (err) {
        console.error('   ❌ Instagram Upload Failed:', err.response?.data?.error || err.message);
        return { status: 'FAILED', url: null };
    }
}

/**
 * Cloudinary API integration (Temporary Video Hosting for IG)
 */
async function uploadToCloudinary(filePath) {
    const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
    const API_KEY = process.env.CLOUDINARY_API_KEY;
    const API_SECRET = process.env.CLOUDINARY_API_SECRET;

    if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
        console.log('   ⏭️  Skipping Cloudinary Upload (Missing Credentials in .env)');
        return null;
    }

    console.log('   📤 Uploading meta video to Cloudinary to generate public URL for Instagram...');
    cloudinary.config({
        cloud_name: CLOUD_NAME,
        api_key: API_KEY,
        api_secret: API_SECRET
    });

    try {
        const uploadResult = await cloudinary.uploader.upload(filePath, {
            resource_type: 'video',
            public_id: `gcp_reel_${Date.now()}`,
            overwrite: true,
            eager: [],
            transformation: []
        });

        console.log(`   ✅ Cloudinary Upload Complete! URL: ${uploadResult.secure_url}`);
        return uploadResult.secure_url;
    } catch (error) {
        console.error('   ❌ Cloudinary Upload Failed:', error.message || error);
        return null;
    }
}


/**
 * Master dispatcher
 */
async function postToAllPlatforms(videoId, renderedVideos, metadata) {
    console.log(`\n🚀 Commencing upload for Video ID: ${videoId}`);
    const platforms = Object.keys(renderedVideos);

    // ==============================================
    // YOUTUBE
    // ==============================================
    if (platforms.includes('youtube')) {
        try {
            const auth = await authorize();
            if (auth) {
                const result = await uploadToYouTubeShorts(auth, renderedVideos['youtube'], metadata);
                await trackPosting(videoId, 'YouTube', result.status, result.url);
            } else {
                console.log('   ⏭️  Skipping YouTube (Missing Credentials)');
            }
        } catch (e) {
            console.error('Error in YouTube flow:', e);
            await trackPosting(videoId, 'YouTube', 'ERROR', null);
        }
    }

    // ==============================================
    // META (FACEBOOK + INSTAGRAM)
    // ==============================================
    if (platforms.includes('meta')) {
        const metaVideoPath = renderedVideos['meta'];

        // Facebook
        const fbResult = await uploadToFacebook(metaVideoPath, metadata);
        await trackPosting(videoId, 'Facebook', fbResult.status, fbResult.url);

        // Instagram
        // We now upload the file to Cloudinary first because the Graph API requires a public URL.
        const cloudUrl = await uploadToCloudinary(metaVideoPath);
        if (cloudUrl) {
            const igResult = await uploadToInstagram(cloudUrl, metadata);
            await trackPosting(videoId, 'Instagram', igResult.status, igResult.url);
        } else {
            console.log('   ⏭️  Skipping Instagram (Requires a public video URL, Cloudinary upload failed or missing keys)');
        }
    }

    console.log('✅ Auto-posting sequence completed.\n');
}

module.exports = { postToAllPlatforms };
