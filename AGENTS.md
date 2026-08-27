# Quy tắc làm việc trong repo

Các quy tắc này áp dụng cho toàn bộ repository.

## Skills và quy trình

- Trước mọi phản hồi hoặc hành động, kiểm tra các skill hiện có. Nếu một skill có khả năng liên quan, phải đọc và làm theo skill đó trước.
- Khi nhiều skill cùng áp dụng, dùng skill quy trình trước, rồi mới đến skill chuyên môn hoặc triển khai.
- Chỉ tạo abstraction, dependency, file hoặc cấu hình khi yêu cầu hiện tại thực sự cần chúng.

## Supabase

- Dùng skill `supabase:supabase` cho mọi công việc liên quan Supabase: Database, Auth, RLS, Storage, Edge Functions, Realtime, CLI, MCP và client library.
- Trước khi triển khai, kiểm tra changelog và tài liệu Supabase hiện hành; không đoán API, cấu hình hoặc lệnh CLI. Dùng `--help` để khám phá lệnh CLI.
- Mọi bảng trong schema được Data API expose phải bật RLS và có policy đúng mô hình truy cập. `TO authenticated` không thay thế kiểm tra quyền sở hữu dữ liệu.
- Không dùng `user_metadata` để phân quyền, không đưa `service_role`/secret key vào client và không thêm `SECURITY DEFINER` chỉ để né lỗi quyền.
- Policy `UPDATE` phải có cả `USING` và `WITH CHECK`, đồng thời phải có policy `SELECT` phù hợp.
- Tạo migration mới bằng `supabase migration new <name>`; không tự đặt timestamp hoặc tên file migration.
- Sau thay đổi, chạy kiểm tra phù hợp, advisors khi có thể và xác nhận migration/query thực sự hoạt động. Không coi thay đổi chưa xác minh là hoàn tất.

## GitNexus

- Luôn chạy `npx gitnexus analyze` từ thư mục gốc trước khi khám phá hoặc chỉnh sửa code, kể cả khi index hiện có chưa báo stale.
- Sau khi analyze, phải dùng GitNexus `query` để tìm execution flow liên quan trước khi dùng `context`, `impact` hoặc đọc/sửa các symbol cụ thể.
- Trước khi phân tích codebase lớn, chạy `node .gitnexus/run.cjs status` để kiểm tra index.
- Nếu chưa có index, runner bị thiếu hoặc index stale sau thay đổi lớn, chạy `node .gitnexus/run.cjs analyze`. Chỉ dùng `--force`, `--embeddings` hoặc `--pdg` khi tác vụ thật sự cần.
- Nếu `.gitnexus/run.cjs` chưa tồn tại, khởi tạo bằng `npx gitnexus analyze` từ thư mục gốc repo.
- Không chạy `clean`, `clean --force` hoặc `clean --all` nếu người dùng chưa yêu cầu rõ ràng hoặc index chưa được xác định là hỏng.
- Sau khi index, dùng skill GitNexus phù hợp để khám phá, debug, đánh giá ảnh hưởng hoặc refactor; không dùng CLI thay cho việc đọc luồng code liên quan.

## Ponytail

- Mặc định áp dụng `ponytail:ponytail` mức `full` cho mọi tác vụ code.
- Sau khi hiểu đầy đủ luồng bị tác động, chọn giải pháp đầu tiên đáp ứng yêu cầu theo thứ tự: không cần làm, tái sử dụng code có sẵn, standard library, tính năng native, dependency đã cài, rồi mới viết code tối thiểu.
- Ưu tiên xóa hơn thêm, code rõ ràng hơn code khéo léo, ít file và diff nhỏ nhất có thể. Không tạo abstraction hoặc scaffolding cho nhu cầu giả định trong tương lai.
- Sửa bug tại nguyên nhân gốc và kiểm tra tất cả caller liên quan; không vá riêng triệu chứng nếu có điểm sửa dùng chung.
- Không đơn giản hóa mất validation ở trust boundary, bảo mật, phòng mất dữ liệu, accessibility hoặc yêu cầu được nêu rõ.
- Logic không tầm thường, đặc biệt đường đi của tiền và bảo mật, phải có ít nhất một kiểm tra chạy được ở mức nhỏ nhất phù hợp.
- Nếu cố ý chọn giải pháp có giới hạn thực tế, thêm comment `ponytail:` nêu rõ giới hạn và điều kiện nâng cấp.

## Hoàn tất công việc

- Chạy các kiểm tra phù hợp với phạm vi thay đổi, tối thiểu gồm `npm run lint`, `npm test` hoặc `npm run build` khi code liên quan bị sửa.
- Báo rõ kiểm tra nào đã chạy và kết quả. Không tuyên bố hoàn tất, đã sửa hoặc đã pass nếu chưa có bằng chứng mới từ lệnh kiểm tra.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **family-finance-app** (466 symbols, 892 relationships, 27 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "feat/supabase-vercel"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({search_query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/family-finance-app/context` | Codebase overview, check index freshness |
| `gitnexus://repo/family-finance-app/clusters` | All functional areas |
| `gitnexus://repo/family-finance-app/processes` | All execution flows |
| `gitnexus://repo/family-finance-app/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
