// src/app/admin/layout.tsx
"use client";

import React from "react";
import { useRouteGuard } from "@/app/_hooks/useRouteGuard";

interface Props {
  children: React.ReactNode;
}
const AdminLayout = ({ children }: Props) => {
  const { isAuthorized } = useRouteGuard();
  if (!isAuthorized) {
    return null;
  }
  return children;
};

export default AdminLayout;
