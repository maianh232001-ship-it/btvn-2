import type { AuditStats } from "@/lib/types";

type Props = { stats: AuditStats; inputLabel?: string };

export default function StatsGrid({ stats, inputLabel = "Dòng đầu vào" }: Props) {
  const items: [string, number | string | undefined][] = [
    [inputLabel, stats.input_rows],
    ["Backlink chất lượng", stats.kept_rows],
    ["Target URL", stats.target_urls],
    ["Tổng link giữ lại", stats.total_links],
    ["Dòng tổng hợp domain", stats.total_domain_rows],
  ];
  return (
    <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
      {items.map(([label, value]) => (
        <div
          key={label}
          className="bg-yellow-soft border border-[#E5DDB3] rounded-lg px-3.5 py-3"
        >
          <div className="text-xs text-ink-soft">{label}</div>
          <div className="text-2xl font-bold">{value ?? "—"}</div>
        </div>
      ))}
    </div>
  );
}
