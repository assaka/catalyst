import { useState, useCallback, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Play, 
  Save, 
  Code, 
  Settings, 
  Info,
  CheckCircle,
  AlertCircle,
  Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  PARAMETER_TYPES, 
  FEATURE_CONTEXTS, 
  FEATURE_CATEGORIES,
  featureRegistry 
} from '../../../utils/featureBuilder/FeatureRegistry';

const CustomFeatureBuilder = ({ 
  onFeatureCreated, 
  onFeatureUpdated,
  editingFeature = null,
  context = FEATURE_CONTEXTS.SLOT_INTERACTION,
  userId,
  onClose 
}) => {
  // Feature definition state
  const [featureData, setFeatureData] = useState({
    name: '',
    description: '',
    category: FEATURE_CATEGORIES.UI_INTERACTION,
    contexts: [context],
    parameters: [],
    code: '',
    examples: [],
    tags: []
  });

  // UI state
  const [activeTab, setActiveTab] = useState('basic');
  const [testParameters, setTestParameters] = useState({});
  const [testResult, setTestResult] = useState(null);
  const [validation, setValidation] = useState({ isValid: true, errors: [] });
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load editing feature
  useEffect(() => {
    if (editingFeature) {
      setFeatureData({
        name: editingFeature.name || '',
        description: editingFeature.description || '',
        category: editingFeature.category || FEATURE_CATEGORIES.UI_INTERACTION,
        contexts: editingFeature.contexts || [context],
        parameters: editingFeature.parameters || [],
        code: editingFeature.code || '',
        examples: editingFeature.examples || [],
        tags: editingFeature.tags || []
      });
      
      // Initialize test parameters with defaults
      const testParams = {};
      (editingFeature.parameters || []).forEach(param => {
        if (param.default !== undefined) {
          testParams[param.name] = param.default;
        }
      });
      setTestParameters(testParams);
    }
  }, [editingFeature, context]);

  // Validate feature data
  useEffect(() => {
    const validation = featureRegistry.validateFeatureDefinition(featureData);
    setValidation(validation);
  }, [featureData]);

  // Add parameter
  const addParameter = useCallback(() => {
    setFeatureData(prev => ({
      ...prev,
      parameters: [
        ...prev.parameters,
        {
          name: '',
          type: 'text',
          required: false,
          default: '',
          description: ''
        }
      ]
    }));
  }, []);

  // Update parameter
  const updateParameter = useCallback((index, field, value) => {
    setFeatureData(prev => ({
      ...prev,
      parameters: prev.parameters.map((param, i) => 
        i === index ? { ...param, [field]: value } : param
      )
    }));
  }, []);

  // Remove parameter
  const removeParameter = useCallback((index) => {
    setFeatureData(prev => ({
      ...prev,
      parameters: prev.parameters.filter((_, i) => i !== index)
    }));
  }, []);

  // Update test parameter value
  const updateTestParameter = useCallback((paramName, value) => {
    setTestParameters(prev => ({
      ...prev,
      [paramName]: value
    }));
  }, []);

  // Test feature execution
  const testFeature = useCallback(async () => {
    if (!validation.isValid) {
      setTestResult({
        success: false,
        error: 'Feature definition is invalid: ' + validation.errors.join(', ')
      });
      return;
    }

    setIsTesting(true);
    try {
      // Create temporary feature for testing
      const tempFeatureId = `temp_${Date.now()}`;
      const registerResult = featureRegistry.registerCustom(tempFeatureId, featureData, userId);
      
      if (!registerResult.success) {
        setTestResult({
          success: false,
          error: 'Feature registration failed: ' + registerResult.errors.join(', ')
        });
        return;
      }

      // Execute the feature
      const result = await featureRegistry.executeFeature(
        tempFeatureId, 
        testParameters,
        {
          userId,
          storeId: 'test',
          slotId: 'test-slot',
          elementId: 'test-element'
        }
      );

      setTestResult({
        success: true,
        result: result,
        message: 'Feature executed successfully!'
      });

    } catch (error) {
      setTestResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsTesting(false);
    }
  }, [featureData, testParameters, validation, userId]);

  // Save feature
  const saveFeature = useCallback(async () => {
    if (!validation.isValid) return;

    setIsSaving(true);
    try {
      const featureId = editingFeature?.id || `custom_${Date.now()}_${userId}`;
      const result = featureRegistry.registerCustom(featureId, featureData, userId);
      
      if (result.success) {
        if (editingFeature) {
          onFeatureUpdated?.(featureId, featureData);
        } else {
          onFeatureCreated?.(featureId, featureData);
        }
        onClose?.();
      } else {
        setTestResult({
          success: false,
          error: 'Failed to save feature: ' + result.errors.join(', ')
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsSaving(false);
    }
  }, [featureData, validation, editingFeature, userId, onFeatureCreated, onFeatureUpdated, onClose]);

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {editingFeature ? 'Edit Custom Feature' : 'Create Custom Feature'}
          </h2>
          <p className="text-gray-600">
            Build reusable functionality for your slots and plugins
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={testFeature}
            disabled={!validation.isValid || isTesting}
          >
            <Play className="w-4 h-4 mr-2" />
            {isTesting ? 'Testing...' : 'Test'}
          </Button>
          <Button 
            onClick={saveFeature}
            disabled={!validation.isValid || isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Feature'}
          </Button>
        </div>
      </div>

      {/* Validation Status */}
      {!validation.isValid && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">Validation Errors</h4>
                <ul className="text-sm text-red-700 mt-1">
                  {validation.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Result */}
      {testResult && (
        <Card className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              )}
              <div>
                <h4 className={`font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {testResult.success ? 'Test Successful' : 'Test Failed'}
                </h4>
                <p className={`text-sm mt-1 ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                  {testResult.message || testResult.error}
                </p>
                {testResult.result && (
                  <pre className="text-xs mt-2 p-2 bg-white rounded border">
                    {JSON.stringify(testResult.result, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="parameters">Parameters</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
          <TabsTrigger value="test">Test</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Feature Information
              </CardTitle>
              <CardDescription>
                Define the basic properties of your custom feature
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Feature Name *</Label>
                  <Input
                    id="name"
                    value={featureData.name}
                    onChange={(e) => setFeatureData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Product Comparison"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={featureData.category} 
                    onValueChange={(value) => setFeatureData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(FEATURE_CATEGORIES).map(([key, value]) => (
                        <SelectItem key={key} value={value}>
                          {key.toLowerCase().replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={featureData.description}
                  onChange={(e) => setFeatureData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this feature does and how it works..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Available Contexts</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {Object.entries(FEATURE_CONTEXTS).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={value}
                        checked={featureData.contexts.includes(value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFeatureData(prev => ({
                              ...prev,
                              contexts: [...prev.contexts, value]
                            }));
                          } else {
                            setFeatureData(prev => ({
                              ...prev,
                              contexts: prev.contexts.filter(c => c !== value)
                            }));
                          }
                        }}
                      />
                      <label htmlFor={value} className="text-sm">
                        {key.toLowerCase().replace('_', ' ')}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Parameters Tab */}
        <TabsContent value="parameters" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Feature Parameters
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={addParameter}
                  className="ml-auto"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Parameter
                </Button>
              </CardTitle>
              <CardDescription>
                Define input parameters that users can configure when using this feature
              </CardDescription>
            </CardHeader>
            <CardContent>
              {featureData.parameters.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No parameters defined</p>
                  <p className="text-sm">Add parameters to make your feature configurable</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {featureData.parameters.map((param, index) => (
                    <Card key={index} className="p-4">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label>Parameter Name *</Label>
                          <Input
                            value={param.name}
                            onChange={(e) => updateParameter(index, 'name', e.target.value)}
                            placeholder="e.g., productId"
                          />
                        </div>
                        <div>
                          <Label>Type</Label>
                          <Select 
                            value={param.type} 
                            onValueChange={(value) => updateParameter(index, 'type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(PARAMETER_TYPES).map(([key, type]) => (
                                <SelectItem key={key} value={type.type}>
                                  {type.type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label>Default Value</Label>
                          <Input
                            value={param.default || ''}
                            onChange={(e) => updateParameter(index, 'default', e.target.value)}
                            placeholder="Optional default value"
                          />
                        </div>
                        <div className="flex items-center space-x-2 pt-6">
                          <Checkbox
                            id={`required-${index}`}
                            checked={param.required || false}
                            onCheckedChange={(checked) => updateParameter(index, 'required', checked)}
                          />
                          <label htmlFor={`required-${index}`} className="text-sm">
                            Required parameter
                          </label>
                        </div>
                      </div>

                      <div>
                        <Label>Description</Label>
                        <Input
                          value={param.description || ''}
                          onChange={(e) => updateParameter(index, 'description', e.target.value)}
                          placeholder="Describe what this parameter does"
                        />
                      </div>

                      <div className="flex justify-end mt-4">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeParameter(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Code Tab */}
        <TabsContent value="code" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Feature Code
              </CardTitle>
              <CardDescription>
                Write the JavaScript code that implements your feature functionality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Lightbulb className="w-4 h-4 mr-2" />
                      {showAdvanced ? 'Hide' : 'Show'} API Reference
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2">Available API Methods:</h4>
                        <div className="text-sm space-y-1 font-mono">
                          <div><code>api.getData(key)</code> - Get stored data</div>
                          <div><code>api.setData(key, value)</code> - Store data</div>
                          <div><code>api.showToast(message, type)</code> - Show notification</div>
                          <div><code>api.addClass(elementId, className)</code> - Add CSS class</div>
                          <div><code>api.removeClass(elementId, className)</code> - Remove CSS class</div>
                          <div><code>api.setText(elementId, text)</code> - Update element text</div>
                          <div><code>api.fetch(url, options)</code> - Make HTTP request</div>
                          <div><code>api.emit(eventName, data)</code> - Emit custom event</div>
                          <div><code>params.parameterName</code> - Access parameters</div>
                          <div><code>context.userId, context.storeId</code> - Context info</div>
                        </div>
                      </CardContent>
                    </Card>
                  </CollapsibleContent>
                </Collapsible>

                <div>
                  <Label htmlFor="code">JavaScript Code</Label>
                  <Textarea
                    id="code"
                    value={featureData.code}
                    onChange={(e) => setFeatureData(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="// Write your feature code here
// Example:
const productId = params.productId;
const currentWishlist = api.getData('wishlist') || [];

if (currentWishlist.includes(productId)) {
  // Remove from wishlist
  const updated = currentWishlist.filter(id => id !== productId);
  api.setData('wishlist', updated);
  api.showToast('Removed from wishlist', 'info');
} else {
  // Add to wishlist
  currentWishlist.push(productId);
  api.setData('wishlist', currentWishlist);
  api.showToast('Added to wishlist!', 'success');
}

return { success: true, wishlistCount: currentWishlist.length };"
                    rows={15}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Tab */}
        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Test Feature
              </CardTitle>
              <CardDescription>
                Test your feature with sample parameters before saving
              </CardDescription>
            </CardHeader>
            <CardContent>
              {featureData.parameters.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="font-medium">Test Parameters</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {featureData.parameters.map((param) => (
                      <div key={param.name}>
                        <Label htmlFor={`test-${param.name}`}>
                          {param.name} 
                          {param.required && <span className="text-red-500">*</span>}
                          {param.type && <span className="text-gray-500 text-xs ml-1">({param.type})</span>}
                        </Label>
                        <Input
                          id={`test-${param.name}`}
                          type={param.type === 'number' ? 'number' : param.type === 'email' ? 'email' : 'text'}
                          value={testParameters[param.name] || ''}
                          onChange={(e) => updateTestParameter(param.name, e.target.value)}
                          placeholder={param.default ? `Default: ${param.default}` : `Enter ${param.name}`}
                        />
                        {param.description && (
                          <p className="text-xs text-gray-500 mt-1">{param.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No parameters to configure for testing.</p>
              )}

              <div className="flex justify-center pt-4">
                <Button 
                  onClick={testFeature}
                  disabled={!validation.isValid || isTesting}
                  size="lg"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {isTesting ? 'Running Test...' : 'Test Feature'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomFeatureBuilder;