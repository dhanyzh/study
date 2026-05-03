/**
 * Job Queue Setup — Redis-free Fallback for Windows Dev
 *
 * When Redis is available, uses Bull queues. When Redis is unavailable,
 * provides a synchronous in-process fallback so the PDF pipeline still works.
 */

let bullAvailable = null; // null = untested, true/false after test

async function testRedis() {
  if (bullAvailable !== null) return bullAvailable;
  
  // Wrap entire test in a hard timeout to prevent hangs on Windows
  const timeoutMs = 1500;
  try {
    const result = await Promise.race([
      (async () => {
        const { createClient } = await import('redis');
        const host = process.env.REDIS_HOST || 'localhost';
        const port = process.env.REDIS_PORT || '6379';
        const client = createClient({ url: `redis://${host}:${port}`, socket: { connectTimeout: 500 } });
        client.on('error', () => {});
        await client.connect();
        await client.ping();
        await client.quit();
        return true;
      })(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Redis test timed out')), timeoutMs)),
    ]);
    bullAvailable = result;
  } catch {
    console.warn('[Queue] Redis unavailable — using synchronous fallback.');
    bullAvailable = false;
  }
  return bullAvailable;
}

export const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT || 6379),
};

// =====================================================
// Synchronous Fake Queue (no Redis needed)
// =====================================================
class FakeJob {
  constructor(data, id) {
    this.data = data;
    this.id = id || `fake-${Date.now()}`;
    this._progress = 0;
    this.opts = { attempts: 1 };
    this.attemptsMade = 0;
    this.returnvalue = null;
    this.failedReason = null;
    this._processor = null;
    this._resolveFinished = null;
    this._finishedPromise = new Promise((resolve) => { this._resolveFinished = resolve; });
  }
  async progress(val) {
    if (val !== undefined) this._progress = val;
    return this._progress;
  }
  async getState() { return this.returnvalue ? 'completed' : 'waiting'; }
  async finished() { return this._finishedPromise; }
}

class FakeQueue {
  constructor(name) {
    this.name = name;
    this._processor = null;
    this._listeners = {};
    this._jobs = new Map();
  }
  process(fn) { this._processor = fn; }
  on(event, fn) { this._listeners[event] = fn; }
  async add(data, opts = {}) {
    const job = new FakeJob(data, opts.jobId || `fake-${Date.now()}`);
    this._jobs.set(job.id, job);
    // Run processor synchronously — the caller must manage background execution
    if (this._processor) {
      try {
        const result = await this._processor(job);
        job.returnvalue = result;
        if (job._resolveFinished) job._resolveFinished(result);
        this._listeners.completed?.(job);
      } catch (err) {
        job.failedReason = err?.message || String(err);
        if (job._resolveFinished) job._resolveFinished(null);
        this._listeners.failed?.(job, err);
        console.error(`[FakeQueue:${this.name}] Job ${job.id} failed:`, err?.message || err);
      }
    } else {
      if (job._resolveFinished) job._resolveFinished(null);
    }
    return job;
  }
  async getJob(id) { return this._jobs.get(id) || null; }
  async close() {}
}

// =====================================================
// Queue instances — lazy init
// =====================================================
const globalCache = globalThis;
const cachedQueues = globalCache.__studyQueues || (globalCache.__studyQueues = { queues: {}, mode: null });

function makeFakeQueue(name) {
  if (cachedQueues.queues[name]) return cachedQueues.queues[name];
  const q = new FakeQueue(name);
  cachedQueues.queues[name] = q;
  return q;
}

async function makeQueue(name, _defaultJobOptions) {
  const redis = await testRedis();
  if (redis) {
    // Bull/BullMQ removed — they use child_process.fork with server-relative
    // imports that Turbopack / Vercel cannot bundle. If Redis-backed queues
    // are needed in the future, consider bullmq with a custom webpack config.
    console.warn(`[Queue] Redis is available but Bull is not bundled. Using FakeQueue for '${name}'.`);
  }
  return makeFakeQueue(name);
}

