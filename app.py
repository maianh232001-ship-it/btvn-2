"""Flask web app: upload backlinks XLSX → download styled audit report."""
from __future__ import annotations

import os
import re
import secrets
import uuid
from pathlib import Path

from flask import (Flask, abort, jsonify, render_template, request,
                   send_from_directory, url_for)
from werkzeug.utils import secure_filename

from audit import AhrefsAPIError, run_audit, run_audit_from_ahrefs
import db


BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "outputs"
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)
try:
    db.init_db()
except Exception as exc:  # noqa: BLE001
    print(f"[db] init failed, history disabled: {exc}", flush=True)

ALLOWED_EXT = {".xlsx"}
MAX_BYTES = 25 * 1024 * 1024  # 25 MB

app = Flask(__name__, static_folder="static", template_folder="templates")
app.config["MAX_CONTENT_LENGTH"] = MAX_BYTES

# Bundled sample so visitors can preview the report format without uploading.
DEMO_SAMPLE = BASE_DIR / (
    "www.thegioididong.com-backlinks-subdomains_2026-05-09_02-31-21.xlsx"
)
DEMO_KEYWORD = "reno15"
DEMO_LABEL = "Reno15"
DEMO_FILENAME = "demo_reno15.xlsx"
_demo_cache: dict | None = None


def _safe_label(label: str) -> str:
    """Sanitize a label so it's safe as a filename token."""
    s = re.sub(r"[^A-Za-z0-9_\-]+", "_", (label or "").strip())
    return s.strip("_") or "report"


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/demo")
def demo_endpoint():
    """Return a cached preview built from the bundled TGDĐ + Reno15 sample."""
    global _demo_cache
    if not DEMO_SAMPLE.exists():
        return jsonify({"error": "File mẫu không có sẵn trên server."}), 404
    if _demo_cache is None:
        try:
            result = run_audit(
                str(DEMO_SAMPLE), DEMO_KEYWORD,
                str(OUTPUT_DIR / DEMO_FILENAME),
                product_label=DEMO_LABEL,
            )
        except Exception as exc:  # noqa: BLE001
            return jsonify({"error": f"Lỗi tạo demo: {exc}"}), 500
        preview = result.pop("preview", None)
        _demo_cache = {"stats": result, "preview": preview}
    return jsonify({
        **_demo_cache,
        "download_url": url_for("download_output", name=DEMO_FILENAME),
        "filename": DEMO_FILENAME,
        "source": "demo",
        "demo": True,
    })


@app.route("/api/audit", methods=["POST"])
def audit_endpoint():
    file = request.files.get("backlinks")
    keyword = (request.form.get("keyword") or "").strip()
    product_label = (request.form.get("product_label") or keyword).strip()

    if not file or not file.filename:
        return jsonify({"error": "Bạn chưa chọn file backlinks (.xlsx)."}), 400
    if not keyword:
        return jsonify({"error": "Bạn chưa nhập từ khoá lọc Target URL."}), 400

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXT:
        return jsonify({"error": "Chỉ chấp nhận file .xlsx."}), 400

    token = secrets.token_hex(8)
    safe_name = secure_filename(file.filename) or "backlinks.xlsx"
    in_path = UPLOAD_DIR / f"{token}__{safe_name}"
    file.save(in_path)

    out_name = f"chi_tiet_anchor_backlink_{_safe_label(product_label)}__{token}.xlsx"
    out_path = OUTPUT_DIR / out_name

    try:
        result = run_audit(str(in_path), keyword, str(out_path),
                           product_label=product_label)
    except Exception as exc:  # surface error to the UI
        try:
            in_path.unlink(missing_ok=True)
        except Exception:
            pass
        return jsonify({"error": f"Xử lý thất bại: {exc}"}), 500

    try:
        in_path.unlink(missing_ok=True)
    except Exception:
        pass

    preview = result.pop("preview", None)
    try:
        db.save_audit(
            source="upload",
            keyword=keyword,
            product_label=product_label or keyword,
            stats=result,
            output_filename=out_name,
        )
    except Exception as exc:  # noqa: BLE001 — don't fail the audit if DB save errors
        print(f"[db] save_audit (upload) failed: {exc}", flush=True)
    return jsonify({
        "stats": result,
        "preview": preview,
        "download_url": url_for("download_output", name=out_name),
        "filename": out_name,
    })


