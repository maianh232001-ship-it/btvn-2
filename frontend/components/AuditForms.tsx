"use client";

import { useState } from "react";
import { runAuditAhrefs, runAuditUpload } from "@/lib/api";
import type { AuditResponse } from "@/lib/types";
import ResultTabs from "./ResultTabs";

type Tab = "upload" | "ahrefs";

export default function AuditForms() {
  const [tab, setTab] = useState<Tab>("upload");

  // Upload tab state
  const [file, setFile] = useState<File | null>(null);
  const [keyword, setKeyword] = useState("");
  const [productLabel, setProductLabel] = useState("");
  const [uploadStatus, setUploadStatus] = useState<{ text: string; kind?: "ok" | "err" | "working" }>({ text: "" });

  // Ahrefs tab state
  const [domain, setDomain] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [ahrKeyword, setAhrKeyword] = useState("");
  const [ahrLabel, setAhrLabel] = useState("");
  const [mode, setMode] = useState("subdomains");
  const [limit, setLimit] = useState(1000);
  const [ahrStatus, setAhrStatus] = useState<{ text: string; kind?: "ok" | "err" | "working" }>({ text: "" });

  const [result, setResult] = useState<AuditResponse | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmitUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setUploadStatus({ text: "Bạn chưa chọn file backlinks.", kind: "err" }); return; }
    if (!keyword.trim()) { setUploadStatus({ text: "Bạn chưa nhập từ khoá.", kind: "err" }); return; }
    setBusy(true);
    setUploadStatus({ text: "Đang xử lý…", kind: "working" });
    try {
      const data = await runAuditUpload(file, keyword.trim(), productLabel.trim());
      setResult(data);
      setUploadStatus({ text: "Hoàn tất ✓", kind: "ok" });
      requestAnimationFrame(() =>
        document.getElementById("result")?.scrollIntoView({ behavior: "smooth", block: "start" })
      );
    } catch (err) {
      setUploadStatus({ text: (err as Error).message, kind: "err" });
    } finally {
      setBusy(false);
    }
  }

  async function onSubmitAhrefs(e: React.FormEvent) {
    e.preventDefault();
    if (!domain.trim() || !apiKey.trim() || !ahrKeyword.trim()) {
      setAhrStatus({ text: "Vui lòng nhập đủ domain, API key, từ khoá.", kind: "err" });
      return;
    }
    setBusy(true);
    setAhrStatus({ text: "Đang gọi Ahrefs API…", kind: "working" });
    try {
      const data = await runAuditAhrefs({
        domain: domain.trim(),
        api_key: apiKey.trim(),
        keyword: ahrKeyword.trim(),
        product_label: ahrLabel.trim(),
        mode,
        limit,
      });
      setResult(data);
      setAhrStatus({ text: `Hoàn tất ✓ ${data.domain || ""}`, kind: "ok" });
      requestAnimationFrame(() =>
        document.getElementById("result")?.scrollIntoView({ behavior: "smooth", block: "start" })
      );
    } catch (err) {
      setAhrStatus({ text: (err as Error).message, kind: "err" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="bg-card border border-[#E5DDB3] rounded-xl shadow-card p-7 mb-6">
        <div className="flex gap-1 border-b-2 border-[#E5DDB3] -mx-3 mb-5 px-3">
          {([
            ["upload", "📁 Upload file XLSX"],
            ["ahrefs", "🔗 Lấy từ Ahrefs API"],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-4 py-3 text-sm font-bold rounded-t-lg -mb-0.5 border-b-[3px] transition-colors ${
                tab === id
                  ? "text-ink border-yellow bg-yellow-soft"
                  : "text-ink-soft border-transparent hover:bg-yellow-soft hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "upload" ? (
          <form onSubmit={onSubmitUpload} className="space-y-4">
            <div>
              <label className="block font-bold text-sm mb-1.5">1. File backlinks (.xlsx)</label>
              <label
                className={`block cursor-pointer text-center px-5 py-8 rounded-xl border-2 ${
                  file ? "bg-white border-solid border-yellow-deep" : "bg-yellow-soft border-dashed border-yellow-deep"
                }`}
              >
                <input
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <div className="text-3xl text-yellow-deep mb-1">⤓</div>
                {file ? (
                  <div className="text-sm">
                    ✓ <strong>{file.name}</strong>{" "}
                    <span className="text-ink-soft">· {(file.size / 1024).toFixed(0)} KB</span>
                  </div>
                ) : (
                  <>
                    <div className="text-sm">Bấm để chọn file</div>
                    <div className="text-xs text-ink-soft mt-1">
                      <code className="bg-white border border-[#E5DDB3] rounded px-1.5 py-0.5">
                        www....-backlinks-subdomains_*.xlsx
                      </code>{" "}
                      · tối đa 25 MB
                    </div>
                  </>
                )}
              </label>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-sm mb-1.5">2. Từ khoá Target URL</label>
                <input
                  type="text"
                  required
                  placeholder="vd: reno15"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full px-3 py-2.5 border-[1.5px] border-[#E5DDB3] rounded-lg bg-white focus:outline-none focus:border-yellow-deep focus:ring-[3px] focus:ring-yellow-soft"
                />
                <div className="text-xs text-ink-soft mt-1">Chỉ giữ các backlink có Target chứa chuỗi này.</div>
              </div>
              <div>
                <label className="block font-bold text-sm mb-1.5">3. Nhãn sản phẩm (tuỳ chọn)</label>
                <input
                  type="text"
                  placeholder="vd: Reno15"
                  value={productLabel}
                  onChange={(e) => setProductLabel(e.target.value)}
                  className="w-full px-3 py-2.5 border-[1.5px] border-[#E5DDB3] rounded-lg bg-white focus:outline-none focus:border-yellow-deep focus:ring-[3px] focus:ring-yellow-soft"
                />
                <div className="text-xs text-ink-soft mt-1">Dùng cho tiêu đề báo cáo & tên file.</div>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <button
                type="submit"
                disabled={busy}
                className="bg-yellow text-ink font-bold px-6 py-3 border-[1.5px] border-yellow-deep rounded-lg hover:bg-yellow-deep hover:shadow-button disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Bắt đầu audit
              </button>
              <StatusText {...uploadStatus} />
            </div>
          </form>
        ) : (
          <form onSubmit={onSubmitAhrefs} className="space-y-4">
            <div>
              <label className="block font-bold text-sm mb-1.5">1. Domain cần audit</label>
              <input
                type="text"
                required
                placeholder="vd: thegioididong.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full px-3 py-2.5 border-[1.5px] border-[#E5DDB3] rounded-lg bg-white focus:outline-none focus:border-yellow-deep focus:ring-[3px] focus:ring-yellow-soft"
              />
              <div className="text-xs text-ink-soft mt-1">
                Nhập domain gốc, không cần <code>https://</code>.
              </div>
            </div>

            <div>
              <label className="block font-bold text-sm mb-1.5">2. Ahrefs API key</label>
              <input
                type="password"
                required
                autoComplete="off"
                placeholder="dán API token Ahrefs..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2.5 border-[1.5px] border-[#E5DDB3] rounded-lg bg-white focus:outline-none focus:border-yellow-deep focus:ring-[3px] focus:ring-yellow-soft"
              />
              <div className="text-xs text-ink-soft mt-1">
                🔒 Key chỉ truyền 1 lần để gọi API,{" "}
                <strong>không lưu trên server</strong>. Lấy key tại{" "}
                <a
                  href="https://app.ahrefs.com/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold border-b-2 border-yellow text-ink hover:border-yellow-deep"
                >
                  app.ahrefs.com/api
                </a>
                .
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-sm mb-1.5">3. Từ khoá Target URL</label>
                <input
                  type="text"
                  required
                  placeholder="vd: reno15"
                  value={ahrKeyword}
                  onChange={(e) => setAhrKeyword(e.target.value)}
                  className="w-full px-3 py-2.5 border-[1.5px] border-[#E5DDB3] rounded-lg bg-white focus:outline-none focus:border-yellow-deep focus:ring-[3px] focus:ring-yellow-soft"
                />
              </div>
              <div>
                <label className="block font-bold text-sm mb-1.5">4. Nhãn sản phẩm</label>
                <input
                  type="text"
                  placeholder="vd: Reno15"
                  value={ahrLabel}
                  onChange={(e) => setAhrLabel(e.target.value)}
                  className="w-full px-3 py-2.5 border-[1.5px] border-[#E5DDB3] rounded-lg bg-white focus:outline-none focus:border-yellow-deep focus:ring-[3px] focus:ring-yellow-soft"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-sm mb-1.5">5. Phạm vi (mode)</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-full px-3 py-2.5 border-[1.5px] border-[#E5DDB3] rounded-lg bg-white focus:outline-none focus:border-yellow-deep focus:ring-[3px] focus:ring-yellow-soft"
                >
                  <option value="subdomains">subdomains (toàn site + sub)</option>
                  <option value="domain">domain (chỉ domain chính)</option>
                  <option value="prefix">prefix (URL bắt đầu bằng)</option>
                  <option value="exact">exact (URL chính xác)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-sm mb-1.5">6. Số backlink tối đa</label>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value, 10) || 1000)}
                  className="w-full px-3 py-2.5 border-[1.5px] border-[#E5DDB3] rounded-lg bg-white focus:outline-none focus:border-yellow-deep focus:ring-[3px] focus:ring-yellow-soft"
                />
                <div className="text-xs text-ink-soft mt-1">⚠️ Càng nhiều càng tốn credit Ahrefs.</div>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <button
                type="submit"
                disabled={busy}
                className="bg-yellow text-ink font-bold px-6 py-3 border-[1.5px] border-yellow-deep rounded-lg hover:bg-yellow-deep hover:shadow-button disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Gọi Ahrefs &amp; audit
              </button>
              <StatusText {...ahrStatus} />
            </div>
          </form>
        )}
      </div>

      {result && (
        <section
          id="result"
          className="bg-card border border-[#E5DDB3] rounded-xl shadow-card p-7 mb-6 border-l-[6px] border-l-yellow"
        >
          <div className="flex items-center justify-between flex-wrap gap-4 mb-3">
            <h2 className="text-[19px] font-bold m-0">Kết quả</h2>
            <a
              href={result.download_url}
              download={result.filename}
              className="bg-yellow text-ink font-bold px-5 py-3 border-[1.5px] border-yellow-deep rounded-lg hover:bg-yellow-deep hover:shadow-button no-underline"
            >
              ⇩ Tải báo cáo Excel
            </a>
          </div>
          <ResultTabs data={result} />
        </section>
      )}
    </>
  );
}

function StatusText({
  text,
  kind,
}: {
  text: string;
  kind?: "ok" | "err" | "working";
}) {
  if (!text) return null;
  const color =
    kind === "ok"
      ? "text-green-700 font-bold"
      : kind === "err"
      ? "text-red-700 font-bold"
      : "text-ink-soft";
  return (
    <span className={`text-sm ${color}`}>
      {text}
      {kind === "working" && (
        <span className="inline-block w-3 h-3 ml-2 align-middle border-2 border-yellow-deep border-t-transparent rounded-full animate-spin" />
      )}
    </span>
  );
}
