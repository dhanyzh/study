/**
 * AI Integration — Dual Provider (Google Gemini + OpenAI fallback)
 * 
 * Tries Gemini first, falls back to OpenAI if Gemini fails or is unavailable.
 * Supports:
 * - Context-aware chat assistance
 * - PDF content classification and structuring
 * - Quiz/MCQ generation
 * - Descriptive answer evaluation
 * - Image/diagram interpretation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

// =========================================================
// Provider Singletons
// =========================================================
let genAI = null;
let openaiClient = null;

const GEMINI_MODELS = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
const OPENAI_MODELS = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'];

function readEnvKey(keyName) {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) return null;
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const lines = envContent.split(/\r?\n/);
    for (const line of lines) {
      if (line.trim().startsWith(`${keyName}=`)) {
        return line.split('=')[1].trim();
      }
    }
  } catch (e) {
    console.error(`[AI] Error reading manual env key ${keyName}:`, e.message);
  }
  return null;
}

function getGeminiKey() {
  let key = process.env.GEMINI_API_KEY;
  if (!key || key === 'your-gemini-api-key-here') {
    key = readEnvKey('GEMINI_API_KEY');
  }
  return key && key !== 'your-gemini-api-key-here' ? key : null;
}

function getOpenAIKey() {
  let key = process.env.OPENAI_API_KEY;
  if (!key || key === 'your-openai-api-key-here') {
    key = readEnvKey('OPENAI_API_KEY');
  }
  return key && key !== 'your-openai-api-key-here' ? key : null;
}

function getGenAI() {
  if (String(process.env.AI_DISABLED || '').toLowerCase() === 'true' || process.env.AI_DISABLED === '1') {
    return null;
  }
  const key = getGeminiKey();
  if (!key) return null;
  if (!genAI || genAI._apiKey !== key) {
    genAI = new GoogleGenerativeAI(key);
    genAI._apiKey = key;
  }
  return genAI;
}

function getOpenAI() {
  const key = getOpenAIKey();
  if (!key) return null;
  if (!openaiClient || openaiClient._key !== key) {
    openaiClient = new OpenAI({ apiKey: key });
    openaiClient._key = key;
  }
  return openaiClient;
}

// =========================================================
// Unified chat function with fallback
// =========================================================

const SYSTEM_PROMPT_TEMPLATE = (context) => `You are StudyBot, an intelligent study assistant integrated into a Study OS platform.
You help students learn, practice, and revise across subjects: DSA, Electronics, Chemistry, SQL, and Excel.

Current context:
- Subject: ${context.subject || 'Not specified'}
- Chapter: ${context.chapter || 'Not specified'}
- Topic: ${context.topic || 'Not specified'}
- Current Notes: ${context.notes ? context.notes.substring(0, 500) : 'None'}

Guidelines:
- ALWAYS format your responses in proper Markdown.
- Use Markdown tables for comparisons.
- For mathematical equations, physics formulas, or chemistry reactions, ALWAYS use LaTeX syntax (e.g., $$E = mc^2$$ for block math, or $E=mc^2$ for inline math).
- If the user asks for a diagram, flowchart, graph, architecture, timeline, or mindmap, ALWAYS generate a valid Mermaid.js diagram inside a \`\`\`mermaid code block.
- If the student asks about code, provide working examples.
- Encourage learning, don't just give answers — guide step by step.`;

/**
 * Send a chat message to AI with context.
 * Tries Gemini first, falls back to OpenAI.
 * Uses a global short-circuit when all providers are known to be down.
 */
let allProvidersDown = false;
let allProvidersDownAt = 0;
const PROVIDERS_DOWN_COOLDOWN_MS = 60000; // Retry after 60 seconds

