import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Languages } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useTranslation } from "@/contexts/TranslationContext.jsx";
import { toast } from "sonner";
import FlashMessage from "@/components/storefront/FlashMessage";
import api from "@/utils/api";

/**
 * Reusable Bulk Translate Dialog Component
 *
 * @param {boolean} open - Whether the dialog is open
 * @param {function} onOpenChange - Callback when dialog open state changes
 * @param {string} entityType - Type of entity (e.g., 'categories', 'products', 'attributes')
 * @param {string} entityName - Display name for the entity (e.g., 'Categories', 'Products')
 * @param {function} onTranslate - Callback function to handle translation (receives fromLang, toLang)
 * @param {function} onComplete - Callback after translation completes (for reloading data)
 */
export default function BulkTranslateDialog({
  open,
  onOpenChange,
  entityType = 'items',
  entityName = 'Items',
  onTranslate,
  onComplete,
  itemCount = 0
}) {
  const { availableLanguages } = useTranslation();
  const [translateFromLang, setTranslateFromLang] = useState('en');
  const [translateToLangs, setTranslateToLangs] = useState([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationCost, setTranslationCost] = useState(0.1); // Default fallback
  const [showFlash, setShowFlash] = useState(false);
  const [flashMessage, setFlashMessage] = useState('');

  // Get flat-rate cost based on entity type
  const getEntityCost = (entityType) => {
    const entityCosts = {
      'CMS Content': 0.35,       // Average of pages (0.5) and blocks (0.2)
      'cms_page': 0.5,           // CMS pages: 0.5 credits
      'cms_block': 0.2,          // CMS blocks: 0.2 credits
      'cookie_consent': 0.1,     // Standard rate
      'product': 0.1,            // Standard rate
      'category': 0.1,           // Standard rate
      'attribute': 0.1,          // Standard rate
      'product_tab': 0.1,        // Standard rate
      'product_label': 0.1,      // Standard rate
      'UI labels': 0.1,          // Standard rate
      'custom_option': 0.1       // Standard rate
    };

    return entityCosts[entityType] || entityCosts[entityName] || 0.1; // Default to 0.1
  };

  // Load translation cost from API
  useEffect(() => {
    const loadTranslationCost = async () => {
      try {
        // Determine which service to use based on entity type
        let serviceKey = 'ai_translation'; // Default

        if (entityType === 'cms_page' || entityName === 'CMS Pages') {
          serviceKey = 'ai_translation_cms_page';
        } else if (entityType === 'cms_block' || entityName === 'CMS Blocks') {
          serviceKey = 'ai_translation_cms_block';
        } else if (entityName === 'CMS Content') {
          // For mixed CMS content, use average
          const pageResponse = await api.get('service-credit-costs/key/ai_translation_cms_page');
          const blockResponse = await api.get('service-credit-costs/key/ai_translation_cms_block');
          if (pageResponse.success && blockResponse.success) {
            setTranslationCost((pageResponse.service.cost_per_unit + blockResponse.service.cost_per_unit) / 2);
            return;
          }
        }

        const response = await api.get(`service-credit-costs/key/${serviceKey}`);
        if (response.success && response.service) {
          setTranslationCost(response.service.cost_per_unit);
        } else {
          setTranslationCost(getEntityCost(entityType));
        }
      } catch (error) {
        console.error('Error loading translation cost:', error);
        setTranslationCost(getEntityCost(entityType));
      }
    };

    if (open) {
      loadTranslationCost();
    }
  }, [open, entityType, entityName]);

  const handleTranslate = async () => {
    if (!translateFromLang || translateToLangs.length === 0) {
      toast.error("Please select source language and at least one target language");
      return;
    }

    if (translateToLangs.includes(translateFromLang)) {
      toast.error("Target languages cannot include the source language");
      return;
    }

    setIsTranslating(true);
    try {
      // Call the provided onTranslate callback for each target language
      let totalTranslated = 0;
      let totalSkipped = 0;
      let totalFailed = 0;
      const allErrors = [];

      for (const toLang of translateToLangs) {
        const result = await onTranslate(translateFromLang, toLang);

        if (result.success) {
          totalTranslated += result.data.translated || 0;
          totalSkipped += result.data.skipped || 0;
          totalFailed += result.data.failed || 0;
          if (result.data.errors && result.data.errors.length > 0) {
            allErrors.push(...result.data.errors.map(err => ({ ...err, toLang })));
          }
        } else {
          toast.error(`Failed to translate to ${toLang}: ${result.message}`);
        }
      }

      if (totalTranslated > 0) {
        const message = `Successfully translated ${totalTranslated} ${entityType} to ${translateToLangs.length} language(s)`;
        toast.success(message);

        // Show green flash message
        setFlashMessage(message);
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 3000);

        // Reload data after successful translation
        if (onComplete) {
          onComplete();
        }
      }
      if (totalSkipped > 0 && totalTranslated === 0) {
        toast.info(`All ${totalSkipped} ${entityType} were skipped (already translated or missing source language)`);
      }
      if (totalFailed > 0) {
        console.warn('Translation errors:', allErrors);
        toast.warning(`${totalFailed} translations failed. Check console for details.`);
      }

      // Reset and close dialog
      setTranslateToLangs([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Bulk translate error:', error);
      toast.error(`Failed to translate ${entityType}`);
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <>
      {showFlash && (
        <FlashMessage
          message={flashMessage}
          type="success"
          duration={3000}
          onClose={() => setShowFlash(false)}
        />
      )}

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Bulk AI Translate {entityName}</DialogTitle>
          </DialogHeader>
        <div className="space-y-4 py-4 overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="from-lang">From Language</Label>
            <Select value={translateFromLang} onValueChange={setTranslateFromLang}>
              <SelectTrigger id="from-lang">
                <SelectValue placeholder="Select source language" />
              </SelectTrigger>
              <SelectContent>
                {availableLanguages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name} ({lang.native_name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>To Languages (Select one or more)</Label>
            <div className="border rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto">
              {availableLanguages
                .filter((lang) => lang.code !== translateFromLang)
                .map((lang) => (
                  <div key={lang.code} className="flex items-center space-x-2">
                    <Checkbox
                      id={`lang-${lang.code}`}
                      checked={translateToLangs.includes(lang.code)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setTranslateToLangs([...translateToLangs, lang.code]);
                        } else {
                          setTranslateToLangs(translateToLangs.filter(code => code !== lang.code));
                        }
                      }}
                    />
                    <Label
                      htmlFor={`lang-${lang.code}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {lang.name} ({lang.native_name})
                    </Label>
                  </div>
                ))}
            </div>
            {translateToLangs.length > 0 && (
              <p className="text-xs text-gray-600 mt-1">
                {translateToLangs.length} language(s) selected
              </p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              {translateToLangs.length > 0 ? (
                <>
                  This will translate all {entityType} from {translateFromLang} to {translateToLangs.length} selected language(s). {entityName} that already have translations will be skipped.
                </>
              ) : (
                'Please select at least one target language.'
              )}
            </p>
          </div>

          {/* Credit Cost Estimate */}
          {translateToLangs.length > 0 && itemCount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-green-800 font-medium">
                  💰 Estimated Cost:
                </span>
                <span className="text-green-900 font-bold">
                  {(itemCount * translateToLangs.length * translationCost).toFixed(2)} credits
                </span>
              </div>
              <p className="text-xs text-green-700">
                {itemCount} {entityType} × {translateToLangs.length} lang(s) × {translationCost.toFixed(2)} credits per item
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {entityName === 'CMS Content' && 'Mixed CMS content (average of pages and blocks)'}
                {entityName === 'CMS Pages' && 'CMS pages: 0.5 credits each ($0.05)'}
                {entityName === 'CMS Blocks' && 'CMS blocks: 0.2 credits each ($0.02)'}
                {!entityName.includes('CMS') && 'Standard rate: 0.1 credits per item ($0.01)'}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setTranslateToLangs([]);
              }}
              disabled={isTranslating}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleTranslate}
              disabled={isTranslating || !translateFromLang || translateToLangs.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isTranslating ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Translating...
                </>
              ) : (
                <>
                  <Languages className="w-4 h-4 mr-2" />
                  Translate to {translateToLangs.length || 0} Language(s)
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
