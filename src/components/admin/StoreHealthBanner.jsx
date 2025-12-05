import React, { useState } from 'react';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import { AlertTriangle, Database, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function StoreHealthBanner() {
  const {
    storeHealth,
    healthLoading,
    selectedStore,
    reprovisionStore,
    deleteStorePermanently,
    needsProvisioning
  } = useStoreSelection();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isReprovisioning, setIsReprovisioning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  // Don't show anything if still loading or store is healthy
  if (healthLoading || !storeHealth || storeHealth.status === 'healthy') {
    return null;
  }

  // Don't show for stores that aren't active
  if (!selectedStore?.is_active || selectedStore?.status !== 'active') {
    return null;
  }

  const handleReprovision = async () => {
    setIsReprovisioning(true);
    setError(null);

    try {
      const result = await reprovisionStore(
        selectedStore?.name || 'My Store',
        selectedStore?.slug
      );

      if (!result.success) {
        setError(result.error || 'Failed to reprovision database');
      } else {
        // Success - page will reload with healthy store
        window.location.reload();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsReprovisioning(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteStorePermanently();

      if (!result.success) {
        setError(result.error || 'Failed to delete store');
      } else {
        // Success - redirect to stores page or auth
        window.location.href = '/admin/stores';
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const getStatusMessage = () => {
    switch (storeHealth.status) {
      case 'empty':
        return 'The database for this store is empty. All tables have been cleared.';
      case 'partial':
        return `The database is partially provisioned. Missing tables: ${storeHealth.missingTables?.join(', ')}`;
      case 'connection_failed':
        return 'Unable to connect to the store database. Please check your database credentials.';
      case 'no_database':
        return 'No database is configured for this store.';
      case 'database_inactive':
        return 'The database connection is inactive.';
      case 'missing_store_record':
        return 'Database tables exist but the store record is missing.';
      default:
        return storeHealth.message || 'There is an issue with the store database.';
    }
  };

  return (
    <>
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />

          <div className="flex-1">
            <h3 className="font-medium text-amber-800">
              Database Issue Detected
            </h3>
            <p className="text-sm text-amber-700 mt-1">
              {getStatusMessage()}
            </p>

            {error && (
              <p className="text-sm text-red-600 mt-2">
                Error: {error}
              </p>
            )}

            <div className="flex gap-2 mt-3">
              {storeHealth.actions?.includes('provision_database') && (
                <Button
                  size="sm"
                  onClick={handleReprovision}
                  disabled={isReprovisioning || isDeleting}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {isReprovisioning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Provisioning...
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4 mr-2" />
                      Reprovision Database
                    </>
                  )}
                </Button>
              )}

              {storeHealth.actions?.includes('remove_store') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isReprovisioning || isDeleting}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Store
                </Button>
              )}

              {storeHealth.actions?.includes('update_credentials') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.location.href = '/admin/settings/database'}
                  disabled={isReprovisioning || isDeleting}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Update Credentials
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Store Permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{selectedStore?.name}" from the platform.
              This action cannot be undone.
              <br /><br />
              <strong>Note:</strong> This only removes the store from the platform.
              The Supabase database will remain unchanged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Permanently'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
