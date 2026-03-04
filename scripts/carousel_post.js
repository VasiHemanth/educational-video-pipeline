/**
 * carousel_post.js
 * Posts carousel images to Instagram and Facebook.
 * YouTube Community Post: stubbed for future (requires 500+ subscribers).
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { v2: cloudinary } = require('cloudinary');

// ── Cloudinary upload (required for Instagram — Graph API needs public URLs) ──
async function uploadImageToCloudinary(filePath, publicId) {
    const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
    const API_KEY = process.env.CLOUDINARY_API_KEY;
    const API_SECRET = process.env.CLOUDINARY_API_SECRET;

    if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
        console.log('   ⏭️  Skipping Cloudinary (missing credentials in .env)');
        return null;
    }

    cloudinary.config({ cloud_name: CLOUD_NAME, api_key: API_KEY, api_secret: API_SECRET });

    try {
        const result = await cloudinary.uploader.upload(filePath, {
            resource_type: 'image',
            public_id: publicId,
            overwrite: true,
        });
        console.log(`      📤 Cloudinary upload: ${path.basename(filePath)} → ${result.secure_url}`);
        return result.secure_url;
    } catch (err) {
        console.error(`      ❌ Cloudinary upload failed for ${path.basename(filePath)}:`, err.message);
        return null;
    }
}

// ── Instagram Carousel (Graph API) ────────────────────────────────────────────
/**
 * Posts a multi-image carousel to Instagram.
 * Requirements: each image must be hosted at a public URL (hence Cloudinary).
 *
 * @param {string[]} imagePaths - local PNG file paths
 * @param {object}   metadata   - carousel metadata from LLM
 * @param {string}   carouselId - unique identifier for Cloudinary public IDs
 */
async function postToInstagram(imagePaths, metadata, carouselId) {
    const IG_ACCOUNT_ID = process.env.IG_ACCOUNT_ID;
    const TOKEN = process.env.META_ACCESS_TOKEN;

    if (!IG_ACCOUNT_ID || !TOKEN) {
        console.log('   ⏭️  Skipping Instagram (missing IG_ACCOUNT_ID or META_ACCESS_TOKEN)');
        return { status: 'SKIPPED', url: null };
    }

    console.log('\n   📸 Uploading carousel images to Cloudinary...');
    const publicUrls = [];
    for (let i = 0; i < imagePaths.length; i++) {
        const url = await uploadImageToCloudinary(
            imagePaths[i],
            `carousel_${carouselId}_slide_${i + 1}`
        );
        if (url) publicUrls.push(url);
    }

    if (publicUrls.length < 2) {
        console.error('   ❌ Need at least 2 images for an Instagram carousel. Aborting.');
        return { status: 'FAILED', url: null };
    }

    try {
        console.log(`\n   📤 Creating ${publicUrls.length} Instagram carousel item containers...`);

        // Step 1: Create individual image containers (is_carousel_item = true)
        const containerIds = [];
        for (const imageUrl of publicUrls) {
            const res = await axios.post(
                `https://graph.facebook.com/v21.0/${IG_ACCOUNT_ID}/media`,
                null,
                {
                    params: {
                        access_token: TOKEN,
                        media_type: 'IMAGE',
                        image_url: imageUrl,
                        is_carousel_item: true,
                    },
                }
            );
            containerIds.push(res.data.id);
            console.log(`      ✅ Item container created: ${res.data.id}`);
        }

        // Step 2: Create the carousel container
        console.log('\n   🎠 Creating Instagram carousel container...');
        const carouselRes = await axios.post(
            `https://graph.facebook.com/v21.0/${IG_ACCOUNT_ID}/media`,
            null,
            {
                params: {
                    access_token: TOKEN,
                    media_type: 'CAROUSEL',
                    children: containerIds.join(','),
                    caption: metadata?.instagram?.caption || 'New AI architecture insights 🚀',
                },
            }
        );

        const carouselContainerId = carouselRes.data.id;
        console.log(`   ✅ Carousel container created: ${carouselContainerId}`);

        // Step 3: Poll until FINISHED
        console.log('   ⏳ Polling carousel processing status...');
        let isReady = false;
        for (let i = 0; i < 20; i++) {
            await new Promise(r => setTimeout(r, 5000));
            const statusRes = await axios.get(
                `https://graph.facebook.com/v21.0/${carouselContainerId}`,
                { params: { fields: 'status_code', access_token: TOKEN } }
            );
            const code = statusRes.data.status_code;
            console.log(`      Poll ${i + 1}/20: status = ${code}`);
            if (code === 'FINISHED') { isReady = true; break; }
            if (code === 'ERROR') throw new Error('Instagram carousel processing failed on Meta servers.');
        }

        if (!isReady) throw new Error('Instagram carousel processing timed out.');

        // Step 4: Publish
        console.log('   🚀 Publishing Instagram carousel...');
        const publishRes = await axios.post(
            `https://graph.facebook.com/v21.0/${IG_ACCOUNT_ID}/media_publish`,
            null,
            { params: { creation_id: carouselContainerId, access_token: TOKEN } }
        );

        const mediaId = publishRes.data.id;
        const url = `https://www.instagram.com/p/${mediaId}/`;
        console.log(`   ✅ Instagram Carousel Published! URL: ${url}`);
        return { status: 'SUCCESS', url };

    } catch (err) {
        console.error('   ❌ Instagram carousel post failed:', err.response?.data?.error || err.message);
        return { status: 'FAILED', url: null };
    }
}

