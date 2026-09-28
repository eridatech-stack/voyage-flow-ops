import { db } from "./client";
import { users, agency_settings } from "./schema";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Seeding database...");

  // Create default admin user
  const email = "admin@intravelsync.com";
  const password = "Admin2026!";
  const hash = await bcrypt.hash(password, 12);

  await db.insert(users).values({
    email,
    password_hash: hash,
    full_name: "Admin",
  }).onDuplicateKeyUpdate({ set: { email } });

  // Create default settings
  await db.insert(agency_settings).values({
    agency_name: "InTravelSync",
    contact_email: "ops@intravelsync.com",
    support_phone: "+374 11 22 33 44",
    address: "12 Abovyan Street, Yerevan, Armenia",
    currency: "AMD",
    timezone: "Asia/Yerevan",
    voucher_footer: "Thank you for travelling with us. Please present this voucher to your guide.",
    voucher_show_qr: true,
    voucher_auto_email: true,
    voucher_signature_line: false,
    email_from_name: "InTravelSync",
  }).onDuplicateKeyUpdate({ set: { agency_name: "InTravelSync" } });

  console.log("✅ Seed complete!");
  console.log(`\n📧 Login: ${email}`);
  console.log(`🔑 Password: ${password}`);
  console.log("\nChange the password after first login!");
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
