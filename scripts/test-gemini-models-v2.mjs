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
const genAI = new GoogleGenerativeAI(key);

async function run() {
  const models = ['gemini-1.5-flash-latest', 'gemini-1.5-pro-latest', 'gemini-pro'];
  for (const m of models) {
    console.log(`Testing model: ${m}...`);
    try {
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent("Say 'OK'");
      console.log(`✅ ${m} Response:`, result.response.text());
    } catch (e) {
      console.error(`❌ ${m} Error:`, e.message);
    }
    console.log('---');
  }
}

run();
