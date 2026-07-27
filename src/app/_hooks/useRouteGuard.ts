// src/app/_hooks/useRouteGuard.ts
import { useAuth } from "@/app/_hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const useRouteGuard = () => {
  const router = useRouter();
  const { isLoading, session, dbUser } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (session === null) {
      router.replace("/login");
      return;
    }

    if (dbUser?.role !== "ADMIN") {
      router.replace("/feed");
    }
  }, [dbUser, isLoading, router, session]);

  return {
    isAuthorized:
      !isLoading &&
      session !== null &&
      dbUser?.role === "ADMIN",
  };
};
