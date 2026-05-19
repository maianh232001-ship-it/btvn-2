"""Generate Claude-powered backlink analysis reports."""
from __future__ import annotations

import json
import os
from collections import Counter
from typing import Any

import anthropic


SYSTEM_PROMPT = """Bạn là chuyên gia SEO/link-building với 10 năm kinh nghiệm phân tích backlink profile.

Nhiệm vụ: Phân tích dữ liệu backlink audit và viết báo cáo bằng tiếng Việt theo định dạng markdown dưới đây. Tuyệt đối không bịa số liệu — chỉ dùng dữ liệu được cung cấp.

**Định dạng đầu ra:**

# Báo cáo phân tích backlink: [TÊN/DOMAIN]

## Tổng quan
[2-3 câu mô tả tổng quan: tổng backlink chất lượng, số Target URL, profile mạnh/yếu ở điểm nào]

## Phân bố Domain Rating
[3 nhóm theo tiêu chuẩn dưới đây, mỗi nhóm có số lượng và %, kèm 1 câu đánh giá]

## Phân tích Anchor Text
[Top 3-5 anchor được dùng nhiều nhất; đánh giá độ đa dạng; phân loại tỉ lệ branded vs generic vs exact-match nếu suy luận được]

## Domain Diversity
[Số domain unique; có domain nào link >5 lần không; rủi ro footprint nếu có]

## Điểm mạnh
- [3-5 bullet ngắn, cụ thể, có số]

## Điểm yếu
- [3-5 bullet ngắn, cụ thể, có số]

## Rủi ro
- [Các dấu hiệu spam/black-hat/over-optimization nếu phát hiện; nếu không thì ghi "Không phát hiện rủi ro lớn"]

## Khuyến nghị hành động
1. [Cụ thể, có thể thực thi ngay]
2. [...]
3. [3-5 mục tổng cộng]

## Điểm tổng: X/10
[1 dòng giải thích điểm theo thang: 8-10 Xuất sắc, 6-7 Tốt, 4-5 Trung bình, <4 Yếu]

**Quy tắc:**
- Mỗi mục tối đa 5 dòng, viết cô đọng
- Mỗi nhận định phải dẫn số liệu cụ thể từ data
- Không hashtag, không emoji thừa, không lời chúc cuối báo cáo
- Khuyến nghị phải actionable, không nói chung chung kiểu "tiếp tục xây backlink chất lượng"
"""


DEFAULT_DR_HIGH = 70
DEFAULT_DR_MID = 40


def _build_criteria(dr_high: int, dr_mid: int, industry: str | None) -> str:
    industry_note = ""
    if industry:
        industry_note = f"\n## Bối cảnh ngành\n- Website thuộc ngành: **{industry}**. Cân nhắc đặc thù ngành khi đánh giá (vd: e-commerce cần DR cao + anchor branded chiếm ưu thế; media chấp nhận generic anchor nhiều hơn; SaaS thường mix forum/blog tech).\n"
    return f"""# Tiêu chuẩn đánh giá backlink
{industry_note}
## Domain Rating (DR)
- DR >= {dr_high}: Tốt (high-authority)
- DR {dr_mid}-{dr_high - 1}: Trung bình
- DR < {dr_mid}: Yếu

## Anchor Text (tỉ lệ tự nhiên)
- Branded (tên thương hiệu): 40-60%
- Generic ("xem thêm", "click here", "tại đây", ...): 20-30%
- Exact match keyword: < 10% (cao hơn → rủi ro Penguin penalty)
- Naked URL: ~15%

## Domain Diversity
- 1 domain link > 5 lần: cần xem xét (có thể footprint)
- 1 domain link > 10 lần: rủi ro cao (PBN/spam footprint)

## Thang điểm tổng /10
- 8-10: Xuất sắc — DR cao, anchor đa dạng, domain phân tán tốt
- 6-7: Tốt — đa số chỉ số ổn, vài điểm cần cải thiện
- 4-5: Trung bình — có vấn đề rõ rệt
- < 4: Yếu — profile cần overhaul hoặc disavow
"""


