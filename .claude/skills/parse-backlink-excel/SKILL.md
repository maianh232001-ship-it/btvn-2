---
name: parse-backlink-excel
description: Đọc và parse file Excel (.xlsx) chứa dữ liệu backlink audit. Trigger khi user upload file xlsx có dữ liệu backlink, anchor text, DR, URL nguồn.
---

# Parse Backlink Excel

Skill đọc file .xlsx backlink audit và chuẩn hóa thành JSON sạch.

## Input
- File .xlsx từ user
- Cột cần có: STT, ANCHOR TEXT, URL NGUỒN, DR, NGÀY

## Bước thực hiện
1. Đọc file Excel bằng pandas
2. Normalize tên cột về: stt, anchor_text, url_nguon, dr, ngay
3. Chuẩn hóa: URL lowercase, DR sang int, Ngày sang YYYY-MM-DD
4. Output JSON sạch truyền cho skill filter-backlink-by-url
