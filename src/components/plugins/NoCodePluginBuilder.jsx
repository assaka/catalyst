/**
 * Guided Plugin Builder
 * Visual wizard interface for building plugins with step-by-step guidance
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Wand2,
  Settings,
  Database,
  Layout,
  Zap,
  CheckCircle,
  ArrowRight,
  Plus,
  Trash2,
  Eye,
  Sparkles,
  Code2
} from 'lucide-react';
import SaveButton from '@/components/ui/save-button';
import PluginAIAssistant from './PluginAIAssistant';

const NoCodePluginBuilder = ({ onSave, onCancel, onSwitchMode, initialContext }) => {
  const [pluginConfig, setPluginConfig] = useState({
    name: '',
    description: '',
    category: 'utility',
    features: [],
    database: {
      tables: []
    },
    ui: {
      widgets: [],
      pages: []
    },
    hooks: [],
    events: [],
    ...initialContext
  });

  const [currentStep, setCurrentStep] = useState('basics');
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleAIConfigGenerated = (config) => {
    // Merge AI-generated config with current config
    setPluginConfig(prev => ({
      ...prev,
      ...config
    }));
  };

  const handleAICodeGenerated = (code, files) => {
    // AI generated the actual code - we don't show it in no-code mode
    // but we store it for deployment
    setPluginConfig(prev => ({
      ...prev,
      generatedCode: code,
      generatedFiles: files
    }));
  };

  const addFeature = (featureType) => {
    setPluginConfig(prev => ({
      ...prev,
      features: [...prev.features, { type: featureType, config: {} }]
    }));
  };

  const removeFeature = (index) => {
    setPluginConfig(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const addDatabaseTable = () => {
    setPluginConfig(prev => ({
      ...prev,
      database: {
        ...prev.database,
        tables: [
          ...prev.database.tables,
          { name: '', fields: [] }
        ]
      }
    }));
  };

  const addTableField = (tableIndex) => {
    const newTables = [...pluginConfig.database.tables];
    newTables[tableIndex].fields.push({
      name: '',
      type: 'string',
      required: false
    });
    setPluginConfig(prev => ({
      ...prev,
      database: { ...prev.database, tables: newTables }
    }));
  };

  const handleSave = async () => {
    setSaveSuccess(false);
    setLoading(true);
    try {
      if (onSave) {
        await onSave(pluginConfig);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 'basics', label: 'Basic Info', icon: Settings },
    { id: 'features', label: 'Features', icon: Zap },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'ui', label: 'Interface', icon: Layout },
    { id: 'review', label: 'Review', icon: Eye }
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Mode Switcher Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Wand2 className="w-6 h-6 text-indigo-600" />
                <h1 className="text-2xl font-bold text-gray-900">Guided Plugin Builder</h1>
                <Badge className="bg-indigo-100 text-indigo-700">Step-by-Step</Badge>
              </div>
              <p className="text-sm text-gray-600">Visual wizard with AI assistance</p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSwitchMode?.('nocode-ai', pluginConfig)}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Switch to No-Code AI
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSwitchMode?.('developer', pluginConfig)}
                className="gap-2"
              >
                <Code2 className="w-4 h-4" />
                Switch to Developer
              </Button>
              <Button variant="ghost" onClick={onCancel}>Cancel</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-4 p-6 overflow-hidden">
      {/* Main Builder Area */}
      <div className="flex-1 bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Progress Steps */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Wand2 className="w-6 h-6" />
            Build Your Plugin
          </h2>
          <div className="flex items-center gap-2">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = steps.findIndex(s => s.id === currentStep) > index;

              return (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => setCurrentStep(step.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-white text-blue-600'
                        : isCompleted
                        ? 'bg-blue-500 text-white'
                        : 'bg-blue-700 text-blue-200 hover:bg-blue-600'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <StepIcon className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">{step.label}</span>
                  </button>
                  {index < steps.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-blue-300" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Builder Content */}
        <div className="p-6 overflow-y-auto" style={{ height: 'calc(100% - 180px)' }}>
          <Tabs value={currentStep} onValueChange={setCurrentStep}>
            {/* Basic Info */}
            <TabsContent value="basics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Plugin Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Plugin Name</Label>
                    <Input
                      value={pluginConfig.name}
                      onChange={(e) => setPluginConfig({ ...pluginConfig, name: e.target.value })}
                      placeholder="My Awesome Plugin"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={pluginConfig.description}
                      onChange={(e) => setPluginConfig({ ...pluginConfig, description: e.target.value })}
                      placeholder="What does your plugin do?"
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={pluginConfig.category}
                      onValueChange={(value) => setPluginConfig({ ...pluginConfig, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="utility">Utility</SelectItem>
                        <SelectItem value="commerce">Commerce</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="analytics">Analytics</SelectItem>
                        <SelectItem value="integration">Integration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Features */}
            <TabsContent value="features" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Plugin Features</CardTitle>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => addFeature('api_endpoint')}>
                        <Plus className="w-4 h-4 mr-1" />
                        API Endpoint
                      </Button>
                      <Button size="sm" onClick={() => addFeature('webhook')}>
                        <Plus className="w-4 h-4 mr-1" />
                        Webhook
                      </Button>
                      <Button size="sm" onClick={() => addFeature('cron_job')}>
                        <Plus className="w-4 h-4 mr-1" />
                        Scheduled Task
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {pluginConfig.features.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Zap className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>No features added yet</p>
                      <p className="text-sm">Click the buttons above to add features</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pluginConfig.features.map((feature, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <Badge className="capitalize">{feature.type.replace('_', ' ')}</Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFeature(index)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Database */}
            <TabsContent value="database" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Database Tables</CardTitle>
                    <Button onClick={addDatabaseTable} size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Table
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {pluginConfig.database.tables.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Database className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>No database tables defined</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pluginConfig.database.tables.map((table, tableIndex) => (
                        <div key={tableIndex} className="border rounded-lg p-4">
                          <Input
                            placeholder="Table name"
                            value={table.name}
                            onChange={(e) => {
                              const newTables = [...pluginConfig.database.tables];
                              newTables[tableIndex].name = e.target.value;
                              setPluginConfig({
                                ...pluginConfig,
                                database: { tables: newTables }
                              });
                            }}
                            className="mb-3"
                          />
                          <div className="space-y-2">
                            {table.fields.map((field, fieldIndex) => (
                              <div key={fieldIndex} className="flex gap-2">
                                <Input
                                  placeholder="Field name"
                                  value={field.name}
                                  className="flex-1"
                                />
                                <Select value={field.type}>
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="string">String</SelectItem>
                                    <SelectItem value="number">Number</SelectItem>
                                    <SelectItem value="boolean">Boolean</SelectItem>
                                    <SelectItem value="date">Date</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            ))}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addTableField(tableIndex)}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add Field
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* UI */}
            <TabsContent value="ui" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Interface</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">
                    Define admin pages and widgets for your plugin
                  </p>
                  {/* TODO: Add UI builder components */}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Review */}
            <TabsContent value="review" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Review Your Plugin</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Plugin Name</h4>
                    <p className="text-gray-600">{pluginConfig.name || 'Not set'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Features</h4>
                    <p className="text-gray-600">{pluginConfig.features.length} features</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Database Tables</h4>
                    <p className="text-gray-600">{pluginConfig.database.tables.length} tables</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-900">Ready to Generate</span>
                    </div>
                    <p className="text-sm text-green-700">
                      AI will generate all code, database migrations, and UI components automatically.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Actions */}
        <div className="border-t p-4 bg-gray-50 flex justify-between">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? 'Hide' : 'Show'} Preview
            </Button>
            <SaveButton
              onClick={handleSave}
              loading={loading}
              success={saveSuccess}
              defaultText="Generate Plugin"
            />
          </div>
        </div>
      </div>

      {/* AI Assistant Sidebar */}
      <div className="w-96 bg-white rounded-lg shadow-lg overflow-hidden">
        <PluginAIAssistant
          mode="guided"
          onConfigGenerated={handleAIConfigGenerated}
          onCodeGenerated={handleAICodeGenerated}
          currentContext={pluginConfig}
        />
      </div>
      </div>
    </div>
  );
};

export default NoCodePluginBuilder;
