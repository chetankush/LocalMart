/**
 * Script to set up admin user
 * 
 * Usage: node scripts/setup-admin.js
 * 
 * This script will:
 * 1. Check if the admin user exists in the database
 * 2. If exists, update their role to ADMIN
 * 3. If not exists, create the user with ADMIN role
 * 
 * Note: The admin must also have a Supabase auth account with the same email.
 * You can create one at: https://supabase.com/dashboard (your project > Authentication > Users)
 */

const { PrismaClient } = require("../src/generated/prisma");

const prisma = new PrismaClient();

// Admin email - change this to your admin email
const ADMIN_EMAIL = "chetankushwah729@gmail.com";
const ADMIN_NAME = "Admin User";

async function setupAdmin() {
  console.log("🔧 Setting up admin user...\n");

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
    });

    if (existingUser) {
      console.log(`✅ User found: ${existingUser.email}`);
      console.log(`   Current role: ${existingUser.role}`);

      if (existingUser.role === "ADMIN") {
        console.log("\n✨ User is already an admin. No changes needed.");
      } else {
        // Update to ADMIN role
        const updatedUser = await prisma.user.update({
          where: { email: ADMIN_EMAIL },
          data: { role: "ADMIN" },
        });
        console.log(`\n✅ Updated user role to ADMIN`);
        console.log(`   Email: ${updatedUser.email}`);
        console.log(`   Role: ${updatedUser.role}`);
      }
    } else {
      // Create new admin user
      console.log(`⚠️  User not found with email: ${ADMIN_EMAIL}`);
      console.log("   Creating new admin user...\n");

      const newUser = await prisma.user.create({
        data: {
          email: ADMIN_EMAIL,
          fullName: ADMIN_NAME,
          role: "ADMIN",
        },
      });

      console.log(`✅ Created new admin user`);
      console.log(`   ID: ${newUser.id}`);
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Role: ${newUser.role}`);
    }

    console.log("\n" + "=".repeat(50));
    console.log("📝 IMPORTANT: Make sure you also have a Supabase auth account");
    console.log(`   with the email: ${ADMIN_EMAIL}`);
    console.log("   You can create one in your Supabase dashboard:");
    console.log("   Authentication > Users > Add User");
    console.log("=".repeat(50));

  } catch (error) {
    console.error("❌ Error setting up admin:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdmin();
