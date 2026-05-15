import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Backlink Audit Tool · BTVN",
  description:
    "Tải lên file Ahrefs backlinks hoặc gọi trực tiếp Ahrefs API, nhận báo cáo Excel 2 sheet đã lọc Black Hat và tô màu theo Domain Rating.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="bg-bg text-ink min-h-screen">
        <Sidebar />
        <main className="md:ml-60 px-5 md:px-12 py-10 md:py-10 pt-16 md:pt-10 max-w-[1100px]">
          {children}
        </main>
      </body>
    </html>
  );
}
