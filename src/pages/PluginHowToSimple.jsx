import React from 'react';

export default function PluginHowToSimple() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Plugin Development Guide
        </h1>
        <p className="text-gray-600 mb-8">
          Learn how to create, test, and publish plugins for Catalyst safely.
        </p>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-purple-600 text-2xl mb-4">🤖</div>
            <h3 className="text-lg font-semibold mb-2">AI-Generated</h3>
            <p className="text-gray-600 text-sm mb-4">
              No coding required - describe your plugin in plain English
            </p>
            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">
              5 minutes
            </span>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-blue-600 text-2xl mb-4">📋</div>
            <h3 className="text-lg font-semibold mb-2">Template-Based</h3>
            <p className="text-gray-600 text-sm mb-4">
              Start with proven templates and customize to your needs
            </p>
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
              30 minutes
            </span>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-green-600 text-2xl mb-4">🚀</div>
            <h3 className="text-lg font-semibold mb-2">Custom Development</h3>
            <p className="text-gray-600 text-sm mb-4">
              Build complex plugins with complete customization
            </p>
            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
              2+ hours
            </span>
          </div>
        </div>

        <div className="mt-12 bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
          
          <div className="space-y-6">
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-semibold text-purple-800">Step 1: Choose Your Approach</h3>
              <p className="text-gray-600 mt-1">
                Pick the development method that matches your skill level and time available.
              </p>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-blue-800">Step 2: Safety First</h3>
              <p className="text-gray-600 mt-1">
                All plugins are automatically tested for security, performance, and compatibility.
              </p>
            </div>
            
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold text-green-800">Step 3: Deploy & Monitor</h3>
              <p className="text-gray-600 mt-1">
                Install with backup creation and 24-hour monitoring for peace of mind.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            Start Building Your Plugin
          </button>
        </div>
      </div>
    </div>
  );
}