export async function chatWithAI(message, context = {}, history = []) {
  let options = {};
  if (arguments.length >= 4 && arguments[3] && typeof arguments[3] === 'object') {
    options = arguments[3];
  }
  const strict = Boolean(options.strict);

  // Short-circuit: if all providers are known to be down, skip API calls entirely
  if (allProvidersDown) {
    const elapsed = Date.now() - allProvidersDownAt;
    if (elapsed < PROVIDERS_DOWN_COOLDOWN_MS) {
      if (strict) throw new Error('All AI providers are down (quota exceeded). Retrying in ' + Math.ceil((PROVIDERS_DOWN_COOLDOWN_MS - elapsed) / 1000) + 's.');
      return getSmartMockResponse(message, context);
    }
    // Cooldown expired — reset and try again
    allProvidersDown = false;
    allProvidersDownAt = 0;
  }

  // Try Gemini models in order
  for (const modelName of GEMINI_MODELS) {
    const geminiResult = await tryGemini(message, context, history, strict, modelName);
    if (geminiResult !== null) return geminiResult;
  }

  // Fall back to OpenAI models
  for (const modelName of OPENAI_MODELS) {
    const openaiResult = await tryOpenAI(message, context, history, strict, modelName);
    if (openaiResult !== null) return openaiResult;
  }

  // Both failed — mark as down and return fallback
  allProvidersDown = true;
  allProvidersDownAt = Date.now();
  console.warn('[AI] All providers failed. Short-circuiting for 60s.');
  
  if (strict) throw new Error('Both AI providers failed');
  return getSmartMockResponse(message, context);
}

let geminiDown = false;
let geminiDownAt = 0;

async function tryGemini(message, context, history, strict, modelName = GEMINI_MODELS[0]) {
  // Skip if Gemini is known to be down (quota exceeded)
  if (geminiDown && (Date.now() - geminiDownAt) < 300000) return null; // 5min cooldown
  if (geminiDown) { geminiDown = false; geminiDownAt = 0; } // reset after cooldown

  const ai = getGenAI();
  if (!ai) return null;

  try {
    console.log(`[AI] Attempting Gemini model: ${modelName}...`);
    const model = ai.getGenerativeModel({
      model: modelName,
      systemInstruction: SYSTEM_PROMPT_TEMPLATE(context),
    });

    const chatHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s max

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(message, { signal: controller.signal });
    clearTimeout(timeoutId);
    console.log(`[AI] Gemini ${modelName} successful.`);
    return result.response.text();
  } catch (error) {
    const errMsg = error?.message || String(error);
    console.error(`Gemini AI error (${modelName}):`, errMsg.substring(0, 150));
    
    // Mark Gemini as down if quota exceeded or rate limited
    if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
      geminiDown = true;
      geminiDownAt = Date.now();
      console.warn('[AI] Gemini marked as DOWN (quota exceeded). Skipping for 5 minutes.');
    }
    
    if (strict && !getOpenAI()) {
      throw error;
    }
    return null; // signal to try fallback
  }
}

let openaiDown = false;
let openaiDownAt = 0;

async function tryOpenAI(message, context, history, strict, modelName = OPENAI_MODELS[0]) {
  // Skip if OpenAI is known to be down
  if (openaiDown && (Date.now() - openaiDownAt) < 300000) return null; // 5min cooldown
  if (openaiDown) { openaiDown = false; openaiDownAt = 0; }

  const client = getOpenAI();
  if (!client) return null;

  try {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT_TEMPLATE(context) },
      ...history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: message },
    ];

    const completion = await client.chat.completions.create({
      model: modelName,
      messages,
      max_tokens: 4096,
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    const errMsg = error?.message || String(error);
    console.error(`OpenAI error (${modelName}):`, errMsg.substring(0, 150));
    
    if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('insufficient_quota')) {
      openaiDown = true;
      openaiDownAt = Date.now();
      console.warn('[AI] OpenAI marked as DOWN (quota exceeded). Skipping for 5 minutes.');
    }
    
    if (strict) throw error;
    return null;
  }
}

// =========================================================
// Evaluate a descriptive answer
// =========================================================
export async function evaluateAnswer(question, answer, maxMarks = 5) {
  const prompt = `You are an expert exam evaluator. Evaluate the following answer:

Question: ${question}
Student's Answer: ${answer}
Maximum Marks: ${maxMarks}

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "score": <number between 0 and ${maxMarks}>,
  "feedback": "<detailed feedback on the answer>",
  "suggestions": ["<suggestion 1>", "<suggestion 2>"]
}`;

  try {
    const response = await chatWithAI(prompt, {}, [], { strict: true });
    const text = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error('AI evaluation error:', error);
    return {
      score: Math.floor(Math.random() * maxMarks) + 1,
      feedback: 'AI evaluation encountered an error. This is a fallback score.',
      suggestions: ['Try again later.']
    };
  }
}

