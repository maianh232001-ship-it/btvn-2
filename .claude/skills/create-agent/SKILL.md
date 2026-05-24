---
name: create-agent
description: Tạo sub-agent Claude Code mới trong .claude/agents/. Dùng khi user muốn tạo agent chuyên gia (SEO, content, web builder...), thêm đồng nghiệp ảo, delegate task lớn cho agent có context riêng.
---

# Create Agent

Tạo file sub-agent `.md` trong `.claude/agents/` để agent chính delegate task.

## Khái niệm

Sub-agent = đồng nghiệp ảo có **context riêng** (không thừa hưởng từ agent chính).
Dùng để:
- Chạy song song nhiều task độc lập
- Giảm token, giảm noise trong context
- Tăng chất lượng output (góc nhìn fresh)

## Input cần hỏi user

1. **name** — tên kebab-case (vd `seo-research`, `content-writer`)
2. **role** — agent này là chuyên gia gì
3. **description** — khi nào agent chính nên gọi (càng cụ thể càng tốt, vì đây là tín hiệu dispatch)
4. **tools** — danh sách tool được phép dùng (vd `Read, Grep, WebFetch`). Mặc định giới hạn, không cho full quyền.
5. **model** — `sonnet` / `opus` / `haiku` / `inherit`. Mặc định `sonnet`.
6. **scope** — project (`./.claude/agents/`) hay user toàn cục (`~/.claude/agents/`). Mặc định project.

## Bước thực hiện

1. Hỏi user các thông số ở trên (nếu thiếu)
2. Tạo file `.claude/agents/[name].md` theo template dưới
3. Báo lại đường dẫn file đã tạo, gợi ý test bằng câu lệnh `"Dùng agent [name] để ..."`

## Template

```markdown
---
name: [name]
description: [Khi nào agent chính nên gọi sub-agent này — viết cụ thể, đề cập trigger keywords]
tools: [Tool1, Tool2, ...]
model: [sonnet|opus|haiku|inherit]
---

# [Tên hiển thị]

Bạn là [role]. [Background ngắn — vd: 10 năm kinh nghiệm SEO].

## Khi được gọi

[Liệt kê các task agent này xử lý]

## Quy trình

1. Đọc yêu cầu cụ thể từ agent chính
2. [Bước phân tích / thu thập data]
3. [Bước xử lý theo framework / tiêu chuẩn]
4. Trả về output theo format dưới

## Output format

[Khung output: heading, bullet, table, độ dài tối đa]

## Cấm

- Không cài tool mới
- Không sửa file ngoài folder [output/]
- Không trả về quá [N] từ
```

## Lưu ý

- **description quan trọng nhất** — agent chính đọc field này để quyết định dispatch. Viết theo mẫu: "Chuyên ... Dùng khi user cần ... [keywords trigger]".
- **Giới hạn tools** — chỉ cấp tool thật sự cần. Vd agent research: `Read, Grep, WebFetch, WebSearch` (không cần `Edit`, `Write`, `Bash`).
- **Có thể gọi SKILL** — trong agent body, hướng dẫn dùng SKILL có sẵn (vd `parse-backlink-excel`) thay vì code lại.
- **Project vs user scope**:
  - Project (`./.claude/agents/`) — chỉ dùng trong repo này, commit cùng project.
  - User (`~/.claude/agents/`) — toàn cục, mọi project đều dùng được.

## Ví dụ

User: "Tạo agent chuyên phân tích backlink đối thủ"

→ Tạo `.claude/agents/competitor-backlink-analyst.md`:

```markdown
---
name: competitor-backlink-analyst
description: Chuyên phân tích backlink đối thủ. Dùng khi user cần benchmark backlink, so sánh DR profile, gap analysis domain, đề xuất outreach list.
tools: Read, Grep, Bash
model: sonnet
---

# Competitor Backlink Analyst

Bạn là chuyên gia SEO link building, chuyên benchmark đối thủ.

## Khi được gọi

- So sánh backlink mình vs đối thủ
- Gap analysis domain
- Đề xuất outreach list ưu tiên

## Quy trình

1. Gọi SKILL `parse-backlink-excel` để parse 2 file
2. Gọi SKILL `compare-two-urls` để so sánh
3. Tổng hợp insight + recommendation

## Output

- Bảng stats side-by-side
- Số link DR>=70 cần thêm
- Top 10 domain ưu tiên outreach
- Max 500 từ
```
