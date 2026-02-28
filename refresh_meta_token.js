require('dotenv').config();
const axios = require('axios');
const readline = require('readline');

/**
 * Helper to exchange a short-lived Meta User Access Token for a long-lived one (60 days).
 * 
 * Requirements in .env:
 * - META_APP_ID
 * - META_APP_SECRET
 */

const APP_ID = process.env.META_APP_ID;
const APP_SECRET = process.env.META_APP_SECRET;

async function refresh() {
    if (!APP_ID || !APP_SECRET) {
        console.error('❌ Missing META_APP_ID or META_APP_SECRET in .env');
        console.log('Please add them to your .env file from the Meta Developer Dashboard (App Settings -> Basic).');
        process.exit(1);
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question('Paste your short-lived User Access Token from Graph API Explorer: ', async (shortToken) => {
        rl.close();

        if (!shortToken) {
            console.error('❌ Token is required');
            process.exit(1);
        }

        console.log('⏳ Exchanging for a long-lived (60-day) token...');

        try {
            const res = await axios.get(`https://graph.facebook.com/v21.0/oauth/access_token`, {
                params: {
                    grant_type: 'fb_exchange_token',
                    client_id: APP_ID,
                    client_secret: APP_SECRET,
                    fb_exchange_token: shortToken
                }
            });

            const { access_token, expires_in } = res.data;
            const days = Math.floor(expires_in / 86400);

            console.log('
✅ SUCCESS!');
            console.log('======================================================');
            console.log('NEW LONG-LIVED TOKEN:');
            console.log(access_token);
            console.log(`
Expires in: ~${days} days`);
            console.log('======================================================');
            console.log('
👉 Update your .env file with this new META_ACCESS_TOKEN');
            
        } catch (e) {
            console.error('❌ Exchange failed:');
            console.error(e.response?.data || e.message);
        }
    });
}

refresh();
