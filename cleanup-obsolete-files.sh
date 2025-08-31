#!/bin/bash
# Cleanup script to remove obsolete patch system files
# Run this after the extension system is fully implemented and tested

echo "🧹 Cleaning up obsolete patch system files..."

# Remove debug and test patch files
echo "Removing debug and test files..."
rm -f check-direct-patch.cjs
rm -f check-existing-patches.cjs
rm -f create-active-patch.cjs
rm -f create-dynamic-db-patch.cjs
rm -f create-patch-diff-entry.cjs
rm -f create-working-adam-patch.cjs
rm -f debug-hybrid-patches-auth.js
rm -f debug-hybrid-patches.cjs
rm -f debug-json-patch.cjs
rm -f debug-patch-application.cjs
rm -f debug-patch-existence.cjs
rm -f debug-patch-flow.cjs
rm -f find-hamid-patch.cjs
rm -f find-real-patches.cjs
rm -f fix-adam-patch.cjs
rm -f fix-store-id-patches.cjs
rm -f fix-store-scoped-patches.cjs
rm -f show-patch-system-concept.cjs
rm -f test-deployed-patch.cjs
rm -f test-end-to-end-patch.cjs
rm -f test-frontend-patch-flow.cjs
rm -f test-patch-api.cjs
rm -f test-patch-retrieval.cjs
rm -f test-patch-system.cjs
rm -f test-patches-api.cjs
rm -f test-preview-tab-patch.js
rm -f update-patch-via-render.cjs
rm -f verify-hamid-cart-patch.cjs

# Remove obsolete backend services (keep extension-service.js)
echo "Removing obsolete backend services..."
rm -f backend/src/services/patch-service.js
rm -f backend/src/services/hybrid-patch-service.js

# Remove obsolete frontend services (keep what's still needed)
echo "Removing obsolete frontend services..."
rm -f src/services/overlay-patch-system.js

# Remove obsolete routes (replace with extension routes)
echo "Moving obsolete routes to backup..."
if [ -f backend/src/routes/patches.js ]; then
  mv backend/src/routes/patches.js backend/src/routes/patches.js.backup
  echo "📁 Backed up patches.js as patches.js.backup"
fi

# Remove obsolete components
echo "Removing obsolete components..."
if [ -f src/components/storefront/PatchApplier.jsx ]; then
  mv src/components/storefront/PatchApplier.jsx src/components/storefront/PatchApplier.jsx.backup
  echo "📁 Backed up PatchApplier.jsx as PatchApplier.jsx.backup"
fi

if [ -f src/components/storefront/GlobalPatchProvider.jsx ]; then
  mv src/components/storefront/GlobalPatchProvider.jsx src/components/storefront/GlobalPatchProvider.jsx.backup
  echo "📁 Backed up GlobalPatchProvider.jsx as GlobalPatchProvider.jsx.backup"
fi

# Remove obsolete database migrations (keep cleanup script)
echo "Moving obsolete migrations to backup..."
mkdir -p backend/src/database/migrations/obsolete
mv backend/src/database/migrations/add-hybrid-patch-support.sql backend/src/database/migrations/obsolete/
mv backend/src/database/migrations/create-versioned-patch-system.sql backend/src/database/migrations/obsolete/
mv backend/src/database/migrations/rename-code-patches-to-patch-diffs.sql backend/src/database/migrations/obsolete/
mv backend/src/database/migrations/rename-patch-applications-to-patch-logs.sql backend/src/database/migrations/obsolete/

# Remove documentation files
echo "Removing obsolete documentation..."
rm -f HYBRID_PATCH_DUAL_FORMAT.md
rm -f PRODUCTION_PATCH_STRATEGY.md
rm -f PATCH_DEBUG_INSTRUCTIONS.md
rm -f BACKWARD_COMPATIBILITY_REMOVED.md

echo "✅ Cleanup completed!"
echo ""
echo "📋 Summary:"
echo "  - Removed debug and test patch files"
echo "  - Removed obsolete backend services"
echo "  - Backed up patch routes and components"
echo "  - Moved obsolete migrations to backup folder"
echo "  - Removed patch documentation files"
echo ""
echo "⚠️  Next steps:"
echo "  1. Run the database cleanup migration: cleanup-patch-system.sql"
echo "  2. Update server.js to use extension routes instead of patch routes"
echo "  3. Update components to use the new hook system"
echo "  4. Test that the new extension system works properly"
echo "  5. Remove .backup files after confirming everything works"