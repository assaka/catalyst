import React, { useState, useEffect } from 'react';
import { Clock, RotateCcw, RefreshCw, AlertCircle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import apiClient from '@/api/client';

/**
 * Version History Component
 * Displays patch releases with rollback functionality
 */
const VersionHistory = ({ filePath, onRollback, className }) => {
  const [releases, setReleases] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [rollingBackId, setRollingBackId] = useState(null);

  // Load version history
  const loadVersionHistory = async () => {
    if (!filePath) return;

    setIsLoading(true);
    setError(null);

    try {
      const authToken = apiClient.getToken();
      if (!authToken) {
        setError('Authentication required');
        return;
      }

      const response = await fetch('/api/patches/releases', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'x-store-id': '157d4590-49bf-4b0b-bd77-abe131909528'
        }
      });

      const data = await response.json();

      if (data.success) {
        // Filter releases that have patches for this specific file
        const fileReleases = data.data.releases.filter(release => 
          release.files && release.files.includes(filePath)
        );
        setReleases(fileReleases);
      } else {
        setError(data.error || 'Failed to load version history');
      }
    } catch (error) {
      setError(`Failed to load version history: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle rollback to specific version
  const handleRollback = async (releaseId, versionName) => {
    if (!releaseId) return;

    setRollingBackId(releaseId);
    setError(null);

    try {
      const authToken = apiClient.getToken();
      if (!authToken) {
        setError('Authentication required for rollback');
        return;
      }

      const response = await fetch(`/api/patches/rollback/${releaseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          rollbackReason: `Rollback to version ${versionName} from AI Context Window`
        })
      });

      const data = await response.json();

      if (data.success) {
        // Notify parent component of successful rollback
        onRollback?.({
          releaseId,
          versionName,
          rolledBackAt: data.data.rolledBackAt
        });
        
        // Reload version history to reflect changes
        await loadVersionHistory();
      } else {
        setError(data.error || 'Failed to rollback version');
      }
    } catch (error) {
      setError(`Rollback failed: ${error.message}`);
    } finally {
      setRollingBackId(null);
    }
  };

  // Load version history when component mounts or file path changes
  useEffect(() => {
    if (isExpanded && filePath) {
      loadVersionHistory();
    }
  }, [filePath, isExpanded]);

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'rolled_back':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className={cn("border-t bg-gray-50 dark:bg-gray-800", className)}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Version History
          </span>
          {releases.length > 0 && (
            <span className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full">
              {releases.length} version{releases.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              loadVersionHistory();
            }}
            disabled={isLoading}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Refresh version history"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </button>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="border-t">
          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border-b">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && !error && (
            <div className="p-6 text-center">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">Loading version history...</p>
            </div>
          )}

          {/* Version List */}
          {!isLoading && !error && (
            <div className="max-h-64 overflow-auto">
              {releases.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {releases.map((release) => (
                    <div key={release.id} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {release.version_name || `Release ${release.id.slice(-8)}`}
                            </span>
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full border",
                              getStatusBadge(release.status)
                            )}>
                              {release.status}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(release.created_at)}
                            {release.description && (
                              <span className="ml-2">• {release.description}</span>
                            )}
                          </div>
                          {release.patch_count && (
                            <div className="text-xs text-gray-400 mt-1">
                              {release.patch_count} patch{release.patch_count !== 1 ? 'es' : ''}
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0 ml-2">
                          {release.status === 'published' && (
                            <button
                              onClick={() => handleRollback(release.id, release.version_name)}
                              disabled={rollingBackId === release.id}
                              className={cn(
                                "flex items-center gap-1 px-2 py-1 text-xs font-medium rounded",
                                "bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300",
                                "text-white disabled:text-gray-500 transition-colors"
                              )}
                              title="Rollback to this version"
                            >
                              {rollingBackId === release.id ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <>
                                  <RotateCcw className="w-3 h-3" />
                                  Rollback
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400 opacity-50" />
                  <p className="text-sm text-gray-500">No version history available</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Publish changes to create version history
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VersionHistory;