"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/app/_hooks/useAuth";

type User = {
  id: string;
  name: string | null;
  githubUrl: string | null;
  role: "ADMIN" | "DEMO_ADMIN" | "USER";
  createdAt: string;
  _count: { posts: number; comments: number };
};

const Page = () => {
  const { token, dbUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);

  const load = useCallback(async () => {
    if (!token) return;
    const response = await fetch("/api/admin/users", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (response.ok) setUsers(await response.json());
  }, [token]);
  useEffect(() => { void load(); }, [load]);

  const changeRole = async (user: User, role: "ADMIN" | "USER") => {
    if (!token || !window.confirm(`${user.name ?? "このユーザー"}の権限を${role}に変更しますか？`)) return;
    const response = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role }),
    });
    if (response.ok) await load();
  };

  return (
    <main className="space-y-6 pb-20">
      <h1 className="text-3xl font-black">ユーザー管理</h1>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr><th className="p-4">ユーザー</th><th className="p-4">活動</th><th className="p-4">権限</th></tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-slate-200 dark:border-slate-700">
                <td className="p-4">
                  <p className="font-bold">{user.name ?? "名前未設定"}</p>
                  {user.githubUrl && <a href={user.githubUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-500">GitHub</a>}
                </td>
                <td className="p-4 text-slate-500">投稿 {user._count.posts} / コメント {user._count.comments}</td>
                <td className="p-4">
                  <select
                    value={user.role === "ADMIN" ? "ADMIN" : "USER"}
                    disabled={user.id === dbUser?.id}
                    onChange={(event) => void changeRole(user, event.target.value as "ADMIN" | "USER")}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:bg-slate-900"
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
};

export default Page;
