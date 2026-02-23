"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/_hooks/useAuth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faCheck } from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";

const PREDEFINED_SKILLS = [
  "TypeScript", "JavaScript", "Python", "Rust", "Go", "Java", "C++", "C#",
  "React", "Next.js", "Vue.js", "Svelte", "Node.js", "Deno",
  "Prisma", "PostgreSQL", "MySQL", "MongoDB", "Redis",
  "Docker", "Kubernetes", "AWS", "GCP", "Azure",
  "TensorFlow", "PyTorch", "scikit-learn",
  "Figma", "CSS", "Tailwind CSS",
];

const PREDEFINED_INTERESTS = [
  "Web開発", "モバイル開発", "AI / ML", "OSS", "セキュリティ",
  "DevOps / インフラ", "UI / UX", "ゲーム開発", "組み込み / IoT",
  "データエンジニアリング", "キャリア / 就活", "アルゴリズム", "ブロックチェーン",
];

const Page: React.FC = () => {
  const router = useRouter();
  const { token, dbUser, setDbUser } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [bio, setBio] = useState("");
  const [displayName, setDisplayName] = useState(dbUser?.name ?? "");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggle = <T extends string>(
    list: T[],
    setList: React.Dispatch<React.SetStateAction<T[]>>,
    item: T,
  ) => {
    setList((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item],
    );
  };

  const handleComplete = async () => {
    if (!token) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: token },
        body: JSON.stringify({
          name: displayName,
          bio,
          skills: selectedSkills,
          techInterests: selectedInterests,
          isOnboardingComplete: true,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setDbUser(updated);
        router.replace("/feed");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepBar = (
    <div className="mb-8 flex items-center justify-center gap-2">
      {[1, 2, 3].map((s) => (
        <div
          key={s}
          className={twMerge(
            "h-2 w-16 rounded-full transition-all duration-300",
            step >= s ? "bg-indigo-600" : "bg-slate-200",
          )}
        />
      ))}
    </div>
  );

  return (
    <main className="mx-auto flex min-h-[85vh] max-w-xl flex-col items-center justify-center px-4 py-10">
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        {/* ヘッダー */}
        <div className="mb-6 text-center">
          <span className="text-4xl">{step === 1 ? "👋" : step === 2 ? "🛠️" : "🎯"}</span>
          <h1 className="mt-2 text-2xl font-black text-slate-900">
            {step === 1
              ? "はじめまして！"
              : step === 2
              ? "技術スタックを教えて"
              : "興味のある分野は？"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {step === 1
              ? "あなたのプロフィールを設定しましょう"
              : step === 2
              ? "使っている技術・勉強中の技術を選んでください"
              : "興味のあるテーマを選んでください（後で変更可）"}
          </p>
        </div>

        {stepBar}

        {/* Step 1: 基本プロフィール */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">表示名</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="例: kuri227"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">自己紹介</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="高専3年生。TypeScript / Next.js を勉強中です。"
                rows={4}
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!displayName.trim()}
              className="mt-2 w-full rounded-xl bg-indigo-600 py-3 font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              次へ →
            </button>
          </div>
        )}

        {/* Step 2: スキル選択 */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_SKILLS.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggle(selectedSkills, setSelectedSkills, skill)}
                  className={twMerge(
                    "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all",
                    selectedSkills.includes(skill)
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-slate-200 text-slate-600 hover:border-indigo-300",
                  )}
                >
                  {selectedSkills.includes(skill) && <FontAwesomeIcon icon={faCheck} className="text-[10px]" />}
                  {skill}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(1)}
                className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
                ← 戻る
              </button>
              <button onClick={() => setStep(3)}
                className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700">
                次へ →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: 興味分野選択 */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_INTERESTS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggle(selectedInterests, setSelectedInterests, interest)}
                  className={twMerge(
                    "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all",
                    selectedInterests.includes(interest)
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-slate-200 text-slate-600 hover:border-emerald-300",
                  )}
                >
                  {selectedInterests.includes(interest) && <FontAwesomeIcon icon={faCheck} className="text-[10px]" />}
                  {interest}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(2)}
                className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
                ← 戻る
              </button>
              <button
                onClick={handleComplete}
                disabled={isSubmitting || selectedInterests.length === 0}
                className="flex-1 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {isSubmitting
                  ? <span className="flex items-center justify-center gap-2"><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> 保存中...</span>
                  : "🎉 はじめる！"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default Page;
