CREATE OR replace FUNCTION search_notes (query TEXT) returns setof RECORD LANGUAGE SQL
AS
  $$
  SELECT    interactions.*,
            people.first_name,
            people.last_name,
            people.id AS person_id
  FROM      interactions
  left join people
  ON        interactions.person_id=people.id
  WHERE     interactions.organization_id = requesting_org_id()
  AND       (
                      lower(query) <-> lower(note)) <0.8
  ORDER BY  lower(query) <-> lower(note) limit 100;
  
  $$;