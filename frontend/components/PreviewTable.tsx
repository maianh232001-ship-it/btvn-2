"use client";

import { useEffect, useState } from "react";
import type {
  DetailGroup,
  SummaryGroup,
} from "@/lib/types";
import {
  DEFAULT_SETTINGS,
  DRSettings,
  drClass,
  loadSettings,
} from "@/lib/settings";

function useDRSettings(): DRSettings {
  const [s, setS] = useState<DRSettings>(DEFAULT_SETTINGS);
  useEffect(() => {
    setS(loadSettings());
    const onChange = (e: Event) =>
      setS((e as CustomEvent<DRSettings>).detail || loadSettings());
    window.addEventListener("btvn:settings", onChange as EventListener);
    return () =>
      window.removeEventListener("btvn:settings", onChange as EventListener);
  }, []);
  return s;
}

function formatDR(dr: number) {
  if (dr == null || (dr as unknown as string) === "") return "—";
  const n = Number(dr);
  if (Number.isNaN(n)) return String(dr);
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function refHost(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function Group({
  title,
  countLabel,
  children,
}: {
  title: string;
  countLabel: string;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="preview-group border-t border-[#E5DDB3] first:border-t-0">
      <div
        className="preview-group-head bg-[#2E75B6] text-white font-bold text-[13px] px-3.5 py-2.5 cursor-pointer select-none flex items-center gap-2"
        onClick={() => setCollapsed((v) => !v)}
      >
        <span
          className={`inline-block text-xs transition-transform ${
            collapsed ? "-rotate-90" : ""
          }`}
        >
          ▼
        </span>
        <span>📌 {title}</span>
        <span className="ml-auto font-normal text-xs bg-white/20 px-2 py-0.5 rounded-full">
          {countLabel}
        </span>
      </div>
      {!collapsed && children}
    </div>
  );
}

export function DetailTable({ groups }: { groups: DetailGroup[] }) {
  const s = useDRSettings();
  if (!groups.length) {
    return (
      <div className="rounded-lg border border-[#E5DDB3] bg-white p-6 text-center text-ink-soft italic">
        Không có backlink chất lượng phù hợp.
      </div>
    );
  }
  return (
    <div className="max-h-[600px] overflow-auto border border-[#E5DDB3] rounded-lg bg-white">
      {groups.map((g) => (
        <Group
          key={g.target}
          title={g.target}
          countLabel={`${g.count} backlink`}
        >
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="bg-[#F4F4F4] text-center w-[50px] px-2.5 py-1.5 text-[12px] uppercase tracking-wide border-b border-[#E5DDB3]">
                  STT
                </th>
                <th className="bg-[#F4F4F4] text-left px-2.5 py-1.5 text-[12px] uppercase tracking-wide border-b border-[#E5DDB3]">
                  Anchor Text
                </th>
                <th className="bg-[#F4F4F4] text-left px-2.5 py-1.5 text-[12px] uppercase tracking-wide border-b border-[#E5DDB3]">
                  URL nguồn
                </th>
                <th className="bg-[#F4F4F4] text-center w-[70px] px-2.5 py-1.5 text-[12px] uppercase tracking-wide border-b border-[#E5DDB3]">
                  DR
                </th>
                <th className="bg-[#F4F4F4] text-center w-[100px] px-2.5 py-1.5 text-[12px] uppercase tracking-wide border-b border-[#E5DDB3]">
                  Ngày
                </th>
              </tr>
            </thead>
            <tbody>
              {g.rows.map((r, i) => {
                const cls =
                  drClass(r.dr, s) || (i % 2 === 1 ? "dr-zebra" : "");
                return (
                  <tr key={r.stt} className={cls}>
                    <td className="text-center px-2.5 py-1.5 border-b border-[#E5DDB3] align-top">
                      {r.stt}
                    </td>
                    <td className="text-left px-2.5 py-1.5 border-b border-[#E5DDB3] align-top">
                      {r.anchor}
                    </td>
                    <td className="text-left px-2.5 py-1.5 border-b border-[#E5DDB3] align-top">
                      <a
                        href={r.ref_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={r.ref_url}
                        className="text-[#1B5DAA] hover:underline break-all"
                      >
                        {refHost(r.ref_url)}
                      </a>
                    </td>
                    <td className="text-center font-bold px-2.5 py-1.5 border-b border-[#E5DDB3]">
                      {formatDR(r.dr)}
                    </td>
                    <td className="text-center text-ink-soft px-2.5 py-1.5 border-b border-[#E5DDB3]">
                      {r.first_seen}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Group>
      ))}
    </div>
  );
}

export function SummaryTable({ groups }: { groups: SummaryGroup[] }) {
  const s = useDRSettings();
  if (!groups.length) {
    return (
      <div className="rounded-lg border border-[#E5DDB3] bg-white p-6 text-center text-ink-soft italic">
        Không có dữ liệu tổng hợp.
      </div>
    );
  }
  return (
    <div className="max-h-[600px] overflow-auto border border-[#E5DDB3] rounded-lg bg-white">
      {groups.map((g) => (
        <Group
          key={g.target}
          title={g.target_path}
          countLabel={`${g.total_links} link / ${g.domain_count} domain`}
        >
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="bg-[#F4F4F4] text-center w-[50px] px-2.5 py-1.5 text-[12px] uppercase tracking-wide border-b border-[#E5DDB3]">
                  STT
                </th>
                <th className="bg-[#F4F4F4] text-left px-2.5 py-1.5 text-[12px] uppercase tracking-wide border-b border-[#E5DDB3]">
                  Domain nguồn
                </th>
                <th className="bg-[#F4F4F4] text-center w-[70px] px-2.5 py-1.5 text-[12px] uppercase tracking-wide border-b border-[#E5DDB3]">
                  Số link
                </th>
                <th className="bg-[#F4F4F4] text-center w-[70px] px-2.5 py-1.5 text-[12px] uppercase tracking-wide border-b border-[#E5DDB3]">
                  DR (max)
                </th>
              </tr>
            </thead>
            <tbody>
              {g.rows.map((r, i) => {
                const cls =
                  drClass(r.dr_max, s) || (i % 2 === 1 ? "dr-zebra" : "");
                return (
                  <tr key={r.stt} className={cls}>
                    <td className="text-center px-2.5 py-1.5 border-b border-[#E5DDB3]">
                      {r.stt}
                    </td>
                    <td className="px-2.5 py-1.5 border-b border-[#E5DDB3]">
                      {r.domain}
                    </td>
                    <td className="text-center font-bold px-2.5 py-1.5 border-b border-[#E5DDB3]">
                      {r.count}
                    </td>
                    <td className="text-center font-bold px-2.5 py-1.5 border-b border-[#E5DDB3]">
                      {formatDR(r.dr_max)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Group>
      ))}
    </div>
  );
}
