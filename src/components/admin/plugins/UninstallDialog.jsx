import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  Database, 
  FileX, 
  Shield, 
  Archive,
  Info
} from "lucide-react";

export default function UninstallDialog({ 
  isOpen, 
  onClose, 
  plugin, 
  onConfirm,
  isUninstalling = false 
}) {
  const [options, setOptions] = useState({
    removeCode: false,
    cleanupData: 'ask',
    cleanupTables: 'ask', 
    createBackup: true,
    force: false
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleOptionChange = (option, value) => {
    setOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };

  const handleConfirm = () => {
    onConfirm(plugin.slug, options);
  };

  if (!plugin) return null;

  const getCleanupBadgeColor = (value) => {
    switch(value) {
      case 'remove': return 'bg-red-100 text-red-700';
      case 'keep': return 'bg-green-100 text-green-700';
      case 'ask': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Uninstall Plugin: {plugin.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plugin Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {plugin.name.charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="font-medium">{plugin.name}</h3>
                <p className="text-sm text-gray-600">v{plugin.version} by {plugin.creator_name}</p>
              </div>
            </div>
            <p className="text-sm text-gray-700">{plugin.description}</p>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Warning</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Uninstalling this plugin will disable all its features immediately. 
                  Some data and configuration may be permanently lost depending on your cleanup choices.
                </p>
              </div>
            </div>
          </div>

          {/* Basic Options */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Uninstall Options
            </h4>

            {/* Backup Option */}
            <div className="flex items-center space-x-3">
              <Checkbox
                id="createBackup"
                checked={options.createBackup}
                onCheckedChange={(checked) => handleOptionChange('createBackup', checked)}
              />
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4 text-blue-500" />
                <label htmlFor="createBackup" className="text-sm font-medium cursor-pointer">
                  Create backup before uninstall
                </label>
                <Badge className="bg-blue-100 text-blue-700 text-xs">Recommended</Badge>
              </div>
            </div>
            <p className="text-xs text-gray-600 ml-6">
              Saves plugin code, configuration, and data for easy restoration
            </p>

            {/* Data Cleanup */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Database className="w-4 h-4 text-green-600" />
                Plugin Data Cleanup
              </label>
              <div className="ml-6 space-y-2">
                {['keep', 'ask', 'remove'].map(value => (
                  <div key={value} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`cleanupData-${value}`}
                      name="cleanupData"
                      checked={options.cleanupData === value}
                      onChange={() => handleOptionChange('cleanupData', value)}
                      className="text-blue-600"
                    />
                    <label htmlFor={`cleanupData-${value}`} className="text-sm cursor-pointer flex items-center gap-2">
                      <Badge className={getCleanupBadgeColor(value)}>
                        {value === 'keep' ? 'Keep all data' : 
                         value === 'ask' ? 'Ask me later' : 
                         'Remove all data'}
                      </Badge>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="border-t pt-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Info className="w-4 h-4" />
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-4 bg-gray-50 rounded-lg p-4">
                {/* Table Cleanup */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Database className="w-4 h-4 text-red-600" />
                    Database Tables
                  </label>
                  <div className="ml-6 space-y-2">
                    {['keep', 'ask', 'remove'].map(value => (
                      <div key={value} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id={`cleanupTables-${value}`}
                          name="cleanupTables"
                          checked={options.cleanupTables === value}
                          onChange={() => handleOptionChange('cleanupTables', value)}
                          className="text-blue-600"
                        />
                        <label htmlFor={`cleanupTables-${value}`} className="text-sm cursor-pointer flex items-center gap-2">
                          <Badge className={getCleanupBadgeColor(value)}>
                            {value === 'keep' ? 'Keep tables' : 
                             value === 'ask' ? 'Ask me later' : 
                             'Drop tables'}
                          </Badge>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Code Removal */}
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="removeCode"
                    checked={options.removeCode}
                    onCheckedChange={(checked) => handleOptionChange('removeCode', checked)}
                  />
                  <div className="flex items-center gap-2">
                    <FileX className="w-4 h-4 text-red-500" />
                    <label htmlFor="removeCode" className="text-sm font-medium cursor-pointer">
                      Remove plugin code files
                    </label>
                    <Badge className="bg-red-100 text-red-700 text-xs">Permanent</Badge>
                  </div>
                </div>
                <p className="text-xs text-gray-600 ml-6">
                  Completely removes plugin files from server (cannot be undone)
                </p>

                {/* Force Option */}
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="force"
                    checked={options.force}
                    onCheckedChange={(checked) => handleOptionChange('force', checked)}
                  />
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <label htmlFor="force" className="text-sm font-medium cursor-pointer">
                      Force uninstall
                    </label>
                    <Badge className="bg-orange-100 text-orange-700 text-xs">Dangerous</Badge>
                  </div>
                </div>
                <p className="text-xs text-gray-600 ml-6">
                  Override safety checks and dependency warnings
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isUninstalling}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isUninstalling}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isUninstalling ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uninstalling...
                </>
              ) : (
                'Uninstall Plugin'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}