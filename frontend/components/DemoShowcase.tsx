"use client";

import { useEffect, useState } from "react";
import { fetchDemo } from "@/lib/api";
import type { AuditResponse } from "@/lib/types";
import StatsGrid from "./StatsGrid";
import { DetailTable, SummaryTable } from "./PreviewTable";

type Tab = "detail" | "summary";

export default function DemoShowcase() {
  const [data, setData] = useState<AuditResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("detail");

  useEffect(() => {
    fetchDemo()
      .then(setData)
      .catch((err) => setError((err as Error).message));
  }, []);

  if (error) {
    return (
      <div className="rounded-lg border border-[#E5DDB3] bg-white p-6 text-center text-ink-soft italic">
        Không tải được dữ liệu mẫu: {error}
      </div>
    );
  }
  if (!data) {
    return (
      <div className="rounded-lg border border-[#E5DDB3] bg-white p-6 text-center text-ink-soft italic">
        Đang tải dữ liệu mẫu…
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-3">
        <div>
          <h2 className="text-[19px] font-bold m-0">📋 Bảng kết quả mẫu</h2>
          <p className="text-[13px] text-ink-soft mt-1.5 max-w-[580px]">
            Audit chạy sẵn trên dữ liệu backlinks{" "}
            <strong>thegioididong.com</strong> lọc theo{" "}
            <code className="bg-white border border-[#E5DDB3] rounded px-1.5">reno15</code>. Khi bạn upload file riêng phía trên, kết quả sẽ trông tương tự với dữ liệu của bạn.
          </p>
        </div>
        <a
          href={data.download_url}
          download={data.filename}
          className="bg-white text-ink font-bold px-5 py-3 border-2 border-yellow-deep rounded-lg hover:bg-yellow-soft no-underline"
        >
          ⇩ Tải file mẫu
        </a>
      </div>

      <StatsGrid stats={data.stats} />

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
