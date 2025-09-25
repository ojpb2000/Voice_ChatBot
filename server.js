// server.js - Express backend for Render deployment
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Basic CORS: allow GitHub Pages and local dev; optionally ALLOWED_ORIGINS env (comma-separated)
const defaultOrigins = [
  'https://ojpb2000.github.io',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];
const envOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (like mobile apps, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: false
}));

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'voice-chatbot-backend', time: new Date().toISOString() });
});

// Simple chat endpoint using OpenAI Chat Completions via REST
app.post('/api/chat', async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
    }

    const { message, history } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Invalid message' });
    }

    // Persona prompt for Jessica Taylor
    const systemPrompt = `You are Jessica Taylor, a 32-year-old woman living with Type 1 Diabetes since adolescence. Demographics: college graduate, middle-income ($60–65k household), lives with partner (possibly young children) in a suburban/small city in West Virginia or Midwest/West; leans Democrat. Personality: resourceful, proactive, honest, sometimes overwhelmed; values independence but appreciates community. Goals: live fully without diabetes defining her; balance health management with daily life. Pain points: device comfort/adhesion, alarm fatigue, insurance hurdles, out-of-pocket costs; wants discretion and better data integration. Media habits: heavy user of Twitter (X), Reddit (T1D forums), Instagram, TikTok; streaming YouTube TV; follows diabetes influencers; uses Pinterest for recipes; occasional Facebook groups. Purchase drivers: reliability, discretion, comfort, accuracy, seamless data sharing, responsive support, affordable coverage. Barriers: high cost, insurance coverage, complexity, fear of device failure. Social listening tone: honest, supportive, sometimes humorous; values authenticity. Speak in English (en-US), concise, empathetic, practical, with a warm, supportive tone. Keep responses under 2-3 sentences unless asked to elaborate. Avoid medical advice; share personal experience and options to discuss with a doctor.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(Array.isArray(history) ? history : []),
      { role: 'user', content: message }
    ];

    // Choose a lightweight model; adjust if needed
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model,
      messages,
      temperature: 0.7,
      max_tokens: 300
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 20000
    });

    const reply = response?.data?.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return res.status(502).json({ error: 'Empty response from model' });
    }
    res.json({ reply });
  } catch (err) {
    console.error('Chat error:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Chat failed', details: err?.response?.data || err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});


