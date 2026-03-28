const Groq = require('groq-sdk');
const dotenv = require('dotenv');

dotenv.config();

// Extremely defensive API key extraction to prevent trailing spaces or newlines leading to 401s
const rawKey = process.env.GROQ_API_KEY || '';
const sanitizedKey = rawKey.trim().replace(/^['"]|['"]$/g, '');

console.log('--- GROQ INIT DEBUG ---');
console.log('Raw key length:', rawKey.length);
console.log('Sanitized key length:', sanitizedKey.length);
console.log('Key starts with:', sanitizedKey.substring(0, 4) + '...');
console.log('-----------------------');

if (!sanitizedKey) {
    console.error('CRITICAL: GROQ_API_KEY is missing or completely empty in this environment!');
}

const groq = new Groq({
    apiKey: sanitizedKey || 'dummy_key_to_prevent_sdk_crash_if_empty'
});

module.exports = groq;
