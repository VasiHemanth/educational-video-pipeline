#!/usr/bin/env node
/**
 * Meta Token Utility — check, debug, and refresh Meta API tokens
 * 
 * Usage:
 *   node scripts/meta_token.js check     — Show token info + page accounts
 *   node scripts/meta_token.js refresh   — Exchange short-lived token for long-lived (60 days)
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const axios = require('axios');
const readline = require('readline');

const TOKEN = process.env.META_ACCESS_TOKEN;
const command = process.argv[2] || 'check';

// ── CHECK ─────────────────────────────────────────────────────────────────────
async function check() {
    if (!TOKEN) {
        console.error('❌ META_ACCESS_TOKEN not set in .env');
        process.exit(1);
    }

    console.log('🔍 Token Debug Info:');
    try {
        const res = await axios.get(`https://graph.facebook.com/v21.0/debug_token?input_token=${TOKEN}&access_token=${TOKEN}`);
        const data = res.data.data;
        console.log(`   App ID     : ${data.app_id}`);
        console.log(`   Type       : ${data.type}`);
        console.log(`   Valid       : ${data.is_valid}`);
        console.log(`   Expires     : ${data.expires_at ? new Date(data.expires_at * 1000).toISOString() : 'Never'}`);
        console.log(`   Scopes      : ${(data.scopes || []).join(', ')}`);
    } catch (e) {
        console.error('   ❌ Debug token failed:', e.response?.data?.error?.message || e.message);
    }

    console.log('\n👤 User Info (/me):');
    try {
        const meRes = await axios.get(`https://graph.facebook.com/v21.0/me?access_token=${TOKEN}`);
        console.log(`   Name : ${meRes.data.name}`);
        console.log(`   ID   : ${meRes.data.id}`);
    } catch (e) {
        console.error('   ❌ /me failed:', e.response?.data?.error?.message || e.message);
    }

    console.log('\n📄 Page Accounts (/me/accounts):');
    try {
        const accountsRes = await axios.get(`https://graph.facebook.com/v21.0/me/accounts?access_token=${TOKEN}`);
        for (const page of accountsRes.data.data) {
            console.log(`   • ${page.name} (ID: ${page.id})`);
        }
        if (accountsRes.data.data.length === 0) {
            console.log('   (no pages found)');
        }
    } catch (e) {
        console.error('   ❌ /me/accounts failed:', e.response?.data?.error?.message || e.message);
    }
}

// ── REFRESH ───────────────────────────────────────────────────────────────────
async function refresh() {
    const APP_ID = process.env.META_APP_ID;
    const APP_SECRET = process.env.META_APP_SECRET;

    if (!APP_ID || !APP_SECRET) {
        console.error('❌ Missing META_APP_ID or META_APP_SECRET in .env');
        console.log('Please add them from the Meta Developer Dashboard (App Settings → Basic).');
        process.exit(1);
    }

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Paste your short-lived User Access Token from Graph API Explorer: ', async (shortToken) => {
        rl.close();

        if (!shortToken) {
            console.error('❌ Token is required');
            process.exit(1);
        }

        console.log('⏳ Exchanging for a long-lived (60-day) token...');
        try {
            const res = await axios.get('https://graph.facebook.com/v21.0/oauth/access_token', {
                params: {
                    grant_type: 'fb_exchange_token',
                    client_id: APP_ID,
                    client_secret: APP_SECRET,
                    fb_exchange_token: shortToken,
                },
            });

            const { access_token, expires_in } = res.data;
            const days = Math.floor(expires_in / 86400);

            console.log('\n✅ SUCCESS!');
            console.log('══════════════════════════════════════════════');
            console.log('NEW LONG-LIVED TOKEN:');
            console.log(access_token);
            console.log(`\nExpires in: ~${days} days`);
            console.log('══════════════════════════════════════════════');
            console.log('\n👉 Update your .env file with this new META_ACCESS_TOKEN');
        } catch (e) {
            console.error('❌ Exchange failed:', e.response?.data || e.message);
        }
    });
}

// ── DISPATCHER ────────────────────────────────────────────────────────────────
switch (command) {
    case 'check':
        check().catch(console.error);
        break;
    case 'refresh':
        refresh();
        break;
    default:
        console.log('Usage: node scripts/meta_token.js <command>');
        console.log('');
        console.log('Commands:');
        console.log('  check     Show token debug info, user info, and page accounts');
        console.log('  refresh   Exchange a short-lived token for a long-lived one (60 days)');
        process.exit(1);
}
