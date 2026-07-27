import { prisma } from "@/lib/prisma";
import { supabase } from "@/utils/supabase";

const extractAccessToken = (authorization: string | null) => {
  if (!authorization) return null;
  return authorization.replace(/^Bearer\s+/i, "").trim() || null;
};

export const getAuthenticatedSupabaseUser = async (
  authorization: string | null,
) => {
  const accessToken = extractAccessToken(authorization);
  if (!accessToken) return null;

  const { data, error } = await supabase.auth.getUser(accessToken);
  return error ? null : data.user;
};

export const getAuthenticatedDbUser = async (authorization: string | null) => {
  const user = await getAuthenticatedSupabaseUser(authorization);
  if (!user) return null;

  return prisma.user.findUnique({
    where: { supabaseId: user.id },
  });
};

export const getAdminDbUser = async (authorization: string | null) => {
  const user = await getAuthenticatedDbUser(authorization);
  return user?.role === "ADMIN" ? user : null;
};

export const getMutableDbUser = async (authorization: string | null) => {
  const user = await getAuthenticatedDbUser(authorization);
  return user?.role === "DEMO_ADMIN" ? null : user;
};
