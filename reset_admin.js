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

  console.log(`Resetting user: ${email}...`);

  try {
    // 1. Delete from public."User" and auth.users
    await pool.query(`DELETE FROM "User" WHERE email = $1`, [email]);
    await pool.query(`DELETE FROM auth.users WHERE email = $1`, [email]);
    console.log("Deleted old user records.");

    // 2. SignUp new user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      console.error("SignUp Error:", signUpError.message);
      process.exit(1);
    }
    
    const supabaseId = signUpData.user.id;
    console.log("Created new Supabase auth user:", supabaseId);

    // 3. Confirm Email
    await pool.query(
      `UPDATE auth.users SET email_confirmed_at = NOW() WHERE id = $1`,
      [supabaseId]
    );
    console.log("Confirmed email in auth.users.");

    // 4. Create in public."User"
    const id = randomUUID();
    await pool.query(`
      INSERT INTO "User" (id, "supabaseId", email, name, role, "isOnboardingComplete", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [id, supabaseId, email, 'Admin User', 'ADMIN', true]);
    console.log(`Created new Prisma User with ADMIN role.`);

    // 5. Test Login
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) {
      console.error("Login Test Failed:", loginError.message);
    } else {
      console.log("Login Test Successful! Session token:", loginData.session.access_token.substring(0, 20) + "...");
    }

  } catch (err) {
    console.error("Script Error:", err);
  } finally {
    await pool.end();
  }
}

main();
