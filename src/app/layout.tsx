import type { Metadata } from "next";
import "./globals.css";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { config } from "@fortawesome/fontawesome-svg-core";
config.autoAddCss = false;
import Header from "@/app/_components/Header";
import { ThemeProvider } from "@/app/_components/ThemeProvider";

export const metadata: Metadata = {
  title: "TechFeed",
  description: "エンジニアによるエンジニアのためのSNS型ブログプラットフォーム",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-[var(--bg-base)] font-sans text-[var(--text-base)] antialiased transition-colors duration-200">
        <ThemeProvider>
          <Header />
          <div className="mx-auto mt-16 min-h-screen max-w-screen-xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
          <footer className="mt-20 border-t border-[var(--border)] bg-[var(--bg-card)] py-10 text-center text-sm text-[var(--text-muted)]">
            &copy; 2026 TechFeed.
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
