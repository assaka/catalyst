/**
 * Preview Demo Component
 * Demonstrates the InlinePreviewPane functionality
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import InlinePreviewPane from './InlinePreviewPane';
import { FileText, Zap } from 'lucide-react';

const PreviewDemo = () => {
  const [selectedFile, setSelectedFile] = useState('src/pages/Cart.jsx');
  const [modifiedCode, setModifiedCode] = useState(`function Cart() {
  return (
    <div className="cart-container">
      <h1>Shopping Cart with Patches Applied!</h1>
      <p>This content was modified via patches</p>
      <button>Checkout</button>
    </div>
  );
}`);

  // Sample files to demonstrate with
  const sampleFiles = [
    { path: 'src/pages/Cart.jsx', name: 'Cart.jsx' },
    { path: 'src/components/ProductCard.jsx', name: 'ProductCard.jsx' },
    { path: 'src/pages/Dashboard.jsx', name: 'Dashboard.jsx' },
    { path: 'src/components/Header.jsx', name: 'Header.jsx' },
    { path: 'src/styles/main.css', name: 'main.css' }
  ];

  const handleFileChange = (filePath) => {
    setSelectedFile(filePath);
    
    // Set sample modified code based on file type
    const fileName = filePath.split('/').pop();
    const fileExt = fileName.split('.').pop().toLowerCase();
    
    if (['jsx', 'js', 'tsx'].includes(fileExt)) {
      setModifiedCode(`function ${fileName.replace(/\.[^/.]+$/, "")}() {
  return (
    <div className="preview-demo">
      <h1>Modified ${fileName}</h1>
      <p>This content shows patches applied inline</p>
      <button>Test Button</button>
    </div>
  );
}`);
    } else if (fileExt === 'css') {
      setModifiedCode(`.preview-demo {
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  color: white;
  padding: 20px;
  border-radius: 8px;
}

.modified-button {
  background: #ff6b6b;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
}`);
    } else {
      setModifiedCode(`# Modified ${fileName}

This is sample modified content for ${fileName}.
The inline preview will show how patches are applied.

## Features
- No redirects
- Patch validation
- Visual preview
- Code diff view`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Preview Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select File to Preview</label>
            <Select value={selectedFile} onValueChange={handleFileChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sampleFiles.map((file) => (
                  <SelectItem key={file.path} value={file.path}>
                    {file.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Modified Code</label>
            <Textarea
              value={modifiedCode}
              onChange={(e) => setModifiedCode(e.target.value)}
              className="font-mono text-sm h-48"
              placeholder="Enter modified code here..."
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Tests patch application without redirecting</li>
              <li>• Shows visual preview in embedded iframe</li>
              <li>• Displays applied patches and their status</li>
              <li>• Validates patches can be applied successfully</li>
              <li>• Provides detailed feedback on any issues</li>
            </ul>
          </div>

          <Button className="w-full" variant="outline">
            <Zap className="h-4 w-4 mr-2" />
            Preview automatically updates
          </Button>
        </CardContent>
      </Card>

      {/* Inline Preview Panel */}
      <InlinePreviewPane
        fileName={selectedFile.split('/').pop()}
        filePath={selectedFile}
        modifiedCode={modifiedCode}
        originalCode=""
      />
    </div>
  );
};

export default PreviewDemo;