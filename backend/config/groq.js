const Groq = require('groq-sdk');
const dotenv = require('dotenv');

dotenv.config();

// Extremely defensive API key extraction to prevent trailing spaces or newlines leading to 401s
const rawKey = process.env.GROQ_API_KEY || '';
const sanitizedKey = rawKey.trim().replace(/^['"]|['"]$/g, '');

const groq = new Groq({
    apiKey: sanitizedKey
});

module.exports = groq;
