WITH pledges_rollup_by_person AS (
  SELECT
    sum(pledges.amount) AS pledges_unfulfilled,
    pledges.person_id
  FROM
    pledges
  WHERE
    (pledges.fufilled IS NOT TRUE)
  GROUP BY
    pledges.person_id
),
donations_rollup_by_person AS (
  SELECT
    donations.person_id,
    sum(donations.amount) AS total_donated,
    max(donations.amount) AS largest_donation,
    count(*) AS number_of_donations,
    max(donations.date) AS most_recent_donation
  FROM
    donations
  GROUP BY
    donations.person_id
),
tag_rollup_by_person AS (
  SELECT
    string_agg(tags.tag, ', ' :: text) AS tags,
    tags.person_id
  FROM
    tags
  GROUP BY
    tags.person_id
)
SELECT
  people.first_name,
  people.last_name,
  people.addr1,
  people.city,
  people.state,
  people.zip,
  people.occupation,
  people.employer,
  donations_rollup_by_person.largest_donation,
  donations_rollup_by_person.total_donated,
  donations_rollup_by_person.number_of_donations,
  donations_rollup_by_person.most_recent_donation,
  tag_rollup_by_person.tags,
  pledges_rollup_by_person.pledges_unfulfilled,
  people.id
FROM
  (
    (
      (
        people
        LEFT JOIN tag_rollup_by_person ON ((people.id = tag_rollup_by_person.person_id))
      )
      LEFT JOIN pledges_rollup_by_person ON ((people.id = pledges_rollup_by_person.person_id))
    )
    LEFT JOIN donations_rollup_by_person ON (
      (people.id = donations_rollup_by_person.person_id)
    )
  );