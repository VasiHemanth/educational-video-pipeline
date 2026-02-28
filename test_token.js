require('dotenv').config();
const axios = require('axios');
const TOKEN = process.env.META_ACCESS_TOKEN;

async function checkToken() {
    try {
        console.log('Fetching /me...');
        const meRes = await axios.get(`https://graph.facebook.com/v21.0/me?access_token=${TOKEN}`);
        console.log('Me:', meRes.data);
    } catch (e) { console.error('Error /me', e.response?.data || e.message); }

    try {
        console.log('\nFetching /me/accounts...');
        const accountsRes = await axios.get(`https://graph.facebook.com/v21.0/me/accounts?access_token=${TOKEN}`);
        console.log('Accounts:', JSON.stringify(accountsRes.data, null, 2));
    } catch (e) { console.error('Error /me/accounts', e.response?.data || e.message); }
}
checkToken();
