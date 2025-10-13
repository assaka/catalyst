import React, { useState, useRef } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Play, Copy, Download, RefreshCw, Trash2, Terminal, Eye } from 'lucide-react';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';

export default function AIStudio() {
  const { selectedStore } = useStoreSelection();
  const [prompt, setPrompt] = useState('');
  const [context, setContext] = useState('');
  const [output, setOutput] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewMode, setPreviewMode] = useState('preview'); // 'preview', 'code', 'data'
  const outputRef = useRef(null);

  // Example prompts for quick actions
  const examplePrompts = [
    {
      title: "Style a Button",
      prompt: "Create a green button with white text that says 'Submit'",
      category: "UI"
    },
    {
      title: "Translate Categories",
      prompt: "Translate all category names to Spanish",
      category: "Translation"
    },
    {
      title: "Generate Product Card",
      prompt: "Create a product card component with image, title, price, and add to cart button",
      category: "Component"
    },
    {
      title: "Create Form",
      prompt: "Generate a contact form with name, email, message fields and validation",
      category: "Form"
    }
  ];

  const handleRunPrompt = async () => {
    if (!prompt.trim()) return;

    setIsProcessing(true);
    setOutput(null);

    try {
      // Simulate AI processing (replace with actual AI API call)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Parse the prompt and generate appropriate output
      const result = await processPrompt(prompt, context);
      setOutput(result);
    } catch (error) {
      console.error('Error processing prompt:', error);
      setOutput({
        type: 'error',
        message: error.message || 'Failed to process prompt'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processPrompt = async (promptText, contextText) => {
    const lowerPrompt = promptText.toLowerCase();

    // Button styling example
    if (lowerPrompt.includes('button') && lowerPrompt.includes('green')) {
      return {
        type: 'component',
        title: 'Green Button Component',
        preview: `<button class="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-colors duration-200">
  Submit
</button>`,
        code: `<Button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-colors">
  Submit
</Button>`,
        description: 'A green button with white text and hover effect'
      };
    }

    // Translation example
    if (lowerPrompt.includes('translate') && lowerPrompt.includes('categories')) {
      return {
        type: 'data',
        title: 'Translated Categories',
        data: [
          { id: 1, original: 'Electronics', translated: 'Electrónica', language: 'es' },
          { id: 2, original: 'Clothing', translated: 'Ropa', language: 'es' },
          { id: 3, original: 'Home & Garden', translated: 'Casa y Jardín', language: 'es' },
          { id: 4, original: 'Sports', translated: 'Deportes', language: 'es' }
        ],
        description: 'Categories translated to Spanish'
      };
    }

    // Product card example
    if (lowerPrompt.includes('product card')) {
      return {
        type: 'component',
        title: 'Product Card Component',
        preview: `<div class="max-w-sm rounded-lg overflow-hidden shadow-lg bg-white">
  <img class="w-full h-48 object-cover" src="https://via.placeholder.com/300x200" alt="Product">
  <div class="p-4">
    <h3 class="font-bold text-xl mb-2">Product Title</h3>
    <p class="text-gray-700 text-base mb-4">Product description goes here</p>
    <div class="flex justify-between items-center">
      <span class="text-2xl font-bold text-blue-600">$99.99</span>
      <button class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Add to Cart
      </button>
    </div>
  </div>
</div>`,
        code: `<Card className="max-w-sm">
  <img src="product.jpg" alt="Product" className="w-full h-48 object-cover" />
  <CardContent className="p-4">
    <h3 className="font-bold text-xl mb-2">Product Title</h3>
    <p className="text-gray-700 mb-4">Product description</p>
    <div className="flex justify-between items-center">
      <span className="text-2xl font-bold text-blue-600">$99.99</span>
      <Button>Add to Cart</Button>
    </div>
  </CardContent>
</Card>`,
        description: 'A product card with image, title, description, price, and add to cart button'
      };
    }

    // Form example
    if (lowerPrompt.includes('form') || lowerPrompt.includes('contact')) {
      return {
        type: 'component',
        title: 'Contact Form',
        preview: `<form class="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
  <div class="mb-4">
    <label class="block text-gray-700 text-sm font-bold mb-2">Name</label>
    <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" placeholder="Your name">
  </div>
  <div class="mb-4">
    <label class="block text-gray-700 text-sm font-bold mb-2">Email</label>
    <input type="email" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" placeholder="your@email.com">
  </div>
  <div class="mb-4">
    <label class="block text-gray-700 text-sm font-bold mb-2">Message</label>
    <textarea class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" rows="4" placeholder="Your message"></textarea>
  </div>
  <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
    Send Message
  </button>
</form>`,
        code: `<form className="max-w-md mx-auto space-y-4">
  <div>
    <label className="block text-sm font-medium mb-2">Name</label>
    <Input type="text" placeholder="Your name" />
  </div>
  <div>
    <label className="block text-sm font-medium mb-2">Email</label>
    <Input type="email" placeholder="your@email.com" />
  </div>
  <div>
    <label className="block text-sm font-medium mb-2">Message</label>
    <Textarea rows={4} placeholder="Your message" />
  </div>
  <Button type="submit" className="w-full">Send Message</Button>
</form>`,
        description: 'A contact form with validation ready'
      };
    }

    // Default response
    return {
      type: 'text',
      title: 'AI Response',
      content: `I understand you want to: "${promptText}"\n\nTry being more specific with commands like:\n- "Create a [color] button with [text]"\n- "Translate [items] to [language]"\n- "Generate a [component] with [features]"`,
      description: 'Command not recognized. Try one of the example prompts.'
    };
  };

  const handleCopyCode = () => {
    if (output?.code) {
      navigator.clipboard.writeText(output.code);
    }
  };

  const handleClearAll = () => {
    setPrompt('');
    setContext('');
    setOutput(null);
  };

  const renderOutput = () => {
    if (!output) {
      return (
        <div className="h-full flex items-center justify-center text-gray-400">
          <div className="text-center">
            <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Run a prompt to see the output</p>
            <p className="text-sm mt-2">Try one of the example prompts to get started</p>
          </div>
        </div>
      );
    }

    if (output.type === 'error') {
      return (
        <div className="h-full flex items-center justify-center p-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <h3 className="text-red-700 font-semibold mb-2">Error</h3>
              <p className="text-red-600">{output.message}</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col">
        {/* Output Header */}
        <div className="border-b bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-lg font-semibold">{output.title}</h3>
              <p className="text-sm text-gray-600">{output.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={previewMode === 'preview' ? 'default' : 'outline'}>
                {output.type === 'component' ? 'Component' : output.type === 'data' ? 'Data' : 'Text'}
              </Badge>
              {output.code && (
                <Button variant="ghost" size="sm" onClick={handleCopyCode}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Code
                </Button>
              )}
            </div>
          </div>

          {/* View Mode Toggles */}
          {output.type === 'component' && (
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                variant={previewMode === 'preview' ? 'default' : 'outline'}
                onClick={() => setPreviewMode('preview')}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button
                size="sm"
                variant={previewMode === 'code' ? 'default' : 'outline'}
                onClick={() => setPreviewMode('code')}
              >
                <Terminal className="w-4 h-4 mr-2" />
                Code
              </Button>
            </div>
          )}
        </div>

        {/* Output Content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          {output.type === 'component' && previewMode === 'preview' && (
            <div
              ref={outputRef}
              className="bg-white rounded-lg p-8 shadow-sm"
              dangerouslySetInnerHTML={{ __html: output.preview }}
            />
          )}

          {output.type === 'component' && previewMode === 'code' && (
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <code>{output.code}</code>
            </pre>
          )}

          {output.type === 'data' && (
            <div className="space-y-4">
              {output.data.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm text-gray-500">Original</span>
                        <p className="font-medium">{item.original}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Translated</span>
                        <p className="font-medium">{item.translated}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Language</span>
                        <Badge>{item.language}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {output.type === 'text' && (
            <Card>
              <CardContent className="p-6">
                <pre className="whitespace-pre-wrap text-gray-700">{output.content}</pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              AI Studio
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Generate components, translate content, and build features with AI
            </p>
          </div>
          {selectedStore && (
            <Badge variant="outline" className="text-sm">
              Store: {selectedStore.name}
            </Badge>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Panel - Input */}
          <ResizablePanel defaultSize={45} minSize={30} maxSize={70}>
            <div className="h-full flex flex-col bg-white">
              {/* Prompt Input */}
              <div className="flex-1 flex flex-col p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Prompt</label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe what you want to create... e.g., 'Create a green button' or 'Translate categories to Spanish'"
                    className="h-32 resize-none"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Context (Optional)</label>
                  <Textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Add any additional context or data here..."
                    className="h-24 resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mb-6">
                  <Button
                    onClick={handleRunPrompt}
                    disabled={!prompt.trim() || isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Run
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleClearAll}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Example Prompts */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Example Prompts</h3>
                  <div className="space-y-2">
                    {examplePrompts.map((example, index) => (
                      <Card
                        key={index}
                        className="cursor-pointer hover:border-blue-500 transition-colors"
                        onClick={() => setPrompt(example.prompt)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{example.title}</p>
                              <p className="text-xs text-gray-500">{example.prompt}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {example.category}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Right Panel - Output */}
          <ResizablePanel defaultSize={55} minSize={30} maxSize={70}>
            {renderOutput()}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
