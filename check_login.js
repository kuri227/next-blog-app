const { createClient } = require("@supabase/supabase-js");
const { loadEnvConfig } = require("@next/env");

loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const email = "admin@example.com";
  const password = "admin123";

  console.log(`Attempting login for: ${email}`);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Login Error details:", error);
  } else {
    console.log("Login successful!", data.user.id);
  }
}

main();
