import type { AuditResponse } from "./types";

const RAW_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "https://btvn-2.onrender.com";
export const API_BASE = RAW_BASE.replace(/\/+$/, "");

async function parseOrThrow(res: Response): Promise<AuditResponse> {
  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Phản hồi không phải JSON (HTTP ${res.status})`);
  }
  if (!res.ok) {
    const message =
      (json as { error?: string }).error ||
      `Lỗi máy chủ (HTTP ${res.status})`;
    throw new Error(message);
  }
  return json as AuditResponse;
}

export async function fetchDemo(): Promise<AuditResponse> {
  const res = await fetch(`${API_BASE}/api/demo`, { cache: "no-store" });
  return parseOrThrow(res);
}

export async function runAuditUpload(
  file: File,
  keyword: string,
  productLabel: string
): Promise<AuditResponse> {
  const fd = new FormData();
  fd.append("backlinks", file);
  fd.append("keyword", keyword);
  fd.append("product_label", productLabel);
  const res = await fetch(`${API_BASE}/api/audit`, {
    method: "POST",
    body: fd,
  });
  return parseOrThrow(res);
}

export type AhrefsPayload = {
  domain: string;
  api_key: string;
  keyword: string;
  product_label: string;
  mode: string;
  limit: number;
};

export async function runAuditAhrefs(
  payload: AhrefsPayload
): Promise<AuditResponse> {
  const res = await fetch(`${API_BASE}/api/audit-ahrefs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseOrThrow(res);
}
