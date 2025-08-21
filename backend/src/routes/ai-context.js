const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const ASTAnalyzer = require('../services/ast-analyzer');
const JSONPatchService = require('../services/json-patch-service');
const ConflictDetector = require('../services/conflict-detector');

// Initialize services
const astAnalyzer = new ASTAnalyzer();
const patchService = new JSONPatchService();
const conflictDetector = new ConflictDetector();

/**
 * Natural Language to Code Patch Endpoint
 * Converts natural language instructions to RFC 6902 JSON Patches
 */
router.post('/nl-to-patch', authMiddleware, async (req, res) => {
  try {
    const { prompt, sourceCode, filePath, context } = req.body;

    if (!prompt || !sourceCode) {
      return res.status(400).json({
        success: false,
        message: 'Prompt and source code are required'
      });
    }

    // Analyze the source code AST
    const astAnalysis = await astAnalyzer.analyzeCode(sourceCode, filePath);
    
    if (!astAnalysis.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to parse source code',
        error: astAnalysis.error
      });
    }

    // Generate patch from natural language
    const patchResult = await patchService.generatePatch({
      prompt,
      ast: astAnalysis.ast,
      sourceCode,
      filePath,
      context: context || {}
    });

    if (!patchResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate patch',
        error: patchResult.error
      });
    }

    // Detect potential conflicts
    const conflicts = await conflictDetector.detectConflicts({
      patch: patchResult.patch,
      sourceCode,
      ast: astAnalysis.ast,
      filePath
    });

    res.json({
      success: true,
      data: {
        patch: patchResult.patch,
        preview: patchResult.preview,
        conflicts: conflicts.conflicts,
        suggestions: patchResult.suggestions || [],
        confidence: patchResult.confidence || 0.8
      }
    });

  } catch (error) {
    console.error('AI Context Window NL to Patch error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Apply Patch Endpoint
 * Applies an RFC 6902 JSON Patch to source code
 */
router.post('/apply-patch', authMiddleware, async (req, res) => {
  try {
    const { patch, sourceCode, filePath } = req.body;

    if (!patch || !sourceCode) {
      return res.status(400).json({
        success: false,
        message: 'Patch and source code are required'
      });
    }

    // Apply the patch to the source code
    const result = await patchService.applyPatch({
      patch,
      sourceCode,
      filePath
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to apply patch',
        error: result.error
      });
    }

    // Validate the result
    const validation = await astAnalyzer.validateCode(result.modifiedCode, filePath);

    res.json({
      success: true,
      data: {
        modifiedCode: result.modifiedCode,
        isValid: validation.isValid,
        validationErrors: validation.errors || [],
        appliedOperations: result.appliedOperations || []
      }
    });

  } catch (error) {
    console.error('AI Context Window Apply Patch error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * AST Analysis Endpoint
 * Provides AST analysis for code intelligence features
 */
router.post('/analyze-ast', authMiddleware, async (req, res) => {
  try {
    const { sourceCode, filePath } = req.body;

    if (!sourceCode) {
      return res.status(400).json({
        success: false,
        message: 'Source code is required'
      });
    }

    const analysis = await astAnalyzer.analyzeCode(sourceCode, filePath);

    if (!analysis.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to analyze code',
        error: analysis.error
      });
    }

    res.json({
      success: true,
      data: {
        ast: analysis.ast,
        symbols: analysis.symbols,
        imports: analysis.imports,
        exports: analysis.exports,
        functions: analysis.functions,
        classes: analysis.classes,
        suggestions: analysis.suggestions || []
      }
    });

  } catch (error) {
    console.error('AI Context Window AST Analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Code Completion Endpoint
 * Provides intelligent code completion suggestions
 */
router.post('/code-completion', authMiddleware, async (req, res) => {
  try {
    const { sourceCode, filePath, position, context } = req.body;

    if (!sourceCode || !position) {
      return res.status(400).json({
        success: false,
        message: 'Source code and position are required'
      });
    }

    const completions = await astAnalyzer.getCompletions({
      sourceCode,
      filePath,
      position,
      context: context || {}
    });

    res.json({
      success: true,
      data: {
        completions: completions.suggestions || [],
        context: completions.context || {},
        triggerKind: completions.triggerKind || 'invoked'
      }
    });

  } catch (error) {
    console.error('AI Context Window Code Completion error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Conflict Detection Endpoint
 * Detects potential conflicts before applying changes
 */
router.post('/detect-conflicts', authMiddleware, async (req, res) => {
  try {
    const { changes, sourceCode, filePath, context } = req.body;

    if (!changes || !sourceCode) {
      return res.status(400).json({
        success: false,
        message: 'Changes and source code are required'
      });
    }

    const conflicts = await conflictDetector.analyzeChanges({
      changes,
      sourceCode,
      filePath,
      context: context || {}
    });

    res.json({
      success: true,
      data: {
        hasConflicts: conflicts.hasConflicts,
        conflicts: conflicts.conflicts,
        resolutions: conflicts.resolutions || [],
        severity: conflicts.severity || 'low'
      }
    });

  } catch (error) {
    console.error('AI Context Window Conflict Detection error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * File Tree Structure Endpoint
 * Provides file tree data for the navigator
 */
router.get('/file-tree', authMiddleware, async (req, res) => {
  try {
    const { path, includeHidden } = req.query;
    const basePath = path || process.cwd();

    const fileTree = await astAnalyzer.getFileTree({
      basePath,
      includeHidden: includeHidden === 'true',
      excludePatterns: [
        'node_modules',
        '.git',
        'dist',
        'build',
        '.env*',
        '*.log'
      ]
    });

    res.json({
      success: true,
      data: {
        tree: fileTree.tree,
        totalFiles: fileTree.totalFiles,
        totalDirectories: fileTree.totalDirectories
      }
    });

  } catch (error) {
    console.error('AI Context Window File Tree error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Preview Generation Endpoint
 * Generates live preview of changes
 */
router.post('/generate-preview', authMiddleware, async (req, res) => {
  try {
    const { sourceCode, changes, filePath } = req.body;

    if (!sourceCode || !changes) {
      return res.status(400).json({
        success: false,
        message: 'Source code and changes are required'
      });
    }

    const preview = await patchService.generatePreview({
      sourceCode,
      changes,
      filePath
    });

    res.json({
      success: true,
      data: {
        previewCode: preview.code,
        diff: preview.diff,
        highlights: preview.highlights || [],
        validation: preview.validation || { isValid: true, errors: [] }
      }
    });

  } catch (error) {
    console.error('AI Context Window Preview Generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;