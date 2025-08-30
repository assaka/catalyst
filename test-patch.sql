-- Test patch with distant changes (lines 5 and 37, 32 lines apart)
-- This should create 2 separate hunks in the DiffPreviewSystem

INSERT INTO patch_diffs (
  id,
  store_id,
  file_path,
  patch_name,
  change_type,
  unified_diff,
  ast_diff,
  change_summary,
  change_description,
  baseline_version,
  applies_to_lines,
  dependencies,
  conflicts_with,
  status,
  is_active,
  priority,
  created_by,
  created_at,
  updated_at
) VALUES (
  'test-hunk-separation-001',
  '8cc01a01-3a78-4f20-beb8-a566a07834e5',
  'src/pages/Cart.jsx',
  'Test patch - distant changes (lines 5 & 37)',
  'manual_edit',
  '--- a/src/pages/Cart.jsx
+++ b/src/pages/Cart.jsx
@@ -2,7 +2,7 @@
 import React, { useState, useEffect, useCallback, useMemo } from ''react'';
 import { Link, useNavigate } from ''react-router-dom'';
 import { createPageUrl } from ''@/utils'';
-import { createPublicUrl, getExternalStoreUrl, getStoreBaseUrl } from ''@/utils/urlUtils'';
+import { TESTcreatePublicUrl, getExternalStoreUrl, getStoreBaseUrl } from ''@/utils/urlUtils'';
 import { useStore } from ''@/components/storefront/StoreProvider'';
 import { StorefrontProduct } from ''@/api/storefront-entities'';
 import { Coupon } from ''@/api/entities'';
@@ -34,7 +34,7 @@
 const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
 
 // Safe number formatting helper
-const formatPrice = (value) => {
+const TESTformatPrice = (value) => {
     const num = parseFloat(value);
     return isNaN(num) ? 0 : num;
 };',
  null,
  'Test patch with changes on lines 5 and 37 (32 lines apart)',
  'Testing hunk separation with TESTcreatePublicUrl and TESTformatPrice',
  'latest',
  '[5, 37]',
  '[]',
  '[]',
  'open',
  true,
  0,
  'cbca0a20-973d-4a33-85fc-d84d461d1372',
  NOW(),
  NOW()
);

-- Verification query to confirm the patch was created
SELECT 
  id,
  file_path,
  patch_name,
  change_type,
  LENGTH(unified_diff) as diff_length,
  applies_to_lines,
  status
FROM patches 
WHERE id = 'test-hunk-separation-001';