"use client";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCode,
  faTerminal,
  faEnvelope,
  faGlobe,
  faGamepad,
  faMicrochip,
  faAward,
} from "@fortawesome/free-solid-svg-icons";
import { faGithub } from "@fortawesome/free-brands-svg-icons";

const AboutPage: React.FC = () => {
  const skills = ["Python", "C++", "C", "HTML", "CSS", "TypeScript"];

  return (
    <main className="mx-auto max-w-4xl space-y-10 px-4 py-10">
      {/* プロフィール・メインカード 
        構造の修正：absoluteの装飾を廃止し、背景を radial-gradient（円形グラデーション）で構成。
        これにより、テキストの前面に重なる要素を排除しました。
      */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.15),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(37,99,235,0.1),transparent_50%)] shadow-2xl">
        <div className="relative z-10 flex flex-col items-center gap-10 p-8 text-center md:flex-row md:p-12 md:text-left">
          {/* アバターエリア */}
          <div className="relative h-44 w-44 shrink-0 overflow-hidden rounded-3xl border-2 border-slate-700 bg-slate-800 shadow-2xl transition-transform hover:scale-105 hover:rotate-2">
            <Image
              src="/images/avatar.png"
              alt="kuri227"
              fill
              className="object-cover"
            />
          </div>

          {/* テキストコンテンツエリア */}
          <div className="flex-1 space-y-5">
            <div className="space-y-1">
              {/* 名前の視認性確保：
                !text-white（最優先）を適用し、かつドロップシャドウ（drop-shadow）を追加して
                背景色に関わらず物理的に浮かび上がらせる構造にしました。
              */}
              <h1 className="text-4xl font-black tracking-tight !text-white drop-shadow-md md:text-6xl">
                kuri227
              </h1>
              <p className="text-sm font-bold tracking-widest text-indigo-400 uppercase">
                3rd Year KOSEN Student / Information Engineering
              </p>
            </div>

            <p className="text-lg leading-relaxed font-medium text-slate-100">
              とある高専の3年生で、情報工学を専攻しています。
              理論と実践のバランスを大切にしながら、日々コードを書いています。
            </p>

            <div className="flex flex-wrap justify-center gap-3 md:justify-start">
              <a
                href="https://github.com/kuri227"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white hover:text-slate-900"
              >
                <FontAwesomeIcon icon={faGithub} /> GitHub
              </a>
              <a
                href="https://kuri227.github.io/PG1-portfolio/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white hover:text-slate-900"
              >
                <FontAwesomeIcon icon={faGlobe} /> Portfolio
              </a>
              <a
                href="mailto:rg23136w@st.omu.ac.jp"
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-500"
              >
                <FontAwesomeIcon icon={faEnvelope} /> Contact
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* コンテストステータス */}
      <section className="flex items-center gap-4 rounded-3xl border-2 border-indigo-100 bg-indigo-50/50 p-6 transition-all hover:bg-indigo-50">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg">
          <FontAwesomeIcon icon={faAward} className="text-xl" />
        </div>
        <div>
          <h3 className="text-xs font-black tracking-widest text-indigo-500 uppercase">
            Currently Focused on
          </h3>
          <p className="text-lg font-black text-slate-800">
            コンテスト出場に向けて全力投球中
          </p>
        </div>
      </section>

      {/* スキル & 興味分野 */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <FontAwesomeIcon icon={faTerminal} />
            </div>
            <h2 className="text-xl font-black text-slate-900">Skills</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-700 transition-colors hover:border-indigo-400 hover:text-indigo-600"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FontAwesomeIcon icon={faMicrochip} />
            </div>
            <h2 className="text-xl font-black text-slate-900">Interests</h2>
          </div>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
              <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-500"></span>
              AI 開発 (Deep Learning / Machine Learning)
            </li>
            <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              モダンな Web 開発 (Next.js / TypeScript)
            </li>
          </ul>
        </div>
      </div>

      {/* 趣味 */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center gap-6 md:flex-row">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
            <FontAwesomeIcon icon={faGamepad} className="text-3xl" />
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-xl font-black text-slate-900">Hobbies</h2>
            <p className="font-medium text-slate-500">
              休日はゲームを楽しんでいます。複雑なロジックを考えるのが好きで、開発にも通じるものがあると感じています。
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AboutPage;
