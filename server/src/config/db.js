import mongoose from 'mongoose';

let memoryServer = null;

export const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGODB_URI;

    // In testing or when explicitly requested
    if (process.env.USE_IN_MEMORY_DB === 'true' || (!mongoUri && process.env.NODE_ENV === 'test')) {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      mongoUri = memoryServer.getUri();
      console.log('Using in-memory MongoDB instance (zero-config mode)');
      const conn = await mongoose.connect(mongoUri);
      console.log(`In-Memory MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    }

    if (!mongoUri) {
      mongoUri = 'mongodb://127.0.0.1:27017/imovies';
    }

    try {
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 3000,
      });
      console.log(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    } catch (connErr) {
      // If local MongoDB is not running, provide intelligent fallback to in-memory server in development
      if (process.env.NODE_ENV !== 'production' && (mongoUri.includes('127.0.0.1') || mongoUri.includes('localhost'))) {
        console.warn('⚠️  Local MongoDB (localhost:27017) not detected.');
        console.log('🔄 Automatically initializing built-in in-memory MongoDB for seamless development...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create();
        const fallbackUri = memoryServer.getUri();
        const conn = await mongoose.connect(fallbackUri);
        console.log(`✅ In-Memory MongoDB Connected: ${conn.connection.name}`);
        return conn;
      }
      throw connErr;
    }
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error('Tip: Make sure MongoDB is running locally or provide a valid MONGODB_URI in .env');
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    return null;
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
    }
  } catch (error) {
    console.error(`Error disconnecting DB: ${error.message}`);
  }
};
