/**
 * HybridCustomizationEditor - Unified interface combining slot-based and code-based editing
 * Provides both Easy Mode (slots) and Advanced Mode (direct code editing)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Code, 
  Zap, 
  ArrowLeftRight,
  AlertTriangle,
  Info,
  Eye,
  Save,
  FileText,
  Wrench,
  Layers,
  RefreshCw
} from 'lucide-react';

// Import both editing systems
import SlotsWorkspace from './SlotsWorkspace.jsx';
import CodeEditor from '@/components/ai-context/CodeEditor.jsx';
import { SlotConfiguration } from '@/api/entities';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import apiClient from '@/api/client';

// Component detection utility
const ComponentDetector = {
  detectFromPath(filePath) {
    if (filePath.includes('Cart')) return 'Cart';
    if (filePath.includes('ProductCard')) return 'ProductCard';
    if (filePath.includes('Checkout')) return 'Checkout';
    if (filePath.includes('ProductDetail')) return 'ProductDetail';
    return null;
  },

  getSlottedVersion(componentName) {
    const slottedVersions = {
      'Cart': 'CartSlotted',
      'ProductCard': 'ProductCardSlotted',
      'Checkout': 'CheckoutSlotted',
      'ProductDetail': 'ProductDetailSlotted'
    };
    return slottedVersions[componentName] || componentName;
  },

  getOriginalPath(componentName) {
    const paths = {
      'Cart': 'src/pages/Cart.jsx',
      'ProductCard': 'src/components/storefront/ProductCard.jsx',
      'Checkout': 'src/pages/Checkout.jsx',
      'ProductDetail': 'src/pages/ProductDetail.jsx'
    };
    return paths[componentName];
  }
};

const HybridCustomizationEditor = ({
  fileName = '',
  filePath = '',
  initialCode = '',
  language = 'javascript',
  userId,
  storeId,
  onSave = () => {},
  onCancel = () => {},
  className = ''
}) => {
  // State management
  const [editingMode, setEditingMode] = useState('nocode'); // 'nocode' | 'advanced' | 'expert'
  const [detectedComponent, setDetectedComponent] = useState(null);
  const [hasSlotSupport, setHasSlotSupport] = useState(false);
  const [currentCode, setCurrentCode] = useState(initialCode);
  const [slotConfig, setSlotConfig] = useState(null);
  const [showModeInfo, setShowModeInfo] = useState(true);
  const [isLoadingCode, setIsLoadingCode] = useState(false);
  const [actualFileCode, setActualFileCode] = useState(initialCode);

  // Store context
  const { selectedStore } = useStoreSelection();
  const effectiveStoreId = storeId || selectedStore?.id;

  // Detect component and slot support
  useEffect(() => {
    const component = ComponentDetector.detectFromPath(fileName || filePath);
    setDetectedComponent(component);
    setHasSlotSupport(!!component);
    
    console.log('🔍 Component detection:', {
      fileName,
      filePath,
      detectedComponent: component,
      hasSlotSupport: !!component
    });
  }, [fileName, filePath]);

  // Load actual file content if initialCode is empty
  useEffect(() => {
    const loadActualFileContent = async () => {
      if (initialCode || !filePath) return;
      
      setIsLoadingCode(true);
      try {
        console.log('🔄 HybridCustomizationEditor: Loading file content for:', filePath);
        const data = await apiClient.get(`extensions/baseline/${encodeURIComponent(filePath)}`);
        
        if (data && data.success && data.data.hasBaseline) {
          const fileContent = data.data.baselineCode;
          setActualFileCode(fileContent);
          setCurrentCode(fileContent);
          console.log('✅ HybridCustomizationEditor: Loaded file content:', fileContent.length, 'characters');
        } else {
          console.warn('⚠️ HybridCustomizationEditor: No baseline found for:', filePath);
        }
      } catch (error) {
        console.error('❌ HybridCustomizationEditor: Error loading file content:', error);
      } finally {
        setIsLoadingCode(false);
      }
    };

    loadActualFileContent();
  }, [filePath, initialCode]);

  // Load existing slot configuration
  useEffect(() => {
    const loadSlotConfiguration = async () => {
      if (!detectedComponent || !userId || !effectiveStoreId) return;

      try {
        const response = await SlotConfiguration.findActiveByUserStore(userId, effectiveStoreId);
        if (response && response.configuration) {
          setSlotConfig(response.configuration);
        }
      } catch (error) {
        console.error('Error loading slot configuration:', error);
      }
    };

    loadSlotConfiguration();
  }, [detectedComponent, userId, effectiveStoreId]);

  // Handle mode switching
  const handleModeSwitch = useCallback((newMode) => {
    if (newMode === editingMode) return;
    
    // Show confirmation if switching from expert mode with changes
    if (editingMode === 'expert' && currentCode !== initialCode) {
      const confirmSwitch = window.confirm(
        'You have unsaved code changes. Switching modes will discard these changes. Continue?'
      );
      if (!confirmSwitch) return;
    }

    setEditingMode(newMode);
  }, [editingMode, currentCode, initialCode]);

  // Handle code changes from advanced editor
  const handleCodeChange = useCallback((newCode) => {
    setCurrentCode(newCode);
  }, []);

  // Handle slot configuration save
  const handleSlotSave = useCallback(async (config) => {
    setSlotConfig(config);
    onSave({
      type: 'slot_config',
      config: config,
      componentName: detectedComponent
    });
  }, [detectedComponent, onSave]);

  // Handle code save
  const handleCodeSave = useCallback(async (codeData) => {
    onSave({
      type: 'code_change',
      fileName: fileName,
      filePath: filePath,
      originalCode: initialCode,
      modifiedCode: currentCode,
      ...codeData
    });
  }, [fileName, filePath, initialCode, currentCode, onSave]);

  // Render mode selection
  const ModeSelector = () => (
    <div className="flex items-center gap-2 mb-4">
      <Button
        variant={editingMode === 'nocode' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleModeSwitch('nocode')}
        disabled={!hasSlotSupport}
        className="flex items-center gap-2"
      >
        <Zap className="w-4 h-4" />
        No-Code
        <Badge variant="success" className="ml-1">Visual</Badge>
      </Button>
      
      <Button
        variant={editingMode === 'advanced' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleModeSwitch('advanced')}
        disabled={!hasSlotSupport}
        className="flex items-center gap-2"
      >
        <Settings className="w-4 h-4" />
        Advanced
        <Badge variant="info" className="ml-1">JSON</Badge>
      </Button>

      <Button
        variant={editingMode === 'expert' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleModeSwitch('expert')}
        className="flex items-center gap-2"
      >
        <Code className="w-4 h-4" />
        Expert
        <Badge variant="warning" className="ml-1">Code</Badge>
      </Button>

      <div className="flex items-center gap-2 ml-auto">
        <ArrowLeftRight className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-600">Switch anytime</span>
      </div>
    </div>
  );

  // Render mode information
  const ModeInfo = () => {
    if (!showModeInfo) return null;

    return (
      <Alert className="mb-4">
        <Info className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            {editingMode === 'nocode' ? (
              <>
                <strong>No-Code Mode:</strong> Visual drag-and-drop slot editing. 
                Perfect for beginners to change layout and content without any coding.
              </>
            ) : editingMode === 'advanced' ? (
              <>
                <strong>Advanced Mode:</strong> JSON-based slot configuration with powerful editing tools. 
                Full validation, diff view, and schema support for technical users.
              </>
            ) : (
              <>
                <strong>Expert Mode:</strong> Direct code editing with live preview. 
                Complete control over component implementation and custom logic.
              </>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowModeInfo(false)}
          >
            ×
          </Button>
        </AlertDescription>
      </Alert>
    );
  };

  // Render no slot support warning
  const NoSlotSupport = () => (
    <Alert className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <strong>Component not supported for No-Code/Advanced Mode.</strong><br />
        This component ({fileName || 'Unknown'}) doesn't support slot-based editing yet. 
        Only Expert Mode (direct code editing) is available.
        {detectedComponent && (
          <div className="mt-2 text-sm">
            <strong>Tip:</strong> Switch to the slotted version: {ComponentDetector.getSlottedVersion(detectedComponent)}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );

  return (
    <div className={`hybrid-customization-editor ${className}`}>
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              {editingMode === 'nocode' ? (
                <>
                  <Zap className="w-5 h-5 text-green-600" />
                  No-Code Visual Editor
                </>
              ) : editingMode === 'advanced' ? (
                <>
                  <Settings className="w-5 h-5 text-blue-600" />
                  Advanced JSON Editor
                </>
              ) : (
                <>
                  <Code className="w-5 h-5 text-purple-600" />
                  Expert Code Editor
                </>
              )}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {detectedComponent && (
                <Badge variant="outline">{detectedComponent}</Badge>
              )}
              {hasSlotSupport && (
                <Badge variant="success">Slot Supported</Badge>
              )}
              {(editingMode === 'nocode' || editingMode === 'advanced') && slotConfig && (
                <Badge variant="info">
                  {Object.keys(slotConfig.slots || {}).length} slots configured
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {!hasSlotSupport && <NoSlotSupport />}
          
          <ModeSelector />
          <ModeInfo />

          {/* No-Code Mode - Visual slot editing */}
          {editingMode === 'nocode' && hasSlotSupport && (
            <div className="min-h-[600px]">
              <div className="text-center p-8 bg-blue-50 rounded-lg border-2 border-blue-200">
                <Zap className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Visual Slot Editor Coming Soon</h3>
                <p className="text-gray-600 mb-4">
                  The drag-and-drop visual editor is currently in development. 
                  Use Advanced Mode for JSON-based slot editing.
                </p>
                <Button 
                  onClick={() => setEditingMode('advanced')}
                  className="flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Switch to Advanced Mode
                </Button>
              </div>
            </div>
          )}

          {/* Advanced Mode - JSON-based slot configuration */}
          {editingMode === 'advanced' && hasSlotSupport && (
            <div className="min-h-[600px]">
              <SlotsWorkspace
                componentName={detectedComponent}
                userId={userId}
                storeId={effectiveStoreId}
                initialUserConfig={slotConfig}
                onSave={handleSlotSave}
                onCancel={onCancel}
              />
            </div>
          )}

          {/* Expert Mode - Direct code editing */}
          {editingMode === 'expert' && (
            <div className="min-h-[600px]">
              {isLoadingCode ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  Loading file content...
                </div>
              ) : (
                <CodeEditor
                  fileName={fileName}
                  filePath={filePath}
                  initialCode={actualFileCode || initialCode}
                  language={language}
                  onChange={handleCodeChange}
                  onSave={handleCodeSave}
                  onCancel={onCancel}
                  className="h-full"
                />
              )}
            </div>
          )}

          {/* Fallback when slot-based modes selected but no slot support */}
          {(editingMode === 'nocode' || editingMode === 'advanced') && !hasSlotSupport && (
            <div className="min-h-[400px] flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center p-8">
                <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Slot-Based Modes Not Available</h3>
                <p className="text-gray-600 mb-4">
                  This component doesn't support slot-based editing yet.
                </p>
                <Button 
                  onClick={() => setEditingMode('expert')}
                  className="flex items-center gap-2"
                >
                  <Code className="w-4 h-4" />
                  Switch to Expert Mode
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mode comparison info panel */}
      <Card className="mt-4">
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                No-Code Mode
              </h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Drag-and-drop editing</li>
                <li>• No coding required</li>
                <li>• Visual slot arrangement</li>
                <li>• Perfect for beginners</li>
                <li>• Error-proof interface</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Advanced Mode
              </h4>
              <ul className="space-y-1 text-gray-600">
                <li>• JSON-based configuration</li>
                <li>• Schema validation</li>
                <li>• Diff view and history</li>
                <li>• Powerful editing tools</li>
                <li>• Technical user friendly</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-purple-700 mb-2 flex items-center gap-2">
                <Code className="w-4 h-4" />
                Expert Mode
              </h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Direct code editing</li>
                <li>• Custom logic implementation</li>
                <li>• Full component control</li>
                <li>• Complex customizations</li>
                <li>• Developer-focused</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HybridCustomizationEditor;