// Export queues as promises that resolve to the correct type
const queueConfigs = [
  ['pdf-extraction', { attempts: 4, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: true, removeOnFail: false }],
  ['pdf-parsing', { attempts: 3, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: true }],
  ['pdf-classification', { attempts: 3, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: true }],
  ['pdf-ai-enhancement', { attempts: 3, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: true }],
  ['pdf-topic-mapping', { attempts: 2, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: true }],
  ['pdf-chunk-classification', { attempts: 4, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: true, removeOnFail: false }],
  ['pdf-chunk-ai-enhancement', { attempts: 4, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: true, removeOnFail: false }],
  ['pdf-question-generation', { attempts: 3, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: true, removeOnFail: false }],
  ['pdf-diagram-intelligence', { attempts: 3, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: true, removeOnFail: false }],
  ['pdf-routing', { attempts: 2, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: true, removeOnFail: false }],
];

// Synchronous queue references (for non-Redis mode, or after init)
// Initially these are FakeQueues that will be replaced after initQueues()
let pdfQueue = makeFakeQueue('pdf-extraction');
let parsingQueue = makeFakeQueue('pdf-parsing');
let classificationQueue = makeFakeQueue('pdf-classification');
let aiEnhancementQueue = makeFakeQueue('pdf-ai-enhancement');
let topicMappingQueue = makeFakeQueue('pdf-topic-mapping');
let chunkClassificationQueue = makeFakeQueue('pdf-chunk-classification');
let chunkEnhancementQueue = makeFakeQueue('pdf-chunk-ai-enhancement');
let questionGenerationQueue = makeFakeQueue('pdf-question-generation');
let diagramIntelligenceQueue = makeFakeQueue('pdf-diagram-intelligence');
let routingQueue = makeFakeQueue('pdf-routing');

let queuesInitialized = false;

export async function initQueues() {
  if (queuesInitialized) return;
  queuesInitialized = true;
  
  const redis = await testRedis();
  if (!redis) {
    console.log('[Queue] Running in synchronous fallback mode (no Redis).');
    return; // keep FakeQueues
  }

  // Replace with real Bull queues
  pdfQueue = await makeQueue('pdf-extraction', queueConfigs[0][1]);
  parsingQueue = await makeQueue('pdf-parsing', queueConfigs[1][1]);
  classificationQueue = await makeQueue('pdf-classification', queueConfigs[2][1]);
  aiEnhancementQueue = await makeQueue('pdf-ai-enhancement', queueConfigs[3][1]);
  topicMappingQueue = await makeQueue('pdf-topic-mapping', queueConfigs[4][1]);
  chunkClassificationQueue = await makeQueue('pdf-chunk-classification', queueConfigs[5][1]);
  chunkEnhancementQueue = await makeQueue('pdf-chunk-ai-enhancement', queueConfigs[6][1]);
  questionGenerationQueue = await makeQueue('pdf-question-generation', queueConfigs[7][1]);
  diagramIntelligenceQueue = await makeQueue('pdf-diagram-intelligence', queueConfigs[8][1]);
  routingQueue = await makeQueue('pdf-routing', queueConfigs[9][1]);
}

export {
  pdfQueue,
  parsingQueue,
  classificationQueue,
  aiEnhancementQueue,
  topicMappingQueue,
  chunkClassificationQueue,
  chunkEnhancementQueue,
  questionGenerationQueue,
  diagramIntelligenceQueue,
  routingQueue,
};

// Global event handlers for monitoring
export function setupQueueMonitoring() {
  const queues = [
    pdfQueue, parsingQueue, classificationQueue, aiEnhancementQueue,
    topicMappingQueue, chunkClassificationQueue, chunkEnhancementQueue,
    questionGenerationQueue, diagramIntelligenceQueue, routingQueue,
  ];
  queues.forEach((queue) => {
    queue.on('completed', (job) => console.log(`✓ [${queue.name}] Job ${job.id} completed`));
    queue.on('failed', (job, err) => console.error(`✗ [${queue.name}] Job ${job?.id} failed:`, err?.message || err));
    queue.on('error', (error) => console.error(`✗ [${queue.name}] Queue error:`, error));
  });
}

/**
 * Enqueue PDF processing job
 */
export async function enqueuePDFProcessing(pdfUploadId, userId, filePath) {
  await initQueues();
  try {
    const job = await pdfQueue.add(
      { pdfUploadId: String(pdfUploadId), userId: String(userId), filePath: String(filePath), timestampMs: Date.now() },
      { jobId: `pdf-${pdfUploadId}`, priority: 5 }
    );
    console.log(`📦 Enqueued PDF job: ${job.id}`);
    return job;
  } catch (error) {
    console.error('Failed to enqueue PDF job:', error);
    throw error;
  }
}

