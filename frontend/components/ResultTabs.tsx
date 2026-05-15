"use client";

import { useState } from "react";
import type { AuditResponse } from "@/lib/types";
import StatsGrid from "./StatsGrid";
import { DetailTable, SummaryTable } from "./PreviewTable";

type Tab = "detail" | "summary";

export default function ResultTabs({ data }: { data: AuditResponse }) {
  const [tab, setTab] = useState<Tab>("detail");
  const inputLabel = data.source === "ahrefs"
    ? "Backlink từ Ahrefs"
    : "Dòng đầu vào";

  return (
    <>
      <StatsGrid stats={data.stats} inputLabel={inputLabel} />

      <div className="flex gap-1 border-b-2 border-[#E5DDB3] mb-3 -mx-3 px-3">
        {([
          ["detail", "📋 Chi tiết URL vs Anchor"],
          ["summary", "📊 Domain vs URL"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-4 py-2.5 text-sm font-bold rounded-t-lg -mb-0.5 border-b-[3px] transition-colors ${
              tab === id
                ? "text-ink border-yellow bg-yellow-soft"
                : "text-ink-soft border-transparent hover:bg-yellow-soft hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="text-xs text-ink-soft mb-2.5">
        <span className="inline-block w-3.5 h-3.5 rounded-sm border border-[#E5DDB3] align-[-2px] bg-dr-high" />{" "}
        DR ≥ 50
        <span className="mx-2 text-[#E5DDB3]">·</span>
        <span className="inline-block w-3.5 h-3.5 rounded-sm border border-[#E5DDB3] align-[-2px] bg-dr-mid" />{" "}
        DR 20–49
      </div>

      {tab === "detail" ? (
        <DetailTable groups={data.preview.detail} />
      ) : (
        <SummaryTable groups={data.preview.summary} />
      )}
    </>
  );
}
