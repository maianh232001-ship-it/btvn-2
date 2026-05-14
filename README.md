# BTVN — Backlink Audit Web App

[![Live Demo](https://img.shields.io/badge/Live%20Demo-btvn--2.onrender.com-F5C518?style=for-the-badge&logo=render&logoColor=black)](https://btvn-2.onrender.com)
[![Python](https://img.shields.io/badge/Python-3.12-blue?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)

## 👉 Xem ngay bản giao diện

**https://btvn-2.onrender.com**

> Lần đầu mở có thể mất ~30 giây vì Render free tier ngủ khi không có traffic. Lần sau nhanh ngay.

---

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

App có **2 chế độ** chọn qua tab:

### A. Upload file XLSX
1. Tải lên file `…-backlinks-subdomains_*.xlsx`
2. Nhập từ khoá Target URL (vd `reno15`)
3. Nhập nhãn sản phẩm tuỳ chọn (vd `Reno15`)
4. Bấm **Bắt đầu audit** → tải file Excel kết quả

### B. Lấy từ Ahrefs API (không cần file)
1. Nhập domain cần audit (vd `thegioididong.com`)
2. Dán **Ahrefs API key** (lấy tại [app.ahrefs.com/api](https://app.ahrefs.com/api), cần plan Standard trở lên)
3. Nhập từ khoá Target URL + nhãn sản phẩm
4. Chọn phạm vi (mode) và số backlink tối đa (mặc định 1000 — càng cao càng tốn credit)
5. Bấm **Gọi Ahrefs & audit** → app tự fetch & build báo cáo

🔒 API key chỉ truyền 1 lần trong request, **không lưu trên server**.
