/**
 * Generic Slot Dialog and Modal Utilities
 * Extracted from CartSlotsEditor.jsx to be reusable across all page editors
 */

import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Editor from '@monaco-editor/react';

/**
 * Generic Add Slot Dialog Component
 */
export function AddSlotDialog({
  showAddSlotDialog,
  setShowAddSlotDialog,
  currentParentSlot,
  setCurrentParentSlot,
  newSlotType,
  setNewSlotType,
  newSlotName,
  setNewSlotName,
  newSlotContent,
  setNewSlotContent,
  onAddSlot,
  availableParentSlots = [],
  slotTypes = [
    { value: 'text', label: 'Text' },
    { value: 'html', label: 'HTML' },
    { value: 'component', label: 'Component' }
  ]
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onAddSlot) {
      onAddSlot();
    }
  };

  return (
    <Dialog open={showAddSlotDialog} onOpenChange={setShowAddSlotDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Custom Slot</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="parent-slot">Parent Slot</Label>
            <Select value={currentParentSlot} onValueChange={setCurrentParentSlot}>
              <SelectTrigger>
                <SelectValue placeholder="Select parent slot" />
              </SelectTrigger>
              <SelectContent>
                {availableParentSlots.map(slot => (
                  <SelectItem key={slot.id} value={slot.id}>
                    {slot.name || slot.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="slot-type">Slot Type</Label>
            <Select value={newSlotType} onValueChange={setNewSlotType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {slotTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="slot-name">Slot Name</Label>
            <Input
              id="slot-name"
              value={newSlotName}
              onChange={(e) => setNewSlotName(e.target.value)}
              placeholder="Enter slot name"
              required
            />
          </div>

          <div>
            <Label htmlFor="slot-content">Initial Content</Label>
            <Textarea
              id="slot-content"
              value={newSlotContent}
              onChange={(e) => setNewSlotContent(e.target.value)}
              placeholder={
                newSlotType === 'html' ? 'Enter HTML content...' :
                newSlotType === 'component' ? 'Enter component code...' :
                'Enter text content...'
              }
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowAddSlotDialog(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Add Slot
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Generic Delete Confirmation Dialog
 */
export function DeleteConfirmationDialog({
  deleteConfirm,
  setDeleteConfirm,
  onConfirmDelete
}) {
  const handleConfirm = () => {
    if (onConfirmDelete) {
      onConfirmDelete(deleteConfirm.slotId);
    }
    setDeleteConfirm({ show: false, slotId: null, slotLabel: '' });
  };

  return (
    <Dialog open={deleteConfirm.show} onOpenChange={(open) => 
      !open && setDeleteConfirm({ show: false, slotId: null, slotLabel: '' })
    }>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete the slot "{deleteConfirm.slotLabel}"? 
            This action cannot be undone.
          </p>
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setDeleteConfirm({ show: false, slotId: null, slotLabel: '' })}
          >
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Generic Code Editor Dialog
 */
export function CodeEditorDialog({
  editingComponent,
  setEditingComponent,
  tempCode,
  setTempCode,
  onSaveCode,
  title = "Edit Code",
  language = "javascript"
}) {
  const handleSave = () => {
    if (onSaveCode) {
      onSaveCode();
    }
  };

  const handleCancel = () => {
    setEditingComponent(null);
    setTempCode('');
  };

  return (
    <Dialog open={!!editingComponent} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title} - {editingComponent}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 border rounded-lg overflow-hidden">
          <Editor
            height="100%"
            defaultLanguage={language}
            value={tempCode}
            onChange={(value) => setTempCode(value || '')}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 14,
              wordWrap: 'on',
              automaticLayout: true,
            }}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Generic Reset Configuration Dialog
 */
export function ResetConfigurationDialog({
  showResetModal,
  setShowResetModal,
  onConfirmReset,
  pageType = 'page'
}) {
  const handleConfirm = () => {
    if (onConfirmReset) {
      onConfirmReset();
    }
    setShowResetModal(false);
  };

  return (
    <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset {pageType.charAt(0).toUpperCase() + pageType.slice(1)} Configuration</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to reset the {pageType} configuration to default values? 
            This will remove all your customizations and cannot be undone.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setShowResetModal(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm}>
            Reset Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Generic Publish Changes Dialog/Panel
 */
export function PublishPanel({
  isPublishing,
  publishSuccess,
  onPublish,
  pageType = 'page',
  hasChanges = false
}) {
  const getStatusColor = () => {
    if (isPublishing) return 'text-blue-600';
    if (publishSuccess === true) return 'text-green-600';
    if (publishSuccess === false) return 'text-red-600';
    return 'text-gray-600';
  };

  const getStatusText = () => {
    if (isPublishing) return 'Publishing...';
    if (publishSuccess === true) return 'Published successfully!';
    if (publishSuccess === false) return 'Failed to publish';
    return hasChanges ? 'Ready to publish' : 'No changes to publish';
  };

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">
            Publish {pageType.charAt(0).toUpperCase() + pageType.slice(1)} Changes
          </h3>
          <p className={`text-sm ${getStatusColor()}`}>
            {getStatusText()}
          </p>
        </div>
        
        <Button
          onClick={onPublish}
          disabled={isPublishing || !hasChanges}
          size="sm"
          className="ml-4"
        >
          {isPublishing ? 'Publishing...' : 'Publish'}
        </Button>
      </div>

      {publishSuccess === false && (
        <div className="mt-2 text-sm text-red-600">
          There was an error publishing your changes. Please try again.
        </div>
      )}
    </div>
  );
}

/**
 * Generic View Mode Selector
 */
export function ViewModeSelector({
  viewMode,
  setViewMode,
  availableModes = [
    { value: 'edit', label: 'Edit Mode' },
    { value: 'preview', label: 'Preview Mode' }
  ]
}) {
  return (
    <div className="flex items-center space-x-2">
      <Label htmlFor="view-mode">View Mode:</Label>
      <Select value={viewMode} onValueChange={setViewMode}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableModes.map(mode => (
            <SelectItem key={mode.value} value={mode.value}>
              {mode.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Generic Save Status Indicator
 */
export function SaveStatusIndicator({
  saveStatus,
  className = ""
}) {
  const getStatusDisplay = () => {
    switch (saveStatus) {
      case 'saving':
        return { text: 'Saving...', color: 'text-blue-600', icon: '💾' };
      case 'saved':
        return { text: 'Saved', color: 'text-green-600', icon: '✅' };
      case 'error':
        return { text: 'Error saving', color: 'text-red-600', icon: '❌' };
      default:
        return null;
    }
  };

  const status = getStatusDisplay();
  if (!status) return null;

  return (
    <div className={`flex items-center space-x-1 text-sm ${status.color} ${className}`}>
      <span>{status.icon}</span>
      <span>{status.text}</span>
    </div>
  );
}

/**
 * Hook for managing dialog state
 */
export function useSlotDialogs() {
  const [showAddSlotDialog, setShowAddSlotDialog] = React.useState(false);
  const [showResetModal, setShowResetModal] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState({ 
    show: false, 
    slotId: null, 
    slotLabel: '' 
  });
  const [editingComponent, setEditingComponent] = React.useState(null);
  const [tempCode, setTempCode] = React.useState('');

  const openAddSlotDialog = (parentSlot) => {
    setCurrentParentSlot(parentSlot);
    setShowAddSlotDialog(true);
  };

  const openDeleteConfirm = (slotId, slotLabel) => {
    setDeleteConfirm({
      show: true,
      slotId,
      slotLabel: slotLabel || slotId
    });
  };

  const openCodeEditor = (componentId, code = '') => {
    setEditingComponent(componentId);
    setTempCode(code);
  };

  const closeAllDialogs = () => {
    setShowAddSlotDialog(false);
    setShowResetModal(false);
    setDeleteConfirm({ show: false, slotId: null, slotLabel: '' });
    setEditingComponent(null);
    setTempCode('');
  };

  return {
    // State
    showAddSlotDialog,
    setShowAddSlotDialog,
    showResetModal,
    setShowResetModal,
    deleteConfirm,
    setDeleteConfirm,
    editingComponent,
    setEditingComponent,
    tempCode,
    setTempCode,
    
    // Actions
    openAddSlotDialog,
    openDeleteConfirm,
    openCodeEditor,
    closeAllDialogs
  };
}