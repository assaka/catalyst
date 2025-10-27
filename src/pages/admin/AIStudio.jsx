import React, { useEffect } from 'react';
import AIStudioComponent from '@/components/ai-studio/AIStudio';
import { AIStudioProvider, useAIStudio } from '@/contexts/AIStudioContext';

/**
 * AIStudio Page Inner Component
 * Handles opening the AI Studio when mounted
 */
function AIStudioPageInner() {
  const { openAI, isOpen } = useAIStudio();

  useEffect(() => {
    if (!isOpen) {
      openAI(null); // Open with no initial mode (shows welcome screen)
    }
  }, [openAI, isOpen]);

  return (
    <div className="h-screen w-full">
      <AIStudioComponent />
    </div>
  );
}

/**
 * AIStudio Page
 * Page wrapper for the AIStudio component
 * Makes AIStudio accessible as a dedicated admin page
 */
export default function AIStudio() {
  return (
    <AIStudioProvider>
      <AIStudioPageInner />
    </AIStudioProvider>
  );
}
