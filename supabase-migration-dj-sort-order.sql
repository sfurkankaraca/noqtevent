-- Sanatçı gösterim sıralaması
-- dj_profiles tablosuna sort_order kolonu ekler ve mevcut kayıtları
-- oluşturulma tarihine göre sıralayarak doldurur.
-- Yeni kayıtlar 1000000 default'u ile listenin sonuna düşer.

alter table dj_profiles
  add column if not exists sort_order integer not null default 1000000;

with ranked as (
  select id, row_number() over (order by created_at asc) - 1 as rn
  from dj_profiles
)
update dj_profiles d
set sort_order = ranked.rn
from ranked
where d.id = ranked.id;

create index if not exists dj_profiles_sort_order_idx
  on dj_profiles (sort_order);
