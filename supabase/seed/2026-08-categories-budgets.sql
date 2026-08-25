-- Categories + budgets + income plans for Aug 2026
-- Household: Gia đình Thắng & Vân
-- Applied to remote project ysxhprvlxflhmeaiujfp

with hh as (
  select '11111111-1111-1111-1111-111111111111'::uuid as id
),
cats(id, name, kind, icon, color, daily_spend, owner_scope) as (
  values
    ('cat_tien_gui_xe', 'Tiền gửi xe', 'EXPENSE', 'Car', '#6366f1', false, 'ALL'),
    ('cat_bim_sua', 'Bỉm sữa', 'EXPENSE', 'Baby', '#06b6d4', true, 'ALL'),
    ('cat_bao_hiem', 'Bảo hiểm', 'EXPENSE', 'ShieldCheck', '#14b8a6', false, 'ALL'),
    ('cat_xang', 'Xăng', 'EXPENSE', 'Car', '#6366f1', true, 'ALL'),
    ('cat_giup_viec', 'Tiền giúp việc', 'EXPENSE', 'HandCoins', '#8b5cf6', false, 'ALL'),
    ('cat_dien_mang', 'Điện + Mạng', 'EXPENSE', 'Zap', '#eab308', false, 'ALL'),
    ('cat_mua_ai', 'Mua AI', 'EXPENSE', 'Sparkles', '#a855f7', false, 'ALL'),
    ('cat_tien_nha', 'Tiền nhà', 'EXPENSE', 'Home', '#0ea5e9', false, 'ALL'),
    ('cat_tra_tin_dung', 'Trả tín dụng', 'EXPENSE', 'CreditCard', '#d97706', false, 'ALL'),
    ('cat_ve_que', 'Về Quê', 'EXPENSE', 'MapPin', '#78716c', false, 'ALL'),
    ('cat_linh_tinh', 'Linh Tinh', 'EXPENSE', 'MoreHorizontal', '#94a3b8', true, 'ALL'),
    ('cat_tieu_vat_van', 'Tiêu vặt Vân', 'EXPENSE', 'Heart', '#ec4899', true, 'VAN'),
    ('cat_tieu_vat_thang', 'Tiêu vặt Thắng', 'EXPENSE', 'User', '#3b82f6', true, 'THANG'),
    ('cat_hoc_tap', 'Học tập', 'EXPENSE', 'BookOpen', '#84cc16', false, 'ALL'),
    ('cat_luong_thang', 'Lương của Thắng', 'INCOME', 'Briefcase', '#2563eb', false, 'THANG'),
    ('cat_luong_van', 'Lương của Vân', 'INCOME', 'Award', '#db2777', false, 'VAN'),
    ('cat_thuong', 'Thưởng', 'INCOME', 'Gift', '#16a34a', false, 'ALL'),
    ('cat_thu_nhap_khac', 'Thu nhập khác', 'INCOME', 'Coins', '#ca8a04', false, 'ALL')
)
insert into public.categories (household_id, id, month, name, kind, icon, color, daily_spend, owner_scope, is_active)
select hh.id, c.id, '2026-08', c.name, c.kind, c.icon, c.color, c.daily_spend, c.owner_scope, true
from hh cross join cats c
on conflict (household_id, month, id) do update set
  name = excluded.name,
  kind = excluded.kind,
  icon = excluded.icon,
  color = excluded.color,
  daily_spend = excluded.daily_spend,
  owner_scope = excluded.owner_scope,
  is_active = true;

with hh as (select '11111111-1111-1111-1111-111111111111'::uuid as id),
bud(id, category_id, budget_type, planned_amount, member_id) as (
  values
    ('b_tien_gui_xe', 'cat_tien_gui_xe', 'EXPENSE_LIMIT', 1300000::numeric, null::text),
    ('b_bim_sua', 'cat_bim_sua', 'EXPENSE_LIMIT', 5000000, null),
    ('b_bao_hiem', 'cat_bao_hiem', 'EXPENSE_LIMIT', 0, null),
    ('b_xang', 'cat_xang', 'EXPENSE_LIMIT', 2000000, null),
    ('b_giup_viec', 'cat_giup_viec', 'EXPENSE_LIMIT', 9000000, null),
    ('b_dien_mang', 'cat_dien_mang', 'EXPENSE_LIMIT', 3000000, null),
    ('b_mua_ai', 'cat_mua_ai', 'EXPENSE_LIMIT', 1000000, null),
    ('b_tien_nha', 'cat_tien_nha', 'EXPENSE_LIMIT', 11000000, null),
    ('b_tra_tin_dung', 'cat_tra_tin_dung', 'EXPENSE_LIMIT', 14000000, null),
    ('b_ve_que', 'cat_ve_que', 'EXPENSE_LIMIT', 7000000, null),
    ('b_linh_tinh', 'cat_linh_tinh', 'EXPENSE_LIMIT', 6000000, null),
    ('b_tieu_vat_van', 'cat_tieu_vat_van', 'EXPENSE_LIMIT', 2000000, 'van'),
    ('b_tieu_vat_thang', 'cat_tieu_vat_thang', 'EXPENSE_LIMIT', 2000000, 'thang'),
    ('b_hoc_tap', 'cat_hoc_tap', 'EXPENSE_LIMIT', 0, null),
    ('b_luong_thang', 'cat_luong_thang', 'INCOME_TARGET', 43000000, 'thang'),
    ('b_luong_van', 'cat_luong_van', 'INCOME_TARGET', 16578250, 'van'),
    ('b_thuong', 'cat_thuong', 'INCOME_TARGET', 0, null),
    ('b_thu_nhap_khac', 'cat_thu_nhap_khac', 'INCOME_TARGET', 9000000, null)
)
insert into public.budgets (household_id, id, month, category_id, member_id, budget_type, planned_amount)
select hh.id, b.id, '2026-08', b.category_id, b.member_id, b.budget_type, b.planned_amount
from hh cross join bud b
on conflict (household_id, id) do update set
  month = excluded.month,
  category_id = excluded.category_id,
  member_id = excluded.member_id,
  budget_type = excluded.budget_type,
  planned_amount = excluded.planned_amount;

insert into public.income_plans (household_id, id, month, source_name, member_id, expected_amount)
values
  ('11111111-1111-1111-1111-111111111111', 'ip_luong_thang', '2026-08', 'Lương của Thắng', 'thang', 43000000),
  ('11111111-1111-1111-1111-111111111111', 'ip_luong_van', '2026-08', 'Lương của Vân', 'van', 16578250),
  ('11111111-1111-1111-1111-111111111111', 'ip_thu_nhap_khac', '2026-08', 'Thu nhập khác', 'thang', 9000000)
on conflict (household_id, id) do update set
  month = excluded.month,
  source_name = excluded.source_name,
  member_id = excluded.member_id,
  expected_amount = excluded.expected_amount;
