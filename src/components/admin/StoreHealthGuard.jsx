import React, { useState } from 'react';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import { AlertTriangle, Database, Trash2, Loader2 } from 'lucide-react';
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
import apiClient from '@/api/client';

/**
 * StoreHealthGuard - Middleware component that blocks rendering if store database is unhealthy
 * Must wrap admin pages to prevent them from trying to load data from an empty database
 */
export default function StoreHealthGuard({ children, pageName }) {
  const {
    selectedStore,
    loading,
    reprovisionStore,
    deleteStorePermanently,
  } = useStoreSelection();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isReprovisioning, setIsReprovisioning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);

  // Skip health check ONLY for pages that don't require a healthy database
  const skipPages = [
    'Auth',
    'StoreOnboarding',
    // Public/Storefront pages - don't block customers
    'Storefront',
    'Category',
    'ProductDetail',
    'Cart',
    'Checkout',
    'OrderSuccess',
    'OrderCancel',
    'CustomerAuth',
    'CustomerDashboard',
    'ResetPassword',
    'EmailVerification',
    'CmsPageViewer',
    'SitemapPublic',
    'RobotsPublic',
    'Landing',
    'NotFound'
  ];
  if (skipPages.includes(pageName)) {
    return children;
  }

  // Wait for store selection to load
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading store...</p>
        </div>
      </div>
    );
  }

  // No store selected - let the normal flow handle redirect
  if (!selectedStore) {
    return children;
  }

  // Check if database is unhealthy
  const isDatabaseUnhealthy = selectedStore.database_healthy === false;

  // If database is healthy, render children normally
  if (!isDatabaseUnhealthy) {
    return children;
  }

  const storeId = selectedStore?.id;

  // Handle reprovision with OAuth flow (like onboarding)
  const handleReprovision = async () => {
    setIsReprovisioning(true);
    setError(null);
    setStatus('Connecting to Supabase...');

    try {
      // Step 1: Initiate OAuth flow
      const oauthResponse = await apiClient.post(`/supabase/connect?storeId=${storeId}`);

      if (!oauthResponse.success || !oauthResponse.authUrl) {
        throw new Error('Failed to get OAuth URL');
      }

      // Step 2: Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        oauthResponse.authUrl,
        'Supabase OAuth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        throw new Error('Please allow popups for this site');
      }

      setStatus('Waiting for Supabase authorization...');

      // Step 3: Listen for OAuth error messages from popup
      let oauthError = null;
      const messageHandler = (event) => {
        if (event.data && event.data.type === 'supabase-oauth-error') {
          oauthError = event.data.error;
        }
      };
      window.addEventListener('message', messageHandler);

      // Step 4: Wait for popup to close
      await new Promise((resolve, reject) => {
        const checkClosed = setInterval(async () => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageHandler);

            // Wait for any pending messages
            await new Promise(r => setTimeout(r, 500));

            // Check sessionStorage as fallback
            if (!oauthError) {
              try {
                const storedError = sessionStorage.getItem('supabase_oauth_error');
                if (storedError) {
                  oauthError = storedError;
                  sessionStorage.removeItem('supabase_oauth_error');
                }
              } catch (e) {
                // Ignore
              }
            }

            if (oauthError) {
              reject(new Error(oauthError));
            } else {
              resolve();
            }
          }
        }, 500);

        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(checkClosed);
          if (!popup.closed) {
            popup.close();
            reject(new Error('OAuth timeout - please try again'));
          }
        }, 300000);
      });

      // Step 5: Verify OAuth succeeded
      setStatus('Verifying connection...');
      const statusResponse = await apiClient.get(`/supabase/oauth-status?storeId=${storeId}`);

      if (statusResponse.error) {
        throw new Error(statusResponse.error);
      }

      if (!statusResponse.success || !statusResponse.connected) {
        throw new Error('OAuth connection failed. Please try again.');
      }

      // Step 6: Now reprovision the database with the new OAuth token
      setStatus('Provisioning database...');
      const result = await reprovisionStore(
        selectedStore?.name || 'My Store',
        selectedStore?.slug
      );

      if (!result.success) {
        throw new Error(result.error || result.message || 'Failed to provision database');
      }

      setStatus('Database provisioned successfully!');
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (err) {
      console.error('Reprovision error:', err);
      setError(err.message);
      setStatus(null);
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

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
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
            The database for this store is empty or not properly configured.
            Click below to reconnect your Supabase account and restore the database.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {status && !error && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <p className="text-sm text-blue-600 flex items-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {status}
              </p>
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
                  {status || 'Processing...'}
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
