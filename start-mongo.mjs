import { MongoMemoryServer } from 'mongodb-memory-server';

async function startServer() {
  console.log('Starting MongoDB Memory Server...');
  const mongod = await MongoMemoryServer.create({
    instance: {
      port: 27017
    }
  });
  
  const uri = mongod.getUri();
  console.log('-------------------------------------------');
  console.log('MongoDB Memory Server is running!');
  console.log(`Connection URI: ${uri}`);
  console.log('-------------------------------------------');
  console.log('Press Ctrl+C to stop.');
}

startServer().catch(console.error);
