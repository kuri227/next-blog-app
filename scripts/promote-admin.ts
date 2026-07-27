import "dotenv/config";
import { randomUUID } from "crypto";
import { Pool } from "pg";

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!email) {
  throw new Error(
    "ADMIN_EMAILを設定してください。例: $env:ADMIN_EMAIL='you@example.com'; npm.cmd run admin:promote",
  );
}

if (!connectionString) {
  throw new Error("DATABASE_URLまたはDIRECT_URLが設定されていません");
}

const pool = new Pool({ connectionString });

const main = async () => {
  const authResult = await pool.query<{ id: string; email: string }>(
    `select id::text, email
     from auth.users
     where lower(email) = $1
     limit 2`,
    [email],
  );

  if (authResult.rowCount !== 1) {
    throw new Error(
      `Supabase Authenticationに ${email} が1件だけ存在することを確認してください`,
    );
  }

  const authUser = authResult.rows[0];

  await pool.query("BEGIN");
  try {
    await pool.query(
      `insert into public."User" (
         id,
         "supabaseId",
         name,
         role,
         skills,
         "techInterests",
         "isOnboardingComplete",
         "createdAt",
         "updatedAt"
       )
       values ($1, $2, 'Administrator', 'ADMIN', '{}', '{}', true, now(), now())
       on conflict ("supabaseId") do update
       set
         role = 'ADMIN',
         "isOnboardingComplete" = true,
         "updatedAt" = now()`,
      [randomUUID(), authUser.id],
    );

    await pool.query("COMMIT");
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }

  console.log(`管理者へ昇格しました: ${authUser.email}`);
};

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
