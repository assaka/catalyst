-- Clean up corrupted CMS block placement data
-- This script will fix over-serialized JSON strings in the placement field

-- First, let's see the current problematic data
SELECT id, title, placement, 
       jsonb_typeof(placement) as placement_type,
       jsonb_array_length(placement) as array_length
FROM cms_blocks 
WHERE placement::text LIKE '%[\\%' 
   OR placement::text LIKE '%"[%'
ORDER BY created_at DESC;

-- Function to recursively parse nested JSON strings
CREATE OR REPLACE FUNCTION clean_placement_array(input_jsonb jsonb)
RETURNS jsonb AS $$
DECLARE
    result jsonb := '[]'::jsonb;
    item jsonb;
    parsed_item text;
    temp_parsed jsonb;
BEGIN
    -- If input is not an array, return it as a single-item array
    IF jsonb_typeof(input_jsonb) != 'array' THEN
        RETURN jsonb_build_array(input_jsonb);
    END IF;
    
    -- Process each item in the array
    FOR item IN SELECT jsonb_array_elements(input_jsonb) LOOP
        -- If item is a string that looks like serialized JSON
        IF jsonb_typeof(item) = 'string' AND (item #>> '{}' LIKE '[%' OR item #>> '{}' LIKE '"%') THEN
            BEGIN
                parsed_item := item #>> '{}';
                -- Try to parse as JSON
                temp_parsed := parsed_item::jsonb;
                
                -- If it's an array, merge its contents
                IF jsonb_typeof(temp_parsed) = 'array' THEN
                    result := result || temp_parsed;
                ELSE
                    result := result || jsonb_build_array(temp_parsed);
                END IF;
            EXCEPTION
                WHEN OTHERS THEN
                    -- If parsing fails, keep the original item
                    result := result || jsonb_build_array(item);
            END;
        ELSE
            -- Regular item, add it as-is
            result := result || jsonb_build_array(item);
        END IF;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update corrupted placement data
UPDATE cms_blocks 
SET placement = clean_placement_array(placement)
WHERE placement::text LIKE '%[\\%' 
   OR placement::text LIKE '%"[%';

-- Show the cleaned data
SELECT id, title, placement, 
       jsonb_typeof(placement) as placement_type,
       jsonb_array_length(placement) as array_length
FROM cms_blocks 
ORDER BY updated_at DESC
LIMIT 10;

-- Clean up the temporary function
DROP FUNCTION clean_placement_array(jsonb);