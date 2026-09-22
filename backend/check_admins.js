const mongoose = require('mongoose');
require('dotenv').config();

const UserSchema = new mongoose.Schema({
  email: String,
  role: String
});
const User = mongoose.model('User', UserSchema);

async function checkAdmins() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/crypto-trading';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const admins = await User.find({ role: 'admin' });
    console.log('Admin users found:', admins.length);
    admins.forEach(admin => {
      console.log(`- ${admin.email}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAdmins();
