import React, { useState, useEffect } from 'react';
import { CmsBlock } from '@/api/entities';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';

// Global cache and request queue to prevent duplicate requests
const cmsBlockCache = new Map();
const pendingRequests = new Map();

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const retryApiCall = async (apiCall, maxRetries = 3, baseDelay = 2000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await delay(Math.random() * 1000); // Random delay to spread requests
      return await apiCall();
    } catch (error) {
      const isRateLimit = error.response?.status === 429 ||
                         error.message?.includes('Rate limit') ||
                         error.message?.includes('429');

      if (isRateLimit && i < maxRetries - 1) {
        const delayTime = baseDelay * Math.pow(2, i) + Math.random() * 2000;
        console.warn(`CmsBlockRenderer: Rate limit hit, retrying in ${delayTime}ms... (Attempt ${i + 1}/${maxRetries})`);
        await delay(delayTime);
        continue;
      }
      
      if (isRateLimit) {
        console.error("CmsBlockRenderer: Rate limit exceeded, returning empty blocks");
        return [];
      }
      
      throw error;
    }
  }
};

const loadCmsBlocksWithCache = async (storeId) => {
  const cacheKey = `store_${storeId}`;
  
  // Check cache first
  if (cmsBlockCache.has(cacheKey)) {
    return cmsBlockCache.get(cacheKey);
  }

  // Check if there's already a pending request
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }

  // Create new request to load CMS blocks
  const requestPromise = retryApiCall(async () => {
    console.log('🔄 Loading CMS blocks for store:', storeId);
    try {
      const blocks = await CmsBlock.findAll({ store_id: storeId });
      console.log('✅ Loaded CMS blocks:', blocks?.length || 0);
      return blocks;
    } catch (error) {
      console.warn('⚠️ CmsBlockRenderer: Backend CMS blocks API failed, this is expected if backend is not properly configured:', error.message);
      // Return empty array instead of throwing - CMS blocks are optional
      return [];
    }
  })
    .then(blocks => {
      const result = blocks || [];
      cmsBlockCache.set(cacheKey, result);
      pendingRequests.delete(cacheKey);
      return result;
    })
    .catch(error => {
      console.warn("⚠️ CmsBlockRenderer: Failed to load CMS blocks, continuing without them:", error.message);
      pendingRequests.delete(cacheKey);
      return [];
    });

  pendingRequests.set(cacheKey, requestPromise);
  return requestPromise;
};

export default function CmsBlockRenderer({ position, page }) {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { selectedStore } = useStoreSelection();

  useEffect(() => {
    const loadBlocks = async () => {
      try {
        if (!selectedStore?.id) {
          console.log('❌ No store selected, cannot load CMS blocks');
          setBlocks([]);
          setLoading(false);
          return;
        }

        const allBlocks = await loadCmsBlocksWithCache(selectedStore.id);
        
        const filteredBlocks = allBlocks.filter(block => {
          if (!block.is_active) return false;
          
          const placement = block.placement || {};
          const blockPosition = placement.position || 'before_content';
          const blockPages = placement.pages || ['storefront_home'];
          
          return blockPosition === position && 
                 (blockPages.includes('all_pages') || blockPages.includes(page));
        });

        // Sort by sort_order
        filteredBlocks.sort((a, b) => {
          const aOrder = a.placement?.sort_order || 0;
          const bOrder = b.placement?.sort_order || 0;
          return aOrder - bOrder;
        });

        setBlocks(filteredBlocks);
      } catch (error) {
        console.error("Error filtering CMS blocks:", error);
        setBlocks([]);
      } finally {
        setLoading(false);
      }
    };

    loadBlocks();
  }, [position, page, selectedStore?.id]);

  if (loading) {
    return null; // Don't show loading spinner for CMS blocks
  }

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className="cms-blocks">
      {blocks.map((block) => (
        <div
          key={block.id}
          className="cms-block"
          dangerouslySetInnerHTML={{ __html: block.content }}
        />
      ))}
    </div>
  );
}