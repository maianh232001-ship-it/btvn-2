---
name: filter-backlink-by-url
description: Lọc và thống kê backlink theo URL đích. Dùng khi user hỏi URL này có bao nhiêu backlink, lọc backlink cho trang X, thống kê domain nào link về.
---

# Filter Backlink By URL

## Cấu trúc
- sample-data/ : file xlsx mẫu để test
- output/      : kết quả lọc lưu ở đây

## Bước thực hiện
1. Hỏi user URL cần lọc
2. Lọc data theo anchor_text chứa URL đó
3. Tính thống kê: tổng backlink, domain unique, DR trung bình
4. Phân loại DR: Tốt >= 70, Trung bình 40-69, Yếu < 40
5. Export ra output/backlink-report-[domain]-[date].xlsx
