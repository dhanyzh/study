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
  console.log("Listing available models...");
  try {
    // Note: listModels is not directly on genAI in some versions, 
    // it's a separate discovery process or via the generativeModel.
    // However, the error message in the previous test suggested calling ListModels.
    
    // Let's try the most basic one again: 'gemini-1.5-flash'
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent("Hi");
    console.log("Response:", result.response.text());
  } catch (e) {
    console.error("Error:", e.message);
  }
}

run();
