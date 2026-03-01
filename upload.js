require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { postToAllPlatforms } = require('./scripts/post');
const { initDB } = require('./scripts/db');

async function run() {
    const args = process.argv.slice(2);
    const options = {};
    for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith('--')) {
            const key = args[i].substring(2);
            const value = args[i + 1];
            options[key] = value;
            i++;
        }
    }

    const NUMBER = options.number;
    if (!NUMBER) {
        console.error('❌ Error: Missing --number argument.');
        console.log('Usage: node upload.js --number <NUMBER> [--platforms youtube,meta]');
        process.exit(1);
    }

    const platformsArg = options.platforms || 'youtube,meta';
    const targetPlatforms = platformsArg.split(',').map(p => p.trim().toLowerCase());

    await initDB();

    // 1. Find metadata
    const metadataPath = path.join('output_prod', `q${NUMBER}_metadata.json`);
    if (!fs.existsSync(metadataPath)) {
        console.error(`❌ Metadata not found: ${metadataPath}`);
        process.exit(1);
    }
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

    // 2. Find videos
    const videoDir = 'output_prod/video';
    if (!fs.existsSync(videoDir)) {
        console.error(`❌ Video directory not found: ${videoDir}`);
        process.exit(1);
    }
    const videoFiles = fs.readdirSync(videoDir);
    const renderedVideos = {};

    targetPlatforms.forEach(platform => {
        // Look for file starting with qNUMBER_ and ending with platform.mp4
        const platformFile = videoFiles.find(f =>
            f.startsWith(`q${NUMBER}_`) &&
            f.toLowerCase().endsWith(`${platform}.mp4`)
        );

        if (platformFile) {
            renderedVideos[platform] = path.join(videoDir, platformFile);
        } else {
            console.warn(`⚠️ Warning: No video found for platform '${platform}' and question q${NUMBER}`);
        }
    });

    if (Object.keys(renderedVideos).length === 0) {
        console.error('❌ Error: No matching video files found for the specified platforms.');
        process.exit(1);
    }

    // 3. Find thumbnail
    const thumbDir = 'output_prod/thumbnails';
    let thumbnailPath = null;
    if (fs.existsSync(thumbDir)) {
        const thumbFiles = fs.readdirSync(thumbDir);

        // Try platform-specific thumbnail first (e.g., q7_*_youtube_thumbnail.png)
        const primaryPlatform = targetPlatforms[0];
        const platformThumb = thumbFiles.find(f =>
            f.startsWith(`q${NUMBER}_`) &&
            f.toLowerCase().includes(`${primaryPlatform}`) &&
            f.toLowerCase().includes('thumbnail.png')
        );

        if (platformThumb) {
            thumbnailPath = path.join(thumbDir, platformThumb);
        } else {
            // Fallback to any thumbnail for this question
            const genericThumb = thumbFiles.find(f =>
                f.startsWith(`q${NUMBER}_`) &&
                f.toLowerCase().includes('thumbnail.png')
            );
            if (genericThumb) {
                thumbnailPath = path.join(thumbDir, genericThumb);
            }
        }
    }

    console.log(`🚀 Manually triggering upload for Q${NUMBER} on: ${Object.keys(renderedVideos).join(', ')}`);
    if (thumbnailPath) {
        console.log(`🖼️  Using thumbnail: ${thumbnailPath}`);
    } else {
        console.log('⚠️  No thumbnail found for this question.');
    }

    // Call the master dispatcher
    await postToAllPlatforms(NUMBER, renderedVideos, metadata, thumbnailPath);
    console.log('✅ Upload sequence triggered!');
}

run().catch(console.error);
