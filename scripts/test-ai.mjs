/**
 * AI Diagnostic Script
 * Tests Gemini and OpenAI connectivity and validates fallback logic.
 */
import { chatWithAI } from '../src/lib/ai.js';

async function runDiagnostic() {
  console.log('🧪 Starting AI Diagnostic...\n');

  const testMessage = "Hello, tell me about Benzene.";
  const context = { subject: "Chemistry", topic: "Organic Compounds" };

  console.log('📡 Testing AI Response (Live or Fallback)...');
  try {
    const startTime = Date.now();
    const response = await chatWithAI(testMessage, context);
    const duration = Date.now() - startTime;

    console.log(`\n⏱️ Response received in ${duration}ms`);
    console.log('--- Response Snippet ---');
    console.log(response.substring(0, 300) + '...');
    console.log('------------------------\n');

    if (response.includes('Offline Mode') || response.includes('Smart Mock')) {
      console.log('⚠️ Result: Running in OFFLINE MODE (Fallback triggered).');
      console.log('Check your API keys and quotas in .env.local.');
    } else {
      console.log('✅ Result: Running in LIVE MODE (AI is active).');
    }
  } catch (error) {
    console.error('❌ Diagnostic Failed:', error.message);
  }
}

runDiagnostic();
