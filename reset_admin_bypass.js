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
  const finalEmail = "admin@example.com";
  const tempEmail = "admin2@techsns.com";
  const password = "admin123";

  console.log(`Resetting user to: ${finalEmail}...`);

  try {
    // 1. Delete from public."User" and auth.users
    await pool.query(`DELETE FROM "User" WHERE email IN ($1, $2)`, [finalEmail, tempEmail]);
    await pool.query(`DELETE FROM auth.users WHERE email IN ($1, $2)`, [finalEmail, tempEmail]);
    console.log("Deleted old user records.");

    // 2. SignUp new user with TEMP email
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ 
      email: tempEmail, 
      password 
    });
    if (signUpError) {
      console.error("SignUp Error:", signUpError.message);
      process.exit(1);
    }
    
    const supabaseId = signUpData.user.id;
    console.log("Created new Supabase auth user with temp email:", tempEmail);

    // 3. Confirm Email and Change to final email in Postgres bypassing validation!
    await pool.query(
      `UPDATE auth.users SET 
        email = $1, 
        raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{email}', '"${finalEmail}"'),
        email_confirmed_at = NOW() 
       WHERE id = $2`,
      [finalEmail, supabaseId]
    );
    console.log(`Changed email to ${finalEmail} and confirmed.`);

    // 4. Create in public."User"
    const id = randomUUID();
    await pool.query(`
      INSERT INTO "User" (id, "supabaseId", email, name, role, "isOnboardingComplete", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [id, supabaseId, finalEmail, 'Admin User', 'ADMIN', true]);
    console.log(`Created new Prisma User with ADMIN role.`);

    // 5. Test Login
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ 
      email: finalEmail, 
      password 
    });
    if (loginError) {
      console.error("Login Test Failed:", loginError.message);
    } else {
      console.log("Login Test Successful! User ID:", loginData.user.id);
    }

  } catch (err) {
    console.error("Script Error:", err);
  } finally {
    await pool.end();
  }
}

main();
