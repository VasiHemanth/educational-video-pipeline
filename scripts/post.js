const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const readline = require('readline');
const { trackPosting } = require('./db');

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
    const fileSize = fs.statSync(filePath).size;

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
                        privacyStatus: 'private', // Upload as private initially
                        selfDeclaredMadeForKids: false,
                    },
                },
                media: {
                    body: fs.createReadStream(filePath),
                },
            },
            {
                // OnProgress is not perfectly supported in the standard Node.js client without custom streams,
                // but we can pass standard axios config
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            }
        );

        const shortUrl = `https://youtube.com/shorts/${res.data.id}`;
        console.log(`   ✅ YouTube Upload Complete! Draft URL: ${shortUrl}`);
        return { status: 'SUCCESS', url: shortUrl };
    } catch (err) {
        console.error('   ❌ YouTube Upload Failed:');
        console.error(err.response?.data?.error?.message || err.message);
        return { status: 'FAILED', url: null };
    }
}

/**
 * Master dispatcher
 */
async function postToAllPlatforms(videoId, filePath, metadata) {
    console.log(`\n🚀 Commencing upload for Video ID: ${videoId}`);
    console.log(`   File: ${filePath}`);

    // 1. YouTube Shorts
    try {
        const auth = await authorize();
        if (auth) {
            const result = await uploadToYouTubeShorts(auth, filePath, metadata);
            await trackPosting(videoId, 'YouTube', result.status, result.url);
        } else {
            console.log('   ⏭️  Skipping YouTube (Missing Credentials)');
        }
    } catch (e) {
        console.error('Error in YouTube flow:', e);
        await trackPosting(videoId, 'YouTube', 'ERROR', null);
    }

    console.log('✅ Auto-posting sequence completed.\n');
}

module.exports = { postToAllPlatforms };
