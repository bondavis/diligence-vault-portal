-- Phase 1: Data Cleanup and Phase 2: Duplicate Prevention

-- Step 1: Clean up duplicate requests (keep the most recent for each title per deal)
WITH duplicate_requests AS (
  SELECT 
    id,
    deal_id,
    title,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY deal_id, title ORDER BY created_at DESC) as rn
  FROM diligence_requests
),
requests_to_delete AS (
  SELECT id FROM duplicate_requests WHERE rn > 1
)
DELETE FROM diligence_requests 
WHERE id IN (SELECT id FROM requests_to_delete);

-- Step 2: Backfill template application records for deals that have template requests but no application record
INSERT INTO deal_template_applications (deal_id, applied_by, applied_at, notes)
SELECT DISTINCT 
  dr.deal_id,
  dr.created_by,
  MIN(dr.created_at) as applied_at,
  'Backfilled from existing template requests'
FROM diligence_requests dr
LEFT JOIN deal_template_applications dta ON dr.deal_id = dta.deal_id
INNER JOIN request_templates rt ON dr.title = rt.title
WHERE dta.id IS NULL
GROUP BY dr.deal_id, dr.created_by;

-- Step 3: Add unique constraint to prevent future duplicates
ALTER TABLE diligence_requests 
ADD CONSTRAINT unique_request_title_per_deal 
UNIQUE (deal_id, title);

-- Step 4: Create index for better performance on template checks
CREATE INDEX IF NOT EXISTS idx_diligence_requests_deal_title 
ON diligence_requests(deal_id, title);

-- Step 5: Create index for template application lookups
CREATE INDEX IF NOT EXISTS idx_deal_template_applications_deal_id 
ON deal_template_applications(deal_id);