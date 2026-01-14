import type { Metadata } from "next";
import "./globals.css";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { config } from "@fortawesome/fontawesome-svg-core";
config.autoAddCss = false;
import Header from "@/app/_components/Header";

export const metadata: Metadata = {
  title: "Next.js Tech Blog",
  description: "Built with Next.js and Prisma",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-slate-50 font-sans text-slate-900 antialiased">
        <Header />
        {/* max-w-2xl から max-w-screen-xl へ変更し、レスポンシブな余白(px)を徹底 */}
        <div className="mx-auto mt-20 min-h-screen max-w-screen-xl px-4 sm:px-6 lg:px-8">
          {children}
        </div>
        <footer className="mt-20 border-t border-slate-200 bg-white py-10 text-center text-sm text-slate-500">
          &copy; 2024 Tech Blog Project.
        </footer>
      </body>
    </html>
  );
}
