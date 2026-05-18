"""SQLite storage for audit history."""
from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Any


SCHEMA = """
CREATE TABLE IF NOT EXISTS audits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    source TEXT NOT NULL,
    domain TEXT,
    keyword TEXT NOT NULL,
    product_label TEXT NOT NULL,
    input_rows INTEGER NOT NULL,
    kept_rows INTEGER NOT NULL,
    target_urls INTEGER NOT NULL,
    total_links INTEGER NOT NULL,
    total_domain_rows INTEGER NOT NULL,
    output_filename TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audits_created_at ON audits(created_at DESC);
"""


_db_path: Path | None = None


def init_db(path: str | Path) -> None:
    """Create tables if needed. Call once at app startup."""
    global _db_path
    _db_path = Path(path)
    _db_path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(_db_path) as conn:
        conn.executescript(SCHEMA)


def _connect() -> sqlite3.Connection:
    if _db_path is None:
        raise RuntimeError("db.init_db() chưa được gọi.")
    conn = sqlite3.connect(_db_path)
    conn.row_factory = sqlite3.Row
    return conn


def save_audit(
    *,
    source: str,
    keyword: str,
    product_label: str,
    stats: dict[str, Any],
    output_filename: str,
    domain: str | None = None,
) -> int:
    """Persist one audit run. Returns the new row id."""
    with _connect() as conn:
        cur = conn.execute(
            """
            INSERT INTO audits (
                source, domain, keyword, product_label,
                input_rows, kept_rows, target_urls,
                total_links, total_domain_rows, output_filename
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                source,
                domain,
                keyword,
                product_label,
                int(stats.get("input_rows", 0)),
                int(stats.get("kept_rows", 0)),
                int(stats.get("target_urls", 0)),
                int(stats.get("total_links", 0)),
                int(stats.get("total_domain_rows", 0)),
                output_filename,
            ),
        )
        return int(cur.lastrowid)


def list_audits(limit: int = 50) -> list[dict[str, Any]]:
    """Return the most recent audits, newest first."""
    limit = max(1, min(int(limit), 500))
    with _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM audits ORDER BY datetime(created_at) DESC, id DESC LIMIT ?",
            (limit,),
        ).fetchall()
    return [dict(r) for r in rows]


def delete_audit(audit_id: int) -> bool:
    """Remove one row. Returns True if a row was deleted."""
    with _connect() as conn:
        cur = conn.execute("DELETE FROM audits WHERE id = ?", (int(audit_id),))
        return cur.rowcount > 0
