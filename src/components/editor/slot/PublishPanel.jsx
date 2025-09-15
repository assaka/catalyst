import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Rocket,
  Clock,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Check,
  AlertCircle,
  Loader2,
  History,
  Eye
} from 'lucide-react';
import slotConfigurationService from '@/services/slotConfigurationService';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const PublishPanel = ({
  draftConfig,
  storeId,
  pageType = 'cart',
  onPublished,
  onReverted,
  hasUnsavedChanges = false
}) => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [versionHistory, setVersionHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [revertingVersionId, setRevertingVersionId] = useState(null);
  const [latestPublished, setLatestPublished] = useState(null);

  // Load version history
  const loadVersionHistory = async () => {
    if (!storeId) return;

    setLoadingHistory(true);
    try {
      const response = await slotConfigurationService.getVersionHistory(storeId, pageType, 50);
      if (response.success) {
        setVersionHistory(response.data || []);
        // Set the latest published version
        if (response.data && response.data.length > 0) {
          setLatestPublished(response.data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load version history:', error);
      toast.error('Failed to load version history');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Load history on mount and when storeId changes
  useEffect(() => {
    if (storeId) {
      loadVersionHistory();
    }
  }, [storeId, pageType]);

  // Publish draft configuration
  const handlePublish = async () => {
    if (!draftConfig?.id) {
      toast.error('No draft configuration to publish');
      return;
    }

    setIsPublishing(true);
    try {
      const response = await slotConfigurationService.publishDraft(draftConfig.id);
      if (response.success) {
        toast.success('Configuration published successfully!');

        // Reload version history
        await loadVersionHistory();

        // Notify parent component
        if (onPublished) {
          onPublished(response.data);
        }
      } else {
        toast.error(response.error || 'Failed to publish configuration');
      }
    } catch (error) {
      console.error('Error publishing configuration:', error);
      toast.error('Failed to publish configuration');
    } finally {
      setIsPublishing(false);
    }
  };

  // Revert to a specific version
  const handleRevert = async (versionId, versionNumber) => {
    if (!versionId) return;

    setRevertingVersionId(versionId);
    try {
      const response = await slotConfigurationService.revertToVersion(versionId);
      if (response.success) {
        toast.success(`Reverted to version ${versionNumber}`);

        // Reload version history
        await loadVersionHistory();

        // Notify parent component to reload draft
        if (onReverted) {
          onReverted(response.data);
        }
      } else {
        toast.error(response.error || 'Failed to revert version');
      }
    } catch (error) {
      console.error('Error reverting version:', error);
      toast.error('Failed to revert to selected version');
    } finally {
      setRevertingVersionId(null);
    }
  };

  // Get status display
  const getStatusDisplay = () => {
    if (!draftConfig) {
      return {
        label: 'No Configuration',
        color: 'text-gray-500',
        icon: <AlertCircle className="w-4 h-4" />
      };
    }

    if (draftConfig.status === 'draft') {
      if (hasUnsavedChanges || draftConfig.has_unpublished_changes) {
        return {
          label: 'Draft with unpublished changes',
          color: 'text-yellow-600',
          icon: <AlertCircle className="w-4 h-4" />
        };
      }
      return {
        label: 'Draft',
        color: 'text-blue-600',
        icon: <Clock className="w-4 h-4" />
      };
    }

    if (draftConfig.status === 'published') {
      return {
        label: 'Published',
        color: 'text-green-600',
        icon: <Check className="w-4 h-4" />
      };
    }

    return {
      label: draftConfig.status,
      color: 'text-gray-600',
      icon: <Clock className="w-4 h-4" />
    };
  };

  const status = getStatusDisplay();
  const canPublish = draftConfig &&
    draftConfig.status === 'draft' &&
    (hasUnsavedChanges || draftConfig.has_unpublished_changes);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Publish Settings</h3>
          <div className={`flex items-center gap-1 ${status.color}`}>
            {status.icon}
            <span className="text-sm">{status.label}</span>
          </div>
        </div>

        {/* Current version info */}
        {draftConfig && (
          <div className="text-sm text-gray-600 mt-2">
            <div>Version: {draftConfig.version_number || 1}</div>
            {draftConfig.updated_at && (
              <div>
                Last modified: {formatDistanceToNow(new Date(draftConfig.updated_at), { addSuffix: true })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Publish Button */}
      <div className="p-4 border-b border-gray-200">
        <Button
          onClick={handlePublish}
          disabled={!canPublish || isPublishing}
          className="w-full"
          variant={canPublish ? "default" : "secondary"}
        >
          {isPublishing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Publishing...
            </>
          ) : (
            <>
              <Rocket className="w-4 h-4 mr-2" />
              {canPublish ? 'Publish Changes' : 'No Changes to Publish'}
            </>
          )}
        </Button>

        {canPublish && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            This will make your changes live on the storefront
          </p>
        )}
      </div>

      {/* Version History Toggle */}
      <div className="border-b border-gray-200">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-gray-600" />
            <span className="font-medium">Version History</span>
            {versionHistory.length > 0 && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {versionHistory.length}
              </span>
            )}
          </div>
          {showHistory ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>

      {/* Version History List */}
      {showHistory && (
        <div className="max-h-96 overflow-y-auto">
          {loadingHistory ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">Loading version history...</p>
            </div>
          ) : versionHistory.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {versionHistory.map((version, index) => {
                const isLatest = index === 0;
                const isReverted = version.status === 'reverted';
                const isCurrent = draftConfig?.parent_version_id === version.id;

                return (
                  <div
                    key={version.id}
                    className={`p-3 hover:bg-gray-50 ${isReverted ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">
                            Version {version.version_number}
                          </span>
                          {isLatest && !isReverted && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                              Latest
                            </span>
                          )}
                          {isReverted && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                              Reverted
                            </span>
                          )}
                          {isCurrent && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              Current Base
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {version.published_at && (
                            <div>
                              Published {formatDistanceToNow(new Date(version.published_at), { addSuffix: true })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Revert button */}
                      {!isReverted && !isLatest && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRevert(version.id, version.version_number)}
                          disabled={revertingVersionId === version.id}
                          className="ml-2"
                        >
                          {revertingVersionId === version.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Revert
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No version history yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Publish your first version to start tracking changes
              </p>
            </div>
          )}
        </div>
      )}

      {/* Preview Mode Info */}
      {draftConfig?.status === 'acceptance' && (
        <div className="p-4 bg-blue-50 border-t border-blue-100">
          <div className="flex items-start gap-2">
            <Eye className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                Preview Mode Active
              </p>
              <p className="text-xs text-blue-700 mt-1">
                This version is available in the acceptance environment
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublishPanel;