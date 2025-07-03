
-- Add period_text column for free-form period descriptions
ALTER TABLE diligence_requests ADD COLUMN period_text TEXT;

-- Extract period information from existing descriptions
UPDATE diligence_requests 
SET period_text = CASE 
  WHEN description ILIKE '%last two years%' THEN 'Last 2 Years'
  WHEN description ILIKE '%thirteen months%' THEN '13 Months'
  WHEN description ILIKE '%historical period%' THEN 'Historical Period'
  WHEN description ILIKE '%last % years%' THEN 'Multi-Year Period'
  WHEN description ILIKE '%monthly%' THEN 'Monthly'
  WHEN description ILIKE '%quarterly%' THEN 'Quarterly'
  WHEN description ILIKE '%annual%' OR description ILIKE '%yearly%' THEN 'Annual'
  WHEN description ILIKE '%current year%' THEN 'Current Year'
  WHEN description ILIKE '%prior year%' THEN 'Prior Year'
  WHEN description ILIKE '%fiscal year%' THEN 'Fiscal Year'
  ELSE NULL
END
WHERE period_text IS NULL AND description IS NOT NULL;
