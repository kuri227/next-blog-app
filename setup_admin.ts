import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { createClient } from "@supabase/supabase-js";
import { prisma } from "./src/lib/prisma";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const email = "admin@example.com";
  const password = "admin123";

  console.log(`Setting up admin user: ${email}...`);

  let { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    if (error.message.includes("already registered") || error.message.includes("User already exists")) {
      console.log("User already exists in Supabase. Attempting login to get user details...");
      const res = await supabase.auth.signInWithPassword({ email, password });
      if (res.error) {
        console.error("SignIn Error:", res.error.message);
        return;
      }
      data = res.data;
    } else {
      console.error("SignUp Error:", error.message);
      return;
    }
  }

  const user = data.user;
  if (!user) {
    console.error("Failed to retrieve user after sign up/in.");
    return;
  }

  console.log("Supabase User ID:", user.id);

  const dbUser = await prisma.user.upsert({
    where: { supabaseId: user.id },
    create: {
      supabaseId: user.id,
      email: user.email!,
      name: "Admin",
      role: "ADMIN",
      isOnboardingComplete: true,
    },
    update: {
      role: "ADMIN",
    },
  });

  console.log("Successfully created/updated admin user in DB!");
  console.log("Email:", dbUser.email);
  console.log("Role:", dbUser.role);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
