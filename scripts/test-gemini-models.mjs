import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

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
    console.error(`Error reading key ${keyName}:`, e.message);
  }
  return null;
}

const key = readEnvKey('GEMINI_API_KEY');
if (!key) {
  console.error('GEMINI_API_KEY not found');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(key);

async function testModel(modelName) {
  console.log(`Testing model: ${modelName}...`);
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Say 'System OK'");
    console.log(`✅ ${modelName} Response:`, result.response.text());
    return true;
  } catch (e) {
    console.error(`❌ ${modelName} Error:`, e.message);
    return false;
  }
}

async function run() {
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
  for (const m of models) {
    await testModel(m);
    console.log('---');
  }
}

run();
