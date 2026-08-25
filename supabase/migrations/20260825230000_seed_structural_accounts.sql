-- Seed the three structural accounts expected by ledger + quick-add UI.
-- Idempotent: safe if accounts already exist.

insert into public.accounts (
  household_id,
  id,
  name,
  type,
  owner_member_id,
  opening_balance,
  is_active,
  color
)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'tk_thang',
    'TK Thắng',
    'CASH_POOL',
    'thang',
    0,
    true,
    '#2563eb'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'tk_van',
    'TK Vân',
    'CASH_POOL',
    'van',
    0,
    true,
    '#db2777'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'tin_dung',
    'Tín dụng',
    'CREDIT_LIABILITY',
    null,
    0,
    true,
    '#d97706'
  )
on conflict (household_id, id) do update set
  name = excluded.name,
  type = excluded.type,
  owner_member_id = excluded.owner_member_id,
  is_active = excluded.is_active,
  color = excluded.color;
