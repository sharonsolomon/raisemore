SELECT
  donations.person_id,
  sum(donations.amount) AS total_donated,
  count(*) AS number_of_donations,
  max(donations.date) AS most_recent_donation,
  donations.organization_id
FROM
  donations
GROUP BY
  donations.person_id,
  donations.organization_id;