// ── Facebook Multi-Image Post ─────────────────────────────────────────────────
/**
 * Posts a multi-image post to a Facebook Page.
 *
 * @param {string[]} imagePaths - local PNG file paths
 * @param {object}   metadata   - carousel metadata from LLM
 */
async function postToFacebook(imagePaths, metadata) {
    const PAGE_ID = process.env.FB_PAGE_ID;
    const USER_TOKEN = process.env.META_ACCESS_TOKEN;

    if (!PAGE_ID || !USER_TOKEN) {
        console.log('   ⏭️  Skipping Facebook (missing FB_PAGE_ID or META_ACCESS_TOKEN)');
        return { status: 'SKIPPED', url: null };
    }

    try {
        // Get Page Access Token
        const accountsRes = await axios.get(
            `https://graph.facebook.com/v21.0/me/accounts?access_token=${USER_TOKEN}`
        );
        const pageData = accountsRes.data.data.find(p => p.id === PAGE_ID);
        const PAGE_TOKEN = pageData ? pageData.access_token : USER_TOKEN;

        console.log('\n   📤 Uploading images to Facebook as unpublished photos...');
        const FormData = require('form-data');
        const photoIds = [];

        for (const imgPath of imagePaths) {
            const form = new FormData();
            form.append('access_token', PAGE_TOKEN);
            form.append('published', 'false'); // upload without publishing
            form.append('source', fs.createReadStream(imgPath));

            const res = await axios.post(
                `https://graph.facebook.com/v21.0/${PAGE_ID}/photos`,
                form,
                { headers: form.getHeaders(), maxContentLength: Infinity, maxBodyLength: Infinity }
            );
            photoIds.push({ media_fbid: res.data.id });
            console.log(`      ✅ Photo uploaded: ${res.data.id}`);
        }

        // Create a multi-photo post
        console.log('\n   📝 Creating Facebook multi-image post...');
        const postRes = await axios.post(
            `https://graph.facebook.com/v21.0/${PAGE_ID}/feed`,
            null,
            {
                params: {
                    access_token: PAGE_TOKEN,
                    message: metadata?.facebook?.caption || metadata?.instagram?.caption || 'New carousel post!',
                    attached_media: JSON.stringify(photoIds),
                },
            }
        );

        const postId = postRes.data.id;
        const url = `https://www.facebook.com/${postId.replace('_', '/posts/')}`;
        console.log(`   ✅ Facebook Post Published! ID: ${postId}`);
        return { status: 'SUCCESS', url };

    } catch (err) {
        console.error('   ❌ Facebook post failed:', err.response?.data?.error || err.message);
        return { status: 'FAILED', url: null };
    }
}

// ── YouTube Community Post (STUB — Future) ────────────────────────────────────
// TODO (future): YouTube Community Posts via YouTube Data API v3
// POST https://www.googleapis.com/youtube/v3/activities
// Requires: channel with 500+ subscribers, community posts enabled.
// Body: { kind: "youtube#bulletinActivity", snippet: { description, thumbnails } }
// Note: YouTube Community Posts API does NOT support true multi-image carousels.
// Strategy when implemented: post slide_01.png as lead image + full caption with
// link to Instagram carousel for the full experience.
async function postToYouTubeCommunity(_imagePaths, _metadata) {
    console.log('   ⏭️  YouTube Community Post: not yet implemented (channel threshold).');
    console.log('      See carousel_post.js for the TODO stub.');
    return { status: 'SKIPPED', url: null };
}

// ── Master Dispatcher ─────────────────────────────────────────────────────────
/**
 * @param {string[]} imagePaths - local PNG paths (all slides)
 * @param {object}   metadata   - { instagram: {caption}, facebook: {caption} }
 * @param {string}   carouselId - used for Cloudinary public IDs
 * @param {string[]} platforms  - e.g. ['instagram', 'facebook']
 */
async function postCarousel(imagePaths, metadata, carouselId, platforms = ['instagram', 'facebook']) {
    console.log(`\n🚀 Posting carousel: ${carouselId} to [${platforms.join(', ')}]`);

    const results = {};

    if (platforms.includes('instagram')) {
        results.instagram = await postToInstagram(imagePaths, metadata, carouselId);
    }

    if (platforms.includes('facebook')) {
        results.facebook = await postToFacebook(imagePaths, metadata);
    }

    if (platforms.includes('youtube')) {
        results.youtube = await postToYouTubeCommunity(imagePaths, metadata);
    }

    console.log('\n✅ Carousel posting complete.');
    console.log('   Results:', JSON.stringify(results, null, 4));
    return results;
}

module.exports = { postCarousel };
