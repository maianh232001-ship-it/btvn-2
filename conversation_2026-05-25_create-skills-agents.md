# Conversation log — BTVN backlink audit project

**Date:** 2026-05-25
**Project:** `/Users/maianh/BTVN` — website audit backlink
**Topic:** Tạo skill `compare-two-urls`, skill `create-agent`, và 2 sub-agent (`data-processor`, `backlink-analyzer`)

---

## 1. Bối cảnh ban đầu

User đang xây website audit backlink. Project tại folder `BTVN`. Đã có 3 skill trong `.claude/skills/`:

- `parse-backlink-excel` — đọc file `.xlsx`, chuẩn hóa thành JSON
- `filter-backlink-by-url` — lọc theo URL, tính thống kê DR
- `backlink-report-generator` — gọi Claude API tạo báo cáo

---

## 2. Tạo skill `compare-two-urls`

### Yêu cầu user

Tạo skill `compare-two-urls` với logic:

- Input: URL mình + URL đối thủ + 2 file xlsx backlink
- Lọc Target URL theo keyword riêng từng site
- Loại spam (cột `Is spam = true`)
- So sánh: số lượng, domain unique, DR TB, phân bố DR
- Đề xuất: cần thêm bao nhiêu link DR>=70, domain nào ưu tiên
- Công thức:
  ```
  needed = (dr_tb_đối_thủ × total_mình − tổng_dr_mình) / (70 − dr_tb_đối_thủ)
  ```

### Kết quả

Tạo file `.claude/skills/compare-two-urls/SKILL.md` theo pattern các skill hiện có (frontmatter Vietnamese ngắn gọn, các bước rõ ràng).

Nội dung chính:

- Pipeline: parse → lọc theo keyword Target URL → loại `Is spam = true` → tính stats
- Công thức `needed`, kèm guard cho mẫu số ≤ 0 (đối thủ DR TB ≥ 70)
- Đề xuất top 10 domain đối thủ có mà mình chưa có, sort theo DR
- Output `output/so-sanh-[my]-vs-[competitor]-[date].md`

---

## 3. Tạo skill `create-agent`

### Yêu cầu user

> đọc file này và tạo skill create-agent
> https://github.com/hdviettt/seongon-claude-code-training

### Quá trình thực hiện

Đã đọc README và folder `knowledge/04-agents-memory-hooks/sub-agents/README.md` của repo training SEONGON. Tài liệu này giải thích:

- **Sub-agent** = đồng nghiệp ảo của Claude Code, có context riêng (không thừa hưởng từ agent chính).
- Lợi ích: chạy song song, giảm token, chất lượng cao hơn (góc nhìn fresh).
- Vị trí: `.claude/agents/` (project scope) hoặc `~/.claude/agents/` (user toàn cục).
- Mỗi sub-agent là 1 file `.md` với frontmatter (`name`, `description`, `tools`, `model`) và body (role, khi được gọi, quy trình, output format, cấm).

### Kết quả

Tạo file `.claude/skills/create-agent/SKILL.md` gồm:

- 6 input cần hỏi user: `name`, `role`, `description`, `tools`, `model`, `scope`
- Template frontmatter chuẩn + body
- Best practices: `description` chi tiết để dispatch đúng, giới hạn tools, có thể gọi SKILL từ trong agent
- Ví dụ tạo `competitor-backlink-analyst` gắn với các skill backlink hiện có

---

## 4. Dùng `/create-agent` tạo 2 sub-agent

### Yêu cầu user

Tạo 2 agent:

**Agent 1 — `data-processor`** (xử lý file backlink xlsx):
- Skill `parse-backlink-excel`
- Skill `filter-backlink-by-url`

**Agent 2 — `backlink-analyzer`** (phân tích + báo cáo):
- Skill `backlink-report-generator`
- Skill `compare-two-urls`

Model: Sonnet 4.6.

### Kết quả

#### `.claude/agents/data-processor.md`

- Tools: `Read, Bash, Grep, Glob`
- Quy trình: nhận yêu cầu → gọi `parse-backlink-excel` → nếu cần lọc gọi tiếp `filter-backlink-by-url` → trả về output ngắn
- Output format: bảng path + stats (tổng row, cột chuẩn hóa, thống kê DR, domain)
- Cấm: không phân tích sâu (đó là việc của `backlink-analyzer`), không gọi Claude API, không sửa file ngoài `output/`

#### `.claude/agents/backlink-analyzer.md`

- Tools: `Read, Write, Bash, Grep, Glob`
- 2 flow:
  1. **Phân tích 1 site** — gọi `backlink-report-generator` (Claude API, sinh báo cáo .md)
  2. **So sánh 2 site** — gọi `compare-two-urls` (tính `needed`, gap analysis)
- Output: tóm tắt, insight, số liệu, khuyến nghị, đường dẫn file báo cáo, max 600 từ
- Cấm: không tự parse Excel (delegate cho `data-processor`), không bịa số liệu

---

## 5. Workflow vừa giao việc agent vừa làm việc khác

### User hỏi

> Workflow của tôi sẽ kiểu:
> - Giao việc cho agent: "Hãy giúp tôi audit file backlink này và tạo báo cáo so sánh với đối thủ"
> - Trong lúc agent đang chạy, tôi muốn có thể làm việc khác

### Giải thích

Claude Code hỗ trợ chạy sub-agent ở **background** qua tham số `run_in_background: true` trên `Agent` tool.

Khi user gõ task lớn, main agent có thể:

1. Dispatch sang `data-processor` (parse + filter) — background
2. Khi xong, dispatch tiếp `backlink-analyzer` (compare + report) — background
3. Trả về khi báo cáo hoàn thành

Trong lúc đó, user gõ tiếp việc khác trong conversation — main agent vẫn trả lời mà không phải đợi. Khi agent background xong, main agent tự được notify và báo kết quả về.

**Giới hạn:**
- Background ≠ song song với conversation thật — gõ câu mới thì main agent ưu tiên câu đó.
- Không xem được progress giữa chừng trừ khi dùng `TaskList`/`TaskOutput`.
- Agent background fail sẽ tự báo về.

Hai option đưa ra cho user:

1. **Giữ như hiện tại** — mỗi lần dùng thêm chữ "chạy background".
2. **Tạo orchestrator agent** gói 2 agent lại — mỗi lần chỉ gọi 1 agent, nó tự chia việc background.

### User chọn

> giữ như hiện tại

Cách dùng hàng ngày:

> "Dùng agent backlink-analyzer audit file-toi.xlsx so với file-doi-thu.xlsx, **chạy background**. Trong lúc đó tôi hỏi việc khác."

Mẹo:
- Check tiến độ: gõ `"check status agent đang chạy"`.
- Agent fail tự báo về, không cần lo mất.

---

## Tổng kết tạo mới

| Loại | Tên | Đường dẫn |
|---|---|---|
| Skill | `compare-two-urls` | `.claude/skills/compare-two-urls/SKILL.md` |
| Skill | `create-agent` | `.claude/skills/create-agent/SKILL.md` |
| Sub-agent | `data-processor` | `.claude/agents/data-processor.md` |
| Sub-agent | `backlink-analyzer` | `.claude/agents/backlink-analyzer.md` |

Pattern thiết kế:
- 2 skill mới (`compare-two-urls`, `create-agent`) đi cùng pattern 3 skill cũ — Vietnamese, frontmatter ngắn, các bước cụ thể.
- 2 agent gói các skill thành "vai trò": `data-processor` lo ETL/filter, `backlink-analyzer` lo phân tích/báo cáo — tách biệt context, có thể chạy song song.
