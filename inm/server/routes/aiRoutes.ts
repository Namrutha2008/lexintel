import { Router } from 'express';
import { openAiService } from '../services/openAiService.js';
import { aiService } from '../services/aiService.js';

const router = Router();

// POST /api/ai/chat
router.post('/chat', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  const { message, query, conversation, history, context, caseId, documentText, documentContext } = req.body;
  const userMessage = message || query;

  console.log(`[AI CHAT] Request received at POST /api/ai/chat`);
  if (userMessage) {
    console.log(`[AI CHAT] User Prompt: "${userMessage.substring(0, 80)}${userMessage.length > 80 ? '...' : ''}"`);
  }

  if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
    console.warn(`[AI CHAT] Rejected request: Missing or empty 'message' field.`);
    return res.status(400).json({
      success: false,
      error: "Missing required 'message' field in request body."
    });
  }

  try {
    console.log(`[AI CHAT] OpenAI request started for prompt length: ${userMessage.length}`);

    const result = await openAiService.chat({
      message: userMessage,
      conversation: conversation || history || [],
      context: context,
      caseId: caseId,
      documentText: documentText || documentContext
    });

    console.log(`[AI CHAT] OpenAI response received successfully.`);

    return res.json({
      success: true,
      reply: result.reply,
      answer: result.answer,
      suggestedQuestions: result.suggestedQuestions,
      sources: result.sources,
      disclaimer: result.disclaimer
    });
  } catch (error: any) {
    const errorMsg = error.message || "An unexpected error occurred while communicating with OpenAI AI provider.";
    console.error(`[AI CHAT] Error status/message: ${errorMsg}`);

    return res.status(500).json({
      success: false,
      error: errorMsg
    });
  }
});

// POST /api/ai/compare
router.post('/compare', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { caseId1, caseId2 } = req.body;
    const response = await aiService.compare(caseId1, caseId2);
    res.json({
      success: true,
      ...response
    });
  } catch (err: any) {
    console.error(`[AI COMPARE] Error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/ai/document
router.post('/document', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { documentText } = req.body;
    const response = await aiService.summarize(documentText || "");
    res.json({
      success: true,
      ...response
    });
  } catch (err: any) {
    console.error(`[AI DOCUMENT] Error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/ai/conversations
let aiConversations = [
  { id: 'conv-1', title: 'Article 21 Constitutional Research', date: '2026-10-06' },
  { id: 'conv-2', title: 'Smith vs TechCorp Contract Analysis', date: '2026-10-05' }
];

router.get('/conversations', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(aiConversations);
});

export default router;
