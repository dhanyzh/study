import dbConnect from './src/lib/db.js';
import PdfUpload from './src/models/PdfUpload.js';
import { enqueuePDFProcessing } from './src/lib/queue.js';
import { ensurePDFWorkers } from './src/lib/pdf-workers.js';
import path from 'path';

async function run() {
  await dbConnect();
  
  const upload = await PdfUpload.create({
    userId: '65f0a0c9e0a0a00000000001', // dummy ObjectId
    filename: 'test-upload.pdf',
    originalName: 'dummy.pdf',
    fileSize: 13264, // roughly 13KB
    status: 'queued',
    currentStage: 'Queued for processing',
    progress: 0,
  });

  console.log('Created upload record:', upload._id);

  await ensurePDFWorkers();

  const filePath = path.join(process.cwd(), 'test-upload.pdf');
  const job = await enqueuePDFProcessing(upload._id.toString(), upload.userId, filePath);
  
  console.log('Job enqueued:', job.id);
  
  // Wait a bit to let it process
  console.log('Waiting for processing...');
  
  // Poll status
  let attempts = 0;
  while(attempts < 15) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const updated = await PdfUpload.findById(upload._id);
    console.log(`Status: ${updated.status}, Progress: ${updated.progress}%, Stage: ${updated.currentStage}`);
    if (updated.status === 'completed' || updated.status === 'failed') {
      break;
    }
    attempts++;
  }
  
  process.exit(0);
}

run().catch(console.error);
