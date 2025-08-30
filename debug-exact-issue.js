/**
 * Debug the EXACT issue with lines 14 and 34 changes
 */
import UnifiedDiffFrontendService from './src/services/unified-diff-frontend-service.js';

// Recreate the exact changes from your patch
const originalCode = `
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { createPublicUrl, getExternalStoreUrl, getStoreBaseUrl } from '@/utils/urlUtils';
import { useStore } from '@/components/storefront/StoreProvider';
import { StorefrontProduct } from '@/api/storefront-entities';
import { Coupon } from '@/api/entities';
import { Tax } from '@/api/entities';
import { User } from '@/api/entities';
import cartService from '@/services/cartService';
import couponService from '@/services/couponService';
import taxService from '@/services/taxService';
import RecommendedProducts from '@/components/storefront/RecommendedProducts';
import FlashMessage from '@/components/storefront/FlashMessage';
import SeoHeadManager from '@/components/storefront/SeoHeadManager';
import CmsBlockRenderer from '@/components/storefront/CmsBlockRenderer';
import { formatDisplayPrice, calculateDisplayPrice } from '@/utils/priceUtils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Minus, Tag, ShoppingCart } from 'lucide-react';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Safe number formatting helper
const formatPrice = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
};`;

const modifiedCode = `
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { createPublicUrl, getExternalStoreUrl, getStoreBaseUrl } from '@/utils/urlUtils';
import { useStore } from '@/components/storefront/StoreProvider';
import { StorefrontProduct } from '@/api/storefront-entities';
import { Coupon } from '@/api/entities';
import { Tax } from '@/api/entities';
import { User } from '@/api/entities';
import cartService from '@/services/cartService';
import couponService from '@/services/couponService';
import taxService from '@/services/taxService';
import sRecommendedProducts from '@/components/storefront/RecommendedProducts';
import FlashMessage from '@/components/storefront/FlashMessage';
import SeoHeadManager from '@/components/storefront/SeoHeadManager';
import CmsBlockRenderer from '@/components/storefront/CmsBlockRenderer';
import { formatDisplayPrice, calculateDisplayPrice } from '@/utils/priceUtils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Minus, Tag, ShoppingCart } from 'lucide-react';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Safe number formatting helper modified
const formatPrice2 = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
};`;

console.log('🔍 DEBUG: Testing EXACT changes - line 14 and 34 (20 lines apart)');

const diffService = new UnifiedDiffFrontendService();
const result = diffService.createDiff(originalCode, modifiedCode, {
  filename: 'Cart.jsx'
});

console.log('\n📋 Generated unified diff:');
console.log('='.repeat(60));
console.log(result.unifiedDiff);
console.log('='.repeat(60));
console.log(`Number of hunks: ${result.parsedDiff.length}`);

// Debug the exact line changes
const originalLines = originalCode.split('\n');
const modifiedLines = modifiedCode.split('\n');
const maxLines = Math.max(originalLines.length, modifiedLines.length);

console.log('\n🔍 Line-by-line analysis:');
let changeLines = [];
for (let i = 0; i < maxLines; i++) {
  if (originalLines[i] !== modifiedLines[i]) {
    changeLines.push(i + 1);
    console.log(`Line ${i + 1}: CHANGED`);
    console.log(`  Original: "${originalLines[i] || 'undefined'}"`);
    console.log(`  Modified: "${modifiedLines[i] || 'undefined'}"`);
  }
}

console.log(`\nChanges detected on lines: [${changeLines.join(', ')}]`);
console.log(`Number of changes: ${changeLines.length}`);

if (changeLines.length >= 2) {
  const separation = Math.abs(changeLines[1] - changeLines[0]);
  console.log(`Separation between first two changes: ${separation} lines`);
  console.log(`Minimum required separation: 6 lines`);
  console.log(`Should create separate hunks: ${separation > 6 ? 'YES' : 'NO'}`);
}

if (result.parsedDiff.length === 1 && changeLines.length === 2) {
  console.log('\n❌ BUG CONFIRMED: 2 changes, 20 lines apart, but only 1 hunk created!');
  console.log('🐛 The groupIntoHunks algorithm is not working correctly!');
} else if (result.parsedDiff.length > 1) {
  console.log('\n✅ Working correctly: Multiple hunks created for distant changes');
}