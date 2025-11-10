import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import abTestService from '@/services/abTestService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Loader2, AlertCircle, Wand2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DynamicVariantEditor from './DynamicVariantEditor';

export default function ABTestEditor({ test, storeId, onSave, onCancel }) {
  const [formData, setFormData] = useState(() => {
    if (test) {
      return test;
    }
    return abTestService.createTestTemplate(storeId);
  });

  const [errors, setErrors] = useState([]);
  const [editMode, setEditMode] = useState('simple'); // 'simple' or 'advanced'

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (test) {
        return abTestService.updateTest(storeId, test.id, data);
      } else {
        return abTestService.createTest(storeId, data);
      }
    },
    onSuccess: () => {
      onSave();
    },
    onError: (error) => {
      setErrors([error.message || 'Failed to save test']);
    },
  });

  const handleSave = () => {
    const validation = abTestService.validateTestConfig(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    setErrors([]);
    saveMutation.mutate(formData);
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addVariant = () => {
    const newVariant = abTestService.createVariantTemplate(`Variant ${formData.variants.length}`);
    updateField('variants', [...formData.variants, newVariant]);
  };

  const updateVariant = (index, field, value) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[index] = { ...updatedVariants[index], [field]: value };
    updateField('variants', updatedVariants);
  };

  const removeVariant = (index) => {
    const updatedVariants = formData.variants.filter((_, i) => i !== index);
    updateField('variants', updatedVariants);
  };

  const toggleControlVariant = (index) => {
    const updatedVariants = formData.variants.map((v, i) => ({
      ...v,
      is_control: i === index
    }));
    updateField('variants', updatedVariants);
  };

  return (
    <div className="space-y-6">
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Guide */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <h4 className="font-semibold text-sm mb-2">📖 How to Create an A/B Test:</h4>
          <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
            <li><strong>Basics:</strong> Give your test a name (e.g., "Button Color Test")</li>
            <li><strong>Variants:</strong> Keep "Control" as-is. Add changes to other variants (test versions)</li>
            <li><strong>Targeting:</strong> Choose which pages to test (e.g., "product")</li>
            <li><strong>Metrics:</strong> What success looks like (e.g., "add to cart rate")</li>
            <li><strong>Save & Start:</strong> Click save, then click ▶️ to start the test</li>
          </ol>
        </CardContent>
      </Card>

      <Tabs defaultValue="basics" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basics">1. Basics</TabsTrigger>
          <TabsTrigger value="variants">2. Variants</TabsTrigger>
          <TabsTrigger value="targeting">3. Targeting</TabsTrigger>
          <TabsTrigger value="metrics">4. Metrics</TabsTrigger>
        </TabsList>

        {/* Basics Tab */}
        <TabsContent value="basics" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Test Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="e.g., Hero CTA Button Test"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="What are you testing?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hypothesis">Hypothesis</Label>
            <Textarea
              id="hypothesis"
              value={formData.hypothesis}
              onChange={(e) => updateField('hypothesis', e.target.value)}
              placeholder="e.g., Changing button color to red will increase conversions by 10%"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="traffic">Traffic Allocation: {Math.round(formData.traffic_allocation * 100)}%</Label>
            <Slider
              id="traffic"
              min={0}
              max={100}
              step={5}
              value={[formData.traffic_allocation * 100]}
              onValueChange={(value) => updateField('traffic_allocation', value[0] / 100)}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Percentage of visitors to include in the test
            </p>
          </div>
        </TabsContent>

        {/* Variants Tab */}
        <TabsContent value="variants" className="space-y-4">
          {/* Explanation */}
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-4">
              <h4 className="font-semibold text-sm mb-2">💡 What are Variants?</h4>
              <div className="text-sm space-y-2 text-muted-foreground">
                <p><strong>Control:</strong> Your current/original version (no changes). Half your visitors see this.</p>
                <p><strong>Variant A, B, C:</strong> Test versions with changes. Half your visitors see these.</p>
                <p>The system compares which version performs better!</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Your Test Versions</p>
              <p className="text-xs text-muted-foreground">Add variants to test different changes</p>
            </div>
            <Button onClick={addVariant} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Test Version
            </Button>
          </div>

          <div className="space-y-4">
            {formData.variants.map((variant, index) => (
              <Card key={variant.id} className={variant.is_control ? 'border-2 border-gray-300' : 'border-2 border-blue-300'}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      {variant.name}
                      {variant.is_control ? (
                        <Badge className="bg-gray-200 text-gray-800">
                          Original Version (Baseline)
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-800">
                          Test Version
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {formData.variants.length > 2 && !variant.is_control && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeVariant(index)}
                          title="Delete this variant"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {variant.is_control && (
                    <p className="text-xs text-muted-foreground mt-1">
                      This is your baseline - leave it empty (no changes). We'll compare test versions against this.
                    </p>
                  )}
                  {!variant.is_control && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Add changes below to create a different version to test
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Variant Name</Label>
                      <Input
                        value={variant.name}
                        onChange={(e) => updateVariant(index, 'name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Traffic Weight</Label>
                      <Input
                        type="number"
                        min="1"
                        value={variant.weight || 1}
                        onChange={(e) => updateVariant(index, 'weight', parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={variant.description}
                      onChange={(e) => updateVariant(index, 'description', e.target.value)}
                      rows={2}
                      placeholder="What changes does this variant have?"
                    />
                  </div>

                  {/* Visual Editor Toggle */}
                  {!variant.is_control && (
                    <div className="space-y-2 border-t pt-4">
                      <div className="flex items-center justify-between">
                        <Label>Configure Changes</Label>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={editMode === 'simple' ? 'default' : 'outline'}
                            onClick={() => setEditMode('simple')}
                          >
                            <Wand2 className="w-4 h-4 mr-1" />
                            Simple
                          </Button>
                          <Button
                            size="sm"
                            variant={editMode === 'advanced' ? 'default' : 'outline'}
                            onClick={() => setEditMode('advanced')}
                          >
                            Advanced (JSON)
                          </Button>
                        </div>
                      </div>

                      {editMode === 'simple' ? (
                        <DynamicVariantEditor
                          variant={variant}
                          onChange={(updated) => updateVariant(index, 'config', updated.config)}
                          storeId={storeId}
                        />
                      ) : (
                        <Textarea
                          className="font-mono text-xs"
                          rows={8}
                          value={JSON.stringify(variant.config, null, 2)}
                          onChange={(e) => {
                            try {
                              const config = JSON.parse(e.target.value);
                              updateVariant(index, 'config', config);
                            } catch (err) {
                              // Invalid JSON, ignore
                            }
                          }}
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Targeting Tab */}
        <TabsContent value="targeting" className="space-y-4">
          <div className="space-y-2">
            <Label>Target Pages</Label>
            <Input
              value={formData.targeting_rules?.pages?.join(', ') || ''}
              onChange={(e) => {
                const pages = e.target.value.split(',').map(p => p.trim()).filter(Boolean);
                updateField('targeting_rules', {
                  ...formData.targeting_rules,
                  pages
                });
              }}
              placeholder="e.g., home, product, cart (comma-separated)"
            />
            <p className="text-sm text-muted-foreground">
              Leave empty to target all pages
            </p>
          </div>

          <div className="space-y-2">
            <Label>Target Devices</Label>
            <Input
              value={formData.targeting_rules?.devices?.join(', ') || ''}
              onChange={(e) => {
                const devices = e.target.value.split(',').map(d => d.trim()).filter(Boolean);
                updateField('targeting_rules', {
                  ...formData.targeting_rules,
                  devices
                });
              }}
              placeholder="e.g., desktop, mobile, tablet (comma-separated)"
            />
            <p className="text-sm text-muted-foreground">
              Leave empty to target all devices
            </p>
          </div>

          <div className="space-y-2">
            <Label>Target Countries</Label>
            <Input
              value={formData.targeting_rules?.countries?.join(', ') || ''}
              onChange={(e) => {
                const countries = e.target.value.split(',').map(c => c.trim()).filter(Boolean);
                updateField('targeting_rules', {
                  ...formData.targeting_rules,
                  countries
                });
              }}
              placeholder="e.g., US, CA, UK (comma-separated country codes)"
            />
            <p className="text-sm text-muted-foreground">
              Leave empty to target all countries
            </p>
          </div>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="primary_metric">Primary Metric *</Label>
            <Select
              value={formData.primary_metric}
              onValueChange={(value) => updateField('primary_metric', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conversion_rate">Conversion Rate</SelectItem>
                <SelectItem value="add_to_cart_rate">Add to Cart Rate</SelectItem>
                <SelectItem value="checkout_completion_rate">Checkout Completion Rate</SelectItem>
                <SelectItem value="revenue_per_visitor">Revenue per Visitor</SelectItem>
                <SelectItem value="average_order_value">Average Order Value</SelectItem>
                <SelectItem value="click_through_rate">Click Through Rate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Secondary Metrics (optional)</Label>
            <Input
              value={formData.secondary_metrics?.join(', ') || ''}
              onChange={(e) => {
                const metrics = e.target.value.split(',').map(m => m.trim()).filter(Boolean);
                updateField('secondary_metrics', metrics);
              }}
              placeholder="e.g., bounce_rate, time_on_page (comma-separated)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Minimum Sample Size</Label>
              <Input
                type="number"
                min="10"
                value={formData.min_sample_size}
                onChange={(e) => updateField('min_sample_size', parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Minimum visitors per variant
              </p>
            </div>

            <div className="space-y-2">
              <Label>Confidence Level</Label>
              <Select
                value={formData.confidence_level.toString()}
                onValueChange={(value) => updateField('confidence_level', parseFloat(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.90">90%</SelectItem>
                  <SelectItem value="0.95">95%</SelectItem>
                  <SelectItem value="0.99">99%</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Statistical significance threshold
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {test ? 'Update Test' : 'Create Test'}
        </Button>
      </div>
    </div>
  );
}
