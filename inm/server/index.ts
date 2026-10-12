import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { searchCases, getCaseDocument } from './services/legalApi.js';
import { caseService } from './services/caseService.js';
import { authService } from './services/authService.js';
import aiRoutes from './routes/aiRoutes.js';

import path from 'path';
import { initDb } from './db.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Database
initDb();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- Auth API ---
app.post('/api/auth/register', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const data = await authService.register(req.body);
    return res.status(201).json(data);
  } catch (err: any) {
    const msg = err.message || "Unable to create account. Please try again.";
    return res.status(400).json({
      success: false,
      message: msg,
      error: msg
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const data = await authService.login(req.body);
    return res.json(data);
  } catch (err: any) {
    const msg = err.message || "Invalid credentials.";
    return res.status(401).json({
      success: false,
      message: msg,
      error: msg
    });
  }
});

app.get('/api/auth/me', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new Error("No token provided");
    const token = authHeader.split(' ')[1];
    const user = await authService.verifyToken(token);
    return res.json(user);
  } catch (err: any) {
    return res.status(401).json({
      success: false,
      message: err.message || "Unauthorized"
    });
  }
});


import legalRoutes from './routes/legalRoutes.js';

// --- Legal API Routes ---
app.use('/api/legal', legalRoutes);


// --- Case Management API ---

app.get('/api/cases', async (req, res) => {
  try {
    const cases = await caseService.getAllCases();
    res.json(cases);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cases', async (req, res) => {
  try {
    const newCase = await caseService.createCase(req.body);
    res.json(newCase);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/cases/:id', async (req, res) => {
  try {
    const caseData = await caseService.getCaseById(req.params.id);
    res.json(caseData);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

app.put('/api/cases/:id', async (req, res) => {
  try {
    const updatedCase = await caseService.updateCase(req.params.id, req.body);
    res.json(updatedCase);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/cases/:id', async (req, res) => {
  try {
    await caseService.deleteCase(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/cases/:id/timeline', async (req, res) => {
  try {
    const timeline = await caseService.getCaseTimeline(req.params.id);
    res.json(timeline);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/cases/:id/hearings', async (req, res) => {
  try {
    const hearings = await caseService.getCaseHearings(req.params.id);
    res.json(hearings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/cases/:id/documents', async (req, res) => {
  try {
    const docs = await caseService.getCaseDocuments(req.params.id);
    res.json(docs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- AI Assistant API Routes ---
app.use('/api/ai', aiRoutes);

app.listen(PORT, () => {
  console.log(`Legal API Server running on port ${PORT}`);
});