export async function getJobStatus(jobId) {
  try {
    const job = await pdfQueue.getJob(jobId);
    if (!job) return null;
    const progress = typeof job.progress === 'function' ? await job.progress() : job._progress || 0;
    const state = typeof job.getState === 'function' ? await job.getState() : 'unknown';
    return {
      id: job.id, state, progress, data: job.data,
      result: job.returnvalue, failedReason: job.failedReason,
      attempts: job.attemptsMade, maxAttempts: job.opts?.attempts,
    };
  } catch (error) {
    console.error('Failed to get job status:', error);
    return null;
  }
}

// Chain helpers
export async function chainParsingJob(data) {
  await initQueues();
  const job = await parsingQueue.add({ ...data, timestampMs: Date.now() }, { jobId: `parsing-${data.pdfUploadId}` });
  console.log(`📦 Chained parsing job: ${job.id}`);
  return job;
}

export async function chainClassificationJob(data) {
  await initQueues();
  const job = await classificationQueue.add({ ...data, timestampMs: Date.now() }, { jobId: `classification-${data.pdfUploadId}` });
  console.log(`📦 Chained classification job: ${job.id}`);
  return job;
}

export async function chainAIEnhancementJob(data) {
  await initQueues();
  const job = await aiEnhancementQueue.add({ ...data, timestampMs: Date.now() }, { jobId: `ai-enhance-${data.pdfUploadId}` });
  console.log(`📦 Chained AI enhancement job: ${job.id}`);
  return job;
}

export async function chainTopicMappingJob(data) {
  await initQueues();
  const job = await topicMappingQueue.add({ ...data, timestampMs: Date.now() }, { jobId: `topic-map-${data.pdfUploadId}` });
  console.log(`📦 Chained topic mapping job: ${job.id}`);
  return job;
}

export async function enqueueChunkClassificationJob(payload) {
  await initQueues();
  return chunkClassificationQueue.add({ ...payload, timestampMs: Date.now() }, { jobId: `cc-${payload.pdfUploadId}-${payload.chunkIndex}`, priority: 3 });
}

export async function enqueueChunkEnhancementJob(payload) {
  await initQueues();
  return chunkEnhancementQueue.add({ ...payload, timestampMs: Date.now() }, { jobId: `ce-${payload.pdfUploadId}-${payload.chunkIndex}`, priority: 3 });
}

export async function enqueueQuestionGenerationJob(payload) {
  await initQueues();
  return questionGenerationQueue.add({ ...payload, timestampMs: Date.now() }, { jobId: `qgen-${payload.pdfUploadId}-${payload.chapterId}`, priority: 5 });
}

export async function enqueueDiagramIntelligenceJob(payload) {
  await initQueues();
  return diagramIntelligenceQueue.add({ ...payload, timestampMs: Date.now() }, { jobId: `diag-${payload.pdfUploadId}-${payload.figureId}`, priority: 5 });
}

export async function enqueueRoutingJob(payload) {
  await initQueues();
  return routingQueue.add({ ...payload, timestampMs: Date.now() }, { jobId: `route-${payload.pdfUploadId}`, priority: 10 });
}

export async function closeQueues() {
  const queues = [
    pdfQueue, parsingQueue, classificationQueue, aiEnhancementQueue,
    topicMappingQueue, chunkClassificationQueue, chunkEnhancementQueue,
    questionGenerationQueue, diagramIntelligenceQueue, routingQueue,
  ];
  await Promise.all(queues.map((q) => q.close()));
  console.log('All queues closed');
}

const queue = {
  pdfQueue, parsingQueue, classificationQueue, aiEnhancementQueue,
  topicMappingQueue, chunkClassificationQueue, chunkEnhancementQueue,
  questionGenerationQueue, diagramIntelligenceQueue, routingQueue,
  enqueuePDFProcessing, getJobStatus,
  chainParsingJob, chainClassificationJob, chainAIEnhancementJob, chainTopicMappingJob,
  enqueueChunkClassificationJob, enqueueChunkEnhancementJob,
  enqueueQuestionGenerationJob, enqueueDiagramIntelligenceJob, enqueueRoutingJob,
  setupQueueMonitoring, closeQueues, initQueues,
};

export default queue;
