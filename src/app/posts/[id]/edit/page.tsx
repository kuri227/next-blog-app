"use client";

import { useParams } from "next/navigation";
import { PostEditor } from "@/app/_components/PostEditor";

const Page = () => {
  const { id } = useParams<{ id: string }>();
  return <PostEditor postId={id} />;
};

export default Page;
