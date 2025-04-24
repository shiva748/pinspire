/**
 * Script to make a user a superadmin
 * 
 * Usage: 
 * 1. Update the userId variable below with the MongoDB _id of the user
 * 2. Run with: node scripts/make-superadmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../database/Schema/user');

// Replace with the MongoDB _id of the user you want to make superadmin
const userId = '680a23640052d183636a66f2';

async function makeUserSuperAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB || 'mongodb://localhost:27017/pintrest');
    console.log('Connected to MongoDB');
    
    const user = await User.findById(userId);
    
    if (!user) {
      console.log('User not found with ID:', userId);
      return;
    }
    
    console.log(`Found user: ${user.username} (${user.email})`);
    
    // Set admin privileges
    user.isAdmin = true;
    user.adminPermissions = [
      'read', 
      'write', 
      'admin-management', 
      'superadmin'
    ];
    
    await user.save();
    
    console.log(`Success! User ${user.username} is now a superadmin with all permissions`);
    console.log('Admin permissions:', user.adminPermissions);
    
  } catch (error) {
    console.error('Error making user superadmin:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Only run if called directly
if (require.main === module) {
  if (userId === 'REPLACE_WITH_USER_ID') {
    console.error('Error: You must replace REPLACE_WITH_USER_ID with an actual user ID');
    process.exit(1);
  }
  
  makeUserSuperAdmin();
} 