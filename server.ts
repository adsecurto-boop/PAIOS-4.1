import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Endpoint: Health
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', app: 'PAIOS' });
  });

  // Cross-Device REST Sync API Store
  interface SyncRecord {
    snapshot: Record<string, any>;
    updatedAt: number;
  }

  const vaultStore = new Map<string, SyncRecord>();
  const userStore = new Map<string, SyncRecord>();
  const authStore = new Map<string, { uid: string; email: string; password?: string; displayName: string }>();

  // Vault Sync Endpoints
  app.get('/api/sync/vault/:code', (req, res) => {
    const code = req.params.code.trim().toUpperCase();
    const record = vaultStore.get(code);
    res.json({
      success: true,
      snapshot: record?.snapshot || null,
      updatedAt: record?.updatedAt || 0,
    });
  });

  app.post('/api/sync/vault/:code', (req, res) => {
    const code = req.params.code.trim().toUpperCase();
    const { snapshot } = req.body;
    if (!snapshot) {
      res.status(400).json({ error: 'Missing snapshot' });
      return;
    }
    const updatedAt = Date.now();
    vaultStore.set(code, { snapshot, updatedAt });
    res.json({ success: true, snapshot, updatedAt });
  });

  // User Cloud Sync Endpoints
  app.get('/api/sync/user/:userId', (req, res) => {
    const userId = req.params.userId.trim();
    const record = userStore.get(userId);
    res.json({
      success: true,
      snapshot: record?.snapshot || null,
      updatedAt: record?.updatedAt || 0,
    });
  });

  app.post('/api/sync/user/:userId', (req, res) => {
    const userId = req.params.userId.trim();
    const { snapshot } = req.body;
    if (!snapshot) {
      res.status(400).json({ error: 'Missing snapshot' });
      return;
    }
    const updatedAt = Date.now();
    userStore.set(userId, { snapshot, updatedAt });
    res.json({ success: true, snapshot, updatedAt });
  });

  // User Auth Endpoint
  app.post('/api/sync/auth', (req, res) => {
    const { action, email, password, displayName } = req.body;

    if (action === 'guest') {
      const guestUid = `guest_${Math.random().toString(36).substring(2, 9)}`;
      const user = { uid: guestUid, email: null, displayName: 'Guest User' };
      res.json({ success: true, user });
      return;
    }

    if (action === 'signup') {
      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }
      const lowerEmail = email.toLowerCase();
      if (authStore.has(lowerEmail)) {
        res.status(400).json({ error: 'This email is already registered. Please sign in instead.' });
        return;
      }
      const uid = `user_${Math.random().toString(36).substring(2, 11)}`;
      const newUser = { uid, email: lowerEmail, password, displayName: displayName || email.split('@')[0] };
      authStore.set(lowerEmail, newUser);
      res.json({ success: true, user: { uid: newUser.uid, email: newUser.email, displayName: newUser.displayName } });
      return;
    }

    if (action === 'login') {
      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }
      const lowerEmail = email.toLowerCase();
      const existing = authStore.get(lowerEmail);
      if (!existing || existing.password !== password) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }
      res.json({ success: true, user: { uid: existing.uid, email: existing.email, displayName: existing.displayName } });
      return;
    }

    res.status(400).json({ error: 'Invalid action' });
  });

  // API Endpoint: Gemini AI Chat
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { userText, userContext, modelName, customApiKey } = req.body;

      if (!userText || typeof userText !== 'string') {
        res.status(400).json({ error: 'userText is required' });
        return;
      }

      const apiKey = customApiKey || process.env.GEMINI_API_KEY;

      if (!apiKey) {
        res.json({
          text: "I don't have an API key configured. Please add GEMINI_API_KEY to your environment or Settings panel.",
          actionType: null,
          actionPayloadJson: null,
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      let selectedModel = 'gemini-2.5-flash';
      if (modelName && typeof modelName === 'string') {
        if (modelName.includes('pro')) {
          selectedModel = 'gemini-2.5-pro';
        } else if (modelName.includes('2.5-flash')) {
          selectedModel = 'gemini-2.5-flash';
        } else if (modelName.includes('1.5-flash')) {
          selectedModel = 'gemini-1.5-flash';
        } else {
          selectedModel = 'gemini-2.5-flash';
        }
      }

      const systemInstruction = `
You are PAIOS (Personal AI Operating System), a calm, highly intelligent personal productivity and life assistant.
You have direct access to the user's local PAIOS context (activities, timeline, tasks, goals).
Answer user questions directly, objectively, and accurately based on their real PAIOS data.
Never fabricate data or statistics.

If the user asks you to take a specific action (e.g. "Add a task to finish API testing tomorrow", "Start a 30-minute study session", "Save a note"), include a structured action block at the VERY END of your response in this exact JSON format:
[[ACTION: {"type": "ADD_TASK", "title": "Finish API testing", "category": "Testing"}]]
or
[[ACTION: {"type": "START_ACTIVITY", "name": "Study ISTQB", "category": "Study"}]]
or
[[ACTION: {"type": "SAVE_NOTE", "text": "Investigate API timeout issue"}]]

Current PAIOS User Context:
${userContext || 'No context available.'}
`.trim();

      let fullText = '';
      try {
        const response = await ai.models.generateContent({
          model: selectedModel,
          contents: userText,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });
        fullText = response.text || '';
      } catch (firstErr: any) {
        console.warn(`Primary Gemini model (${selectedModel}) call failed, retrying with gemini-2.5-flash:`, firstErr?.message);
        try {
          const fallbackResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userText,
            config: {
              systemInstruction,
              temperature: 0.7,
            },
          });
          fullText = fallbackResponse.text || '';
        } catch (retryErr: any) {
          console.error('Gemini API Fallback Retry Error:', retryErr);
          res.json({
            text: `Unable to process request with Gemini API: ${retryErr.message || 'API request failed'}. Please check your API key in Settings.`,
            actionType: null,
            actionPayloadJson: null,
          });
          return;
        }
      }

      if (!fullText) {
        fullText = 'I could not generate a response. Please check your network or API key settings.';
      }

      // Parse action block
      let actionType: string | null = null;
      let actionPayloadJson: string | null = null;
      const actionRegex = /\[\[ACTION:\s*(\{.*?\})\s*\]\]/s;
      const match = actionRegex.exec(fullText);

      if (match) {
        actionPayloadJson = match[1];
        if (actionPayloadJson.includes('ADD_TASK')) actionType = 'ADD_TASK';
        else if (actionPayloadJson.includes('START_ACTIVITY')) actionType = 'START_ACTIVITY';
        else if (actionPayloadJson.includes('SAVE_NOTE')) actionType = 'SAVE_NOTE';
      }

      const cleanText = fullText.replace(actionRegex, '').trim();

      res.json({
        text: cleanText,
        actionType,
        actionPayloadJson,
      });
    } catch (err: any) {
      console.error('Gemini API Error:', err);
      res.status(500).json({
        text: `Error communicating with AI: ${err.message || 'Internal Server Error'}`,
        actionType: null,
        actionPayloadJson: null,
      });
    }
  });

  // Vite Middleware in Dev vs Static files in Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PAIOS server running on http://localhost:${PORT}`);
  });
}

startServer();
