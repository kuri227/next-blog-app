CREATE UNIQUE INDEX IF NOT EXISTS "PostCategory_postId_categoryId_key"
ON "PostCategory"("postId", "categoryId");
