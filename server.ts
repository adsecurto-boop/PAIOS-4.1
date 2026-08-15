import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    // Pre-processing Emergency Red-Flag Interceptor
    const redFlagRegexes = [
      { category: 'CARDIOVASCULAR', pattern: /\b(chest pain|crushing chest|chest pressure|left arm numb|passed out|syncope)\b/i },
      { category: 'ANAPHYLAXIS', pattern: /\b(throat closing|swollen lips|swollen tongue|cannot breathe|hives all over)\b/i },
      { category: 'NEUROLOGICAL', pattern: /\b(slurred speech|face drooping|sudden vision loss|seizure|convulsing)\b/i },
      { category: 'SEROTONIN_TOXICITY', pattern: /\b(severe tremor|rigid muscles|fever and agitation|serotonin syndrome)\b/i },
      { category: 'PSYCHIATRIC_CRISIS', pattern: /\b(want to end my life|suicidal thoughts|plan to harm myself)\b/i },
    ];

    for (const flag of redFlagRegexes) {
      if (flag.pattern.test(userText)) {
        res.json({
          text: `🚨 EMERGENCY MEDICAL ALERT (${flag.category}): The symptoms you described may indicate a medical emergency. Please call emergency services (911 or 112) or go to the nearest emergency room immediately. PAIOS cannot provide emergency treatment.`,
          actionType: null,
          actionPayloadJson: null,
        });
        return;
      }
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

    let selectedModel = 'gemini-flash-latest';
    if (modelName && typeof modelName === 'string') {
      if (modelName.includes('pro')) {
        selectedModel = 'gemini-3.1-pro-preview';
      } else if (modelName.includes('3.7')) {
        selectedModel = 'gemini-3.7-flash';
      } else {
        selectedModel = 'gemini-flash-latest';
      }
    }

    const serverNow = new Date();
    const systemInstruction = `
You are PAIOS (Personal AI Operating System), a calm, highly intelligent personal productivity, life, and health assistant.
You have direct access to the user's real-time local PAIOS context (activities, timeline, tasks, health/medications, check-ins, reviews, journal).

CRITICAL HEALTH & CLINICAL SAFETY BOUNDARIES:
1. STRICT NON-PRESCRIPTIVE POLICY: NEVER suggest altering, increasing, decreasing, or stopping any medication. NEVER diagnose conditions or assert direct clinical causality.
2. MISSED DOSE PROTOCOL: NEVER tell a user to take a double dose to make up for a missed pill. Quote standard FDA leaflet guidance: "Take as soon as remembered unless close to the next scheduled dose; never double up."
3. HEALTH-AWARE TASK PRIORITIZATION: If dizziness, sedation, or grogginess is logged in the user context, advise caution regarding physical hazards (driving, heavy machinery).
4. EPISTEMIC PROVENANCE: Treat prescription records, RxNorm CUIs, and adherence logs as authoritative ground truth. Never invent missing doses or false refill numbers.

CRITICAL TIME-BASED GROUNDING RULES:
1. ALWAYS reference the explicit CURRENT LOCAL TIME & DATE METADATA provided in the context below (Server Time: ${serverNow.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} ${serverNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).
2. All advice, schedule suggestions, and reflections MUST be explicitly anchored to the user's current date and time of day.
3. Answer user questions directly, objectively, and accurately based on their real PAIOS data. Never fabricate data.

SUPPORTED STRUCTURED ACTION FORMATS (Include at the VERY END of your response if an action is requested):
[[ACTION: {"type": "ADD_TASK", "title": "Finish API testing", "category": "Testing"}]]
or
[[ACTION: {"type": "START_ACTIVITY", "name": "Study ISTQB", "category": "Study"}]]
or
[[ACTION: {"type": "SAVE_NOTE", "text": "Investigate API timeout issue"}]]
or
[[ACTION: {"type": "LOG_DOSE", "medicationName": "Sertraline 50 mg", "status": "TAKEN"}]]
or
[[ACTION: {"type": "LOG_SYMPTOM", "symptomName": "Dizziness", "severity": 3}]]

Active PAIOS Context & Metadata:
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
      console.warn(`Primary Gemini model (${selectedModel}) call failed, retrying with gemini-flash-latest:`, firstErr?.message);
      try {
        const fallbackResponse = await ai.models.generateContent({
          model: 'gemini-flash-latest',
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

// Setup server middleware and static serving
async function setupMiddleware() {
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import('vite');
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

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`PAIOS server running on http://localhost:${PORT}`);
    });
  }
}

setupMiddleware();

export default app;
