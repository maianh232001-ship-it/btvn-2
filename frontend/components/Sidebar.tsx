"use client";

import { useEffect, useState } from "react";

const NAV = [
  { id: "home", label: "Trang chủ", icon: "🏠" },
  { id: "audit", label: "Audit mới", icon: "🎯" },
  { id: "demo", label: "Demo", icon: "🎬" },
  { id: "guide", label: "Hướng dẫn", icon: "📖" },
  { id: "settings", label: "Setting", icon: "⚙️" },
];

export default function Sidebar() {
  const [active, setActive] = useState("home");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window))
      return;
    const sections = NAV.map((n) => document.getElementById(n.id)).filter(
      Boolean
    ) as HTMLElement[];
    if (!sections.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  function go(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(id);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        className="fixed top-3 left-3 z-50 w-10 h-10 rounded-lg bg-sb-bg text-white text-xl shadow-card md:hidden"
        onClick={() => setOpen((v) => !v)}
        aria-label="Mở menu"
      >
        ☰
      </button>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 w-60 bg-sb-bg text-sb-text flex flex-col py-6 z-40 shadow-[2px_0_8px_rgba(0,0,0,0.06)] transition-transform duration-250 ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex items-center gap-3 px-5 pb-5 border-b border-sb-border">
          <span className="w-9 h-9 rounded-[10px] bg-yellow text-ink flex items-center justify-center text-xl font-bold shadow-[0_2px_6px_rgba(245,197,24,0.3)]">
            ★
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-white text-[18px] font-bold tracking-wide">
              BTVN
            </span>
            <span className="text-sb-dim text-[11px] uppercase tracking-[1.2px] mt-0.5">
              Backlink Audit
            </span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5 overflow-y-auto">
          {NAV.map((n) => {
            const isActive = active === n.id;
            return (
              <a
                key={n.id}
                href={`#${n.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  go(n.id);
                }}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm border-l-[3px] -ml-[3px] transition-colors ${
                  isActive
                    ? "bg-sb-soft text-white border-l-yellow font-bold"
                    : "border-l-transparent hover:bg-sb-soft hover:text-white"
                }`}
              >
                <span className="w-5 text-center text-base">{n.icon}</span>
                <span>{n.label}</span>
              </a>
            );
          })}
        </nav>

        <div className="px-5 pt-4 border-t border-sb-border flex flex-col gap-1">
          <div className="text-sb-dim text-[11px] uppercase tracking-[1px]">
            🌐 Live
          </div>
          <a
            href="https://btvn-2.onrender.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-yellow font-bold text-[13px] break-all hover:text-white"
          >
            btvn-2.onrender.com
          </a>
          <a
            href="https://github.com/maianh232001-ship-it/btvn-2"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sb-dim text-xs hover:text-yellow"
          >
            github · btvn-2
          </a>
        </div>
      </aside>
    </>
  );
}
