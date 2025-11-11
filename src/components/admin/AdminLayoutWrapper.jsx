/**
 * AdminLayoutWrapper
 *
 * Wraps admin routes with TranslationProvider
 * This prevents duplicate TranslationProvider for storefront routes
 */

import React from 'react';
import { TranslationProvider } from '@/contexts/TranslationContext';

export function AdminLayoutWrapper({ children }) {
  return (
    <TranslationProvider>
      {children}
    </TranslationProvider>
  );
}
