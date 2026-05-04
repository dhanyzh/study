import mongoose from 'mongoose';

const uri = "mongodb+srv://jalwadhanish2_db_user:s7IpWpmzMIN5Xxnu@cluster0.suh93xh.mongodb.net/?retryWrites=true&w=majority";

console.log('Connecting to:', uri.replace(/\/\/.*@/, '//***@'));

mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 })
  .then(() => {
    console.log('✅ Success! Connected to Atlas.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  });
