/**
 * Fully AI-Driven No-Code Plugin Builder
 * Pure conversational interface - no technical knowledge required
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Send,
  Zap,
  ChevronRight,
  Wand2,
  Code2,
  Settings2
} from 'lucide-react';
import PluginAIAssistant from './PluginAIAssistant';

const FullyAIPluginBuilder = ({ onSave, onCancel, onSwitchMode, initialContext }) => {
  const [pluginConfig, setPluginConfig] = useState(initialContext || {
    name: '',
    description: '',
    category: 'utility',
    generatedCode: null,
    generatedFiles: []
  });

  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const templates = [
    {
      id: 'reviews',
      icon: '⭐',
      title: 'Product Reviews',
      description: '5-star ratings and customer feedback',
      prompt: 'Create a product review system with star ratings and customer comments'
    },
    {
      id: 'wishlist',
      icon: '❤️',
      title: 'Customer Wishlist',
      description: 'Let customers save favorite products',
      prompt: 'Create a wishlist feature where customers can save and manage their favorite products'
    },
    {
      id: 'loyalty',
      icon: '🎁',
      title: 'Loyalty Points',
      description: 'Reward repeat customers with points',
      prompt: 'Create a loyalty points system that rewards customers for purchases and allows them to redeem points'
    },
    {
      id: 'email',
      icon: '📧',
      title: 'Email Campaigns',
      description: 'Send newsletters to customers',
      prompt: 'Create an email campaign system to send newsletters and promotional emails to customers'
    },
    {
      id: 'notifications',
      icon: '🔔',
      title: 'Push Notifications',
      description: 'Send alerts about orders and offers',
      prompt: 'Create a push notification system for order updates and special offers'
    },
    {
      id: 'referral',
      icon: '🤝',
      title: 'Referral Program',
      description: 'Let customers refer friends for rewards',
      prompt: 'Create a referral program where customers can invite friends and earn rewards'
    }
  ];

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    // Auto-populate AI chat with template prompt
  };

  const handleAIGenerated = (config, code, files) => {
    setPluginConfig(prev => ({
      ...prev,
      ...config,
      generatedCode: code,
      generatedFiles: files
    }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave(pluginConfig);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Mode Switcher Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-6 h-6 text-purple-600" />
                <h1 className="text-2xl font-bold text-gray-900">No-Code Plugin Builder</h1>
                <Badge className="bg-purple-100 text-purple-700">Fully AI-Driven</Badge>
              </div>
              <p className="text-sm text-gray-600">Just describe what you want - no technical knowledge needed</p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSwitchMode?.('guided', pluginConfig)}
                className="gap-2"
              >
                <Settings2 className="w-4 h-4" />
                Switch to Guided
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

      <div className="flex-1 flex gap-6 p-6 overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto">
          {/* Welcome Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Wand2 className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Build Anything with AI</h2>
                  <p className="text-purple-100">
                    Choose a template below or describe your idea in the AI chat →
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Template Gallery */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Templates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
                    selectedTemplate?.id === template.id
                      ? 'ring-2 ring-purple-500 shadow-lg'
                      : 'border shadow-md'
                  }`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardContent className="p-6">
                    <div className="text-4xl mb-3">{template.icon}</div>
                    <h4 className="font-semibold text-gray-900 mb-2">{template.title}</h4>
                    <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                    <Button
                      size="sm"
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTemplateSelect(template);
                      }}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* How It Works */}
          <Card className="border-0 shadow-md bg-blue-50">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                How It Works
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Choose a template or describe your idea</p>
                    <p className="text-sm text-gray-600">Use the chat on the right to tell AI what you want</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">AI generates everything</p>
                    <p className="text-sm text-gray-600">Database, API, UI - all created automatically</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Deploy or customize</p>
                    <p className="text-sm text-gray-600">Activate immediately or switch to Developer mode to edit code</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generated Plugin Preview */}
          {pluginConfig.generatedCode && (
            <Card className="border-0 shadow-lg bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-green-600" />
                  Plugin Generated!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{pluginConfig.name}</h4>
                    <p className="text-sm text-gray-600">{pluginConfig.description}</p>
                  </div>

                  {pluginConfig.generatedFiles && pluginConfig.generatedFiles.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Generated {pluginConfig.generatedFiles.length} files:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {pluginConfig.generatedFiles.map((file, idx) => (
                          <Badge key={idx} variant="outline" className="bg-white">
                            {file.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-3">
                    <Button
                      onClick={handleSave}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Deploy Plugin
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => onSwitchMode?.('developer', pluginConfig)}
                    >
                      <Code2 className="w-4 h-4 mr-2" />
                      Customize Code
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* AI Assistant Sidebar */}
        <div className="w-96 bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
          <PluginAIAssistant
            mode="nocode-ai"
            onConfigGenerated={(config) => {
              setPluginConfig(prev => ({ ...prev, ...config }));
            }}
            onCodeGenerated={handleAIGenerated}
            currentContext={pluginConfig}
            selectedTemplate={selectedTemplate}
          />
        </div>
      </div>
    </div>
  );
};

export default FullyAIPluginBuilder;
