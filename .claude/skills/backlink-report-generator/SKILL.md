---
name: backlink-report-generator
description: Tạo báo cáo phân tích backlink bằng Claude API. Dùng khi user muốn phân tích backlink có tốt không, viết báo cáo SEO, đánh giá chất lượng link building.
---

# Backlink Report Generator

## Cấu trúc
- references/tieu-chuan-danh-gia.md : tiêu chuẩn đánh giá

## Bước thực hiện
1. Hỏi user: ngành website, ngưỡng DR tùy chỉnh, format output
2. Gọi Claude API với stats từ skill filter-backlink-by-url
3. Tạo báo cáo gồm: điểm mạnh, điểm yếu, rủi ro, khuyến nghị, điểm /10
4. Lưu file ra outputs/bao-cao-[domain]-[date].md
