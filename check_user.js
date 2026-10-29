const { PrismaClient } = require('./src/generated/prisma');
const p = new PrismaClient();

async function check() {
  const userId = 'b4de8c96-8756-4b34-a492-6bfe558aad78';
  
  const user = await p.user.findUnique({ where: { id: userId } });
  console.log('User:', JSON.stringify(user, null, 2));
  
  const vendor = await p.vendor.findFirst({ where: { userId: userId } });
  console.log('Vendor by userId:', JSON.stringify(vendor, null, 2));
  
  const vendorByEmail = await p.vendor.findFirst({ where: { contactEmail: 'chetankush729@gmail.com' } });
  console.log('Vendor by email:', JSON.stringify(vendorByEmail, null, 2));
  
  await p.$disconnect();
}

check().catch(e => { console.error(e); process.exit(1); });
