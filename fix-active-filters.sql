-- Fix active_filters slot to restore component field
UPDATE slots 
SET configuration = jsonb_set(
  configuration, 
  '{component}', 
  '"ActiveFilters"'
)
WHERE slot_id = 'active_filters' 
  AND slot_type = 'category_layout'
  AND (configuration->>'type' = 'component')
  AND (configuration->>'component' IS NULL OR configuration->>'component' = '');

-- Verify the update
SELECT slot_id, configuration->>'type' as type, configuration->>'component' as component 
FROM slots 
WHERE slot_id = 'active_filters' AND slot_type = 'category_layout';
