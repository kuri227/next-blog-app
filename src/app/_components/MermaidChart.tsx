"use client";
import { useEffect, useRef } from "react";
import DOMPurify from "isomorphic-dompurify";

interface Props { code: string; }

let mermaidLoaded = false;

const MermaidChart: React.FC<Props> = ({ code }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const render = async () => {
      const mermaid = (await import("mermaid")).default;
      if (!mermaidLoaded) {
        mermaid.initialize({
          startOnLoad: false,
          theme: document.documentElement.classList.contains("dark") ? "dark" : "default",
          securityLevel: "strict",
        });
        mermaidLoaded = true;
      }
      if (!ref.current) return;
      const id = `mermaid-${Math.random().toString(36).slice(2)}`;
      try {
        const { svg } = await mermaid.render(id, code);
        ref.current.innerHTML = DOMPurify.sanitize(svg, {
          USE_PROFILES: { svg: true, svgFilters: true },
        });
      } catch (e) {
        console.error("Mermaid render error:", e);
        ref.current.replaceChildren();
        const errorMessage = document.createElement("pre");
        errorMessage.className = "text-red-500 text-xs p-3";
        errorMessage.textContent = "図を表示できませんでした。Mermaidの構文を確認してください。";
        ref.current.appendChild(errorMessage);
      }
    };
    render();
  }, [code]);

  return (
    <div
      ref={ref}
      className="my-4 flex justify-center overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4"
    />
  );
};

export default MermaidChart;
