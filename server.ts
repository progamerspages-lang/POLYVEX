import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';
const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  // AI Configuration status check endpoint
  app.get('/api/ai/status', (_req, res) => {
    const rawKey = process.env.GEMINI_API_KEY;
    const isConfigured = Boolean(rawKey && rawKey.trim() !== '' && rawKey !== 'MY_GEMINI_API_KEY');
    res.json({
      configured: isConfigured,
      model: 'gemini-3.8-flash',
      provider: 'Google Gemini',
      message: isConfigured
        ? 'Native server-side AI assistant active.'
        : 'External Prompt Mode active. (Server GEMINI_API_KEY not configured)'
    });
  });

  // AI Study Assistant proxy endpoint
  app.post('/api/ai/study-assist', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
      return res.status(503).json({
        configured: false,
        error: 'GEMINI_API_KEY is not configured on the server. Please use External Prompt Mode.'
      });
    }

    try {
      const {
        tool,
        courseCode,
        courseTitle,
        topic,
        difficulty = 'Intermediate',
        style = 'Step-by-step',
        numQuestions = 5,
        notes = '',
        userPrompt = ''
      } = req.body;

      if (!topic && !userPrompt && !notes) {
        return res.status(400).json({ error: 'Please specify a topic, notes, or prompt for the study assistant.' });
      }

      const systemInstruction = `You are Polyvex AI, an elite academic study tutor and revision strategist for university students (especially in Nigerian tertiary institutions like FUTO, UNILAG, UI, UNN, etc.).
Your job is to provide academically sound, clear, step-by-step explanations, practice quizzes, structured guidance, and high-efficiency revision schedules.
CRITICAL ACADEMIC INTEGRITY DIRECTIVES:
1. For laboratory and practical reports: NEVER invent, fabricate, or assume experimental measurements, observations, raw data, or specific lecturer requirements. If raw results are missing, remind the student to supply their actual recorded readings.
2. For mathematical/engineering calculations: State the formula, explain what each variable represents, substitute supplied values, show calculation steps, include units (e.g. V, A, Ω, N, J, W, kg/m³), and point out common student pitfalls.
3. For quizzes and self-tests: Always format clearly with questions first, and provide step-by-step solutions with explanations.
4. Keep explanations grounded, encouraging, and pedagogically rigorous.`;

      let promptContent = `ACADEMIC CONTEXT:
Course: ${courseCode || ''} ${courseTitle ? `(${courseTitle})` : ''}
Topic: ${topic || 'General Academic Topic'}
Assistance Tool Selected: ${tool || 'Explain a difficult topic step by step'}
Difficulty Level: ${difficulty}
Explanation Style: ${style}
Number of Questions (if applicable): ${numQuestions}

STUDENT'S SUPPLIED NOTES OR INPUT:
${notes ? notes : '(None provided)'}

SPECIFIC STUDENT QUESTION / TASK:
${userPrompt ? userPrompt : `Execute the selected study tool (${tool}) for this topic.`}

Please provide a well-structured, clear response formatted with markdown headings, bullet points, and code/math blocks where helpful.`;

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptContent,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      return res.json({
        success: true,
        text: response.text || 'No response generated.',
        tool,
        topic,
      });
    } catch (err: any) {
      console.error('Gemini API Error in /api/ai/study-assist:', err);
      const isRateLimit = err?.status === 429 || String(err).includes('429') || String(err).includes('Quota');
      return res.status(500).json({
        error: isRateLimit
          ? 'AI rate limit exceeded or quota reached. You can switch to External Prompt Mode to continue immediately.'
          : (err.message || 'Error communicating with AI service. Try External Prompt Mode.')
      });
    }
  });

  // AI-Powered Revision Planner endpoint
  app.post('/api/ai/revision-plan', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
      return res.status(503).json({
        configured: false,
        error: 'GEMINI_API_KEY is not configured on the server. Please use External Prompt Mode.'
      });
    }

    try {
      const { timeframe = 'daily', topics = [], tasks = [], dailyHours = 4, preferredFocus = 'balanced' } = req.body;

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction = `You are Polyvex AI Academic Strategist, specializing in spaced repetition, cognitive load theory, and high-yield university examination preparation.
Your goal is to synthesize the student's actual course topics, confidence scores (1=weak to 5=mastered), and imminent academic deadlines into an achievable, structured daily or weekly revision plan.
Rules:
1. Prioritize low-confidence topics (levels 1 & 2) and immediate deadlines (due within 1-4 days).
2. For each recommended study block, provide:
   - Specific time allotment (e.g. 45 min focus sprint + 10 min recall break)
   - Pedagogical rationale (why this was prioritized now)
   - Concrete action strategy (e.g., "Solve 3 past exam questions", "Derive governing formulas", "Active recall on definitions")
3. Keep the schedule realistic with transit/meal buffers to prevent cognitive burnout.`;

      const prompt = `STUDENT REVISION LOAD:
Timeframe requested: ${timeframe === 'weekly' ? '7-Day Weekly Schedule' : 'Daily Action Plan'}
Available daily study hours: ${dailyHours} hours
Focus orientation: ${preferredFocus}

TOPICS & CONFIDENCE RATINGS (1=Low, 5=Mastered):
${topics.map((t: any) => `- [${t.courseCode || 'Course'}] "${t.title}": Confidence ${t.confidence}/5, Last revised: ${t.lastRevisedDate || 'Never'}, Next review: ${t.nextRevisionDate || 'Pending'}`).join('\n')}

UPCOMING TASKS & DEADLINES:
${tasks.map((tsk: any) => `- [${tsk.courseCode || 'Course'}] "${tsk.title}" (${tsk.taskType}): Due ${tsk.dueDate || 'No date'}, Priority: ${tsk.priority}, Status: ${tsk.status}`).join('\n')}

Please construct an optimal, highly structured revision timetable with clear explanations for why each topic is placed at that specific time.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.6,
        },
      });

      return res.json({
        success: true,
        planMarkdown: response.text || '',
        timeframe,
      });
    } catch (err: any) {
      console.error('Gemini API Error in /api/ai/revision-plan:', err);
      return res.status(500).json({
        error: err.message || 'Error generating AI revision plan. Use External Prompt mode.'
      });
    }
  });

  // Mount Vite middleware in development or serve static in production
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Polyvex server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
