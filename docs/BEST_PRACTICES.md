# PDF Intelligence Engine - Best Practices & Checklist

## ✅ Implementation Checklist

### Phase 1: Foundation (Week 1)
- [ ] Install all dependencies (BullMQ, Redis, pdf-parse)
- [ ] Setup Redis locally (Docker or native)
- [ ] Configure environment variables
- [ ] Create queue infrastructure (queue.js)
- [ ] Test queue connectivity

### Phase 2: Services (Week 2)
- [ ] Implement extraction service
- [ ] Implement parsing service
- [ ] Implement classification service
- [ ] Implement AI enhancement service
- [ ] Implement topic mapping service
- [ ] Unit test each service

### Phase 3: Workers (Week 3)
- [ ] Create extraction worker
- [ ] Create parsing worker
- [ ] Create classification worker
- [ ] Create AI enhancement worker
- [ ] Create topic mapping worker
- [ ] Setup worker monitoring
- [ ] Test worker pipeline

### Phase 4: API & Integration (Week 4)
- [ ] Update PDF upload API
- [ ] Create status check API
- [ ] Update frontend for async processing
- [ ] Create progress UI component
- [ ] Setup job tracking
- [ ] Integration testing

### Phase 5: Production (Week 5)
- [ ] Cloud storage setup (S3)
- [ ] Database optimization (indexes)
- [ ] Monitoring & alerting
- [ ] Error handling & retries
- [ ] Load testing
- [ ] Security audit
- [ ] Deployment

---

## 🎯 Performance Optimization

### Text Processing
```javascript
// ❌ Bad: Process entire PDF at once
const blocks = parseIntoBlocks(entireText);

// ✅ Good: Process page by page
const pages = splitIntoPages(text, 40); // lines per page
for (const page of pages) {
  const blocks = parseIntoBlocks(page);
  // Process...
}
```

### LLM Calls
```javascript
// ❌ Bad: One API call per block
for (const block of blocks) {
  const result = await chatWithAI(block.content);
}

// ✅ Good: Batch multiple blocks
const batchSize = 5;
for (let i = 0; i < blocks.length; i += batchSize) {
  const batch = blocks.slice(i, i + batchSize);
  const results = await Promise.all(
    batch.map(b => classifyContentBlock(b))
  );
}
```

### Caching
```javascript
// ✅ Cache embeddings and classifications
const redis = require('redis');
const client = redis.createClient();

async function classifyWithCache(content) {
  const key = `classify:${hashContent(content)}`;
  const cached = await client.get(key);
  
  if (cached) return JSON.parse(cached);
  
  const result = await classifyContentBlock(content);
  await client.setex(key, 86400, JSON.stringify(result)); // 24hr cache
  
  return result;
}
```

---

## 🔐 Security Best Practices

### File Validation
```javascript
// Validate file before processing
async function validatePDF(file, maxSize = 50 * 1024 * 1024) {
  // Check size
  if (file.size > maxSize) throw new Error('File too large');
  
  // Check MIME type
  if (file.type !== 'application/pdf') throw new Error('Invalid file type');
  
  // Check magic bytes (PDF signature)
  const signature = file.slice(0, 4);
  if (signature !== '%PDF') throw new Error('Not a valid PDF');
  
  // Optional: Scan with ClamAV
  const isSafe = await scanWithClamAV(file);
  if (!isSafe) throw new Error('File contains malware');
}
```

### Data Protection
```javascript
// Encrypt sensitive fields in database
const upload = {
  ...data,
  extractedText: encrypt(extractedText, encryptionKey),
  aiProcessedContent: encrypt(aiProcessedContent, encryptionKey),
};

// Delete files after retention period
async function cleanupOldUploads() {
  const retentionDays = 30;
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  
  const oldUploads = await PdfUpload.find({ createdAt: { $lt: cutoff } });
  
  for (const upload of oldUploads) {
    await deleteFile(upload.filepath);
    await PdfUpload.deleteOne({ _id: upload._id });
  }
}
```

---

## 🚨 Error Handling Strategy

### Retry Logic
```javascript
async function processWithRetry(fn, maxAttempts = 3, backoffMs = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      
      const delay = backoffMs * Math.pow(2, attempt - 1); // exponential
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// Usage
await processWithRetry(() => extractPDF(buffer), 4, 2000);
```

### Graceful Degradation
```javascript
// If AI fails, use rule-based fallback
async function classifyContentBlock(block, subject) {
  try {
    // Try AI first
    return await classifyByAI(block, subject);
  } catch (error) {
    // Fall back to rules
    console.warn('AI classification failed, using rules:', error);
    return classifyByRules(block);
  }
}
```

---

## 📊 Monitoring & Observability

### Queue Metrics
```javascript
async function emitQueueMetrics() {
  const queues = [pdfQueue, parsingQueue, classificationQueue, aiEnhancementQueue, topicMappingQueue];
  
  setInterval(async () => {
    for (const queue of queues) {
      const metrics = {
        name: queue.name,
        active: await queue.getActiveCount(),
        waiting: await queue.getWaitingCount(),
        failed: await queue.getFailedCount(),
        completed: await queue.getCompletedCount(),
        timestamp: new Date(),
      };
      
      // Send to monitoring service (Datadog, CloudWatch, etc)
      monitor.emit('queue-metrics', metrics);
    }
  }, 10000); // Every 10 seconds
}
```

