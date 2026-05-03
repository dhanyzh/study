# PDF Intelligence Engine - Implementation Guide

## 🎯 Quick Start

### 1. Install Dependencies

```bash
npm install bull redis pdfjs-dist tesseract.js-core pdf-parse
```

### 2. Setup Redis (for job queue)

```bash
# If using Windows with WSL or Docker:
docker run -d -p 6379:6379 redis:latest

# Or install Redis locally on Windows
# https://github.com/microsoftarchive/redis/releases
```

### 3. Add Environment Variables

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# File Storage
UPLOAD_DIR=/uploads
MAX_PDF_SIZE=52428800  # 50MB

# AI Configuration
GEMINI_API_KEY=your-key
```

### 4. Initialize Workers in Your App

In a server component or API route (e.g., in your root layout or startup sequence):

```javascript
// src/app/layout.js or a dedicated worker initialization file
import { initializeAllWorkers, setupQueueMonitoring } from '@/lib/pdf-workers';

// Initialize on server startup (only runs once)
if (process.env.NODE_ENV !== 'development' || !global.workersInitialized) {
  initializeAllWorkers().catch(console.error);
  setupQueueMonitoring();
  global.workersInitialized = true;
}
```

---

## 📊 Architecture Overview

### Processing Pipeline

```
PDF Upload
    ↓
┌─────────────────────┐
│ EXTRACTION WORKER   │  Extracts text from PDF
└────────────┬────────┘
             ↓
┌─────────────────────┐
│ PARSING WORKER      │  Structures content into blocks
└────────────┬────────┘
             ↓
┌─────────────────────┐
│ CLASSIFICATION      │  Categorizes blocks (notes, MCQ, etc)
│ WORKER              │
└────────────┬────────┘
             ↓
┌─────────────────────┐
│ AI ENHANCEMENT      │  Generates summaries, MCQs, flashcards
│ WORKER              │
└────────────┬────────┘
             ↓
┌─────────────────────┐
│ TOPIC MAPPING       │  Maps to Subject→Chapter→Topic
│ WORKER              │
└────────────┬────────┘
             ↓
        DATABASE
(Notes, MCQs, Flashcards)
```

---

## 🔧 API Usage

### 1. Upload PDF

```javascript
// Client-side
const formData = new FormData();
formData.append('file', pdfFile);
formData.append('subjectId', 'dsa');  // Optional

const response = await fetch('/api/pdf/upload', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});

