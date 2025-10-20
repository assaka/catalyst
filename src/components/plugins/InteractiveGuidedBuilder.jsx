/**
 * Interactive Guided Plugin Builder
 * AI-powered question-based wizard that adapts based on user answers
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Wand2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Code2,
  Loader2,
  CheckCircle,
  MessageSquare,
  Lightbulb
} from 'lucide-react';
import SaveButton from '@/components/ui/save-button';

const InteractiveGuidedBuilder = ({ onSave, onCancel, onSwitchMode, initialContext }) => {
  const [currentQuestionSet, setCurrentQuestionSet] = useState(null);
  const [questionHistory, setQuestionHistory] = useState([]);
  const [answers, setAnswers] = useState(initialContext?.answers || {});
  const [pluginConfig, setPluginConfig] = useState(initialContext || {});
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [isComplete, setIsComplete] = useState(false);

  // Initialize with first question
  useEffect(() => {
    if (!currentQuestionSet && !initialContext) {
      loadNextQuestions();
    }
  }, []);

  const loadNextQuestions = async (userAnswers = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/plugins/ai/guided-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previousAnswers: { ...answers, ...userAnswers },
          pluginConfig: pluginConfig,
          questionHistory: questionHistory.map(q => q.questions)
        })
      });

      if (!response.ok) throw new Error('Failed to generate questions');

      const data = await response.json();

      if (data.complete) {
        setIsComplete(true);
        setPluginConfig(data.finalConfig);
      } else {
        setCurrentQuestionSet(data);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error loading questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNext = async () => {
    // Validate required questions
    const unanswered = currentQuestionSet?.questions?.filter(q =>
      q.required && !answers[q.id]
    );

    if (unanswered?.length > 0) {
      setError(`Please answer: ${unanswered.map(q => q.label).join(', ')}`);
      return;
    }

    // Save current question set to history
    setQuestionHistory(prev => [...prev, currentQuestionSet]);

    // Load next questions based on current answers
    await loadNextQuestions(answers);
  };

  const handleBack = () => {
    if (questionHistory.length === 0) return;

    // Pop the last question set from history
    const previous = questionHistory[questionHistory.length - 1];
    setQuestionHistory(prev => prev.slice(0, -1));
    setCurrentQuestionSet(previous);
    setIsComplete(false);
  };

  const handleSave = async () => {
    setSaveSuccess(false);
    setGenerating(true);
    try {
      // Generate the plugin using all collected answers
      const response = await fetch('/api/plugins/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'guided',
          answers: answers,
          config: pluginConfig
        })
      });

      if (!response.ok) throw new Error('Failed to generate plugin');

      const generatedPlugin = await response.json();

      if (onSave) {
        await onSave(generatedPlugin);
      }
      setSaveSuccess(true);
    } catch (err) {
      setError(err.message);
      console.error('Error generating plugin:', err);
    } finally {
      setGenerating(false);
    }
  };

  const renderQuestion = (question) => {
    const answer = answers[question.id];

    switch (question.type) {
      case 'text':
        return (
          <Input
            value={answer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder={question.placeholder}
            className="mt-2"
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={answer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder={question.placeholder}
            className="mt-2"
            rows={3}
          />
        );

      case 'select':
        return (
          <Select
            value={answer || ''}
            onValueChange={(value) => handleAnswerChange(question.id, value)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder={question.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multi-select':
        return (
          <div className="mt-2 space-y-2">
            {question.options?.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(answer || []).includes(opt.value)}
                  onChange={(e) => {
                    const current = answer || [];
                    const newValue = e.target.checked
                      ? [...current, opt.value]
                      : current.filter(v => v !== opt.value);
                    handleAnswerChange(question.id, newValue);
                  }}
                  className="w-4 h-4"
                />
                <div>
                  <div className="font-medium">{opt.label}</div>
                  {opt.description && (
                    <div className="text-xs text-gray-600">{opt.description}</div>
                  )}
                </div>
              </label>
            ))}
          </div>
        );

      case 'radio':
        return (
          <div className="mt-2 space-y-2">
            {question.options?.map((opt) => (
              <label key={opt.value} className="flex items-start gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  checked={answer === opt.value}
                  onChange={() => handleAnswerChange(question.id, opt.value)}
                  className="w-4 h-4 mt-0.5"
                />
                <div className="flex-1">
                  <div className="font-medium">{opt.label}</div>
                  {opt.description && (
                    <div className="text-sm text-gray-600 mt-1">{opt.description}</div>
                  )}
                </div>
              </label>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading && !currentQuestionSet) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Preparing your guided experience...</p>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="h-screen flex flex-col bg-gray-100">
        {/* Header */}
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wand2 className="w-6 h-6 text-indigo-600" />
                <h1 className="text-2xl font-bold text-gray-900">Interactive Guided Builder</h1>
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
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <CardTitle className="text-2xl">Ready to Generate!</CardTitle>
              </div>
              <p className="text-gray-600">
                You've completed all the questions. Here's what we'll create:
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                <h3 className="font-bold text-lg mb-2">{pluginConfig.name || 'Your Plugin'}</h3>
                <p className="text-gray-700 mb-3">{pluginConfig.description || 'No description'}</p>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">
                      {Object.keys(answers).length}
                    </div>
                    <div className="text-sm text-gray-600">Questions Answered</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">
                      {questionHistory.length + 1}
                    </div>
                    <div className="text-sm text-gray-600">Steps Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">
                      {pluginConfig.features?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Features</div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 p-3 rounded-lg border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
                <SaveButton
                  onClick={handleSave}
                  loading={generating}
                  success={saveSuccess}
                  defaultText="Generate Plugin"
                  loadingText="Generating..."
                  successText="Plugin Created!"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Wand2 className="w-6 h-6 text-indigo-600" />
                <h1 className="text-2xl font-bold text-gray-900">Interactive Guided Builder</h1>
                <Badge className="bg-indigo-100 text-indigo-700">AI-Powered</Badge>
              </div>
              <p className="text-sm text-gray-600">
                {currentQuestionSet?.progress
                  ? `Step ${currentQuestionSet.progress.current} of ~${currentQuestionSet.progress.estimated}`
                  : 'Customized questions based on your needs'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSwitchMode?.('nocode-ai', { ...pluginConfig, answers })}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Switch to No-Code AI
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSwitchMode?.('developer', { ...pluginConfig, answers })}
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

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Progress indicator */}
          {currentQuestionSet?.progress && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm text-gray-600">
                  {Math.round((currentQuestionSet.progress.current / currentQuestionSet.progress.estimated) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(currentQuestionSet.progress.current / currentQuestionSet.progress.estimated) * 100}%`
                  }}
                />
              </div>
            </div>
          )}

          {/* Context message */}
          {currentQuestionSet?.message && (
            <Card className="border-indigo-200 bg-indigo-50">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <MessageSquare className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">{currentQuestionSet.message}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Questions */}
          {currentQuestionSet?.questions?.map((question) => (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle className="flex items-start gap-2 text-lg">
                  {question.required && <span className="text-red-500">*</span>}
                  {question.label}
                </CardTitle>
                {question.description && (
                  <p className="text-sm text-gray-600 mt-1">{question.description}</p>
                )}
              </CardHeader>
              <CardContent>
                {renderQuestion(question)}

                {question.hint && (
                  <div className="mt-3 flex gap-2 text-sm text-gray-600 bg-blue-50 p-2 rounded">
                    <Lightbulb className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>{question.hint}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {error && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-t shadow-lg">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={questionHistory.length === 0 || loading}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InteractiveGuidedBuilder;
