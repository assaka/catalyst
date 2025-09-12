import { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  Zap, 
  Plus, 
  Settings, 
  ChevronDown, 
  ChevronRight,
  Play,
  Edit,
  Trash2,
  Copy,
  Share2
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { featureRegistry, FEATURE_CONTEXTS } from '../../../utils/featureBuilder/FeatureRegistry';
import CustomFeatureBuilder from './CustomFeatureBuilder';

const FeatureIntegration = ({ 
  slotId,
  elementId,
  context = FEATURE_CONTEXTS.SLOT_INTERACTION,
  userId,
  storeId,
  onFeatureExecuted,
  slotConfig 
}) => {
  // State management
  const [availableFeatures, setAvailableFeatures] = useState([]);
  const [assignedFeatures, setAssignedFeatures] = useState([]);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [featureParams, setFeatureParams] = useState({});
  const [expandedFeatures, setExpandedFeatures] = useState(new Set());
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [editingFeature, setEditingFeature] = useState(null);

  // Load available features for this context
  const contextFeatures = useMemo(() => {
    return featureRegistry.getFeaturesForContext(context);
  }, [context]);

  // Load features on component mount and context change
  useEffect(() => {
    setAvailableFeatures(contextFeatures);
  }, [contextFeatures]);

  // Load assigned features from slot configuration
  useEffect(() => {
    if (slotConfig?.features) {
      const features = slotConfig.features[elementId] || [];
      setAssignedFeatures(features);
    }
  }, [slotConfig, elementId]);

  // Add feature to element
  const assignFeature = useCallback(async () => {
    if (!selectedFeature) return;

    const feature = featureRegistry.getFeature(selectedFeature);
    if (!feature) return;

    // Validate parameters
    try {
      const sanitizedParams = featureRegistry.validateAndSanitizeParameters(
        feature.parameters || [], 
        featureParams
      );

      const newAssignment = {
        featureId: selectedFeature,
        parameters: sanitizedParams,
        trigger: 'onClick', // Default trigger
        assignedAt: new Date().toISOString()
      };

      setAssignedFeatures(prev => [...prev, newAssignment]);
      
      // Clear selection
      setSelectedFeature(null);
      setFeatureParams({});

      // Notify parent component
      onFeatureExecuted?.(elementId, 'feature-assigned', { feature: newAssignment });

    } catch (error) {
      console.error('Failed to assign feature:', error);
      // Show error to user
    }
  }, [selectedFeature, featureParams, elementId, onFeatureExecuted]);

  // Remove feature assignment
  const removeFeature = useCallback((index) => {
    const updatedFeatures = assignedFeatures.filter((_, i) => i !== index);
    setAssignedFeatures(updatedFeatures);
    onFeatureExecuted?.(elementId, 'feature-removed', { features: updatedFeatures });
  }, [assignedFeatures, elementId, onFeatureExecuted]);

  // Execute feature
  const executeFeature = useCallback(async (assignment) => {
    try {
      const executionContext = {
        userId,
        storeId,
        slotId,
        elementId,
        trigger: assignment.trigger
      };

      const result = await featureRegistry.executeFeature(
        assignment.featureId,
        assignment.parameters,
        executionContext
      );

      onFeatureExecuted?.(elementId, 'feature-executed', {
        featureId: assignment.featureId,
        result
      });

    } catch (error) {
      console.error('Feature execution failed:', error);
      onFeatureExecuted?.(elementId, 'feature-error', {
        featureId: assignment.featureId,
        error: error.message
      });
    }
  }, [userId, storeId, slotId, elementId, onFeatureExecuted]);

  // Update parameter value
  const updateParameter = useCallback((paramName, value) => {
    setFeatureParams(prev => ({
      ...prev,
      [paramName]: value
    }));
  }, []);

  // Update assigned feature parameter
  const updateAssignedParameter = useCallback((featureIndex, paramName, value) => {
    setAssignedFeatures(prev => 
      prev.map((assignment, index) => 
        index === featureIndex 
          ? {
              ...assignment,
              parameters: {
                ...assignment.parameters,
                [paramName]: value
              }
            }
          : assignment
      )
    );
  }, []);

  // Toggle feature expansion
  const toggleFeatureExpansion = useCallback((index) => {
    setExpandedFeatures(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  // Handle custom feature creation
  const handleCustomFeatureCreated = useCallback((featureId, featureData) => {
    // Refresh available features
    setAvailableFeatures(featureRegistry.getFeaturesForContext(context));
    setShowCustomBuilder(false);
  }, [context]);

  // Get feature by ID
  const getFeatureById = useCallback((featureId) => {
    return featureRegistry.getFeature(featureId);
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-600" />
          <h3 className="font-medium">Interactive Features</h3>
        </div>
        <Dialog open={showCustomBuilder} onOpenChange={setShowCustomBuilder}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-1" />
              Custom
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Custom Feature</DialogTitle>
              <DialogDescription>
                Build a reusable interactive feature for your elements
              </DialogDescription>
            </DialogHeader>
            <CustomFeatureBuilder
              context={context}
              userId={userId}
              editingFeature={editingFeature}
              onFeatureCreated={handleCustomFeatureCreated}
              onFeatureUpdated={handleCustomFeatureCreated}
              onClose={() => {
                setShowCustomBuilder(false);
                setEditingFeature(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Assigned Features */}
      {assignedFeatures.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Active Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {assignedFeatures.map((assignment, index) => {
              const feature = getFeatureById(assignment.featureId);
              const isExpanded = expandedFeatures.has(index);
              
              if (!feature) {
                return (
                  <div key={index} className="p-3 border rounded-lg bg-red-50 border-red-200">
                    <p className="text-sm text-red-700">
                      Feature not found: {assignment.featureId}
                    </p>
                  </div>
                );
              }

              return (
                <Card key={index} className="border-blue-200">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Collapsible 
                          open={isExpanded} 
                          onOpenChange={() => toggleFeatureExpansion(index)}
                        >
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-1">
                              {isExpanded ? 
                                <ChevronDown className="w-4 h-4" /> : 
                                <ChevronRight className="w-4 h-4" />
                              }
                            </Button>
                          </CollapsibleTrigger>
                        </Collapsible>
                        <div>
                          <h4 className="font-medium text-sm">{feature.name}</h4>
                          <p className="text-xs text-gray-600">{feature.description}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => executeFeature(assignment)}
                          title="Test Feature"
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                        {feature.type === 'custom' && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => {
                              setEditingFeature(feature);
                              setShowCustomBuilder(true);
                            }}
                            title="Edit Feature"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => removeFeature(index)}
                          title="Remove Feature"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <Collapsible open={isExpanded} onOpenChange={() => toggleFeatureExpansion(index)}>
                      <CollapsibleContent className="mt-3">
                        {feature.parameters && feature.parameters.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Parameters</Label>
                            <div className="grid grid-cols-2 gap-2">
                              {feature.parameters.map((param) => (
                                <div key={param.name}>
                                  <Label className="text-xs">{param.name}</Label>
                                  <Input
                                    size="sm"
                                    value={assignment.parameters[param.name] || ''}
                                    onChange={(e) => 
                                      updateAssignedParameter(index, param.name, e.target.value)
                                    }
                                    placeholder={param.default || `Enter ${param.name}`}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Add New Feature */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Add Feature</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">Select Feature</Label>
            <Select value={selectedFeature} onValueChange={setSelectedFeature}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a feature..." />
              </SelectTrigger>
              <SelectContent>
                {availableFeatures.map((feature) => (
                  <SelectItem key={feature.id} value={feature.id}>
                    <div className="flex items-center gap-2">
                      <span>{feature.name}</span>
                      <span className="text-xs text-gray-500">
                        ({feature.type})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Feature Parameters */}
          {selectedFeature && (() => {
            const feature = getFeatureById(selectedFeature);
            return feature?.parameters?.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">Configure Parameters</Label>
                <div className="grid grid-cols-2 gap-2">
                  {feature.parameters.map((param) => (
                    <div key={param.name}>
                      <Label className="text-xs">
                        {param.name}
                        {param.required && <span className="text-red-500">*</span>}
                      </Label>
                      <Input
                        size="sm"
                        value={featureParams[param.name] || ''}
                        onChange={(e) => updateParameter(param.name, e.target.value)}
                        placeholder={param.default || `Enter ${param.name}`}
                        required={param.required}
                      />
                      {param.description && (
                        <p className="text-xs text-gray-500 mt-1">{param.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          <Button 
            onClick={assignFeature}
            disabled={!selectedFeature}
            size="sm"
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Feature
          </Button>
        </CardContent>
      </Card>

      {/* Available Features Library */}
      {availableFeatures.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Feature Library</CardTitle>
            <CardDescription className="text-xs">
              {availableFeatures.length} features available for {context.replace('_', ' ')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2">
              {availableFeatures.slice(0, 5).map((feature) => (
                <div 
                  key={feature.id} 
                  className="p-2 border rounded text-xs hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedFeature(feature.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-medium">{feature.name}</h5>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      feature.type === 'custom' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {feature.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FeatureIntegration;