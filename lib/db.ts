import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

// Reuse one connection across hot reloads (dev) and warm serverless invocations (Vercel).
const globalForMongoose = globalThis as unknown as { mongooseCache?: Cache };
const cache: Cache = globalForMongoose.mongooseCache ?? { conn: null, promise: null };
globalForMongoose.mongooseCache = cache;

export async function connectDB() {
  if (cache.conn) return cache.conn;
  if (!MONGODB_URI) throw new Error("MONGODB_URI is not set");

  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000, // slow first TLS handshakes on some networks
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null; // allow a retry on the next request
    throw err;
  }
  return cache.conn;
}
