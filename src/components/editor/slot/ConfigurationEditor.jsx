/**
 * ConfigurationEditor - Advanced JSON editor for slot configurations
 * Features diff view between default and user configurations with live validation
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Editor, { DiffEditor } from '@monaco-editor/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Code, 
  Diff, 
  Check, 
  AlertTriangle, 
  Eye, 
  EyeOff,
  RotateCcw,
  Copy,
  Download,
  Upload,
  Maximize2,
  Minimize2,
  Info
} from 'lucide-react';

import { 
  SlotConfigurationJSONSchema, 
  ValidationUtils, 
  ComponentSlotDefinitions 
} from './types.js';

const ConfigurationEditor = ({
  defaultConfig = { version: '1.0', slots: {}, metadata: {} },
  userConfig = { version: '1.0', slots: {}, metadata: {} },
  componentName = 'ProductCard',
  onChange = () => {},
  slotDefinitions = {},
  theme = 'vs-dark',
  readOnly = false,
  className = ''
}) => {
  // State management
  const [editorMode, setEditorMode] = useState('diff'); // 'diff', 'user', 'default'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isValid, setIsValid] = useState(true);
  const [showValidation, setShowValidation] = useState(true);
  const [editorValue, setEditorValue] = useState('');
  const [lastValidConfig, setLastValidConfig] = useState(userConfig);

  // Refs
  const editorRef = useRef(null);
  const diffEditorRef = useRef(null);

  // Get component slot definitions
  const componentDef = ComponentSlotDefinitions[componentName] || {
    name: componentName,
    availableSlots: [],
    defaultProps: {}
  };

  // Format JSON for display
  const formatJSON = useCallback((obj) => {
    return JSON.stringify(obj, null, 2);
  }, []);

  // Initialize editor value
  useEffect(() => {
    const formatted = formatJSON(userConfig);
    setEditorValue(formatted);
  }, [userConfig, formatJSON]);

  // Validate configuration
  const validateConfig = useCallback((configString) => {
    try {
      const config = JSON.parse(configString);
      const validation = ValidationUtils.validateConfiguration(config);
      
      // Additional validation for component-specific slots
      const componentErrors = [];
      if (config.slots) {
        Object.keys(config.slots).forEach(slotId => {
          if (!componentDef.availableSlots.includes(slotId)) {
            componentErrors.push(`Slot "${slotId}" is not available for ${componentName} component`);
          }
        });
      }

      const allErrors = [...validation.errors, ...componentErrors];
      
      setValidationErrors(allErrors);
      setIsValid(allErrors.length === 0);
      
      return {
        valid: allErrors.length === 0,
        errors: allErrors,
        config: config
      };
    } catch (error) {
      const errors = [`Invalid JSON: ${error.message}`];
      setValidationErrors(errors);
      setIsValid(false);
      return {
        valid: false,
        errors: errors,
        config: null
      };
    }
  }, [componentDef.availableSlots, componentName]);

  // Handle editor changes
  const handleEditorChange = useCallback((value) => {
    if (!value) return;
    
    setEditorValue(value);
    
    const validation = validateConfig(value);
    if (validation.valid && validation.config) {
      setLastValidConfig(validation.config);
      onChange(validation.config);
    }
  }, [validateConfig, onChange]);

  // Monaco editor setup
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Configure JSON schema validation
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemas: [{
        uri: 'http://myserver/slot-config-schema.json',
        fileMatch: ['*'],
        schema: SlotConfigurationJSONSchema
      }]
    });

    // Add custom completion provider for slot IDs
    monaco.languages.registerCompletionItemProvider('json', {
      provideCompletionItems: (model, position) => {
        const suggestions = componentDef.availableSlots.map(slotId => ({
          label: slotId,
          kind: monaco.languages.CompletionItemKind.Property,
          insertText: `"${slotId}": {\n  "enabled": true,\n  "order": 1,\n  "props": {}\n}`,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: `Slot configuration for ${slotId}`,
          detail: `Available slot for ${componentName}`
        }));
        
        return { suggestions };
      }
    });
  };

  // Diff editor setup
  const handleDiffEditorDidMount = (editor, monaco) => {
    diffEditorRef.current = editor;
    
    // Configure the diff editor
    editor.getModifiedEditor().onDidChangeModelContent(() => {
      const value = editor.getModifiedEditor().getValue();
      handleEditorChange(value);
    });
  };

  // Action handlers
  const handleReset = () => {
    const defaultUserConfig = { version: '1.0', slots: {}, metadata: {} };
    const formatted = formatJSON(defaultUserConfig);
    setEditorValue(formatted);
    setLastValidConfig(defaultUserConfig);
    onChange(defaultUserConfig);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editorValue);
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy configuration:', error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([editorValue], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${componentName.toLowerCase()}-slot-config.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      setEditorValue(content);
      handleEditorChange(content);
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  // Render validation panel
  const ValidationPanel = () => (
    <Card className="mt-4">
      <CardHeader className="py-2">
        <CardTitle className="text-sm flex items-center gap-2">
          {isValid ? (
            <>
              <Check className="w-4 h-4 text-green-500" />
              Configuration Valid
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Validation Errors ({validationErrors.length})
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowValidation(!showValidation)}
          >
            {showValidation ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      {showValidation && !isValid && (
        <CardContent className="py-2">
          <div className="space-y-1">
            {validationErrors.map((error, index) => (
              <div key={index} className="text-sm text-red-600 flex items-start gap-2">
                <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );

  // Main render
  return (
    <div className={`slot-configuration-editor ${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      <Card className="h-full">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">
                Slot Configuration Editor
              </CardTitle>
              <Badge variant="outline">
                {componentDef.displayName || componentName}
              </Badge>
              <Badge variant={isValid ? 'success' : 'destructive'}>
                {isValid ? 'Valid' : 'Invalid'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                title="Copy configuration"
              >
                <Copy className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                title="Download configuration"
              >
                <Download className="w-4 h-4" />
              </Button>
              
              <label className="cursor-pointer">
                <Button
                  variant="outline"
                  size="sm"
                  title="Upload configuration"
                  asChild
                >
                  <span>
                    <Upload className="w-4 h-4" />
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleUpload}
                  className="hidden"
                />
              </label>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                title="Reset to default"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs value={editorMode} onValueChange={setEditorMode} className="h-full">
            <div className="px-4 py-2 border-b">
              <TabsList>
                <TabsTrigger value="diff" className="flex items-center gap-2">
                  <Diff className="w-4 h-4" />
                  Diff View
                </TabsTrigger>
                <TabsTrigger value="user" className="flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  User Config
                </TabsTrigger>
                <TabsTrigger value="default" className="flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Default Config
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="px-4" style={{ height: isFullscreen ? 'calc(100vh - 200px)' : '500px' }}>
              <TabsContent value="diff" className="h-full">
                <DiffEditor
                  height="100%"
                  language="json"
                  theme={theme}
                  original={formatJSON(defaultConfig)}
                  modified={editorValue}
                  onMount={handleDiffEditorDidMount}
                  options={{
                    renderSideBySide: true,
                    readOnly: false,
                    originalEditable: false,
                    automaticLayout: true,
                    minimap: { enabled: true },
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    formatOnPaste: true,
                    formatOnType: true
                  }}
                />
              </TabsContent>

              <TabsContent value="user" className="h-full">
                <Editor
                  height="100%"
                  language="json"
                  theme={theme}
                  value={editorValue}
                  onChange={handleEditorChange}
                  onMount={handleEditorDidMount}
                  options={{
                    readOnly: readOnly,
                    automaticLayout: true,
                    minimap: { enabled: true },
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    formatOnPaste: true,
                    formatOnType: true,
                    suggestOnTriggerCharacters: true,
                    quickSuggestions: true,
                    parameterHints: { enabled: true }
                  }}
                />
              </TabsContent>

              <TabsContent value="default" className="h-full">
                <Editor
                  height="100%"
                  language="json"
                  theme={theme}
                  value={formatJSON(defaultConfig)}
                  options={{
                    readOnly: true,
                    automaticLayout: true,
                    minimap: { enabled: true },
                    scrollBeyondLastLine: false,
                    wordWrap: 'on'
                  }}
                />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      <ValidationPanel />
    </div>
  );
};

export default ConfigurationEditor;