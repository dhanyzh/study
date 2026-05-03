import crypto from 'crypto';
import { chatWithAI } from './ai.js';

// In-memory fallback cache when Redis is unavailable (Windows dev)
const memoryCache = new Map();
let redisClient = null;
let redisUnavailable = false;

async function getRedis() {
  if (redisUnavailable) return null;
  if (redisClient) return redisClient;

  try {
    const result = await Promise.race([
      (async () => {
        const { createClient } = await import('redis');
        const host = process.env.REDIS_HOST || 'localhost';
        const port = process.env.REDIS_PORT || '6379';
        const url = `redis://${host}:${port}`;
        const client = createClient({ url, socket: { connectTimeout: 500 } });
        client.on('error', () => {}); // suppress noise
        await client.connect();
        return client;
      })(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), 1000)),
    ]);
    redisClient = result;
    return result;
  } catch {
    console.warn('[AI JSON Cache] Redis unavailable — using in-memory cache.');
    redisUnavailable = true;
    return null;
  }
}

async function cacheGet(key) {
  const redis = await getRedis();
  if (redis) {
    try {
      return await redis.get(key);
    } catch {}
  }
  return memoryCache.get(key) || null;
}

async function cacheSet(key, value, ttlSeconds) {
  const redis = await getRedis();
  if (redis) {
    try {
      await redis.set(key, value, { EX: ttlSeconds });
      return;
    } catch {}
  }
  memoryCache.set(key, value);
  // Auto-expire from memory cache
  setTimeout(() => memoryCache.delete(key), Math.min(ttlSeconds * 1000, 3600000));
}

function sha256Short(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 24);
}

function extractJsonCandidate(text) {
  if (!text) return null;
  const trimmed = String(text).trim();

  // Remove common markdown fences.
  const noFences = trimmed
    .replace(/```json\s*/g, '')
    .replace(/```/g, '')
    .trim();

  // If it parses cleanly, use it.
  try {
    return JSON.parse(noFences);
  } catch {
    // continue
  }

  // Try to extract first JSON object/array substring.
  const objMatch = noFences.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      return JSON.parse(objMatch[0]);
    } catch {
      // continue
    }
  }

  const arrMatch = noFences.match(/\[[\s\S]*\]/);
  if (arrMatch) {
    try {
      return JSON.parse(arrMatch[0]);
    } catch {
      // continue
    }
  }

  return null;
}

function isNonNullObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

async function safeRepairJson({ schemaHint, invalidResponse, originalPrompt }) {
  const repairPrompt = `You returned invalid or non-conforming JSON.

Schema requirement (human description):
${schemaHint}

Original prompt:
${originalPrompt}

Your invalid response:
${invalidResponse}

Return ONLY valid JSON that satisfies the schema. No markdown, no code fences.`;

  const repaired = await chatWithAI(repairPrompt, {}, [], { strict: true });
  return extractJsonCandidate(repaired);
}

/**
 * Request strict JSON from the AI with:
 * - Redis/memory caching keyed by prompt+model+optional extraKey
 * - JSON repair retry when parsing fails or schema validation fails
 */
export async function cachedJsonFromPrompt({
  prompt,
  cacheNamespace,
  validator,
  schemaHint,
  extraKey = '',
  ttlSeconds = 60 * 60 * 24 * 7, // 7 days
}) {
  const modelKey = 'ai-dual-provider';
  const cacheKey = `aijson:${cacheNamespace}:${modelKey}:${sha256Short(prompt)}:${sha256Short(extraKey)}`;

  // 1) Cache lookup
  try {
    const cached = await cacheGet(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (!validator || validator(parsed)) return parsed;
    }
  } catch {
    // cache optional; fall through
  }

  // 2) Primary AI call
  const responseText = await chatWithAI(prompt, {}, [], { strict: true });
  let parsed = extractJsonCandidate(responseText);

  // 3) Repair if parse failed or schema invalid
  if (!parsed || (validator && !validator(parsed))) {
    parsed = await safeRepairJson({
      schemaHint,
      invalidResponse: responseText,
      originalPrompt: prompt,
    });
  }

  if (!parsed || (validator && !validator(parsed))) {
    // Last resort: throw so upstream can handle fallback.
    const msg = 'AI JSON validation failed after repair.';
    const detail = parsed ? 'Parsed but invalid' : 'Could not parse JSON';
    throw new Error(`${msg} ${detail}`);
  }

  // 4) Cache store
  try {
    await cacheSet(cacheKey, JSON.stringify(parsed), ttlSeconds);
  } catch {
    // ignore cache failures
  }

  return parsed;
}

export const validators = {
  isRecord: (v) => isNonNullObject(v),
};
