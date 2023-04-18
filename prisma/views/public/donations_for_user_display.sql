SELECT
  donations.id,
  donations.date,
  donations.donor_first_name AS first_name,
  donations.donor_last_name AS last_name,
  donations.amount,
  donations.organization_id
FROM
  donations;