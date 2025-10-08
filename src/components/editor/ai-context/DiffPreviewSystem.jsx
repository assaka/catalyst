/**
 * Modern Preview System - Replaces Old Diff System  
 * Uses the modern hook-based architecture for stable code changes
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Eye,
  Package,
  CheckCircle,
  XCircle,
  ArrowRight,
  ExternalLink,
  Zap,
  BarChart3
} from 'lucide-react';

// Import new systems
import PreviewSystem from './PreviewSystem.jsx';
import hookSystem from '@/core/HookSystem.js';
import eventSystem from '@/core/EventSystem.js';
import versionSystem from '@/core/VersionSystem.js';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';

const DiffPreviewSystem = ({ 
  originalCode = '', 
  modifiedCode = '', 
  fileName = '',
  language = 'javascript',
  onPreview,
  onPublish,
  className = '' 
}) => {
  const { selectedStore } = useStoreSelection();
  const [changes, setChanges] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [releaseData, setReleaseData] = useState(null);

  // Calculate changes using the new system
  useEffect(() => {
    if (originalCode && modifiedCode && originalCode !== modifiedCode) {
      const changeData = {
        id: `change_${Date.now()}`,
        filePath: fileName,
        originalCode,
        modifiedCode,
        language,
        timestamp: Date.now(),
        description: `Modified ${fileName}`,
        changeType: 'edit',
        linesChanged: Math.abs(modifiedCode.split('\n').length - originalCode.split('\n').length)
      };

      // Apply hooks to process the change
      const processedChange = hookSystem.apply('preview.processChange', changeData, {
        storeId: selectedStore?.id,
        fileName,
        language
      });

      setChanges([processedChange]);

      // Emit change detected event
      eventSystem.emit('preview.changeDetected', {
        change: processedChange,
        storeId: selectedStore?.id
      });
    } else {
      setChanges([]);
    }
  }, [originalCode, modifiedCode, fileName, language, selectedStore?.id]);

  // Handle preview generation
  const handlePreview = useCallback(async (previewData) => {
    try {
      console.log('🔍 Generating preview with new system...');
      
      // Apply preview hooks
      const enhancedPreviewData = hookSystem.apply('preview.beforeGenerate', previewData, {
        storeId: selectedStore?.id,
        changes
      });

      // Emit preview generated event
      eventSystem.emit('preview.generated', {
        previewData: enhancedPreviewData,
        storeId: selectedStore?.id,
        changes
      });

      if (onPreview) {
        onPreview(enhancedPreviewData);
      }

      setPreviewMode(true);
    } catch (error) {
      console.error('❌ Preview generation failed:', error);
      
      eventSystem.emit('preview.failed', {
        error: error.message,
        storeId: selectedStore?.id
      });
    }
  }, [selectedStore?.id, changes, onPreview]);

  // Handle release publishing
  const handlePublish = useCallback(async (publishData) => {
    try {
      console.log('🚀 Publishing release with new version system...');

      // Create release using the new version system
      const release = await versionSystem.createRelease({
        name: `Update ${fileName}`,
        description: `Updated ${fileName} with ${changes.length} change(s)`,
        changes,
        storeId: selectedStore?.id,
        createdBy: 'current-user', // This should come from auth context
        type: 'minor'
      });

      // Publish the release
      const publishedRelease = await versionSystem.publishRelease(release.id, {
        publishedBy: 'current-user',
        publishNotes: 'Published via preview system'
      });

      setReleaseData(publishedRelease);

      // Apply publish hooks
      hookSystem.do('preview.afterPublish', {
        release: publishedRelease,
        changes,
        storeId: selectedStore?.id
      });

      // Emit publish success event
      eventSystem.emit('preview.publishSuccess', {
        release: publishedRelease,
        storeId: selectedStore?.id
      });

      if (onPublish) {
        onPublish({
          ...publishData,
          release: publishedRelease
        });
      }

    } catch (error) {
      console.error('❌ Release publish failed:', error);
      
      eventSystem.emit('preview.publishFailed', {
        error: error.message,
        storeId: selectedStore?.id
      });
    }
  }, [fileName, changes, selectedStore?.id, onPublish]);

  // Apply rendering hooks
  const renderProps = hookSystem.apply('preview.renderProps', {
    originalCode,
    modifiedCode,
    fileName,
    language,
    changes,
    hasChanges: changes.length > 0,
    previewMode,
    releaseData
  }, {
    storeId: selectedStore?.id
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* System Status - Unified Plugin System */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Package className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="font-medium">Modern Preview System</h3>
              <p className="text-sm text-muted-foreground">
                Hook-based architecture with {Object.keys(hookSystem.getStats()).length} hooks registered
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-green-50 text-green-700">
              <CheckCircle className="w-3 h-3 mr-1" />
              Active
            </Badge>
          </div>
        </div>
      </Card>

      {/* Changes Summary */}
      {renderProps.hasChanges && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium">Changes Detected</h3>
              <p className="text-sm text-muted-foreground">
                {renderProps.changes.length} change(s) in {renderProps.fileName}
              </p>
            </div>
            <Badge variant="secondary">
              {renderProps.language.toUpperCase()}
            </Badge>
          </div>

          <div className="space-y-2">
            {renderProps.changes.map((change, index) => (
              <div key={change.id || index} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">{change.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {change.linesChanged} lines affected • {new Date(change.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Preview System Integration */}
      {renderProps.hasChanges && (
        <PreviewSystem
          changes={renderProps.changes}
          storeId={selectedStore?.id}
          onPreview={handlePreview}
          onPublish={handlePublish}
          className="border-t pt-6"
        />
      )}

      {/* Release Status */}
      {releaseData && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <h3 className="font-medium text-green-900">Release Published Successfully</h3>
              <p className="text-sm text-green-700 mt-1">
                Version {releaseData.version} has been published and is now live.
              </p>
            </div>
            <Button variant="outline" size="sm" className="text-green-700 border-green-300">
              <ExternalLink className="w-3 h-3 mr-1" />
              View Release
            </Button>
          </div>
        </Card>
      )}

      {/* No Changes State */}
      {!renderProps.hasChanges && (
        <Card className="p-8">
          <div className="text-center">
            <Eye className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No Changes Detected</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Make changes to your code to see them previewed here with the modern hook-based system.
            </p>
            <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
              <div className="flex items-center">
                <BarChart3 className="w-3 h-3 mr-1" />
                Hook System
              </div>
              <div className="flex items-center">
                <Zap className="w-3 h-3 mr-1" />
                Real-time Processing
              </div>
              <div className="flex items-center">
                <Package className="w-3 h-3 mr-1" />
                Plugin Ready
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DiffPreviewSystem;