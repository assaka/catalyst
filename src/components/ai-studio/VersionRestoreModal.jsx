import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button.jsx";
import {
  X,
  RotateCcw,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle,
  Info
} from 'lucide-react';

/**
 * VersionRestoreModal
 * Confirms and executes plugin version restoration
 * Creates a new version with the restored state (like git revert)
 */
const VersionRestoreModal = ({
  pluginId,
  versionId,
  currentVersionId,
  onClose,
  onSuccess,
  className = ''
}) => {
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [version, setVersion] = useState(null);
  const [currentVersion, setCurrentVersion] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [newVersion, setNewVersion] = useState(null);

  // Load version details
  useEffect(() => {
    loadData();
  }, [pluginId, versionId, currentVersionId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const storeId = localStorage.getItem('selectedStoreId');
      const headers = {
        'Content-Type': 'application/json',
        ...(storeId && storeId !== 'undefined' ? { 'x-store-id': storeId } : {})
      };

      // Load target version details
      const versionResponse = await fetch(`/api/plugins/${pluginId}/versions/${versionId}`, { headers });

      if (!versionResponse.ok) {
        throw new Error('Failed to load version data');
      }

      const versionData = await versionResponse.json();
      setVersion(versionData.version);

      // Load current version
      let actualCurrentVersionId = currentVersionId;
      if (!actualCurrentVersionId) {
        const currentResponse = await fetch(`/api/plugins/${pluginId}/versions/current`, { headers });
        if (currentResponse.ok) {
          const currentData = await currentResponse.json();
          setCurrentVersion(currentData.version);
        }
      } else {
        const currentResponse = await fetch(`/api/plugins/${pluginId}/versions/${actualCurrentVersionId}`, { headers });
        if (currentResponse.ok) {
          const currentData = await currentResponse.json();
          setCurrentVersion(currentData.version);
        }
      }
    } catch (error) {
      console.error('Failed to load version data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Execute restore
  const handleRestore = async () => {
    try {
      setRestoring(true);
      setError(null);
      const storeId = localStorage.getItem('selectedStoreId');

      const response = await fetch(
        `/api/plugins/${pluginId}/versions/${versionId}/restore`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(storeId && storeId !== 'undefined' ? { 'x-store-id': storeId } : {})
          },
          body: JSON.stringify({
            created_by: null,
            created_by_name: 'System'
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to restore version');
      }

      const result = await response.json();
      setNewVersion(result.version);
      setSuccess(true);

      // Wait a moment to show success message
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Failed to restore version:', error);
      setError(error.message);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-lg shadow-xl w-[500px] max-w-[90vw]">
        {/* Header */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {success ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : error ? (
                <XCircle className="w-6 h-6 text-red-600" />
              ) : (
                <RotateCcw className="w-6 h-6 text-primary" />
              )}
              <div>
                <h2 className="text-lg font-semibold">
                  {success ? 'Version Restored!' : 'Restore Version'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {success
                    ? 'A new version has been created'
                    : 'Confirm version restoration'}
                </p>
              </div>
            </div>

            <Button variant="ghost" size="sm" onClick={onClose} disabled={restoring}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading version details...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <XCircle className="w-12 h-12 mx-auto mb-3 text-red-600" />
              <p className="text-sm font-medium text-red-600 mb-2">Error</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button className="mt-4" onClick={loadData}>
                Retry
              </Button>
            </div>
          ) : success ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-600" />
              <p className="text-lg font-medium text-green-600 mb-2">
                Version Restored Successfully!
              </p>
              <p className="text-sm text-muted-foreground">
                Created new version <span className="font-mono font-semibold">{newVersion?.version_number}</span> with state from {version?.version_number}
              </p>
            </div>
          ) : (
            <>
              {/* Version info */}
              {version && currentVersion && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 bg-muted/50 border rounded-md p-3">
                    <p className="text-xs text-muted-foreground font-medium mb-1">Current</p>
                    <p className="font-mono text-sm font-semibold">{currentVersion.version_number}</p>
                  </div>

                  <div className="text-muted-foreground">
                    <RotateCcw className="w-4 h-4" />
                  </div>

                  <div className="flex-1 bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p className="text-xs text-blue-600 font-medium mb-1">Restore To</p>
                    <p className="font-mono text-sm font-semibold">{version.version_number}</p>
                  </div>
                </div>
              )}

              {/* Info box */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-700">
                    <p className="font-medium mb-1">How restore works:</p>
                    <p>A new version will be created with the state from version {version?.version_number}. Your current version history is preserved - you can always restore to any previous version.</p>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-orange-700">
                    This will replace your current plugin code with the code from version {version?.version_number}. Make sure you want to proceed.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!success && !loading && !error && (
          <div className="border-t p-4 bg-muted/30">
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={restoring}>
                Cancel
              </Button>
              <Button
                onClick={handleRestore}
                disabled={restoring}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {restoring ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Restoring...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Restore Version
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VersionRestoreModal;