// =========================================================
// Classify PDF content
// =========================================================
export async function classifyPDFContent(textChunk, subject) {
  const prompt = `Analyze the following educational text for the subject "${subject}" and classify it.

Text:
${textChunk}

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "type": "notes|mcq|descriptive_question|formula|code_snippet|table",
  "chapter": "<detected chapter name>",
  "topic": "<detected topic name>",
  "content": "<cleaned and formatted content>",
  "keyConceptsHighlighted": "<content with **key concepts** bolded>",
  "summary": "<brief summary>",
  "mcqs": [
    {
      "question": "<generated MCQ question>",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "<why this answer is correct>",
      "difficulty": "easy|medium|hard"
    }
  ]
}

Generate 3-5 MCQs from this content if it contains educational material.`;

  try {
    const response = await chatWithAI(prompt, {}, [], { strict: true });
    const text = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(text);
    
    return {
      type: parsed.type || 'notes',
      chapter: parsed.chapter || 'General',
      topic: parsed.topic || 'Extracted Content',
      content: parsed.content || textChunk,
      keyConceptsHighlighted: parsed.keyConceptsHighlighted || parsed.content || textChunk,
      summary: parsed.summary || textChunk.substring(0, 200),
      mcqs: parsed.mcqs || []
    };
  } catch (error) {
    console.error('PDF classification error:', error);
    return {
      type: 'notes',
      chapter: 'Extracted',
      topic: 'Content',
      content: textChunk,
      keyConceptsHighlighted: textChunk,
      summary: textChunk.substring(0, 200),
      mcqs: [],
      _fallback: true,
      _error: error.message
    };
  }
}

// =========================================================
// Generate MCQs
// =========================================================
export async function generateMCQs(content, subject, count = 10) {
  const defaultMCQs = Array.from({ length: Math.min(count, 5) }, (_, i) => ({
    question: `Question ${i + 1}: Based on the extracted content from "${subject}", what can you identify?`,
    options: [
      'Main concept from the text',
      'Related concept',
      'Alternative viewpoint', 
      'Unrelated topic'
    ],
    correctAnswer: 0,
    explanation: 'This MCQ was generated from the extracted PDF content as AI processing was unavailable.',
    difficulty: i < 2 ? 'easy' : i < 4 ? 'medium' : 'hard'
  }));

  const prompt = `Generate ${Math.min(count, 20)} multiple-choice questions for the subject "${subject}" based on this content:

${content.substring(0, 3000)}

Respond ONLY with a valid JSON array (no markdown, no code blocks):
[
  {
    "question": "<question text>",
    "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
    "correctAnswer": <index 0-3>,
    "explanation": "<why the correct answer is correct>",
    "difficulty": "easy|medium|hard"
  }
]`;

  try {
    const response = await chatWithAI(prompt, {}, [], { strict: true });
    const text = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(text);
    
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map(mcq => ({
        question: mcq.question || 'Question',
        options: Array.isArray(mcq.options) ? mcq.options : ['A', 'B', 'C', 'D'],
        correctAnswer: typeof mcq.correctAnswer === 'number' ? mcq.correctAnswer : 0,
        explanation: mcq.explanation || 'See question and options',
        difficulty: mcq.difficulty || 'medium'
      }));
    }
    
    return defaultMCQs;
  } catch (error) {
    console.error('MCQ generation error:', error.message);
    return defaultMCQs;
  }
}

// =========================================================
// Image/Diagram Description
// =========================================================
export async function describeImageWithAI({ imageBase64, mimeType = 'image/png', prompt, context = {} }) {
  // Try Gemini vision first (natively supports images)
  const ai = getGenAI();
  if (ai) {
    try {
      const model = ai.getGenerativeModel({ model: GEMINI_MODEL });
      const result = await model.generateContent([
        { text: prompt || 'Describe this diagram and provide a step-by-step explanation.' },
        { inlineData: { mimeType, data: imageBase64 } },
        ...(context && Object.keys(context).length
          ? [{ text: `Context: ${JSON.stringify(context).slice(0, 500)}` }]
          : []),
      ]);
      return result.response.text();
    } catch (error) {
      console.error('Gemini image error:', error?.message);
    }
  }

  // Fall back to OpenAI vision
  const client = getOpenAI();
  if (client) {
    try {
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt || 'Describe this diagram and provide a step-by-step explanation.' },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
            ],
          },
        ],
        max_tokens: 2000,
      });
      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenAI image error:', error?.message);
    }
  }

  return JSON.stringify({
    schemaVersion: '1.0',
    summary: '',
    stepByStepExplanation: '',
    detectedConcepts: [],
    method: 'unavailable',
  });
}

