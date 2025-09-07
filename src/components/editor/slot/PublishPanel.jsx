import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Rocket, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  History,
  RotateCcw,
  Trash2
} from 'lucide-react';
import slotConfigurationService from '@/services/slotConfigurationService';
import { formatDistanceToNow } from 'date-fns';

const PublishPanel = ({ 
  storeId, 
  pageType = 'cart', 
  onConfigurationChange,
  currentDraftId = null 
}) => {
  const [publishStatus, setPublishStatus] = useState('draft');
  const [isPublishing, setIsPublishing] = useState(false);
  const [versionHistory, setVersionHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [publishedConfig, setPublishedConfig] = useState(null);
  const [draftConfig, setDraftConfig] = useState(null);

  // Load current status and history
  useEffect(() => {
    loadPublishStatus();
    if (showHistory) {
      loadVersionHistory();
    }
  }, [storeId, pageType, showHistory, currentDraftId]);

  const loadPublishStatus = async () => {
    try {
      // Load published version
      const publishedResponse = await slotConfigurationService.getPublishedConfiguration(storeId, pageType);
      setPublishedConfig(publishedResponse.success ? publishedResponse.data : null);

      // Load draft version
      const draftResponse = await slotConfigurationService.getDraftConfiguration(storeId, pageType);
      setDraftConfig(draftResponse.success ? draftResponse.data : null);

      // Determine status
      if (draftResponse.success && draftResponse.data) {
        if (!publishedResponse.success || !publishedResponse.data) {
          setPublishStatus('unpublished');
        } else {
          // Compare versions to see if draft is newer
          const draftUpdated = new Date(draftResponse.data.updated_at);
          const publishedUpdated = new Date(publishedResponse.data.updated_at || publishedResponse.data.published_at);
          
          if (draftUpdated > publishedUpdated) {
            setPublishStatus('draft');
          } else {
            setPublishStatus('published');
          }
        }
      } else {
        setPublishStatus(publishedResponse.success ? 'published' : 'none');
      }
    } catch (error) {
      console.error('Error loading publish status:', error);
    }
  };

  const loadVersionHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await slotConfigurationService.getVersionHistory(storeId, pageType, 10);
      if (response.success) {
        setVersionHistory(response.data);
      }
    } catch (error) {
      console.error('Error loading version history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handlePublish = async () => {
    if (!draftConfig) {
      alert('No draft configuration to publish');
      return;
    }

    setIsPublishing(true);
    try {
      const response = await slotConfigurationService.publishDraft(draftConfig.id);
      
      if (response.success) {
        setPublishStatus('published');
        setPublishedConfig(response.data);
        
        // Notify parent of configuration change
        if (onConfigurationChange) {
          onConfigurationChange(response.data);
        }
        
        // Reload status
        await loadPublishStatus();
        
        alert('Configuration published successfully!');
      } else {
        alert('Failed to publish configuration: ' + response.error);
      }
    } catch (error) {
      console.error('Error publishing configuration:', error);
      alert('Error publishing configuration: ' + error.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRevertToVersion = async (versionId) => {
    if (!confirm('Are you sure you want to revert to this version? This will create a new published version and mark newer versions as reverted.')) {
      return;
    }

    try {
      const response = await slotConfigurationService.revertToVersion(versionId);
      
      if (response.success) {
        await loadPublishStatus();
        await loadVersionHistory();
        
        // Notify parent of configuration change
        if (onConfigurationChange) {
          onConfigurationChange(response.data);
        }
        
        alert('Successfully reverted to selected version!');
      } else {
        alert('Failed to revert: ' + response.error);
      }
    } catch (error) {
      console.error('Error reverting version:', error);
      alert('Error reverting version: ' + error.message);
    }
  };

  const getStatusColor = () => {
    switch (publishStatus) {
      case 'published': return 'green';
      case 'draft': return 'yellow';
      case 'unpublished': return 'red';
      default: return 'gray';
    }
  };

  const getStatusIcon = () => {
    switch (publishStatus) {
      case 'published': return <CheckCircle className="w-4 h-4" />;
      case 'draft': return <Clock className="w-4 h-4" />;
      case 'unpublished': return <AlertCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusText = () => {
    switch (publishStatus) {
      case 'published': return 'Published';
      case 'draft': return 'Draft changes ready';
      case 'unpublished': return 'Unpublished draft';
      default: return 'No configuration';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Rocket className="w-5 h-5" />
            Publish Configuration
          </span>
          <Badge 
            variant="outline" 
            className={`text-${getStatusColor()}-600 border-${getStatusColor()}-300`}
          >
            {getStatusIcon()}
            {getStatusText()}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="space-y-2">
          {publishedConfig && (
            <div className="text-sm text-gray-600">
              <strong>Current Published:</strong> Version {publishedConfig.version_number} 
              {publishedConfig.published_at && (
                <span> - {formatDistanceToNow(new Date(publishedConfig.published_at), { addSuffix: true })}</span>
              )}
            </div>
          )}
          
          {draftConfig && (
            <div className="text-sm text-gray-600">
              <strong>Draft:</strong> Last modified {formatDistanceToNow(new Date(draftConfig.updated_at), { addSuffix: true })}
            </div>
          )}
        </div>

        {/* Publish Button */}
        {publishStatus === 'draft' || publishStatus === 'unpublished' ? (
          <Button 
            onClick={handlePublish} 
            disabled={isPublishing || !draftConfig}
            className="w-full"
          >
            {isPublishing ? 'Publishing...' : 'Publish Changes'}
          </Button>
        ) : (
          <div className="text-sm text-gray-500 text-center py-2">
            No unpublished changes
          </div>
        )}

        {/* Version History Toggle */}
        <Button
          variant="outline"
          onClick={() => setShowHistory(!showHistory)}
          className="w-full"
        >
          <History className="w-4 h-4 mr-2" />
          {showHistory ? 'Hide' : 'Show'} Version History
        </Button>

        {/* Version History */}
        {showHistory && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Version History</h4>
            
            {isLoadingHistory ? (
              <div className="text-sm text-gray-500">Loading history...</div>
            ) : versionHistory.length === 0 ? (
              <div className="text-sm text-gray-500">No published versions yet</div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {versionHistory.map((version) => (
                  <div 
                    key={version.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        Version {version.version_number}
                        {version.status === 'reverted' && (
                          <Badge variant="outline" className="ml-2 text-red-600 border-red-300">
                            Reverted
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-600">
                        {version.published_at && formatDistanceToNow(new Date(version.published_at), { addSuffix: true })}
                      </div>
                    </div>
                    
                    {version.status !== 'reverted' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevertToVersion(version.id)}
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Revert
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PublishPanel;