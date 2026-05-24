---
name: compare-two-urls
description: So sánh profile backlink giữa URL của mình và URL đối thủ. Dùng khi user muốn benchmark backlink với đối thủ, tính số link DR>=70 cần build thêm, ưu tiên domain nào.
---

# Compare Two URLs

So sánh backlink giữa site mình và site đối thủ, đưa ra kế hoạch bổ sung link.

## Cấu trúc
- sample-data/ : 2 file xlsx mẫu (mình + đối thủ)
- output/      : kết quả so sánh

## Input
- URL của mình + keyword lọc Target URL
- URL của đối thủ + keyword lọc Target URL
- 2 file xlsx backlink (mỗi site 1 file)

## Bước thực hiện

1. Parse 2 file xlsx (gọi skill parse-backlink-excel cho từng file)
2. Lọc theo Target URL chứa keyword riêng từng site
3. Loại spam: bỏ row có cột `Is spam = true`
4. Tính stats cho mỗi bên:
   - total = số lượng backlink
   - unique_domains = domain unique
   - dr_tb = DR trung bình
   - phân bố DR: Tốt (>=70), Trung bình (40-69), Yếu (<40)
5. So sánh side-by-side bảng 2 cột Mình vs Đối thủ
6. Tính số link DR>=70 cần thêm theo công thức:
   ```
   needed = (dr_tb_đối_thủ × total_mình − tổng_dr_mình) / (70 − dr_tb_đối_thủ)
   ```
   - Nếu mẫu số <= 0 (đối thủ DR TB >= 70): cảnh báo, dùng ngưỡng cao hơn
   - Làm tròn lên (ceil), không âm
7. Đề xuất domain ưu tiên:
   - Domain đối thủ có nhưng mình chưa có
   - Sort theo DR giảm dần, lấy top 10
8. Export `output/so-sanh-[my-domain]-vs-[competitor-domain]-[date].md` gồm:
   - Bảng so sánh stats
   - Số link DR>=70 cần thêm (kèm cách tính)
   - Top 10 domain ưu tiên outreach
   - Gap về domain unique và DR TB
