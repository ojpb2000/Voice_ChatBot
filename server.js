// server.js - Express backend for Render deployment
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const WebSocket = require('ws');
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
    const systemPrompt = `You are Jessica Taylor, a 32-year-old woman living with Type 1 Diabetes since adolescence. Demographics: college graduate, middle-income ($60–65k household), lives with partner (possibly young children) in a suburban/small city in West Virginia or Midwest/West; leans Democrat. Personality: resourceful, proactive, honest, sometimes overwhelmed; values independence but appreciates community. Goals: live fully without diabetes defining her; balance health management with daily life. Pain points: device comfort/adhesion, alarm fatigue, insurance hurdles, out-of-pocket costs; wants discretion and better data integration. Media habits: heavy user of Twitter (X), Reddit (T1D forums), Instagram, TikTok; streaming YouTube TV; follows diabetes influencers; uses Pinterest for recipes; occasional Facebook groups. Purchase drivers: reliability, discretion, comfort, accuracy, seamless data sharing, responsive support, affordable coverage. Barriers: high cost, insurance coverage, complexity, fear of device failure. Social listening tone: honest, supportive, sometimes humorous; values authenticity. IMPORTANT: Always respond in English (en-US), regardless of the user's input language. If the user speaks Spanish, first interpret their intent, then answer in English. Be concise (2-3 sentences) unless asked to elaborate. Avoid medical advice; share personal experience and options to discuss with a doctor.`;

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

// Streaming chat via Server-Sent Events (SSE)
app.get('/api/chat/stream', async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
    }

    const userMessage = (req.query.message || '').toString();
    if (!userMessage) {
      return res.status(400).json({ error: 'Missing message' });
    }

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const systemPrompt = `You are Jessica Taylor, a 32-year-old woman living with Type 1 Diabetes since adolescence. Always respond in English (en-US) regardless of user language. Be concise, empathetic, and warm (2-3 sentences unless asked to elaborate). No medical advice; share personal experience and options to discuss with a doctor.`;

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        stream: true,
        max_tokens: 300
      })
    });

    if (!response.ok || !response.body) {
      res.write(`data: ${JSON.stringify({ error: 'Upstream error' })}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    const decoder = new TextDecoder('utf-8');
    const reader = response.body.getReader();
    let buffer = '';

    const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

    // Heartbeat
    const ping = setInterval(() => res.write(': ping\n\n'), 15000);

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.replace(/^data:\s*/, '');
        if (payload === '[DONE]') {
          res.write('data: [DONE]\n\n');
          clearInterval(ping);
          return res.end();
        }
        try {
          const json = JSON.parse(payload);
          const token = json?.choices?.[0]?.delta?.content;
          if (typeof token === 'string' && token.length) {
            send({ token });
          }
        } catch (e) {
          // ignore malformed lines
        }
      }
    }

    clearInterval(ping);
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    try {
      res.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (_) {}
  }
});

// Realtime API token endpoint
app.post('/api/realtime/session', async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
    }

    // Create ephemeral session token for Realtime API
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instructions: `You are Jessica Taylor, a 32-year-old woman living with Type 1 Diabetes since adolescence. Always respond in English (en-US). Be conversational, empathetic, and warm. Keep responses concise (2-3 sentences) unless asked to elaborate. Avoid medical advice; share personal experience and options to discuss with a doctor.`,
        voice: 'alloy', // Female voice
        model: 'gpt-4o-realtime-preview-2024-10-01',
        tools: [],
        tool_choice: 'auto',
        temperature: 0.7,
        max_response_output_tokens: 300
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Realtime session creation failed:', error);
      return res.status(500).json({ error: 'Failed to create realtime session' });
    }

    const data = await response.json();
    res.json({ 
      client_secret: data.client_secret,
      session_id: data.id 
    });
  } catch (err) {
    console.error('Realtime session error:', err);
    res.status(500).json({ error: 'Realtime session failed' });
  }
});

// Upgrade HTTP to WebSocket for Realtime API proxy
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (clientWs) => {
  let openaiWs = null;
  
  clientWs.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'connect') {
        // Get session token
        const apiKey = process.env.OPENAI_API_KEY;
        const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            instructions: `You are Jessica Taylor, a 32-year-old woman living with Type 1 Diabetes since adolescence. Always respond in English (en-US). Be conversational, empathetic, and warm. Keep responses concise (2-3 sentences) unless asked to elaborate. Avoid medical advice; share personal experience and options to discuss with a doctor.`,
            voice: 'alloy',
            model: 'gpt-4o-realtime-preview-2024-10-01',
            tools: [],
            tool_choice: 'auto',
            temperature: 0.7,
            max_response_output_tokens: 300
          })
        });
        
        const sessionData = await response.json();
        
        // Connect to OpenAI Realtime
        openaiWs = new WebSocket(`wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01&client_secret=${sessionData.client_secret}`);
        
        openaiWs.on('open', () => {
          clientWs.send(JSON.stringify({ type: 'connected' }));
        });
        
        openaiWs.on('message', (data) => {
          clientWs.send(data);
        });
        
        openaiWs.on('close', () => {
          clientWs.close();
        });
        
        openaiWs.on('error', (error) => {
          clientWs.send(JSON.stringify({ type: 'error', error: error.message }));
        });
        
      } else if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
        // Forward message to OpenAI
        openaiWs.send(message);
      }
      
    } catch (error) {
      clientWs.send(JSON.stringify({ type: 'error', error: error.message }));
    }
  });
  
  clientWs.on('close', () => {
    if (openaiWs) {
      openaiWs.close();
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`WebSocket proxy available on same port`);
});


