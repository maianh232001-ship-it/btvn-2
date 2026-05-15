export type DetailRow = {
  stt: number;
  anchor: string;
  ref_url: string;
  dr: number;
  first_seen: string;
};

export type DetailGroup = {
  target: string;
  target_path: string;
  count: number;
  rows: DetailRow[];
};

export type SummaryRow = {
  stt: number;
  domain: string;
  count: number;
  dr_max: number;
};

export type SummaryGroup = {
  target: string;
  target_path: string;
  total_links: number;
  domain_count: number;
  rows: SummaryRow[];
};

export type AuditStats = {
  input_rows: number;
  kept_rows: number;
  target_urls: number;
  total_links: number;
  total_domain_rows: number;
};

export type AuditResponse = {
  stats: AuditStats;
  preview: { detail: DetailGroup[]; summary: SummaryGroup[] };
  download_url: string;
  filename: string;
  source?: "ahrefs" | "demo";
  demo?: boolean;
  domain?: string;
};

export type AuditError = { error: string };
