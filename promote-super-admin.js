const mongoose = require('mongoose');

// Connection string for the production database
const MONGODB_URI = "mongodb+srv://jalwadhanish2_db_user:s7IpWpmzMIN5Xxnu@cluster0.suh93xh.mongodb.net/?appName=Cluster0";

async function promoteAdmin() {
  console.log('Connecting to MongoDB Atlas...');
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
      username: String,
      role: String,
      permissions: [String]
    }));

    console.log('Searching for user: admindhanis...');
    const result = await User.findOneAndUpdate(
      { username: 'admindhanis' },
      { 
        $set: { 
          role: 'super_admin',
          permissions: [] // Super admins don't need explicit perms
        } 
      },
      { new: true }
    );

    if (result) {
      console.log('SUCCESS! User promoted to super_admin:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('User not found in database. Please make sure the username is correct.');
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

promoteAdmin();
