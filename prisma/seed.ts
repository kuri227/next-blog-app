import { prisma } from "@/lib/prisma";

const main = async () => {
  console.log("🌱 Seeding database...");

  // 既存データをクリア（順序重要）
  await prisma.like.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.postCategory.deleteMany();
  await prisma.post.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();

  // ── カテゴリ ──────────────────────────────────────
  const [nextjs, typescript, ai, webdev, oss, career, design] =
    await Promise.all([
      prisma.category.create({ data: { name: "Next.js" } }),
      prisma.category.create({ data: { name: "TypeScript" } }),
      prisma.category.create({ data: { name: "AI / ML" } }),
      prisma.category.create({ data: { name: "Web開発" } }),
      prisma.category.create({ data: { name: "OSS" } }),
      prisma.category.create({ data: { name: "キャリア" } }),
      prisma.category.create({ data: { name: "UI / UX" } }),
    ]);

  console.log("✅ Categories created");

  // ── デモユーザー ───────────────────────────────────
  const demoUser = await prisma.user.create({
    data: {
      supabaseId: "seed-demo-user-001",
      email: "demo@techsns.dev",
      name: "Kuri227",
      avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
      githubUrl: "https://github.com/kuri227",
      bio: "高専3年生。TypeScript / Next.js / Python を中心に学習中。就活に向けてポートフォリオを構築しています。",
      skills: ["TypeScript", "Next.js", "Python", "Prisma", "Supabase"],
      techInterests: ["Web開発", "AI / ML", "OSS"],
      isOnboardingComplete: true,
      role: "ADMIN",
    },
  });

  const demoUser2 = await prisma.user.create({
    data: {
      supabaseId: "seed-demo-user-002",
      email: "alice@techsns.dev",
      name: "Alice Dev",
      avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
      githubUrl: "https://github.com/alice",
      bio: "フロントエンドエンジニア。React 大好き。",
      skills: ["React", "TypeScript", "CSS", "Figma"],
      techInterests: ["UI / UX", "Web開発"],
      isOnboardingComplete: true,
    },
  });

  console.log("✅ Demo users created");

  // ── 投稿記事 ───────────────────────────────────────
  const posts = [
    {
      title: "Next.js 15 × Supabase で作るモダン SNS の設計と実装",
      content: `## はじめに

Next.js 15 の App Router と Supabase を組み合わせると、フルスタックな SNS を驚くほど少ないコードで構築できます。この記事では実際に構築した「エンジニア向け SNS」の設計思想と実装のポイントを解説します。

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Next.js 15 (App Router) |
| バックエンド | Next.js API Routes |
| DB / ORM | Supabase + Prisma |
| 認証 | Supabase Auth (GitHub OAuth) |
| ホスティング | Vercel |

## 認証設計のポイント

GitHub OAuth を使うことで「エンジニア認証」が自動的に実現されます。\`supabase.auth.signInWithOAuth\` を呼ぶだけで GitHub のプロフィール情報（アバター・ユーザー名）が取得できます。

\`\`\`typescript
const { error } = await supabase.auth.signInWithOAuth({
  provider: "github",
  options: { redirectTo: \`\${origin}/auth/callback\` },
});
\`\`\`

## Prisma でのリレーション設計

フォロー機能は自己参照の多対多リレーションで実装しました。複合主キー \`@@id([followerId, followingId])\` を使うことで、同じユーザーへの二重フォローを DB レベルで防ぎます。

## まとめ

Supabase × Prisma の組み合わせは型安全性と開発速度を両立できる最強スタックです。ぜひ試してみてください！`,
      postType: "PROJECT" as const,
      repoUrl: "https://github.com/kuri227",
      published: true,
      authorId: demoUser.id,
      categoryIds: [nextjs.id, typescript.id, webdev.id],
    },
    {
      title: "useOptimistic で実現するストレスゼロのいいねボタン",
      content: `## React 19 の \`useOptimistic\` とは

\`useOptimistic\` は React 19 で追加されたフックで、非同期処理の完了を待たずに UI を即時更新できます。SNS のいいね機能に最適です。

## 実装方法

\`\`\`typescript
const [optimisticLikes, updateLikes] = useOptimistic(
  likeCount,
  (state: number, delta: number) => state + delta
);

const handleLike = async () => {
  startTransition(async () => {
    updateLikes(isLiked ? -1 : 1); // 即時反映
    setIsLiked(!isLiked);
    await fetch(\`/api/posts/\${id}/like\`, { method: isLiked ? "DELETE" : "POST" });
  });
};
\`\`\`

## なぜ重要か

ネットワークレイテンシが体感ゼロになり、UX が劇的に向上します。特にモバイル環境では効果絶大です。`,
      postType: "KNOWLEDGE" as const,
      published: true,
      authorId: demoUser.id,
      categoryIds: [nextjs.id, typescript.id],
    },
    {
      title: "Prisma の多対多リレーションを完全理解する",
      content: `## 暗示的 vs 明示的リレーション

Prisma の多対多には2種類あります。

### 暗示的（Implicit）

\`\`\`prisma
model Post {
  categories Category[]
}
model Category {
  posts Post[]
}
\`\`\`

Prisma が自動で中間テーブルを作ります。シンプルな場合はこれで十分。

### 明示的（Explicit）

\`\`\`prisma
model PostCategory {
  postId     String
  categoryId String
  post       Post     @relation(fields: [postId], references: [id])
  category   Category @relation(fields: [categoryId], references: [id])
  @@id([postId, categoryId])
}
\`\`\`

中間テーブルに追加フィールドが必要な場合や、複合主キーで制約をつけたい場合に使います。

## onDelete: Cascade の重要性

親レコードを削除したとき、子レコードも自動削除されるよう \`onDelete: Cascade\` を設定しましょう。設定を忘れると外部キー制約エラーになることがあります。`,
      postType: "KNOWLEDGE" as const,
      published: true,
      authorId: demoUser.id,
      categoryIds: [typescript.id],
    },
    {
      title: "GitHub Copilot を使ったコードレビュー術",
      content: `## AI に「コードレビュアー」をやってもらう

GitHub Copilot Chat を使えば、自分のコードに対して厳しいコードレビューをしてもらえます。

### プロンプト例

\`\`\`
以下のコードをシニアエンジニアの視点でレビューしてください。
- パフォーマンスの問題
- バグの可能性
- 可読性・命名
- セキュリティ上の懸念
\`\`\`

## 実際に変わったこと

個人的に最も効果があったのは「命名の改善提案」です。自分では当たり前だと思っていた変数名が、AI から見ると不明瞭だと指摘されることがよくあります。`,
      postType: "KNOWLEDGE" as const,
      published: true,
      authorId: demoUser2.id,
      categoryIds: [ai.id, career.id],
    },
    {
      title: "就活エンジニア向け：ポートフォリオで差をつける技術選定",
      content: `## なぜ技術選定がアピールになるのか

採用担当者や技術面接官は「なぜこの技術を選んだか」を必ず聞きます。単に「流行っているから」ではなく、理由を語れることが重要です。

## 推奨スタック（2025年版）

| カテゴリ | おすすめ | 理由 |
|---------|---------|------|
| フレームワーク | Next.js 15 | App Router / RSC が業界標準になりつつある |
| データベース | Supabase | 認証・Storage・DB が一体型で開発が速い |
| ORM | Prisma | 型安全・マイグレーション管理が強力 |
| デプロイ | Vercel | Next.js との相性◎、CI/CDが簡単 |

## まとめ

就活では「動くもの」を作ることより「なぜそう作ったか」を語れる技術力が大切です。`,
      postType: "KNOWLEDGE" as const,
      published: true,
      authorId: demoUser2.id,
      categoryIds: [career.id, webdev.id],
    },
  ];

  for (const p of posts) {
    const { categoryIds, ...postData } = p;
    const post = await prisma.post.create({ data: postData });
    for (const categoryId of categoryIds) {
      await prisma.postCategory.create({
        data: { postId: post.id, categoryId },
      });
    }
  }

  console.log("✅ Sample posts created");
  console.log("🎉 Seeding complete!");
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
