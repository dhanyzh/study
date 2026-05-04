/**
 * MongoDB Connection Utility
 * 
 * Uses Mongoose to connect to MongoDB Atlas.
 * Implements connection caching to prevent multiple connections
 * in serverless/edge environments (Next.js API routes).
 * 
 * FALLBACK: When the primary MongoDB is unreachable AND we are
 * in development, automatically start a MongoMemoryServer so that
 * Mongoose models (PdfUpload, Quiz, etc.) work out-of-the-box
 * with zero infrastructure setup.
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studyos';

/**
 * Global cache for the MongoDB connection.
 * In development, we use a global variable to preserve the connection
 * across hot-reloads. In production, this is naturally handled.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null, memServer: null };
}

/**
 * Connect to MongoDB.
 * Returns a cached connection if available, otherwise creates a new one.
 * Falls back to MongoMemoryServer in development if the primary URI is unreachable.
 */
async function dbConnect() {
  // Return cached connection if available and still connected
  if (cached.conn) {
    // Verify the connection is still alive
    if (mongoose.connection.readyState === 1) {
      return cached.conn;
    }
    // Connection dropped — reset and reconnect
    cached.conn = null;
    cached.promise = null;
  }

  // If no promise exists, create a new connection
  if (!cached.promise) {
    const opts = {
      bufferCommands: true, // CHANGED: allow buffering so operations queue until connected
      serverSelectionTimeoutMS: 5000, // fail fast if server not found
      connectTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      console.log('✅ MongoDB connected successfully to:', MONGODB_URI.replace(/\/\/.*@/, '//***@'));
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    console.error('❌ MongoDB Connection Error:', e.message);
    cached.promise = null;
    cached.conn = null;

    // ──────────────────────────────────────────────────
    // FALLBACK: Start MongoMemoryServer for local dev
    // ──────────────────────────────────────────────────
    if (process.env.NODE_ENV !== 'production') {
      // Reuse existing memory server if it was already started
      if (cached.memServer) {
        const memUri = cached.memServer.getUri();
        console.log('🔄 Reusing existing MongoDB Memory Server at:', memUri);
        try {
          // Disconnect any stale connection first
          if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
          }
          cached.conn = await mongoose.connect(memUri, { bufferCommands: true });
          cached.promise = Promise.resolve(cached.conn);
          return cached.conn;
        } catch (reconnErr) {
          console.error('❌ Failed to reconnect to Memory Server:', reconnErr.message);
        }
      }

      console.log('🔄 Starting MongoDB Memory Server for local development...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const memServer = await MongoMemoryServer.create();
        const memUri = memServer.getUri();
        console.log('✅ MongoDB Memory Server started at:', memUri);

        // Disconnect any stale connection first
        if (mongoose.connection.readyState !== 0) {
          await mongoose.disconnect();
        }

        cached.conn = await mongoose.connect(memUri, { bufferCommands: true });
        cached.promise = Promise.resolve(cached.conn);
        cached.memServer = memServer;
        return cached.conn;
      } catch (memError) {
        console.error('❌ Failed to start MongoDB Memory Server:', memError.message);
        console.error('   Install it with: npm install mongodb-memory-server --save-dev');
      }
    }

    // If we get here, nothing worked. Throw so callers know DB is unavailable.
    throw new Error(
      'MongoDB connection failed: ' + e.message + 
      ' | URI used: ' + (MONGODB_URI ? MONGODB_URI.replace(/\/\/.*@/, '//***@') : 'undefined')
    );
  }
}

export default dbConnect;
