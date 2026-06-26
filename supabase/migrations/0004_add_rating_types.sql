-- Add support for multiple rating types: 3-facet, single 1-10, 5-star, and out-of-100

-- Add new columns to dish_logs
alter table public.dish_logs
add column rating_type text default '3facet' check (rating_type in ('3facet', 'single_10', 'stars_5', '100')),
add column rating_value numeric(5,1);

-- Replace the rating_overall generated column with logic that handles all rating types
alter table public.dish_logs
drop column rating_overall;

alter table public.dish_logs
add column rating_overall numeric(3,1) generated always as (
  case
    when rating_type = '3facet' then
      -- Original logic: mean of non-null facets
      round(
        ( coalesce(rating_taste,0) + coalesce(rating_ambience,0)
        + coalesce(rating_service,0) )::numeric
        / nullif(
            (case when rating_taste    is not null then 1 else 0 end)
          + (case when rating_ambience is not null then 1 else 0 end)
          + (case when rating_service  is not null then 1 else 0 end), 0)
      , 1)
    when rating_type = 'single_10' then
      -- Single 1-10 rating stored as-is
      rating_value
    when rating_type = 'stars_5' then
      -- 5-star (1.0-5.0) normalized to 0-10: (value - 1) * 2
      round(((rating_value - 1) * 2)::numeric, 1)
    when rating_type = '100' then
      -- Out of 100 normalized to 0-10: value / 10
      round((rating_value / 10)::numeric, 1)
    else null
  end
) stored;
