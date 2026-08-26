begin;

insert into public.goals (
  household_id,
  id,
  title,
  goal_type,
  target_amount,
  saved_amount,
  target_date,
  priority,
  status,
  note
)
select
  household_id,
  'migrated_' || id,
  name,
  case
    when lower(name) like '%khẩn cấp%' then 'EMERGENCY_FUND'
    when lower(name) like '%du lịch%' then 'TRAVEL'
    else 'OTHER'
  end,
  target_amount,
  current_amount,
  due_date,
  'HIGH',
  case
    when status = 'COMPLETED' then 'DONE'
    when status = 'PAUSED' then 'PLANNING'
    when current_amount >= target_amount then 'READY'
    else 'FUNDING'
  end,
  null
from public.funds;

update public.transactions
set goal_id = 'migrated_' || fund_id
where fund_id is not null
  and goal_id is null;

alter table public.transactions drop column fund_id;
drop table public.funds;

commit;