### Performance Tracking
```javascript
// Track processing time per stage
const timings = {};

async function trackStage(stageName, fn) {
  const start = Date.now();
  
  try {
    const result = await fn();
    const duration = Date.now() - start;
    
    timings[stageName] = {
      duration,
      success: true,
      timestamp: new Date(),
    };
    
    console.log(`[${stageName}] Completed in ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    
    timings[stageName] = {
      duration,
      success: false,
      error: error.message,
    };
    
    throw error;
  }
}
```

---

## 🧪 Testing Strategies

### Unit Tests
```javascript
import { parseIntoBlocks, buildBlockHierarchy } from '@/lib/parsing-service';
import { classifyContentBlock } from '@/lib/classification-service';

describe('PDF Pipeline', () => {
  describe('Parsing', () => {
    test('should parse markdown headings', () => {
      const text = '# Chapter 1\n\nContent here';
      const blocks = parseIntoBlocks(text);
      expect(blocks[0].type).toBe('heading');
    });

    test('should parse MCQs', () => {
      const text = 'Q: What is 2+2?\nA) 4\nB) 5\nC) 6\nD) 7';
      const blocks = parseIntoBlocks(text);
      expect(blocks.some(b => b.type === 'mcq')).toBe(true);
    });
  });

  describe('Classification', () => {
    test('should classify notes', () => {
      const block = { content: 'Biology is the study of life', type: 'paragraph' };
      const result = classifyByRules(block);
      expect(result.primaryCategory).toBe('notes');
    });
  });
});
```

### Integration Tests
```javascript
describe('PDF Processing Pipeline', () => {
  test('should process PDF end-to-end', async () => {
    const pdfBuffer = fs.readFileSync('test.pdf');
    const extraction = await extractPDF(pdfBuffer);
    
    expect(extraction.success).toBe(true);
    expect(extraction.pageCount).toBeGreaterThan(0);
    
    const blocks = parseIntoBlocks(extraction.text);
    expect(blocks.length).toBeGreaterThan(0);
    
    const classified = await classifyBlocks(blocks);
    expect(classified.some(b => b.classification)).toBe(true);
  });
});
```

### Load Testing
```javascript
// Simulate 100 concurrent uploads
async function loadTest() {
  const pdfBuffer = fs.readFileSync('sample.pdf');
  const promises = [];

  for (let i = 0; i < 100; i++) {
    promises.push(
      fetch('/api/pdf/upload', {
        method: 'POST',
        body: createFormData(pdfBuffer, `file-${i}.pdf`),
        headers: { Authorization: `Bearer ${token}` },
      })
    );
  }

  const results = await Promise.all(promises);
  const success = results.filter(r => r.ok).length;
  console.log(`Success rate: ${success}%`);
}
```

---

## 📱 Client-Side Best Practices

### Polling Strategy
```javascript
async function pollStatus(jobId, maxAttempts = 300, interval = 2000) {
  let attempts = 0;

  return new Promise((resolve, reject) => {
    const timer = setInterval(async () => {
      attempts++;

      try {
        const response = await fetch(`/api/pdf/status/${jobId}`);
        const { upload } = await response.json();

        console.log(`[${attempts}] ${upload.status}: ${upload.progress}%`);

        if (upload.status === 'completed') {
          clearInterval(timer);
          resolve(upload);
        } else if (upload.status === 'failed') {
          clearInterval(timer);
          reject(new Error(upload.errorLog?.[0] || 'Processing failed'));
        } else if (attempts >= maxAttempts) {
          clearInterval(timer);
          reject(new Error('Processing timeout'));
        }
      } catch (error) {
        clearInterval(timer);
        reject(error);
      }
    }, interval);
  });
}
```

### WebSocket Updates (Optional)
```javascript
// Real-time updates instead of polling
const ws = new WebSocket('ws://your-server/pdf-updates');

ws.onmessage = (event) => {
  const { jobId, status, progress } = JSON.parse(event.data);
  updateUI(jobId, status, progress);
};
```

---

## 🚀 Deployment Checklist

### Production Configuration
```env
# Security
ENCRYPTION_KEY=your-encryption-key
JWT_SECRET=your-jwt-secret

# Database
MONGODB_URI=your-production-db
DB_POOL_SIZE=10

# Redis
REDIS_HOST=your-redis-cluster
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_SSL=true

# Storage
AWS_REGION=us-east-1
AWS_BUCKET=your-pdf-bucket
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret

# AI
GEMINI_API_KEY=your-key
RATE_LIMIT=100  # requests per minute

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
```

### Infrastructure
```yaml
# docker-compose.yml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - REDIS_HOST=redis
      - DATABASE_URL=mongodb://mongo:27017/studyos
    depends_on:
      - redis
      - mongo

  mongo:
    image: mongo:6
    volumes:
      - mongo-data:/data/db

volumes:
  redis-data:
  mongo-data:
```

---

## 💡 Advanced Topics

### Vector Embeddings for Semantic Search
```javascript
// Use embeddings for better topic matching
import Anthropic from '@anthropic-ai/sdk';

async function getEmbedding(text) {
  const client = new Anthropic();
  
  const embedding = await client.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Generate embedding vector for: ${text}`
    }]
  });
  
  return embedding;
}
```

### Multi-Language Support
```javascript
// Detect and handle multiple languages
async function detectLanguage(text) {
  const prompt = `Detect the language of this text and respond with language code:
${text.substring(0, 500)}`;
  
  const language = await chatWithAI(prompt);
  return language.trim();
}

async function translateContent(text, targetLanguage) {
  const prompt = `Translate to ${targetLanguage}:
${text}`;
  
  return await chatWithAI(prompt);
}
```

---

## 📚 References

- [BullMQ Documentation](https://docs.bullmq.io/)
- [MongoDB Best Practices](https://docs.mongodb.com/manual/core/)
- [Google Gemini API](https://ai.google.dev/)
- [Node.js Stream Processing](https://nodejs.org/en/docs/guides/backpressuring-in-streams/)

