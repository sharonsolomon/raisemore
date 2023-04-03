create or replace function
  columns (tblname TEXT) returns setof text as $$
SELECT
  column_name
FROM
  information_schema.columns
WHERE
  table_schema = 'public'
  AND table_name = tblname;
$$ language sql;