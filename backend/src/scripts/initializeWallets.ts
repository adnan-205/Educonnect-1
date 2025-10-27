/**
 * Initialize Wallets for Existing Teachers
 * 
 * This script creates wallets for all existing teachers who don't have one yet.
 * Run this once after deploying the wallet system.
 * 
 * Usage:
 *   npx ts-node src/scripts/initializeWallets.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Wallet from '../models/Wallet';

// Load environment variables
dotenv.config();

async function initializeWallets() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB');

    // Find all teachers
    const teachers = await User.find({ role: 'teacher' });
    console.log(`\n📊 Found ${teachers.length} teachers`);

    let created = 0;
    let existing = 0;
    let errors = 0;

    for (const teacher of teachers) {
      try {
        // Check if wallet already exists
        const existingWallet = await Wallet.findOne({ teacher: teacher._id });

        if (existingWallet) {
          console.log(`⏭️  Wallet already exists for: ${teacher.name} (${teacher.email})`);
          existing++;
          continue;
        }

        // Create new wallet
        const wallet = await Wallet.create({
          teacher: teacher._id,
          balance: 0,
          totalEarned: 0,
          totalWithdrawn: 0,
          currency: 'BDT',
        });

        // Update user with wallet reference
        await User.findByIdAndUpdate(teacher._id, { wallet: wallet._id });

        console.log(`✅ Created wallet for: ${teacher.name} (${teacher.email})`);
        created++;
      } catch (error) {
        console.error(`❌ Error creating wallet for ${teacher.name}:`, error);
        errors++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📋 SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Teachers: ${teachers.length}`);
    console.log(`✅ Wallets Created: ${created}`);
    console.log(`⏭️  Already Existed: ${existing}`);
    console.log(`❌ Errors: ${errors}`);
    console.log('='.repeat(50));

    if (created > 0) {
      console.log('\n✨ Wallet initialization completed successfully!');
    } else if (existing === teachers.length) {
      console.log('\n✨ All teachers already have wallets!');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
console.log('🚀 Starting Wallet Initialization Script...\n');
initializeWallets();
