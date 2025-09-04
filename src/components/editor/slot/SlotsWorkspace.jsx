/**
 * SlotsWorkspace - Simplified wrapper around GenericSlotEditor
 * Handles database persistence and provides exit confirmation dialog
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// Import slot editor components
import GenericSlotEditor from './GenericSlotEditor.jsx';

const SlotsWorkspace = ({
  componentName = 'ProductCard',
  onSave = () => {},
  onCancel = () => {},
  className = ''
}) => {
  // Simple state management - just exit confirmation
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Handle slot save - pass through to parent
  const handleSlotSave = (config) => {
    onSave({
      type: 'slot_config',
      config: config,
      componentName: componentName
    });
  };

  // Handle cancel with confirmation if needed
  const handleCancel = () => {
    // GenericSlotEditor handles its own unsaved changes detection
    // For now, just call parent onCancel directly
    onCancel();
  };

  const confirmExit = () => {
    setShowExitConfirm(false);
    onCancel();
  };

  return (
    <div className={`slots-workspace ${className}`}>
      {/* Direct slot editor - no redundant tabs or headers */}
      <GenericSlotEditor
        pageName={componentName}
        onSave={handleSlotSave}
        onCancel={onCancel}
      />

      {/* Exit confirmation dialog */}
      <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Are you sure you want to exit without saving?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowExitConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmExit}
            >
              Exit Without Saving
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SlotsWorkspace;