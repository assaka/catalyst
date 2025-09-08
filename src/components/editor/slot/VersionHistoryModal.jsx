import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  History, 
  RotateCcw, 
  CheckCircle,
  Clock,
  AlertCircle 
} from 'lucide-react';
import slotConfigurationService from '@/services/slotConfigurationService';
import { formatDistanceToNow } from 'date-fns';

const VersionHistoryModal = ({ 
  storeId, 
  pageType = 'cart', 
  isOpen, 
  onClose, 
  onRevert 
}) => {
  const [versionHistory, setVersionHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isReverting, setIsReverting] = useState(null);

  useEffect(() => {
    if (isOpen && storeId) {
      loadVersionHistory();
    }
  }, [isOpen, storeId, pageType]);

  const loadVersionHistory = async () => {
    setIsLoading(true);
    try {
      const response = await slotConfigurationService.getVersionHistory(storeId, pageType, 20);
      if (response.success) {
        setVersionHistory(response.data);
      }
    } catch (error) {
      console.error('Error loading version history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevert = async (versionId) => {
    if (!confirm('Are you sure you want to revert to this version? This will create a new published version and mark newer versions as reverted.')) {
      return;
    }

    setIsReverting(versionId);
    try {
      const response = await slotConfigurationService.revertToVersion(versionId);
      
      if (response.success) {
        // Reload history to show updated state
        await loadVersionHistory();
        
        // Notify parent component
        if (onRevert) {
          onRevert(response.data);
        }
        
        // Show success message briefly
        setTimeout(() => {
          alert('Successfully reverted to selected version!');
        }, 100);
      } else {
        alert('Failed to revert: ' + response.error);
      }
    } catch (error) {
      console.error('Error reverting version:', error);
      alert('Error reverting version: ' + error.message);
    } finally {
      setIsReverting(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'reverted':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return <Badge variant="outline" className="text-green-600 border-green-300">Published</Badge>;
      case 'reverted':
        return <Badge variant="outline" className="text-red-600 border-red-300">Reverted</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-600 border-gray-300">{status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Version History - Cart Configuration
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          {isLoading ? (
            <div className="text-center py-8 text-gray-600">
              Loading version history...
            </div>
          ) : versionHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              No published versions found
            </div>
          ) : (
            <div className="space-y-3">
              {versionHistory.map((version) => (
                <Card key={version.id} className={`border ${version.status === 'reverted' ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(version.status)}
                          <div>
                            <div className="font-medium text-gray-900">
                              Version {version.version_number}
                            </div>
                            <div className="text-sm text-gray-600">
                              {version.published_at && formatDistanceToNow(new Date(version.published_at), { addSuffix: true })}
                            </div>
                          </div>
                          {getStatusBadge(version.status)}
                        </div>
                        
                        {version.published_by && (
                          <div className="text-xs text-gray-500">
                            Published by user {version.published_by}
                          </div>
                        )}
                      </div>
                      
                      {version.status !== 'reverted' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevert(version.id)}
                          disabled={isReverting === version.id}
                          className="ml-4"
                        >
                          {isReverting === version.id ? (
                            <>
                              <div className="w-3 h-3 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-1" />
                              Reverting...
                            </>
                          ) : (
                            <>
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Revert
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VersionHistoryModal;