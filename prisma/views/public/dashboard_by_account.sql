SELECT
  organization_id,
  (grouped_donations.total_sum_donations) :: integer AS total_sum_donations,
  (grouped_donations.number_of_donations) :: integer AS number_of_donations,
  (grouped_pledges.total_sum_unfulfilled_pledges) :: integer AS total_sum_unfulfilled_pledges,
  (grouped_pledges.number_of_unfulfilled_pledges) :: integer AS number_of_unfulfilled_pledges,
  COALESCE(calls.total_number_of_calls, (0) :: bigint) AS total_number_of_calls
FROM
  (
    (
      (
        SELECT
          sum(donations.amount) AS total_sum_donations,
          count(*) AS number_of_donations,
          donations.organization_id
        FROM
          donations
        GROUP BY
          donations.organization_id
      ) grouped_donations FULL
      JOIN (
        SELECT
          sum(pledges.amount) AS total_sum_unfulfilled_pledges,
          count(*) AS number_of_unfulfilled_pledges,
          pledges.organization_id
        FROM
          pledges
        GROUP BY
          pledges.organization_id
      ) grouped_pledges USING (organization_id)
    ) FULL
    JOIN (
      SELECT
        count(*) AS total_number_of_calls,
        interactions.organization_id
      FROM
        interactions
      WHERE
        (interactions.contact_type = 'call' :: text)
      GROUP BY
        interactions.organization_id
    ) calls USING (organization_id)
  );