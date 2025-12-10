const fetch = require('node-fetch');

const BASE = 'http://localhost:4000';

async function login() {
    const res = await fetch(`${BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'sanket@gmail.com', password: 'Sanket@123' })
    });
    const data = await res.json();
    console.log('login status', res.status, data);
    return data.token;
}

async function update(token) {
    const payload = {
        detailsData: {
            about: 'Dummy about',
            location: 'Test City',
            investmentFocus: ['AI', 'SaaS'],
            interestedRounds: ['Seed'],
            stage: 'MVP',
            geography: ['Worldwide'],
            checkSize: { min: 10000, max: 500000 },
            previousInvestments: [{ companyName: 'TestCo', companyId: 'TC123', date: new Date().toISOString(), amount: 50000, docs: [] }]
        }
    };
    const res = await fetch(`${BASE}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
    });
    const data = await res.text();
    console.log('PUT status', res.status, data);
}

async function getProfile(token) {
    const res = await fetch(`${BASE}/api/profile`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.text();
    console.log('GET status', res.status, data);
}

(async function main() {
    try {
        const token = await login();
        if (!token) return console.error('No token');
        await update(token);
        await getProfile(token);
    } catch (e) { console.error(e); process.exit(1); }
})();
