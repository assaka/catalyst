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

export default function StoreHealthBanner({ fullPage = false }) {
  const {
    storeHealth,
    healthLoading,
    selectedStore,
    reprovisionStore,
    deleteStorePermanently,
  } = useStoreSelection();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isReprovisioning, setIsReprovisioning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  // Define handlers FIRST (before any returns)
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
        window.location.href = '/admin/stores';
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Check database_healthy flag directly from store (faster than waiting for health check)
  const isDatabaseUnhealthy = selectedStore?.database_healthy === false;

  // Don't show anything if store is healthy (both flag and health check)
  if (!isDatabaseUnhealthy && !healthLoading && storeHealth?.status === 'healthy') {
    return null;
  }

  // Don't show for stores that aren't active
  if (!selectedStore?.is_active || selectedStore?.status !== 'active') {
    return null;
  }

  // Full page blocking modal when database is unhealthy
  if (isDatabaseUnhealthy && fullPage) {
    return (
      <>
        <div className="fixed inset-0 bg-gray-50 z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Database Issue</h2>
                <p className="text-sm text-gray-500">{selectedStore?.name || 'Your store'}</p>
              </div>
            </div>

            <p className="text-gray-600 mb-6">
              The database for this store is empty or not properly configured. You need to reprovision it to continue.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <Button
                className="w-full bg-amber-600 hover:bg-amber-700"
                onClick={handleReprovision}
                disabled={isReprovisioning || isDeleting}
              >
                {isReprovisioning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Provisioning Database...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Reprovision Database
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isReprovisioning || isDeleting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Store from Platform
              </Button>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => window.location.href = '/admin/stores'}
                disabled={isReprovisioning || isDeleting}
              >
                Switch to Another Store
              </Button>
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
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Show loading state while checking health
  if (healthLoading) {
    if (fullPage) {
      return (
        <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Checking store database...</p>
          </div>
        </div>
      );
    }
    return null;
  }

  // If no health data yet, don't show
  if (!storeHealth) {
    return null;
  }

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

  // Full page mode for storeHealth-based detection
  if (fullPage && (storeHealth.status === 'empty' || storeHealth.status === 'partial' || storeHealth.status === 'connection_failed')) {
    return (
      <>
        <div className="fixed inset-0 bg-gray-50 z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Database Issue</h2>
                <p className="text-sm text-gray-500">{selectedStore?.name || 'Your store'}</p>
              </div>
            </div>

            <p className="text-gray-600 mb-6">
              {getStatusMessage()}
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <Button
                className="w-full bg-amber-600 hover:bg-amber-700"
                onClick={handleReprovision}
                disabled={isReprovisioning || isDeleting}
              >
                {isReprovisioning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Provisioning Database...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Reprovision Database
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isReprovisioning || isDeleting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Store from Platform
              </Button>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => window.location.href = '/admin/stores'}
                disabled={isReprovisioning || isDeleting}
              >
                Switch to Another Store
              </Button>
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
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Banner mode (non-fullPage)
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
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
