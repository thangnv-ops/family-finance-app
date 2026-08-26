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