def _summarize_preview(preview: dict, *, max_anchors: int = 20,
                        max_domains: int = 20,
                        dr_high: int = 70, dr_mid: int = 40) -> dict:
    """Aggregate detail/summary rows into a compact payload for Claude."""
    detail = preview.get("detail") or []
    summary = preview.get("summary") or []

    all_rows: list[dict] = []
    for group in detail:
        all_rows.extend(group.get("rows") or [])

    high_key = f"high_ge{dr_high}"
    mid_key = f"mid_{dr_mid}_{dr_high - 1}"
    low_key = f"low_lt{dr_mid}"
    dr_buckets = {high_key: 0, mid_key: 0, low_key: 0}
    for r in all_rows:
        try:
            dr = float(r.get("dr") or 0)
        except (TypeError, ValueError):
            dr = 0
        if dr >= dr_high:
            dr_buckets[high_key] += 1
        elif dr >= dr_mid:
            dr_buckets[mid_key] += 1
        else:
            dr_buckets[low_key] += 1

    anchor_counts: Counter[str] = Counter()
    for r in all_rows:
        a = (r.get("anchor") or "").strip()
        if a:
            anchor_counts[a.lower()] += 1

    domain_rows: list[dict] = []
    for s in summary:
        for r in s.get("rows") or []:
            domain_rows.append({
                "domain": r.get("domain"),
                "count": int(r.get("count") or 0),
                "dr_max": r.get("dr_max"),
            })
    domain_rows.sort(key=lambda x: -x["count"])
    heavy_5 = sum(1 for d in domain_rows if d["count"] > 5)
    heavy_10 = sum(1 for d in domain_rows if d["count"] > 10)

    return {
        "dr_distribution": dr_buckets,
        "total_anchor_rows": len(all_rows),
        "unique_anchors": len(anchor_counts),
        "top_anchors": [
            {"anchor": a, "count": c}
            for a, c in anchor_counts.most_common(max_anchors)
        ],
        "total_domains": len(domain_rows),
        "top_domains": domain_rows[:max_domains],
        "domains_linking_over_5_times": heavy_5,
        "domains_linking_over_10_times": heavy_10,
        "target_url_count": len(detail),
    }


def generate_report(
    *,
    stats: dict[str, Any],
    preview: dict[str, Any],
    label: str,
    domain: str | None = None,
    industry: str | None = None,
    dr_high: int = DEFAULT_DR_HIGH,
    dr_mid: int = DEFAULT_DR_MID,
    model: str = "claude-opus-4-7",
) -> dict[str, Any]:
    """Call Claude to produce a markdown analysis report.

    Returns {"report": str, "model": str, "usage": dict}.
    Raises if ANTHROPIC_API_KEY is missing or the API call fails.
    """
    client = anthropic.Anthropic()

    compact = _summarize_preview(preview, dr_high=dr_high, dr_mid=dr_mid)
    payload = {
        "label": label,
        "domain": domain,
        "industry": industry,
        "dr_thresholds": {"high": dr_high, "mid": dr_mid},
        "stats": {
            k: stats.get(k)
            for k in (
                "input_rows", "kept_rows", "target_urls",
                "total_links", "total_domain_rows",
            )
        },
        "aggregates": compact,
    }
    user_msg = (
        "Dưới đây là dữ liệu audit backlink đã được tổng hợp. "
        "Hãy phân tích theo định dạng đã hướng dẫn.\n\n"
        f"```json\n{json.dumps(payload, ensure_ascii=False, indent=2)}\n```"
    )

    response = client.messages.create(
        model=model,
        max_tokens=4000,
        thinking={"type": "adaptive"},
        output_config={"effort": "medium"},
        system=[
            {"type": "text", "text": SYSTEM_PROMPT},
            {"type": "text", "text": _build_criteria(dr_high, dr_mid, industry)},
        ],
        messages=[{"role": "user", "content": user_msg}],
    )

    text = next(
        (b.text for b in response.content if b.type == "text"),
        "",
    )

    usage = response.usage
    return {
        "report": text,
        "model": response.model,
        "usage": {
            "input_tokens": usage.input_tokens,
            "output_tokens": usage.output_tokens,
            "cache_creation_input_tokens": getattr(
                usage, "cache_creation_input_tokens", 0) or 0,
            "cache_read_input_tokens": getattr(
                usage, "cache_read_input_tokens", 0) or 0,
        },
    }


def is_configured() -> bool:
    return bool((os.environ.get("ANTHROPIC_API_KEY") or "").strip())
