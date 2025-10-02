-- Update layered_navigation slot template to use filterOptionStyles without ../../../
UPDATE slots
SET content = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  content,
  '{{../../../filterOptionStyles.optionTextColor}}', '{{filterOptionStyles.optionTextColor}}'
),
  '{{../../../filterOptionStyles.optionHoverColor}}', '{{filterOptionStyles.optionHoverColor}}'
),
  '{{../../../filterOptionStyles.checkboxColor}}', '{{filterOptionStyles.checkboxColor}}'
),
  '{{../../../filterOptionStyles.optionCountColor}}', '{{filterOptionStyles.optionCountColor}}'
),
  '{{../../../filterOptionStyles.activeFilterBgColor}}', '{{filterOptionStyles.activeFilterBgColor}}'
),
  '{{../../../filterOptionStyles.activeFilterTextColor}}', '{{filterOptionStyles.activeFilterTextColor}}'
)
WHERE slot_id = 'layered_navigation'
AND page_type = 'category';
