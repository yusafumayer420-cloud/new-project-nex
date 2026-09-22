/**
 * Admin Management Script
 * Usage:
 *   node manage_admins.js list                            — list all admin accounts
 *   node manage_admins.js reset <email> <newPassword>    — reset an admin's password
 *   node manage_admins.js promote <email>                — promote a user to admin
 *   node manage_admins.js demote <email>                 — demote an admin back to user
 *   node manage_admins.js create <email> <password> <name> — create a new admin account
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/crypto-trading';

async function connect() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');
}

async function listAdmins() {
  const admins = await User.find({ role: 'admin' }).select('email fullName status isVerified createdAt plainPassword');
  if (admins.length === 0) {
    console.log('⚠️  No admin accounts found.');
    return;
  }
  console.log(`Found ${admins.length} admin account(s):\n`);
  admins.forEach((a, i) => {
    console.log(`[${i + 1}] Email    : ${a.email}`);
    console.log(`     Name     : ${a.fullName}`);
    console.log(`     Status   : ${a.status}`);
    console.log(`     Verified : ${a.isVerified}`);
    console.log(`     Created  : ${a.createdAt?.toISOString().slice(0, 10)}`);
    if (a.plainPassword) console.log(`     Password : ${a.plainPassword}`);
    console.log('');
  });
}

async function resetPassword(email, newPassword) {
  if (!email || !newPassword) {
    console.error('Usage: node manage_admins.js reset <email> <newPassword>');
    process.exit(1);
  }
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) { console.error(`❌ No user found with email: ${email}`); process.exit(1); }

  const hashed = await bcrypt.hash(newPassword, 10);
  user.password = hashed;
  user.plainPassword = newPassword;
  user.passwordChangedAt = new Date();
  await user.save({ validateBeforeSave: false });

  console.log(`✅ Password reset for ${email}`);
  console.log(`   New password: ${newPassword}`);
}

async function promoteUser(email) {
  if (!email) { console.error('Usage: node manage_admins.js promote <email>'); process.exit(1); }
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) { console.error(`❌ No user found with email: ${email}`); process.exit(1); }
  if (user.role === 'admin') { console.log(`ℹ️  ${email} is already an admin.`); return; }

  user.role = 'admin';
  user.isVerified = true;
  await user.save({ validateBeforeSave: false });
  console.log(`✅ ${email} has been promoted to admin.`);
}

async function demoteUser(email) {
  if (!email) { console.error('Usage: node manage_admins.js demote <email>'); process.exit(1); }
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) { console.error(`❌ No user found with email: ${email}`); process.exit(1); }
  if (user.role === 'user') { console.log(`ℹ️  ${email} is already a regular user.`); return; }

  user.role = 'user';
  await user.save({ validateBeforeSave: false });
  console.log(`✅ ${email} has been demoted to regular user.`);
}

async function createAdmin(email, password, fullName) {
  if (!email || !password || !fullName) {
    console.error('Usage: node manage_admins.js create <email> <password> <fullName>');
    process.exit(1);
  }
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.error(`❌ An account already exists for ${email}. Use "promote" or "reset" instead.`);
    process.exit(1);
  }

  const hashed = await bcrypt.hash(password, 10);
  await User.create({
    email: email.toLowerCase(),
    password: hashed,
    plainPassword: password,
    fullName,
    role: 'admin',
    isVerified: true,
    wallet: {}
  });

  console.log(`✅ Admin account created!`);
  console.log(`   Email    : ${email}`);
  console.log(`   Password : ${password}`);
  console.log(`   Name     : ${fullName}`);
}

(async () => {
  const [,, command, arg1, arg2, arg3] = process.argv;

  try {
    await connect();

    switch (command) {
      case 'list':    await listAdmins(); break;
      case 'reset':   await resetPassword(arg1, arg2); break;
      case 'promote': await promoteUser(arg1); break;
      case 'demote':  await demoteUser(arg1); break;
      case 'create':  await createAdmin(arg1, arg2, arg3); break;
      default:
        console.log('Admin Management Script');
        console.log('=======================');
        console.log('  node manage_admins.js list');
        console.log('  node manage_admins.js reset <email> <newPassword>');
        console.log('  node manage_admins.js promote <email>');
        console.log('  node manage_admins.js demote <email>');
        console.log('  node manage_admins.js create <email> <password> <fullName>');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
