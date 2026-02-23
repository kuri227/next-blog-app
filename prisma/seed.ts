import { prisma } from "@/lib/prisma";

const main = async () => {
  // 各テーブルから既存の全レコードを削除
  await prisma.postCategory?.deleteMany();
  await prisma.post?.deleteMany();
  await prisma.category?.deleteMany();

  // カテゴリデータの作成
  const c1 = await prisma.category.create({ data: { name: "カテゴリ1" } });
  const c2 = await prisma.category.create({ data: { name: "カテゴリ2" } });
  const c3 = await prisma.category.create({ data: { name: "カテゴリ3" } });
  const c4 = await prisma.category.create({ data: { name: "カテゴリ4" } });

  console.log("カテゴリ作成完了:", [c1, c2, c3, c4].map((c) => c.name));
  console.log("※ 投稿記事は authorId (User) が必要なため、実際のユーザーでログイン後に作成してください。");
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