const { upload } = await response.json();
console.log('Job ID:', upload.jobId);  // Track this for status updates
```

### 2. Check Processing Status

```javascript
// Poll for status (recommended: every 2-3 seconds)
const checkStatus = async (jobId) => {
  const response = await fetch(`/api/pdf/status/${jobId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const { upload, processedContent } = await response.json();
  
  console.log('Progress:', upload.progress, '%');
  console.log('Status:', upload.status);
  
  if (upload.status === 'completed') {
    console.log('Content:', processedContent);
  }
  
  if (upload.errorLog?.length > 0) {
    console.error('Errors:', upload.errorLog);
  }
};

// Poll every 2 seconds
const interval = setInterval(() => checkStatus(jobId), 2000);

// Stop when done
setTimeout(() => clearInterval(interval), 300000); // 5 min timeout
```

### 3. Frontend Progress UI

```jsx
'use client';
import { useState, useEffect } from 'react';

export default function PDFUploadStatus({ jobId }) {
  const [status, setStatus] = useState(null);
  const [content, setContent] = useState(null);

  useEffect(() => {
    const poll = setInterval(async () => {
      const res = await fetch(`/api/pdf/status/${jobId}`);
      const data = await res.json();
      setStatus(data.upload);

      if (data.upload.status === 'completed') {
        setContent(data.processedContent);
        clearInterval(poll);
      }
    }, 2000);

    return () => clearInterval(poll);
  }, [jobId]);

  if (!status) return <div>Loading...</div>;

  return (
    <div>
      <div>Status: {status.currentStage}</div>
      <progress value={status.progress} max={100} />
      <p>{status.progress}% - {status.status}</p>

      {status.errorLog?.length > 0 && (
        <div>
          <h4>Errors:</h4>
          {status.errorLog.map((err, i) => <p key={i}>{err}</p>)}
        </div>
      )}

      {content && (
        <div>
          <h3>Processing Complete!</h3>
          <p>Notes: {content.notes?.length || 0}</p>
          <p>MCQs: {content.mcqs?.length || 0}</p>
          <p>Flashcards: {content.flashcards?.length || 0}</p>
        </div>
      )}
    </div>
  );
}
```

---

## 🗄️ Database Models

### PdfUpload

```javascript
const schema = {
  _id: ObjectId,
  userId: ObjectId,
  filename: String,
  originalName: String,
  status: String, // queued, extracting, parsing, classifying, enhancing, mapping, completed, failed
  currentStage: String,
  progress: Number, // 0-100
  pageCount: Number,
  fileSize: Number,
  extractedText: String,
  aiProcessedContent: {
    notes: Array,
    mcqs: Array,
    flashcards: Array,
  },
  errorLog: [String],
  uploadedAt: Date,
  completedAt: Date,
};
```

---

## 🚀 Performance Tips

### 1. Batch Processing

For large PDF collections, batch uploads with delays:

```javascript
async function uploadMultiplePDFs(files) {
  for (const file of files) {
    await uploadPDF(file);
    await new Promise(r => setTimeout(r, 1000)); // 1s delay between uploads
  }
}
```

### 2. Worker Scaling

Run multiple worker instances:

```javascript
// worker.js - Run this as a separate Node process
import { initializeAllWorkers } from '@/lib/pdf-workers';
initializeAllWorkers();

// Start with: node worker.js
// In production, use PM2 or similar to manage processes
```

### 3. Caching

The system automatically caches:
- Extracted text blocks
- MCQ generations
- Topic mappings

Redis handles this. Ensure Redis is running.

---

## 🔍 Monitoring & Debugging

### 1. Check Queue Health

```javascript
import { pdfQueue, parsingQueue, classificationQueue, aiEnhancementQueue, topicMappingQueue } from '@/lib/queue';

async function checkQueueHealth() {
  const queues = [pdfQueue, parsingQueue, classificationQueue, aiEnhancementQueue, topicMappingQueue];

  for (const queue of queues) {
    const activeCount = await queue.getActiveCount();
    const failedCount = await queue.getFailedCount();
    const completedCount = await queue.getCompletedCount();

    console.log(`${queue.name}:`, {
      active: activeCount,
      failed: failedCount,
      completed: completedCount,
    });
  }
}
```

### 2. Logs

Logs are printed to console. In production, send to:
- Sentry
- CloudWatch
- ELK Stack

Example:

```javascript
const Sentry = require('@sentry/node');

try {
  // processing code
} catch (error) {
  Sentry.captureException(error);
  console.error('Processing failed:', error);
}
```

---

## 🧪 Testing

### Unit Test Example

```javascript
import { parseIntoBlocks } from '@/lib/parsing-service';

describe('Parsing Service', () => {
  it('should parse headings', () => {
    const text = '# Introduction\n\nThis is a paragraph.';
    const blocks = parseIntoBlocks(text);

    expect(blocks[0].type).toBe('heading');
    expect(blocks[0].content).toBe('Introduction');
  });

  it('should detect MCQs', () => {
    const text = 'What is 2+2?\nA) 4\nB) 5\nC) 6\nD) 7';
    const blocks = parseIntoBlocks(text);

    expect(blocks[0].type).toBe('mcq');
  });
});
```

---

## 🔐 Security Considerations

1. **File Validation**
   - Check MIME type
   - Scan file size
   - Use virus scanning in production (ClamAV)

2. **User Access Control**
   - Verify user owns the upload
   - Rate limit uploads per user
   - Quota management

3. **Content Safety**
   - Sanitize extracted text
   - Filter inappropriate content
   - Log all processing

4. **Data Privacy**
   - Encrypt files in storage
   - Delete files after retention period
   - GDPR compliance

---

## 📈 Scaling to Production

### 1. Use Cloud Storage (AWS S3)

```javascript
import AWS from 'aws-sdk';

const s3 = new AWS.S3();

async function uploadToS3(filePath, filename) {
  const fileContent = await fs.readFile(filePath);
  const params = {
    Bucket: process.env.AWS_BUCKET,
    Key: `pdfs/${filename}`,
    Body: fileContent,
  };

  return s3.upload(params).promise();
}
```

### 2. Distributed Redis

Use Redis Cluster or AWS ElastiCache:

```javascript
const redis = require('redis');
const client = redis.createClient({
  host: 'your-redis-cluster-endpoint',
  port: 6379,
  cluster: true,
});
```

### 3. Database Optimization

Add indexes:

```javascript
db.collection('pdfuploads').createIndex({ userId: 1, createdAt: -1 });
db.collection('pdfuploads').createIndex({ status: 1, progress: 1 });
```

### 4. Load Balancing

Use multiple app instances behind a load balancer.

---

## 🎓 Learning Resources

- [BullMQ Documentation](https://docs.bullmq.io/)
- [pdf-parse Guide](https://www.npmjs.com/package/pdf-parse)
- [Google Gemini API](https://ai.google.dev/)
- [MongoDB Best Practices](https://docs.mongodb.com/manual/core/data-modeling/)

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| PDF extraction fails | Check if PDF is digital (not scanned); enable OCR |
| Workers not processing | Verify Redis is running; check queue health |
| LLM API errors | Check API key; rate limit; use fallback |
| Memory issues | Chunk text; limit batch size; increase server RAM |
| Slow processing | Add more workers; optimize prompts; use caching |

---

## 📝 Configuration Checklist

- [ ] Redis installed and running
- [ ] Environment variables set (.env.local)
- [ ] Workers initialized on app startup
- [ ] Database connected and models created
- [ ] API routes deployed
- [ ] Frontend UI updated for async processing
- [ ] Monitoring/logging configured
- [ ] Error handling tested
- [ ] Rate limiting configured
- [ ] Production deployment planned

