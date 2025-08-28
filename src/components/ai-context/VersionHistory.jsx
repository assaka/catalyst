import React, { useState, useEffect, useRef } from 'react';
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
  const dropdownRef = useRef(null);

  // Check if this is being used inline in header
  const isHeaderMode = className?.includes('inline-block');

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

  // Handle click outside to close dropdown in header mode
  useEffect(() => {
    if (!isExpanded || !isHeaderMode) return;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded, isHeaderMode]);

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
    <div 
      ref={dropdownRef}
      className={cn(
        isHeaderMode 
          ? "relative" 
          : "border-t bg-gray-50 dark:bg-gray-800", 
        className
      )}
    >
      {/* Header - Compact for header mode */}
      <div 
        className={cn(
          "flex items-center cursor-pointer",
          isHeaderMode 
            ? "gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            : "justify-between p-3 hover:bg-gray-100 dark:hover:bg-gray-700"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-gray-500" />
          <span className={cn(
            "font-medium text-gray-700 dark:text-gray-300",
            isHeaderMode ? "text-xs" : "text-sm"
          )}>
            {isHeaderMode ? "History" : "Version History"}
          </span>
          {releases.length > 0 && (
            <span className={cn(
              "text-gray-500 bg-gray-200 dark:bg-gray-600 rounded-full",
              isHeaderMode ? "text-xs px-1 py-0.5" : "text-xs px-2 py-0.5"
            )}>
              {releases.length}
            </span>
          )}
        </div>
        {!isHeaderMode && (
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
        )}
        {isHeaderMode && (
          <ChevronDown className={cn("w-3 h-3 text-gray-500 transition-transform", isExpanded && "rotate-180")} />
        )}
      </div>

      {/* Content - Dropdown for header mode, inline for regular mode */}
      {isExpanded && (
        <div className={cn(
          isHeaderMode 
            ? "absolute top-full left-0 mt-1 min-w-[320px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50"
            : "border-t"
        )}>
          {/* Error Display */}
          {error && (
            <div className={cn(
              "bg-red-50 dark:bg-red-900/20 border-b",
              isHeaderMode ? "p-2 rounded-t-md" : "p-3"
            )}>
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                <span className={cn(
                  "text-red-700 dark:text-red-400",
                  isHeaderMode ? "text-xs" : "text-sm"
                )}>{error}</span>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && !error && (
            <div className={cn(
              "text-center",
              isHeaderMode ? "p-4" : "p-6"
            )}>
              <RefreshCw className={cn(
                "animate-spin mx-auto mb-2 text-gray-400",
                isHeaderMode ? "w-4 h-4" : "w-6 h-6"
              )} />
              <p className={cn(
                "text-gray-500",
                isHeaderMode ? "text-xs" : "text-sm"
              )}>Loading version history...</p>
            </div>
          )}

          {/* Version List */}
          {!isLoading && !error && (
            <div className={cn(
              "overflow-auto",
              isHeaderMode ? "max-h-80" : "max-h-64"
            )}>
              {releases.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {releases.map((release) => (
                    <div key={release.id} className={cn(
                      "hover:bg-gray-100 dark:hover:bg-gray-700",
                      isHeaderMode ? "p-2" : "p-3"
                    )}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn(
                              "font-medium text-gray-900 dark:text-gray-100 truncate",
                              isHeaderMode ? "text-xs" : "text-sm"
                            )}>
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
                                "flex items-center gap-1 font-medium rounded transition-colors",
                                isHeaderMode ? "px-1.5 py-0.5 text-xs" : "px-2 py-1 text-xs",
                                "bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300",
                                "text-white disabled:text-gray-500"
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
                <div className={cn(
                  "text-center",
                  isHeaderMode ? "p-4" : "p-6"
                )}>
                  <Clock className={cn(
                    "mx-auto mb-2 text-gray-400 opacity-50",
                    isHeaderMode ? "w-6 h-6" : "w-8 h-8"
                  )} />
                  <p className={cn(
                    "text-gray-500",
                    isHeaderMode ? "text-xs" : "text-sm"
                  )}>
                    {filePath ? 'No history for this file' : 'No version history available'}
                  </p>
                  <p className={cn(
                    "text-gray-400 mt-1",
                    isHeaderMode ? "text-xs" : "text-xs"
                  )}>
                    {isHeaderMode ? 'Publish to create versions' : 'Publish changes to create version history'}
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