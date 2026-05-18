"""Postgres storage for audit history (Supabase)."""
from __future__ import annotations

import os
from typing import Any

import psycopg
from psycopg.rows import dict_row


SCHEMA = """
CREATE TABLE IF NOT EXISTS audits (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
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


_dsn: str | None = None


def init_db(dsn: str | None = None) -> None:
    """Run schema if DATABASE_URL is configured. Silent no-op otherwise."""
    global _dsn
    _dsn = (dsn or os.environ.get("DATABASE_URL") or "").strip() or None
    if _dsn is None:
        return
    with psycopg.connect(_dsn, connect_timeout=10) as conn:
        with conn.cursor() as cur:
            cur.execute(SCHEMA)
        conn.commit()


def is_configured() -> bool:
    return _dsn is not None


def _connect() -> psycopg.Connection:
    if _dsn is None:
        raise RuntimeError("DATABASE_URL chưa được set.")
    # prepare_threshold=None: required for Supabase transaction pooler (PgBouncer).
    return psycopg.connect(
        _dsn, row_factory=dict_row, prepare_threshold=None, connect_timeout=10,
    )


def save_audit(
    *,
    source: str,
    keyword: str,
    product_label: str,
    stats: dict[str, Any],
    output_filename: str,
    domain: str | None = None,
) -> int | None:
    """Persist one audit run. Returns new id, or None if DB is not configured."""
    if not is_configured():
        return None
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO audits (
                    source, domain, keyword, product_label,
                    input_rows, kept_rows, target_urls,
                    total_links, total_domain_rows, output_filename
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
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
            row = cur.fetchone()
        conn.commit()
    return int(row["id"]) if row else None


def list_audits(limit: int = 50) -> list[dict[str, Any]]:
    """Return the most recent audits, newest first."""
    if not is_configured():
        return []
    limit = max(1, min(int(limit), 500))
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM audits ORDER BY created_at DESC, id DESC LIMIT %s",
                (limit,),
            )
            rows = cur.fetchall()
    for r in rows:
        ts = r.get("created_at")
        if ts is not None:
            r["created_at"] = ts.isoformat()
    return rows


def delete_audit(audit_id: int) -> bool:
    if not is_configured():
        return False
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM audits WHERE id = %s", (int(audit_id),))
            deleted = cur.rowcount > 0
        conn.commit()
    return deleted
