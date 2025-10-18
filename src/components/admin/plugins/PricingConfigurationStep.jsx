// src/components/admin/plugins/PricingConfigurationStep.jsx
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectItem } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Package, Zap } from 'lucide-react';
import { PRICING_MODELS, LICENSE_TYPES, REVENUE_SHARE } from '@/constants/PluginPricing';

export default function PricingConfigurationStep({ pluginData, onUpdate }) {
  const [pricingModel, setPricingModel] = useState(pluginData.pricingModel || 'free');
  const [pricing, setPricing] = useState({
    basePrice: pluginData.basePrice || 0,
    monthlyPrice: pluginData.monthlyPrice || 0,
    yearlyPrice: pluginData.yearlyPrice || 0,
    currency: pluginData.currency || 'USD',
    licenseType: pluginData.licenseType || 'per_store',
    tiers: pluginData.pricingTiers || [],
    hasTrial: pluginData.hasTrial || false,
    trialDays: pluginData.trialDays || 14
  });

  const handlePricingModelChange = (model) => {
    setPricingModel(model);
    onUpdate({ ...pluginData, pricingModel: model });
  };

  const handlePricingChange = (updates) => {
    const newPricing = { ...pricing, ...updates };
    setPricing(newPricing);
    onUpdate({ ...pluginData, ...newPricing });
  };

  const calculateRevenue = (price) => {
    return (price * REVENUE_SHARE.CREATOR_PERCENTAGE / 100).toFixed(2);
  };

  const calculateYearlyDiscount = () => {
    if (pricing.monthlyPrice && pricing.yearlyPrice) {
      const monthlyTotal = pricing.monthlyPrice * 12;
      const discount = ((monthlyTotal - pricing.yearlyPrice) / monthlyTotal * 100);
      return discount.toFixed(0);
    }
    return 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Monetization Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure how you want to charge for your plugin. You'll receive {REVENUE_SHARE.CREATOR_PERCENTAGE}%
          of all sales after platform fees.
        </p>
      </div>

      {/* Pricing Model Selection */}
      <Card className="p-4">
        <Label className="text-base font-medium mb-3 block">Pricing Model</Label>
        <RadioGroup value={pricingModel} onValueChange={handlePricingModelChange}>
          <div className="space-y-3">
            {/* Free */}
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="free" id="free" className="mt-1" />
              <Label htmlFor="free" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-4 h-4 text-green-600" />
                  <span className="font-medium">Free</span>
                  <Badge variant="secondary" className="text-xs">Most Popular</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  No charge. Great for building reputation, getting feedback, and community contributions.
                </p>
              </Label>
            </div>

            {/* One-Time */}
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="one_time" id="one_time" className="mt-1" />
              <Label htmlFor="one_time" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">One-Time Purchase</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Single payment for lifetime access. Best for feature-complete plugins.
                </p>
              </Label>
            </div>

            {/* Subscription */}
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="subscription" id="subscription" className="mt-1" />
              <Label htmlFor="subscription" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span className="font-medium">Subscription</span>
                  <Badge variant="outline" className="text-xs">Recurring Revenue</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Monthly or yearly recurring payments. Great for ongoing support and updates.
                </p>
              </Label>
            </div>

            {/* Custom Tiers */}
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="custom" id="custom" className="mt-1" />
              <Label htmlFor="custom" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-orange-600" />
                  <span className="font-medium">Custom Tiers</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Multiple pricing tiers with different feature sets (Starter, Pro, Enterprise).
                </p>
              </Label>
            </div>
          </div>
        </RadioGroup>
      </Card>

      {/* One-Time Pricing Form */}
      {pricingModel === 'one_time' && (
        <Card className="p-4">
          <Label className="text-base font-medium mb-3 block">One-Time Price</Label>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <select
                value={pricing.currency}
                onChange={(e) => handlePricingChange({ currency: e.target.value })}
                className="border rounded px-3 py-2"
              >
                <option value="USD">USD $</option>
                <option value="EUR">EUR €</option>
                <option value="GBP">GBP £</option>
              </select>
              <Input
                type="number"
                placeholder="49.00"
                value={pricing.basePrice}
                onChange={(e) => handlePricingChange({ basePrice: parseFloat(e.target.value) || 0 })}
                className="flex-1"
              />
            </div>
            {pricing.basePrice > 0 && (
              <Alert className="bg-green-50 border-green-200">
                <DollarSign className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  You'll receive <span className="font-semibold">${calculateRevenue(pricing.basePrice)}</span> per sale
                  ({REVENUE_SHARE.CREATOR_PERCENTAGE}% of ${pricing.basePrice})
                </AlertDescription>
              </Alert>
            )}
          </div>
        </Card>
      )}

      {/* Subscription Pricing Form */}
      {pricingModel === 'subscription' && (
        <Card className="p-4">
          <Label className="text-base font-medium mb-3 block">Subscription Pricing</Label>
          <div className="space-y-4">
            {/* Monthly Price */}
            <div>
              <Label className="text-sm mb-2 block">Monthly Price</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">$</span>
                <Input
                  type="number"
                  placeholder="9.99"
                  value={pricing.monthlyPrice}
                  onChange={(e) => handlePricingChange({ monthlyPrice: parseFloat(e.target.value) || 0 })}
                />
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              {pricing.monthlyPrice > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  You earn ${calculateRevenue(pricing.monthlyPrice)}/month per subscriber
                </p>
              )}
            </div>

            {/* Yearly Price */}
            <div>
              <Label className="text-sm mb-2 block">Yearly Price (optional discount)</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">$</span>
                <Input
                  type="number"
                  placeholder="99.00"
                  value={pricing.yearlyPrice}
                  onChange={(e) => handlePricingChange({ yearlyPrice: parseFloat(e.target.value) || 0 })}
                />
                <span className="text-sm text-muted-foreground">/year</span>
              </div>
              {pricing.monthlyPrice && pricing.yearlyPrice && (
                <p className="text-xs text-green-600 mt-1">
                  {calculateYearlyDiscount()}% discount for yearly •
                  You earn ${calculateRevenue(pricing.yearlyPrice)}/year per subscriber
                </p>
              )}
            </div>

            {/* Trial Option */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label className="text-sm font-medium">Offer Free Trial</Label>
                <p className="text-xs text-muted-foreground">Let users try before they buy</p>
              </div>
              <input
                type="checkbox"
                checked={pricing.hasTrial}
                onChange={(e) => handlePricingChange({ hasTrial: e.target.checked })}
                className="w-4 h-4"
              />
            </div>

            {pricing.hasTrial && (
              <div>
                <Label className="text-sm mb-2 block">Trial Duration (days)</Label>
                <Input
                  type="number"
                  value={pricing.trialDays}
                  onChange={(e) => handlePricingChange({ trialDays: parseInt(e.target.value) || 14 })}
                  min="1"
                  max="90"
                />
              </div>
            )}
          </div>
        </Card>
      )}

      {/* License Type */}
      {pricingModel !== 'free' && (
        <Card className="p-4">
          <Label className="text-base font-medium mb-3 block">License Type</Label>
          <select
            value={pricing.licenseType}
            onChange={(e) => handlePricingChange({ licenseType: e.target.value })}
            className="w-full border rounded px-3 py-2"
          >
            <option value="per_store">Per Store - Each tenant pays separately</option>
            <option value="unlimited">Unlimited - One purchase, install anywhere</option>
            <option value="per_user">Per User - Pricing based on admin user count</option>
          </select>
        </Card>
      )}

      {/* Revenue Share Info */}
      <Alert>
        <DollarSign className="w-4 h-4" />
        <AlertDescription>
          <div className="font-medium mb-1">Revenue Share</div>
          <p className="text-sm">
            Platform takes {REVENUE_SHARE.PLATFORM_PERCENTAGE}% for hosting, payment processing,
            marketplace fees, and customer support. You keep {REVENUE_SHARE.CREATOR_PERCENTAGE}% of all sales.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
