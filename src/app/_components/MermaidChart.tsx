"use client";
import { useEffect, useRef } from "react";

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
          securityLevel: "loose",
        });
        mermaidLoaded = true;
      }
      if (!ref.current) return;
      const id = `mermaid-${Math.random().toString(36).slice(2)}`;
      try {
        const { svg } = await mermaid.render(id, code);
        ref.current.innerHTML = svg;
      } catch (e) {
        console.error("Mermaid render error:", e);
        ref.current.innerHTML = `<pre class="text-red-500 text-xs p-3">${code}</pre>`;
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
