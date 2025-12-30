const { PrismaClient } = require('./src/generated/prisma');
const p = new PrismaClient();

async function fix() {
  const newUserId = 'b4de8c96-8756-4b34-a492-6bfe558aad78';
  const oldUserId = '9848eaff-0ab2-4afd-aa11-a8e850f66752';
  const email = 'chetankush729@gmail.com';
  const vendorId = '6afaf2e3-939f-4a1d-94cc-1b7125126a8f';
  
  console.log('Updating user ID from', oldUserId, 'to', newUserId);
  
  // Use raw SQL to update the user ID (bypasses Prisma constraints)
  // Prisma uses PascalCase model names but PostgreSQL table names are lowercase
  await p.$executeRawUnsafe(`UPDATE "user" SET id = $1 WHERE id = $2`, newUserId, oldUserId);
  console.log('User ID updated');
  
  // Update vendor to point to new user ID
  await p.$executeRawUnsafe(`UPDATE "vendor" SET "userId" = $1 WHERE id = $2`, newUserId, vendorId);
  console.log('Vendor userId updated');
  
  // Verify final state
  const finalUser = await p.user.findUnique({ where: { id: newUserId } });
  const finalVendor = await p.vendor.findUnique({ where: { id: vendorId } });
  console.log('\n=== FINAL STATE ===');
  console.log('User:', finalUser?.id, finalUser?.role);
  console.log('Vendor userId:', finalVendor?.userId);
  
  await p.$disconnect();
  console.log('\nDone! Try creating a product now.');
}

fix().catch(e => { console.error(e); process.exit(1); });
