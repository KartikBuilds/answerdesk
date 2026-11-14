\set QUIET on
create or replace function pg_temp.check(name text, ok boolean) returns void language plpgsql as $$
begin raise notice '% %', case when ok then 'PASS' else 'FAIL' end, name; end $$;

insert into public.ad_chunks values
  ('a#0', 'refunds', 'Refunds', 'Refund a card payment', 'refund text', array_fill(0.0, array[383]) || array[1.0]::real[]),
  ('b#0', 'plans', 'Plans', 'Pro plan', 'pro text', array[1.0]::real[] || array_fill(0.0, array[383]));

set role anon;
do $$ begin perform 1 from public.ad_chunks; perform pg_temp.check('1 visitors cannot read the table directly', false);
exception when insufficient_privilege then perform pg_temp.check('1 visitors cannot read the table directly', true); end $$;

select pg_temp.check('2 search returns the closest section first',
  (select slug from public.ad_match((array_fill(0.0, array[383]) || array[1.0]::real[])::extensions.vector, 2) limit 1) = 'refunds');

select pg_temp.check('3 search caps results at 10', (select count(*) from public.ad_match((array[1.0]::real[] || array_fill(0.0, array[383]))::extensions.vector, 500)) <= 10);

do $$ begin insert into public.ad_usage values (current_date, 'x', -100); perform pg_temp.check('4 visitors cannot reset their own usage', false);
exception when insufficient_privilege then perform pg_temp.check('4 visitors cannot reset their own usage', true); end $$;

select pg_temp.check('5 a visitor is stopped after 15 questions a day',
  (select array_agg(public.ad_take_quota(repeat('a', 64))) from generate_series(1, 16)) = array_fill(true, array[15]) || array[false]);

select pg_temp.check('6 a caller cannot raise their own limit',
  public.ad_take_quota(repeat('a', 64), 1000, 100000) = false);

select pg_temp.check('7 the site-wide cap stops everyone',
  (select bool_and(public.ad_take_quota(lpad(to_hex(i), 64, 'b'))) from generate_series(1, 285) i)
  and public.ad_take_quota(repeat('c', 64)) = false);

do $$ begin perform public.ad_take_quota('1.2.3.4'); perform pg_temp.check('8 raw IP addresses are refused', false);
exception when others then perform pg_temp.check('8 raw IP addresses are refused', sqlerrm = 'invalid visitor id'); end $$;
reset role;
