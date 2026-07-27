export type PostInput = {
  title: string;
  content: string;
  postType: "PROJECT" | "KNOWLEDGE";
  repoUrl: string | null;
  demoUrl: string | null;
  coverImageKey: string | null;
  published: boolean;
  categoryIds: string[];
};

const optionalHttpUrl = (value: unknown) => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.length > 2048) {
    throw new Error("URLが不正です");
  }
  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("URLはhttpまたはhttpsのみ指定できます");
  }
  return url.toString();
};

export const parsePostInput = (body: unknown): PostInput => {
  if (!body || typeof body !== "object") {
    throw new Error("入力形式が不正です");
  }
  const input = body as Record<string, unknown>;
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const content = typeof input.content === "string" ? input.content.trim() : "";
  const postType = input.postType;
  const rawCategoryIds = Array.isArray(input.categoryIds) ? input.categoryIds : [];
  const categoryIds = [...new Set(rawCategoryIds.filter((id): id is string => typeof id === "string"))];

  if (title.length < 1 || title.length > 120) {
    throw new Error("タイトルは1〜120文字で入力してください");
  }
  if (content.length < 1 || content.length > 20000) {
    throw new Error("本文は1〜20,000文字で入力してください");
  }
  if (postType !== "PROJECT" && postType !== "KNOWLEDGE") {
    throw new Error("投稿種別が不正です");
  }
  if (categoryIds.length > 5) {
    throw new Error("カテゴリーは5件まで選択できます");
  }
  if (
    input.coverImageKey !== undefined &&
    input.coverImageKey !== null &&
    (typeof input.coverImageKey !== "string" || input.coverImageKey.length > 500)
  ) {
    throw new Error("画像キーが不正です");
  }

  return {
    title,
    content,
    postType,
    repoUrl: optionalHttpUrl(input.repoUrl),
    demoUrl: optionalHttpUrl(input.demoUrl),
    coverImageKey:
      typeof input.coverImageKey === "string" ? input.coverImageKey : null,
    published: input.published !== false,
    categoryIds,
  };
};