// =========================================================
// Smart Mock response for when AI fails — generates contextual content locally
// =========================================================
function getSmartMockResponse(message, context = {}) {
  const msg = String(message).toLowerCase();
  const subject = (context.subject || '').toLowerCase();
  const topic = (context.topic || '').toLowerCase();

  // 1. Check for specific common subjects
  if (msg.includes('chemistry') || subject === 'chemistry' || msg.includes('reaction') || msg.includes('atom')) {
    const chemical = msg.includes('water') || msg.includes('h2o') ? 'Water ($$H_2O$$)' : 
                   msg.includes('benzene') ? 'Benzene ($$C_6H_6$$)' : 'the chemical compound';
    
    return `### 🔬 Chemistry Insight: ${chemical} (Offline Mode)

While my AI processing is currently offline, I can provide this study reference:

#### Molecular Structure
The structure of **${chemical}** is fundamental to its properties. In the case of organic compounds, resonance and bonding play key roles.

#### Concept Map
\`\`\`mermaid
graph TD
  A[Matter] --> B[Substances]
  B --> C[Elements]
  B --> D[Compounds]
  D --> E[${chemical}]
  E --> F[Molecular Geometry]
  E --> G[Chemical Bonding]
\`\`\`

#### Key Reaction Equation
Typical behavior for this substance:
$$A + B \rightarrow C \quad \Delta H < 0$$

*To see live AI analysis for specific queries, please check your API credits.*`;
  }

  if (msg.includes('dsa') || subject === 'dsa' || msg.includes('algorithm') || msg.includes('sort')) {
    return `### 💻 DSA Study Guide: Algorithms (Offline Mode)

It seems you are studying Data Structures and Algorithms!

#### Time Complexity Overview
| Algorithm | Best Case | Average | Worst Case |
| :--- | :--- | :--- | :--- |
| **Quick Sort** | $O(n \log n)$ | $O(n \log n)$ | $O(n^2)$ |
| **Binary Search** | $O(1)$ | $O(\log n)$ | $O(\log n)$ |
| **Hash Table** | $O(1)$ | $O(1)$ | $O(n)$ |

#### Mindmap
\`\`\`mermaid
graph LR
  DSA((DSA)) --> DS[Data Structures]
  DSA --> AL[Algorithms]
  DS --> Linear[Linear: Arrays, Lists]
  DS --> NonLinear[Non-Linear: Trees, Graphs]
  AL --> Sort[Sorting]
  AL --> Search[Searching]
  AL --> Dynamic[Dynamic Programming]
\`\`\`

*Enable your AI keys for step-by-step code walkthroughs.*`;
  }

  // 2. Generic Fallback
  return `### StudyBot — Offline Mode

I am currently running in **Offline Mode** because your API providers (Gemini/OpenAI) are returning "Quota Exceeded" errors.

**What I can do right now:**
- I can still render **Math** ($$E=mc^2$$) and **Diagrams** (Mermaid).
- Your **PDF processing** will work using internal fallback logic.
- I can provide study templates for **Chemistry**, **DSA**, and **Electronics**.

**How to fix live AI:**
- **OpenAI**: Check your [billing dashboard](https://platform.openai.com/usage).
- **Gemini**: Ensure your API key is active in [Google AI Studio](https://aistudio.google.com/).

*Try asking about "Chemistry" or "DSA" to see my rich formatting capabilities even while offline!*`;
}

/** @deprecated Use getSmartMockResponse */
function getMockResponse(message) {
  return getSmartMockResponse(message);
}

// =========================================================
// Mock response for when no AI providers are configured or both fail
// =========================================================
// Note: See getSmartMockResponse for context-aware fallbacks.</code>
