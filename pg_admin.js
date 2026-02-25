const { createClient } = require("@supabase/supabase-js");
const { Pool } = require("pg");
const { loadEnvConfig } = require("@next/env");
const { randomUUID } = require("crypto");

loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

const supabase = createClient(supabaseUrl, supabaseKey);
const pool = new Pool({ connectionString: dbUrl });

async function main() {
  const email = "admin@example.com";
  const password = "admin123";

  console.log(`Setting up admin user: ${email}...`);

  let supabaseId;
  let { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    if (error.message.includes("already registered") || error.message.includes("User already exists")) {
      const res = await supabase.auth.signInWithPassword({ email, password });
      if (res.error) {
        console.error("SignIn Error:", res.error.message);
        process.exit(1);
      }
      supabaseId = res.data.user.id;
    } else {
      console.error("SignUp Error:", error.message);
      process.exit(1);
    }
  } else {
    supabaseId = data.user.id;
  }

  console.log("Supabase User ID:", supabaseId);

  // Sync with Postgres directly
  const id = randomUUID();
  try {
    const check = await pool.query(`SELECT id FROM "User" WHERE email = $1`, [email]);
    if (check.rowCount > 0) {
      await pool.query(`UPDATE "User" SET role = 'ADMIN' WHERE email = $1`, [email]);
      console.log(`Updated existing user ${email} to ADMIN.`);
    } else {
      await pool.query(`
        INSERT INTO "User" (id, "supabaseId", email, name, role, "isOnboardingComplete", "updatedAt") 
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [id, supabaseId, email, 'Admin User', 'ADMIN', true]);
      console.log(`Created new user ${email} with ADMIN role.`);
    }
  } catch (err) {
    console.error("PG Error:", err);
  } finally {
    await pool.end();
  }
}

main();
