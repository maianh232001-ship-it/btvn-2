# BTVN — Backlink Audit Web App

🌐 **Live demo**: https://btvn-2.onrender.com (~30 giây loading lần đầu vì Render free tier ngủ khi không có traffic)

Công cụ web đơn giản: tải lên file backlinks Ahrefs (.xlsx), nhập từ khoá lọc, nhận về báo cáo Excel 2 sheet có style sẵn (đã loại Black Hat, tô màu theo Domain Rating).

Theme vàng `#F5C518`, font Helvetica.

## Chạy local

```bash
pip3 install -r requirements.txt
python3 app.py
```

Mở http://127.0.0.1:5050

## Cấu trúc

```
app.py                ← Flask backend (3 route)
audit.py              ← Logic đọc XLSX + ghi báo cáo có style
templates/index.html  ← Giao diện
static/style.css      ← Theme vàng + Helvetica
static/script.js      ← Upload drag-and-drop + gọi API
```

## File dữ liệu mẫu

Đính kèm trong repo:

- `www.thegioididong.com-backlinks-subdomains_*.xlsx` — file dữ liệu chính cần upload
- `www.thegioididong.com-anchors-subdomains_*.xlsx` / `top-pages-*.xlsx` — file phụ trợ (không bắt buộc cho audit hiện tại)
- `chi_tiet_anchor_backlink_reno15.xlsx` — file output mẫu (target format)
- `BTVN_export.txt` — export gộp toàn bộ source code

## Cách dùng

1. Tải lên file `…-backlinks-subdomains_*.xlsx`
2. Nhập từ khoá Target URL (vd `reno15`)
3. Nhập nhãn sản phẩm tuỳ chọn (vd `Reno15`)
4. Bấm **Bắt đầu audit** → tải file Excel kết quả
