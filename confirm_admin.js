const { Pool } = require("pg");
const { loadEnvConfig } = require("@next/env");

loadEnvConfig(process.cwd());

const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString: dbUrl });

async function main() {
  const email = "admin@example.com";
  console.log(`Confirming email for ${email} in auth.users...`);

  try {
    const res = await pool.query(
      `UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = $1 RETURNING id`,
      [email]
    );

    if (res.rowCount > 0) {
      console.log(`Successfully confirmed email for user ID: ${res.rows[0].id}`);
    } else {
      console.log(`User ${email} not found in auth.users`);
    }
  } catch (err) {
    console.error("Database error:", err.message);
  } finally {
    await pool.end();
  }
}

main();
