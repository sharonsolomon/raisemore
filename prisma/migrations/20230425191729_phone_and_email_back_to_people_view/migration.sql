DROP VIEW
  people_for_user_display;

CREATE OR REPLACE VIEW
  people_for_user_display
with
  (security_invoker = true) AS (
    WITH
      -- alltime_individual_contributions_rollup as (
      --   select
      --     name,
      --     zip_code,
      --     string_agg(distinct cmte_nm, ', ') as fec_committees,
      --     sum(transaction_amt) as fec_total_donated,
      --     max(transaction_amt) as fec_largest_donation,
      --     count(*) as fec_number_of_donations,
      --     max(transaction_dt) as fec_most_recent_donation
      --   from
      --     alltime_individual_contributions
      --     group by name, zip_code
      -- ),
      pledges_rollup_by_person as (
        select
          sum(amount) as pledges_unfulfilled,
          person_id
        from
          pledges
        where
          fufilled IS NOT true
        group by
          person_id
      ),
      donations_rollup_by_person as (
        select
          person_id,
          sum(amount) as total_donated,
          max(amount) as largest_donation,
          count(*) as number_of_donations,
          max(date) as most_recent_donation
        from
          donations
        group by
          person_id
      ),
      tag_rollup_by_person as (
        select
          string_agg(tags.tag, ', ') as tags,
          person_id
        from
          tags
        group by
          tags.person_id
      ),
      top_phone_number as (
        SELECT DISTINCT
          ON (person_id) phone_number,
          person_id
        FROM
          phone_numbers
        ORDER BY
          person_id,
          primary_for DESC,
          created_at DESC
      ),
      top_email as (
        SELECT DISTINCT
          ON (person_id) email,
          person_id
        FROM
          emails
        ORDER BY
          person_id,
          primary_for DESC,
          created_at DESC
      )
    select
      people.first_name,
      people.last_name,
      top_phone_number.phone_number,
      top_email.email,
      people.addr1,
      -- people.addr2,
      people.city,
      people.state,
      people.zip,
      -- people.country,
      people.occupation,
      people.employer,
      -- ,
      -- people.email,
      -- people.phone,
      largest_donation,
      total_donated,
      number_of_donations,
      most_recent_donation,
      tags,
      pledges_unfulfilled,
      people.id
      -- -- 
      -- ,fec_committees,
      --     fec_total_donated,
      --     fec_largest_donation,
      --     fec_number_of_donations,
      --     fec_most_recent_donation
      -- 
    from
      people
      left join tag_rollup_by_person on people.id = tag_rollup_by_person.person_id
      left join pledges_rollup_by_person on people.id = pledges_rollup_by_person.person_id
      left join donations_rollup_by_person on people.id = donations_rollup_by_person.person_id
      left join top_phone_number on people.id = top_phone_number.person_id
      left join top_email on people.id = top_email.person_id
      -- left join alltime_individual_contributions_rollup fec on 
      -- fec.name = upper(people.last_name||', '||people.first_name)
      -- and left(fec.zip_code,5)=people.zip
      -- left join indiv20b on indiv20b.concatenated_zip_and_name = LOWER(
      --   CONCAT(
      --     COALESCE(
      --       CONCAT(people.first_name, '+', people.last_name),
      --       'NO_NAME_PROVIDED'
      --     ),
      --     '+',
      --     LPAD(
      --       LEFT(
      --         CAST(COALESCE(people.zip, '00000') AS VARCHAR),
      --         5
      --       ),
      --       5,
      --       '0'
      --     )
      --   )
      -- )
  );