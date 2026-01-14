"use client";
import Image from "next/image";
import { twMerge } from "tailwind-merge";

const About: React.FC = () => {
  return (
    <main>
      <div className="mb-5 text-2xl font-bold">About</div>

      <div
        className={twMerge(
          "mx-auto mb-5 w-full md:w-2/3",
          "flex justify-center",
        )}
      >
        <Image
          src="/images/avatar.png"
          alt="Example Image"
          width={350}
          height={350}
          priority
          className="rounded-full border-4 border-slate-500 p-1.5"
        />
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="mb-3 text-xl font-bold">自己紹介</h2>
          <p className="text-gray-700">
            高専3年です。プログラミングに興味があります。
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold">スキル</h2>
          <ul className="list-inside list-disc space-y-2 text-gray-700">
            <li>python</li>
            <li>C++</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold">経歴</h2>
          <p className="text-gray-700">2021年4月 - 現在: 高専在学中</p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold">趣味・興味</h2>
          <p className="text-gray-700">ゲーム・カラオケ</p>
        </section>
      </div>
    </main>
  );
};

export default About;