@app.route("/api/audit-ahrefs", methods=["POST"])
def audit_ahrefs_endpoint():
    payload = request.get_json(silent=True) or {}
    domain = (payload.get("domain") or "").strip()
    api_key = (payload.get("api_key") or "").strip()
    keyword = (payload.get("keyword") or "").strip()
    product_label = (payload.get("product_label") or keyword).strip()
    try:
        limit = int(payload.get("limit") or 1000)
    except (TypeError, ValueError):
        limit = 1000
    limit = max(1, min(limit, 10000))
    mode = (payload.get("mode") or "subdomains").strip().lower()
    if mode not in {"subdomains", "domain", "exact", "prefix"}:
        mode = "subdomains"

    if not domain:
        return jsonify({"error": "Bạn chưa nhập domain."}), 400
    if not api_key:
        return jsonify({"error": "Bạn chưa nhập Ahrefs API key."}), 400
    if not keyword:
        return jsonify({"error": "Bạn chưa nhập từ khoá lọc Target URL."}), 400

    token = secrets.token_hex(8)
    out_name = (
        f"chi_tiet_anchor_backlink_{_safe_label(product_label)}__{token}.xlsx"
    )
    out_path = OUTPUT_DIR / out_name

    try:
        result = run_audit_from_ahrefs(
            domain, api_key, keyword, str(out_path),
            product_label=product_label, limit=limit, mode=mode,
        )
    except AhrefsAPIError as exc:
        status = 502 if (exc.status or 0) >= 500 else 400
        return jsonify({"error": str(exc)}), status
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:  # noqa: BLE001 — surface unexpected errors to UI
        return jsonify({"error": f"Xử lý thất bại: {exc}"}), 500

    preview = result.pop("preview", None)
    try:
        db.save_audit(
            source="ahrefs",
            domain=domain,
            keyword=keyword,
            product_label=product_label or keyword,
            stats=result,
            output_filename=out_name,
        )
    except Exception as exc:  # noqa: BLE001 — don't fail the audit if DB save errors
        print(f"[db] save_audit (ahrefs) failed: {exc}", flush=True)
    return jsonify({
        "stats": result,
        "preview": preview,
        "download_url": url_for("download_output", name=out_name),
        "filename": out_name,
        "source": "ahrefs",
        "domain": domain,
    })


@app.route("/api/history")
def history_endpoint():
    if not db.is_configured():
        return jsonify({
            "error": "Database chưa cấu hình. Set env var DATABASE_URL "
                     "(Supabase connection string) rồi restart service.",
        }), 503
    try:
        limit = int(request.args.get("limit", 50))
    except (TypeError, ValueError):
        limit = 50
    try:
        items = db.list_audits(limit=limit)
    except Exception as exc:  # noqa: BLE001 — surface DB errors to the UI
        return jsonify({
            "error": f"Lỗi kết nối database: {type(exc).__name__}: {exc}",
        }), 500
    for item in items:
        out = item.get("output_filename")
        if out and (OUTPUT_DIR / out).exists():
            item["download_url"] = url_for("download_output", name=out)
        else:
            item["download_url"] = None
    return jsonify({"items": items, "count": len(items)})


@app.route("/api/history/<int:audit_id>", methods=["DELETE"])
def history_delete(audit_id: int):
    try:
        ok = db.delete_audit(audit_id)
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": f"Lỗi DB: {type(exc).__name__}: {exc}"}), 500
    if not ok:
        return jsonify({"error": "Không tìm thấy bản ghi."}), 404
    return jsonify({"ok": True})


@app.route("/api/db-health")
def db_health():
    """Diagnostic endpoint: tries a trivial DB query, returns details on failure."""
    if not db.is_configured():
        return jsonify({"ok": False, "reason": "DATABASE_URL not set"}), 503
    try:
        items = db.list_audits(limit=1)
        return jsonify({"ok": True, "rows_visible": len(items)})
    except Exception as exc:  # noqa: BLE001
        return jsonify({
            "ok": False,
            "error_type": type(exc).__name__,
            "error": str(exc),
        }), 500


@app.route("/download/<path:name>")
def download_output(name: str):
    safe = secure_filename(name)
    if safe != name:
        abort(404)
    file_path = OUTPUT_DIR / safe
    if not file_path.exists():
        abort(404)
    return send_from_directory(OUTPUT_DIR, safe, as_attachment=True)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5050"))
    app.run(host="127.0.0.1", port=port, debug=False)
