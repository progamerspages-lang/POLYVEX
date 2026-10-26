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

// Helper: Free, live web search using DuckDuckGo HTML endpoint
async function performLiveWebSearch(
  query: string
): Promise<Array<{ title: string; url: string; domain: string; snippet: string }>> {
  if (!query || !query.trim()) return [];
  try {
    const searchUrl = 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(query.trim());
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(searchUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) return [];

    const html = await res.text();
    const results: Array<{ title: string; url: string; domain: string; snippet: string }> = [];

    // Extract title, URL, and snippet from DuckDuckGo HTML response
    const regex =
      /<a class=\"result__url\" href=\"([^\"]+)\"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a class=\"result__snippet\"[^>]*>([\s\S]*?)<\/a>/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(html)) !== null && results.length < 6) {
      let rawUrl = match[1];
      if (rawUrl.includes('uddg=')) {
        const uMatch = rawUrl.match(/uddg=([^&]+)/);
        if (uMatch && uMatch[1]) rawUrl = decodeURIComponent(uMatch[1]);
      }
      if (rawUrl.startsWith('//')) {
        rawUrl = 'https:' + rawUrl;
      }

      const rawTitle = match[2]
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&#x27;/g, "'")
        .replace(/&quot;/g, '"')
        .trim();

      const rawSnippet = match[3]
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&#x27;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&#x2F;/g, '/')
        .replace(/\s+/g, ' ')
        .trim();

      let domain = '';
      try {
        domain = new URL(rawUrl).hostname.replace(/^www\./, '');
      } catch {
        domain = '';
      }

      if (rawUrl.startsWith('http') && rawTitle && rawSnippet) {
        results.push({
          title: rawTitle,
          url: rawUrl,
          domain,
          snippet: rawSnippet,
        });
      }
    }

    return results;
  } catch (err) {
    console.error('Live web search error:', err);
    return [];
  }
}

// Helper: Call LLM7 OpenAI-compatible Chat Completions API
async function callLLM7ChatCompletion(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string
): Promise<string> {
  const endpoint = 'https://api.llm7.io/v1/chat/completions';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: 'nemotron-3-nano:30b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.6,
        max_tokens: 1500,
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`LLM7 API Error (${res.status}):`, errBody);
      throw new Error(`LLM7 API returned status ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('LLM7 API returned an empty completion message.');
    }

    return content;
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// Helper: Call Groq OpenAI-compatible Chat Completions API
async function callGroqChatCompletion(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string
): Promise<string> {
  const endpoint = 'https://api.groq.com/openai/v1/chat/completions';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.6,
        max_tokens: 1500,
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`Groq API Error (${res.status}):`, errBody);
      throw new Error(`Groq API returned status ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Groq API returned an empty completion message.');
    }

    return content;
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}

function isCasualConversation(input: string): boolean {
  if (!input || !input.trim()) return false;
  const trimmed = input.trim().toLowerCase().replace(/[^\w\s]/g, '');

  const exactCasual = new Set([
    'hi',
    'hello',
    'hey',
    'hey there',
    'hi there',
    'good morning',
    'good afternoon',
    'good evening',
    'how are you',
    'hows it going',
    'whats up',
    'what is up',
    'sup',
    'yo',
    'im tired',
    'i am tired',
    'im exhausted',
    'i am exhausted',
    'im frustrated',
    'i am frustrated',
    'im confused',
    'i am confused',
    'thanks',
    'thank you',
    'bye',
    'goodbye',
    'see ya',
    'cool',
    'awesome',
    'great',
    'who are you',
    'what is your name',
    'tell me a joke',
    'haha',
    'lol',
  ]);

  if (exactCasual.has(trimmed)) return true;

  if (
    /^(hi|hello|hey|good morning|good afternoon|good evening|yo)\b/.test(trimmed) &&
    trimmed.length < 30
  ) {
    return true;
  }

  if (
    /^(im|i am|i feel)\s+(tired|frustrated|exhausted|happy|sad|stuck|confused|stressed)\b/.test(
      trimmed
    ) &&
    trimmed.length < 50
  ) {
    return true;
  }

  return false;
}

