const fs = require('fs');

const code = `graph TD
    User["ブラウザ"]
    NextJS["Next.js App (Vercel)"]
    SupabaseAuth["Supabase Auth (GitHub OAuth)"]
    SupabaseDB["Supabase DB (PostgreSQL)"]
    SupabaseStorage["Supabase Storage (カバー画像)"]
    Prisma["Prisma ORM"]

    User -->|HTTPS| NextJS
    NextJS -->|OAuth| SupabaseAuth
    NextJS --> Prisma
    Prisma -->|SQL| SupabaseDB
    NextJS -->|画像 PUT/GET| SupabaseStorage`;

const state = { code, mermaid: { theme: 'default' } };
const json = JSON.stringify(state);
const base64 = Buffer.from(json).toString('base64');
const url = `https://mermaid.ink/svg/${base64}`;

const readmeContent = fs.readFileSync('README.md', 'utf8');
const newContent = readmeContent.replace(
  /```mermaid\n([\s\S]*?)\n```/,
  `![システム構成図](${url})`
);

fs.writeFileSync('README.md', newContent);
console.log('Successfully replaced mermaid code with mermaid.ink link.');
