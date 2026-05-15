"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_SETTINGS,
  clearSettings,
  loadSettings,
  saveSettings,
} from "@/lib/settings";

export default function SettingsPanel() {
  const [drHigh, setDrHigh] = useState(DEFAULT_SETTINGS.drHigh);
  const [drMid, setDrMid] = useState(DEFAULT_SETTINGS.drMid);
  const [status, setStatus] = useState<{ text: string; kind?: "ok" | "err" }>({
    text: "",
  });

  useEffect(() => {
    const s = loadSettings();
    setDrHigh(s.drHigh);
    setDrMid(s.drMid);
  }, []);

  function onSave() {
    if (
      Number.isNaN(drHigh) ||
      Number.isNaN(drMid) ||
      drMid >= drHigh ||
      drHigh > 100 ||
      drMid < 0
    ) {
      setStatus({ text: "Giá trị không hợp lệ (mid < high, 0–100).", kind: "err" });
      return;
    }
    saveSettings({ drHigh, drMid });
    setStatus({ text: "Đã lưu ✓", kind: "ok" });
  }

  function onReset() {
    clearSettings();
    setDrHigh(DEFAULT_SETTINGS.drHigh);
    setDrMid(DEFAULT_SETTINGS.drMid);
    setStatus({ text: "Đã đặt lại mặc định ✓", kind: "ok" });
  }

  return (
    <>
      <h2 className="text-[19px] font-bold m-0 mb-3">⚙️ Setting</h2>
      <p className="text-[13px] text-ink-soft mb-5">
        Các tuỳ chọn dưới đây <strong>chỉ lưu trên trình duyệt của bạn</strong>{" "}
        (localStorage) — không ảnh hưởng người dùng khác.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block font-bold text-sm mb-1.5">
            Ngưỡng DR &quot;chất lượng cao&quot; (mặc định 50)
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={drHigh}
            onChange={(e) => setDrHigh(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2.5 border-[1.5px] border-[#E5DDB3] rounded-lg bg-white focus:outline-none focus:border-yellow-deep focus:ring-[3px] focus:ring-yellow-soft"
          />
          <div className="text-xs text-ink-soft mt-1">
            Dòng có DR ≥ ngưỡng này sẽ tô xanh lá.
          </div>
        </div>
        <div>
          <label className="block font-bold text-sm mb-1.5">
            Ngưỡng DR &quot;trung bình&quot; (mặc định 20)
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={drMid}
            onChange={(e) => setDrMid(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2.5 border-[1.5px] border-[#E5DDB3] rounded-lg bg-white focus:outline-none focus:border-yellow-deep focus:ring-[3px] focus:ring-yellow-soft"
          />
          <div className="text-xs text-ink-soft mt-1">
            Tô vàng cho DR từ ngưỡng này đến ngưỡng cao.
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <button
          type="button"
          onClick={onSave}
          className="bg-yellow text-ink font-bold px-6 py-3 border-[1.5px] border-yellow-deep rounded-lg hover:bg-yellow-deep hover:shadow-button"
        >
          Lưu setting
        </button>
        <button
          type="button"
          onClick={onReset}
          className="bg-white text-ink font-bold px-6 py-3 border-2 border-yellow-deep rounded-lg hover:bg-yellow-soft"
        >
          Đặt lại mặc định
        </button>
        {status.text && (
          <span
            className={`text-sm ${
              status.kind === "ok"
                ? "text-green-700 font-bold"
                : status.kind === "err"
                ? "text-red-700 font-bold"
                : "text-ink-soft"
            }`}
          >
            {status.text}
          </span>
        )}
      </div>
    </>
  );
}
