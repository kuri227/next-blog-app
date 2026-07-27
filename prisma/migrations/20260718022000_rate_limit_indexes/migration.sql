CREATE INDEX IF NOT EXISTS "Post_authorId_createdAt_idx"
ON "Post"("authorId", "createdAt");

CREATE INDEX IF NOT EXISTS "Comment_authorId_createdAt_idx"
ON "Comment"("authorId", "createdAt");
