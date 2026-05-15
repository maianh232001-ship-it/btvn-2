import AuditForms from "@/components/AuditForms";
import DemoShowcase from "@/components/DemoShowcase";
import SettingsPanel from "@/components/SettingsPanel";

export default function HomePage() {
  return (
    <>
      <section id="home" className="mb-7">
        <span className="inline-block bg-yellow-soft text-ink border border-yellow-deep rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase mb-3.5">
          v2 · Next.js · Python
        </span>
        <h1 className="m-0 mb-3 text-[32px] leading-[1.2] tracking-[-0.3px] font-bold">
          Audit backlink từ file dữ liệu của bạn
        </h1>
        <p className="m-0 text-ink-soft text-[15px]">
          Tải lên file <strong>Ahrefs backlinks (.xlsx)</strong>, nhập từ khoá
          Target URL (ví dụ <em>reno15</em>), nhận về file báo cáo có 2 sheet
          đã chia nhóm, tô màu theo Domain Rating.
        </p>
        <p className="text-[13px] text-ink-soft mt-3.5">
          👇 Cuộn xuống cuối trang để xem{" "}
          <a
            href="#demo"
            className="text-ink font-bold border-b-2 border-yellow hover:border-yellow-deep no-underline"
          >
            bảng kết quả mẫu
          </a>{" "}
          trước khi upload.
        </p>
      </section>

      <section id="audit">
        <AuditForms />
      </section>

      <section
        id="guide"
        className="bg-card border border-[#E5DDB3] rounded-xl shadow-card p-7 mb-6"
      >
        <h2 className="text-[19px] font-bold m-0 mb-3">📖 Định dạng đầu ra</h2>
        <ul className="m-0 pl-5 space-y-1.5">
          <li>
            <strong>Sheet 1 — Chi Tiết URL vs Anchor:</strong> liệt kê từng
            backlink theo Target URL, đã loại bỏ Black Hat. Dòng DR ≥ 50 tô{" "}
            <span className="inline-block w-3.5 h-3.5 rounded-sm border border-[#E5DDB3] align-[-2px] bg-dr-high" />{" "}
            xanh lá.
          </li>
          <li>
            <strong>Sheet 2 — 📊 Domain vs URL:</strong> đếm số link & DR cao
            nhất theo domain nguồn. DR ≥ 50 tô{" "}
            <span className="inline-block w-3.5 h-3.5 rounded-sm border border-[#E5DDB3] align-[-2px] bg-dr-high" />
            , DR 20–49 tô{" "}
            <span className="inline-block w-3.5 h-3.5 rounded-sm border border-[#E5DDB3] align-[-2px] bg-dr-mid" />{" "}
            vàng.
          </li>
        </ul>
      </section>

      <section
        id="demo"
        className="bg-gradient-to-b from-[#FFFEF7] to-[#FFFAEB] border border-[#E5DDB3] rounded-xl shadow-card p-7 mb-6 border-l-[6px] border-l-yellow-deep"
      >
        <DemoShowcase />
      </section>

      <section
        id="settings"
        className="bg-card border border-[#E5DDB3] rounded-xl shadow-card p-7 mb-6"
      >
        <SettingsPanel />
      </section>

      <footer className="text-center text-xs text-ink-soft pt-6">
        Theme · Helvetica · Yellow #F5C518 · Repo:{" "}
        <a
          href="https://github.com/maianh232001-ship-it/btvn-2"
          target="_blank"
          rel="noopener noreferrer"
          className="text-ink font-bold"
        >
          github.com/maianh232001-ship-it/btvn-2
        </a>
      </footer>
    </>
  );
}
