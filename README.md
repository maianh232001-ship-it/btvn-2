# BTVN — Backlink Audit · Next.js + Python

[![Backend](https://img.shields.io/badge/API-btvn--2.onrender.com-F5C518?style=for-the-badge&logo=render&logoColor=black)](https://btvn-2.onrender.com)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Backend-Flask%20%2B%20Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)

Monorepo gồm 2 stack:

| Thư mục | Stack | Deploy |
|---|---|---|
| `backend/` | Python + Flask + openpyxl | Render (https://btvn-2.onrender.com) |
| `frontend/` | Next.js 14 + TypeScript + Tailwind | Railway (cần setup, xem dưới) |

App audit backlinks Ahrefs: nhập file XLSX hoặc gọi trực tiếp Ahrefs API → báo cáo Excel 2 sheet đã lọc Black Hat, tô màu theo Domain Rating.

## Chạy local

### Backend (port 5050)
```bash
cd backend
pip3 install -r requirements.txt
ALLOWED_ORIGINS="http://localhost:3000" python3 app.py
```

### Frontend (port 3000)
```bash
cd frontend
npm install
NEXT_PUBLIC_API_BASE=http://localhost:5050 npm run dev
```

Mở http://localhost:3000

## Deploy

### Backend → Render
- `render.yaml` ở root → Render Blueprint tự đọc → tạo service Python từ `backend/`
- Auto-deploy mỗi `git push` lên `main`
- Env var `ALLOWED_ORIGINS`: comma-separated list các domain frontend được phép gọi API (đã include localhost + Railway placeholder)

### Frontend → Railway
1. Vào https://railway.app → New Project → Deploy from GitHub repo
2. Chọn `maianh232001-ship-it/btvn-2`
3. Trong service settings → Root Directory: `frontend`
4. Env var: `NEXT_PUBLIC_API_BASE=https://btvn-2.onrender.com`
5. Bấm Deploy → đợi build (~3–5 phút) → copy URL Railway cấp (dạng `*.up.railway.app`)
6. Quay lại backend Render dashboard → thêm URL Railway vào `ALLOWED_ORIGINS` để mở CORS

## Tính năng

- 📁 **Upload XLSX** — kéo thả file Ahrefs backlinks → báo cáo Excel 2 sheet
- 🔗 **Ahrefs API direct** — nhập domain + API key → server tự fetch & build
- 📋 **Preview inline** — bảng kết quả ngay trên trang (2 tab Chi tiết / Domain, group collapse, sticky header, DR coloring)
- 🎬 **Demo showcase** — bảng mẫu TGDĐ + Reno15 auto-load ở cuối trang
- ⚙️ **Settings** — ngưỡng DR custom lưu localStorage
- 📐 **Sidebar dashboard** — nav menu cố định, mobile responsive

## API endpoints

| Method | Path | Mô tả |
|---|---|---|
| GET | `/` | Status JSON |
| GET | `/api/demo` | Preview demo (cached) |
| POST | `/api/audit` | multipart: `backlinks`, `keyword`, `product_label` |
| POST | `/api/audit-ahrefs` | json: `domain`, `api_key`, `keyword`, `mode`, `limit`, `product_label` |
| GET | `/download/<name>` | Tải file XLSX kết quả |

## Cấu trúc

```
backend/
  app.py              ← Flask API (4 endpoints, CORS-enabled)
  audit.py            ← Logic: XLSX read + Ahrefs API + styled report writer
  requirements.txt
  www.thegioididong.com-backlinks-subdomains_*.xlsx  ← demo sample

frontend/
  app/
    layout.tsx        ← Sidebar shell + global CSS
    page.tsx          ← Trang chính (Home / Audit / Guide / Demo / Settings)
    globals.css       ← Tailwind + DR row colors
  components/
    Sidebar.tsx       ← Dark nav menu + IntersectionObserver active state
    AuditForms.tsx    ← 2-tab form (Upload / Ahrefs)
    PreviewTable.tsx  ← Detail + Summary tables với group collapse
    StatsGrid.tsx
    ResultTabs.tsx
    DemoShowcase.tsx  ← Auto-fetch /api/demo
    SettingsPanel.tsx ← DR thresholds → localStorage
  lib/
    api.ts            ← Fetch wrapper (NEXT_PUBLIC_API_BASE)
    settings.ts       ← localStorage settings + event broadcast
    types.ts          ← Audit response types

render.yaml           ← Blueprint cho backend service
```
