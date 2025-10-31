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
import api from "@/utils/api";

/**
 * Reusable Bulk Translate Dialog Component
 *
 * @param {boolean} open - Whether the dialog is open
 * @param {function} onOpenChange - Callback when dialog open state changes
 * @param {string} entityType - Type of entity (e.g., 'categories', 'products', 'attributes')
 * @param {string} entityName - Display name for the entity (e.g., 'Categories', 'Products')
 * @param {function} onTranslate - Callback function to handle translation (receives fromLang, toLang)
 */
export default function BulkTranslateDialog({
  open,
  onOpenChange,
  entityType = 'items',
  entityName = 'Items',
  onTranslate,
  itemCount = 0
}) {
  const { availableLanguages } = useTranslation();
  const [translateFromLang, setTranslateFromLang] = useState('en');
  const [translateToLangs, setTranslateToLangs] = useState([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationCost, setTranslationCost] = useState(0.1); // Default fallback

  // Load translation cost from API
  useEffect(() => {
    const loadTranslationCost = async () => {
      try {
        const response = await api.get('/service-credit-costs/key/ai_translation');
        if (response.data.success && response.data.service) {
          setTranslationCost(response.data.service.cost_per_unit);
        }
      } catch (error) {
        console.error('Error loading translation cost:', error);
        // Keep using default fallback value
      }
    };

    if (open) {
      loadTranslationCost();
    }
  }, [open]);

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
        toast.success(`Successfully translated ${totalTranslated} ${entityType} to ${translateToLangs.length} language(s)`);
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
                  This will translate all {entityType} from {translateFromLang} to {translateToLangs.length} selected language(s).
                  {entityName} that already have translations will be skipped.
                </>
              ) : (
                'Please select at least one target language.'
              )}
            </p>
          </div>

          {/* Credit Cost Estimate */}
          {translateToLangs.length > 0 && itemCount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-800 font-medium">
                  💰 Estimated Cost:
                </span>
                <span className="text-green-900 font-bold">
                  {(itemCount * translateToLangs.length * translationCost).toFixed(2)} credits
                </span>
              </div>
              <p className="text-xs text-green-700 mt-1">
                {itemCount} {entityType} × {translateToLangs.length} language(s) × {translationCost} credits each
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
  );
}
