/**
 * Fetches CC0 / Public Domain UI sound effects for the video assembler.
 * Usage: node download_sound_effect.js
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// FIXED: Removed the '..' so it saves directly inside your current 'education_video' folder
const SFX_DIR = path.join(__dirname, 'sample_audio_files', 'sfx');

if (!fs.existsSync(SFX_DIR)) {
    fs.mkdirSync(SFX_DIR, { recursive: true });
}

// CC0 / Open Source audio URLs
const SOUNDS = {
    'typing.wav': 'https://raw.githubusercontent.com/drachtio/drachtio-dialogflow-phone-gateway/master/sounds/keyboard-typing.wav',
    // FIXED: Replaced the broken 404 link with a reliable open-source pop/click sound
    'pop.mp3': 'https://raw.githubusercontent.com/ionden/ion.sound/master/sounds/button_tiny.mp3',
    'whoosh.wav': 'https://remotion.media/whoosh.wav'
};

async function downloadSfx() {
    console.log('🎧 Fetching open-source SFX for the assembly pipeline...\n');

    for (const [filename, url] of Object.entries(SOUNDS)) {
        const dest = path.join(SFX_DIR, filename);
        try {
            const response = await axios({
                method: 'GET',
                url: url,
                responseType: 'stream'
            });

            const writer = fs.createWriteStream(dest);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
            console.log(`✅ Downloaded: ${filename} -> ./assets/sfx/`);
        } catch (err) {
            console.error(`❌ Failed to download ${filename}:`, err.message);
        }
    }
    console.log(`\n🚀 SFX ready! You can find them at: ${SFX_DIR}`);
}

downloadSfx();