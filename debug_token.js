require('dotenv').config();
const axios = require('axios');
const TOKEN = process.env.META_ACCESS_TOKEN;

async function check() {
    try {
        const res = await axios.get(`https://graph.facebook.com/v21.0/debug_token?input_token=${TOKEN}&access_token=${TOKEN}`);
        console.log(JSON.stringify(res.data, null, 2));
    } catch(e) {
        console.error(e.response?.data || e.message);
    }
}
check();