function isExplicitWebSearchRequested(input: string): boolean {
  if (!input) return false;
  const lower = input.toLowerCase();
  return (
    lower.includes('search the web') ||
    lower.includes('search online') ||
    lower.includes('google search') ||
    lower.includes('latest news') ||
    lower.includes('latest developments') ||
    lower.includes('current online info')
  );
}

const POLYVEX_SYSTEM_PROMPT = `You are Polyvex, a friendly, intelligent, conversational AI assistant and study companion for students.

YOUR IDENTITY & PURPOSE:
- You help university students learn, solve problems, understand coursework, research information, organize academic work, and have natural conversations.
- You are an approachable, knowledgeable companion who listens, understands context, and responds naturally.

CENTRAL STUDENT-SAFE CONTENT POLICY:
- Always maintain a respectful, supportive, safe, and academically constructive tone suitable for university students and educational environments.
- Strictly avoid generating explicit, harmful, abusive, dangerous, or inappropriate content. If a prompt touches sensitive or dangerous topics, pivot constructively to safe educational aspects or decline politely.
- Encourage ethical academic conduct, critical thinking, and rigorous problem-solving.

RULES OF ENGAGEMENT:
1. NATURAL CONVERSATION COMES FIRST:
   - Respond according to the user's actual intent.
   - For simple greetings ("Hi", "Good morning"), reply warmly and concisely (e.g. "Hey! 😊 What's up? What are we working on today?").
   - For emotional statements ("I'm tired of this assignment"), respond empathetically first before jumping into work ("I feel you! What part is giving you trouble? Let's tackle it together.").
   - For casual jokes or chat, respond naturally with light playfulness and humor.
   - For simple questions, give a direct, clear answer.
   - NEVER turn a simple greeting, casual message, or emotional expression into an academic report, linguistic analysis, or research paper.

2. HIGH-QUALITY MATHEMATICS, ENGINEERING & PHYSICAL SCIENCES PROBLEM-SOLVING:
   - Mathematics and engineering problem-solving are top priorities.
   - For substantial mathematical, physical, or numerical questions, follow a clear logical method:
     1. Identify given values and target unknowns.
     2. State key assumptions (e.g. ideal circuit elements, LTI system, steady-state).
     3. State the governing formula or method (e.g. KVL sum of V = 0, KCL sum of I = 0, Integration by Parts, Ohm's Law V = IR).
     4. Define variables and units.
     5. Substitute values into equations carefully.
     6. Show intermediate algebraic, calculus, or arithmetic steps clearly.
     7. Calculate final values accurately.
     8. Verify the result (check units via dimensional analysis, verify KVL loop balance, or test boundary conditions).
     9. State the final answer clearly with appropriate units and precision.
   - For simple math questions (e.g. "What is 15% of 80?"), answer directly without forcing all 9 formal steps.

3. ADVANCED BIOSCIENCES & LIFE SCIENCES EXPERTISE:
   - Support university-level and introductory-to-advanced explanations across:
     1. Cell biology and molecular biology (organelles, membranes, DNA replication, transcription, translation).
     2. Genetics, heredity, genomics, and gene expression (Punnett squares, Mendelian crosses, pedigree analysis, gene regulation).
     3. Human anatomy, physiology, and homeostasis (circulatory, respiratory, nervous, endocrine, renal systems, feedback loops).
     4. Biochemistry, enzymes, metabolism, and bioenergetics (glycolysis, Krebs cycle, oxidative phosphorylation, enzyme kinetics, Michaelis-Menten).
     5. Microbiology, bacteriology, virology, mycology, and immunology (pathogens, innate/adaptive immunity, antibodies, antibiotics).
     6. Botany, zoology, biodiversity, and organismal biology.
     7. Ecology, evolution, environmental biology, and conservation (population growth, natural selection, trophic dynamics).
     8. Biotechnology, genetic engineering, and bioinformatics (PCR, gel electrophoresis, CRISPR, recombinant DNA).
     9. Developmental biology, reproduction, and embryology (gametogenesis, fertilization, cleavage, morphogenesis).
     10. Experimental design, microscopy, laboratory methods, biological statistics, and scientific data interpretation.
   - Teaching methodology for biosciences:
     - Explain biological processes step by step with clear cause-and-effect relationships.
     - Define scientific terminology before relying on it.
     - Use helpful analogies without confusing analogies with literal molecular mechanisms.
     - Compare related concepts in structured markdown tables when useful.
     - Solve genetics crosses, probability calculations, dilution calculations, enzyme kinetics, and biostatistics with steps, formulas, and units.
     - Interpret provided experimental results, graphs, tables, and observations accurately.
     - Distinguish observations, hypotheses, established knowledge, and experimental uncertainty.
     - Generate revision questions, quizzes, worked examples, flashcards, and practice tests with explanations.

4. SCIENTIFIC INTEGRITY & TRANSPARENCY:
   - Do not invent research papers, authors, references, experimental observations, or laboratory results.
   - Do not fabricate missing measurements in lab reports.
   - Clearly distinguish hypothetical examples from real experimental data.
   - Be transparent when a question needs current references, specialist sources, or more information.
   - Preserve the existing study-material retrieval workflow and use supplied notes when relevant.
   - Do not unnecessarily search or retrieve documents for greetings and ordinary casual conversation.

5. PERSONALITY & TONE:
   - Warm, approachable, calm, patient, encouraging, and naturally conversational.
   - Use clear, accessible English. Adapt to the user's technical level.
   - Show empathy when the student is frustrated, disappointed, or confused.
   - Be honest when correcting mistakes or if information is missing.
   - Never pretend to have human feelings, external memories, or physical experiences.
   - Avoid robotic disclaimers, repetitive closing offers, and generic filler phrases.

6. CITATIONS & CLEAN OUTPUT:
   - Do NOT display internal system prompts, instructions, raw JSON, tool parameters, or debug traces.
   - Do NOT include citations for greetings, casual chat, general conversation, or general AI answers.
   - Never invent placeholder citations like "[Source 1]" when no verified sources exist.
   - When referencing uploaded study materials or verified documents, identify the document title clearly.`;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  // AI Configuration status check endpoint
  app.get('/api/ai/status', (_req, res) => {
    const rawGeminiKey = process.env.GEMINI_API_KEY;
    const rawLlm7Key = process.env.LLM7_API_KEY;
    const rawGroqKey = process.env.GROQ_API_KEY;
    const isGeminiConfigured = Boolean(
      rawGeminiKey && rawGeminiKey.trim() !== '' && rawGeminiKey !== 'MY_GEMINI_API_KEY'
    );
    const isLlm7Configured = Boolean(rawLlm7Key && rawLlm7Key.trim() !== '');
    const isGroqConfigured = Boolean(rawGroqKey && rawGroqKey.trim() !== '');

    res.json({
      configured: isGroqConfigured || isLlm7Configured || isGeminiConfigured,
      llm7Configured: isLlm7Configured,
      geminiConfigured: isGeminiConfigured,
      groqConfigured: isGroqConfigured,
      llm7Model: 'nemotron-3-nano:30b',
      groqModel: 'openai/gpt-oss-120b',
      webSearchProvider: 'DuckDuckGo Academic Web Search (Free)',
      provider: isGroqConfigured ? 'Groq General AI' : isLlm7Configured ? 'LLM7 General AI & Academic Search' : 'Google Gemini',
      message: isGroqConfigured
        ? 'Groq AI Mode active on server.'
        : isLlm7Configured
        ? 'LLM7 AI Mode active on server.'
        : 'Server AI_API_KEY not configured. External Prompt Mode available.',
    });
  });

  // AI Study Assistant proxy endpoint
  app.post('/api/ai/study-assist', async (req, res) => {
    try {
      const {
        mode = 'ai-mode', // 'ai-mode' | 'study-materials' | 'combined'
        question = '',
        userPrompt = '',
        topic = '',
        courseCode = '',
        courseTitle = '',
        selectedResources = [],
        notes = '',
        conversationHistory = [],
      } = req.body;

      const activeQuestion = question || userPrompt || topic;
      if (!activeQuestion && !notes && (!selectedResources || selectedResources.length === 0)) {
        return res
          .status(400)
          .json({ error: 'Please enter a question or select study materials to explore.' });
      }

      const llm7ApiKey = process.env.LLM7_API_KEY;
      const groqApiKey = process.env.GROQ_API_KEY;
      const geminiApiKey = process.env.GEMINI_API_KEY;

      let historyContextString = '';
      if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
        historyContextString = conversationHistory
          .map((m: any) => `${m.role === 'user' ? 'Student' : 'Polyvex'}: ${m.text}`)
          .join('\n');
      }

      const isCasual = isCasualConversation(activeQuestion);

      // MODE 1: AI MODE (General Conversational AI Assistant)
      if (mode === 'ai-mode' || mode === 'web-search') {
        const apiKey = groqApiKey || llm7ApiKey;
        if (!apiKey || apiKey.trim() === '') {
          return res.status(503).json({
            configured: false,
            error:
              'No valid AI API_KEY (Groq/LLM7) configured on the server.',
          });
        }

        const isSearchRequested = isExplicitWebSearchRequested(activeQuestion);
        let webSearchData: Array<{ title: string; url: string; domain: string; snippet: string }> = [];

        if (isSearchRequested && !isCasual) {
          webSearchData = await performLiveWebSearch(activeQuestion);
        }

        let webContextString = '';
        if (webSearchData.length > 0) {
          webContextString = webSearchData
            .map(
              (src, idx) =>
                `[Source ${idx + 1}] "${src.title}" (${src.domain})\nURL: ${src.url}\nSnippet: ${src.snippet}`
            )
            .join('\n\n');
        }

        const modeInstructions = isCasual
          ? `MODAL CONTEXT: AI MODE (Casual Conversation / Greeting).
Respond naturally as Polyvex. Do NOT cite web sources or generate an academic paper.`
          : isSearchRequested
          ? `MODAL CONTEXT: AI MODE (Web Research Requested).
Ground your answer in the retrieved web search results below. Include real source links where relevant.`
          : `MODAL CONTEXT: AI MODE (General Conversational AI Assistant).
Answer directly using your comprehensive general AI knowledge. Do NOT cite web sources unless explicit search results are provided below.`;

        const systemPrompt = `${POLYVEX_SYSTEM_PROMPT}\n\n${modeInstructions}`;

        const userPromptString = `${historyContextString ? `CONVERSATION HISTORY:\n${historyContextString}\n\n` : ''}COURSE CONTEXT: ${courseCode || 'General'} ${
          courseTitle ? `(${courseTitle})` : ''
        }
STUDENT MESSAGE: ${activeQuestion}

${webSearchData.length > 0 ? `RETRIEVED LIVE WEB SEARCH RESULTS (${webSearchData.length}):\n${webContextString}` : ''}`;

        if (req.body.stream) {
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');

          try {
            const llmRes = await fetch(groqApiKey ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.llm7.io/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey.trim()}`,
              },
              body: JSON.stringify({
                model: groqApiKey ? 'openai/gpt-oss-120b' : 'nemotron-3-nano:30b',
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: userPromptString },
                ],
                temperature: 0.6,
                max_tokens: 1500,
                stream: true,
              }),
            });

            if (!llmRes.ok) {
              const errBody = await llmRes.text();
              res.write(`data: ${JSON.stringify({ error: errBody })}\n\n`);
              res.end();
              return;
            }

            const reader = llmRes.body?.getReader();
            const decoder = new TextDecoder();
            if (!reader) {
              res.write(`data: ${JSON.stringify({ error: 'No stream reader' })}\n\n`);
              res.end();
              return;
            }

            res.write(
              `data: ${JSON.stringify({
                webSources: webSearchData.map((s) => ({
                  title: s.title,
                  url: s.url,
                  domain: s.domain,
                })),
                materialCitations: [],
              })}\n\n`
            );

            let buffer = '';
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';
              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith('data:')) continue;
                const dataStr = trimmed.replace(/^data:\s*/, '');
                if (dataStr === '[DONE]') continue;
                try {
                  const json = JSON.parse(dataStr);
                  const delta = json.choices?.[0]?.delta?.content;
                  if (delta) {
                    res.write(`data: ${JSON.stringify({ chunk: delta })}\n\n`);
                  }
                } catch {}
              }
            }
            res.write(`data: [DONE]\n\n`);
            res.end();
            return;
          } catch (streamErr: any) {
            console.error('Streaming error:', streamErr);
            res.write(`data: ${JSON.stringify({ error: streamErr.message })}\n\n`);
            res.end();
            return;
          }
        }

        const synthesizedText = await (groqApiKey
          ? callGroqChatCompletion(systemPrompt, userPromptString, groqApiKey)
          : callLLM7ChatCompletion(systemPrompt, userPromptString, llm7ApiKey || ''));


        return res.json({
          success: true,
          text: synthesizedText,
          mode: 'ai-mode',
          webSources: webSearchData.map((s) => ({
            title: s.title,
            url: s.url,
            domain: s.domain,
          })),
          materialCitations: [],
        });
      }

      // MODE 2: STUDY MATERIALS MODE (Uses course materials only - NO LLM7 or web search)
      if (mode === 'study-materials') {
        if (!geminiApiKey || geminiApiKey.trim() === '' || geminiApiKey === 'MY_GEMINI_API_KEY') {
          return res.status(503).json({
            configured: false,
            error: 'GEMINI_API_KEY is not configured on the server for Study Materials mode.',
          });
        }

        const ai = new GoogleGenAI({
          apiKey: geminiApiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        });

        let materialsContext = '';
        if (Array.isArray(selectedResources) && selectedResources.length > 0) {
          materialsContext = selectedResources
            .map(
              (res: any, idx: number) =>
                `[Material ${idx + 1}] "${res.title}" (${res.type || 'Document'})\nDescription: ${
                  res.description || 'None'
                }\nRef: ${res.linkOrRef || 'None'}\nNotes: ${res.notes || 'None'}`
            )
            .join('\n\n');
        }

        const systemInstruction = `${POLYVEX_SYSTEM_PROMPT}

MODAL CONTEXT: STUDY MATERIALS MODE for ${courseCode || 'this course'}.
Ground your answer strictly in the student's selected course study materials.
If it is a greeting or casual chat, respond warmly as Polyvex without forcing academic reports.
If it is an academic question about course materials and the materials do NOT contain enough information, state:
"Based on the selected course materials, there is not enough information to answer this question comprehensively."`;

        const promptContent = `${historyContextString ? `CONVERSATION HISTORY:\n${historyContextString}\n\n` : ''}COURSE: ${courseCode || 'General'} ${
          courseTitle ? `(${courseTitle})` : ''
        }
STUDENT MESSAGE: ${activeQuestion}

ATTACHED STUDY MATERIALS (${selectedResources.length}):
${materialsContext || '(No specific study materials attached)'}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: promptContent,
          config: { systemInstruction, temperature: 0.6 },
        });

        const materialCitations = (selectedResources || []).map((r: any) => ({
          id: r.id,
          title: r.title,
          type: r.type,
          linkOrRef: r.linkOrRef,
          description: r.description,
        }));

        return res.json({
          success: true,
          text: response.text || 'No response generated.',
          mode: 'study-materials',
          materialCitations,
          webSources: [],
        });
      }

      // MODE 3: COMBINED MODE (Uses course materials AND general AI synthesis)
      let webSearchData: Array<{ title: string; url: string; domain: string; snippet: string }> = [];
      if (isExplicitWebSearchRequested(activeQuestion) && !isCasual) {
        webSearchData = await performLiveWebSearch(activeQuestion);
      }

      if (llm7ApiKey && llm7ApiKey.trim() !== '') {
        let materialsContext = '';
        if (Array.isArray(selectedResources) && selectedResources.length > 0) {
          materialsContext = selectedResources
            .map(
              (res: any, idx: number) =>
                `[Course Material ${idx + 1}] "${res.title}" (${
                  res.type || 'Document'
                })\nDescription: ${res.description || 'None'}\nRef: ${res.linkOrRef || 'None'}`
            )
            .join('\n\n');
        }

        let webContextString = '';
        if (webSearchData.length > 0) {
          webContextString = webSearchData
            .map(
              (src, idx) =>
                `[Web Source ${idx + 1}] "${src.title}" (${src.domain})\nURL: ${src.url}\nSnippet: ${src.snippet}`
            )
            .join('\n\n');
        }

        const modeInstructions = isCasual
          ? `MODAL CONTEXT: COMBINED MODE (Casual Conversation / Greeting).
Respond naturally as Polyvex. Do NOT cite sources or generate an academic report.`
          : `MODAL CONTEXT: COMBINED MODE.
- Prioritize the student's course study materials for course terminology.
- Use general AI reasoning and physical/mathematical principles for broader explanations, derivations, and examples.
- Clearly distinguish material-derived information from general explanations.`;

        const systemPrompt = `${POLYVEX_SYSTEM_PROMPT}\n\n${modeInstructions}`;

        const userPromptString = `${historyContextString ? `CONVERSATION HISTORY:\n${historyContextString}\n\n` : ''}COURSE: ${courseCode || 'General'}
STUDENT MESSAGE: ${activeQuestion}

ATTACHED COURSE MATERIALS (${selectedResources.length}):
${materialsContext || '(None attached)'}

${webSearchData.length > 0 ? `RETRIEVED LIVE WEB SEARCH RESULTS (${webSearchData.length}):\n${webContextString}` : ''}`;

        const synthesizedText = await (groqApiKey
          ? callGroqChatCompletion(systemPrompt, userPromptString, groqApiKey)
          : callLLM7ChatCompletion(systemPrompt, userPromptString, llm7ApiKey));


        const materialCitations = (selectedResources || []).map((r: any) => ({
          id: r.id,
          title: r.title,
          type: r.type,
          linkOrRef: r.linkOrRef,
          description: r.description,
        }));

        return res.json({
          success: true,
          text: synthesizedText,
          mode: 'combined',
          materialCitations,
          webSources: webSearchData.map((s) => ({
            title: s.title,
            url: s.url,
            domain: s.domain,
          })),
        });
      }

      // Fallback if LLM7 API key is missing in Combined mode: use Gemini
      if (geminiApiKey && geminiApiKey.trim() !== '' && geminiApiKey !== 'MY_GEMINI_API_KEY') {
        const ai = new GoogleGenAI({
          apiKey: geminiApiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        });

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: activeQuestion,
          config: { tools: [{ googleSearch: {} }] },
        });

        return res.json({
          success: true,
          text: response.text || '',
          mode: 'combined',
          materialCitations: (selectedResources || []).map((r: any) => ({
            id: r.id,
            title: r.title,
            type: r.type,
          })),
          webSources: webSearchData.map((s) => ({
            title: s.title,
            url: s.url,
            domain: s.domain,
          })),
        });
      }

      return res.status(503).json({
        configured: false,
        error: 'Neither LLM7_API_KEY nor GEMINI_API_KEY is configured on the server.',
      });
    } catch (err: any) {
      console.error('API Error in /api/ai/study-assist:', err);
      return res.status(500).json({
        error: err.message || 'Error processing AI research query.',
      });
    }
  });

  // AI-Powered Revision Planner endpoint
  app.post('/api/ai/revision-plan', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
      return res.status(503).json({
        configured: false,
        error: 'GEMINI_API_KEY is not configured on the server. Please use External Prompt Mode.',
      });
    }

    try {
      const {
        timeframe = 'daily',
        topics = [],
        tasks = [],
        dailyHours = 4,
        preferredFocus = 'balanced',
      } = req.body;

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
${topics
  .map(
    (t: any) =>
      `- [${t.courseCode || 'Course'}] "${t.title}": Confidence ${t.confidence}/5, Last revised: ${
        t.lastRevisedDate || 'Never'
      }, Next review: ${t.nextRevisionDate || 'Pending'}`
  )
  .join('\n')}

UPCOMING TASKS & DEADLINES:
${tasks
  .map(
    (tsk: any) =>
      `- [${tsk.courseCode || 'Course'}] "${tsk.title}" (${tsk.taskType}): Due ${
        tsk.dueDate || 'No date'
      }, Priority: ${tsk.priority}, Status: ${tsk.status}`
  )
  .join('\n')}

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
        error: err.message || 'Error generating AI revision plan. Use External Prompt mode.',
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
