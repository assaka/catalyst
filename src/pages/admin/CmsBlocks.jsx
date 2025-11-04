
import React, { useState, useEffect } from "react";
import { CmsBlock } from "@/api/entities";
import { useStoreSelection } from "@/contexts/StoreSelectionContext.jsx";
import NoStoreSelected from "@/components/admin/NoStoreSelected";
import CmsBlockForm from "@/components/admin/cms/CmsBlockForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBlockTitle, getBlockContent } from "@/utils/translationUtils";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, FileText } from "lucide-react"; // Removed Eye, Code as they are not used
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import FlashMessage from "@/components/storefront/FlashMessage";
import { useAlertTypes } from "@/hooks/useAlert";
import { clearCmsBlocksCache } from "@/utils/cacheUtils";

export default function CmsBlocks() {
  const { selectedStore, getSelectedStoreId } = useStoreSelection();
  const { showConfirm, AlertComponent } = useAlertTypes();
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [flashMessage, setFlashMessage] = useState(null);

  useEffect(() => {
    if (selectedStore) {
      loadBlocks();
    }
  }, [selectedStore]);

  // Listen for store changes
  useEffect(() => {
    const handleStoreChange = () => {
      if (selectedStore) {
        loadBlocks();
      }
    };

    window.addEventListener('storeSelectionChanged', handleStoreChange);
    return () => window.removeEventListener('storeSelectionChanged', handleStoreChange);
  }, [selectedStore]);

  const loadBlocks = async () => {
    const storeId = getSelectedStoreId();
    if (!storeId) {
      console.warn("CmsBlocks: No store selected.");
      setBlocks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const blocksData = await CmsBlock.filter({ store_id: storeId });
      console.log('🔍 CmsBlocks - Loaded blocks:', {
        count: blocksData?.length,
        firstBlock: blocksData?.[0],
        firstBlockTranslations: blocksData?.[0]?.translations,
        firstBlockTranslationKeys: Object.keys(blocksData?.[0]?.translations || {})
      });
      setBlocks(blocksData || []);
    } catch (error) {
      console.error("Error loading CMS blocks:", error);
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (formData) => {
    const storeId = getSelectedStoreId();
    if (!storeId) {
      console.error("Cannot save CMS block: No store selected.");
      setFlashMessage({ type: 'error', message: 'Cannot save CMS block: No store selected.' });
      return;
    }

    try {
      // Ensure the store_id is set for new blocks
      if (!formData.store_id) {
        formData.store_id = storeId;
      }

      if (editingBlock) {
        await CmsBlock.update(editingBlock.id, formData);
        setFlashMessage({ type: 'success', message: 'CMS Block updated successfully!' });
      } else {
        await CmsBlock.create(formData);
        setFlashMessage({ type: 'success', message: 'CMS Block created successfully!' });
      }
      closeForm();
      loadBlocks();
      // Clear storefront cache for instant updates
      if (storeId) clearCmsBlocksCache(storeId);
    } catch (error) {
      console.error("Failed to save CMS block", error);
      setFlashMessage({ type: 'error', message: 'Failed to save CMS block.' });
    }
  };

  const handleEdit = (block) => {
    console.log('🔍 CmsBlocks - Edit clicked on block:', {
      blockId: block?.id,
      blockIdentifier: block?.identifier,
      hasTranslations: !!block?.translations,
      translationKeys: Object.keys(block?.translations || {}),
      translations: block?.translations
    });
    setEditingBlock(block); // Changed from 'setSelectedBlock'
    setShowForm(true);
  };

  const handleDelete = async (blockId) => {
    const confirmed = await showConfirm("Are you sure you want to delete this CMS block?", "Delete CMS Block");
    if (confirmed) {
      try {
        await CmsBlock.delete(blockId);
        setFlashMessage({ type: 'success', message: 'CMS Block deleted successfully!' });
        loadBlocks(); // Call loadBlocks
        // Clear storefront cache for instant updates
        const storeId = getSelectedStoreId();
        if (storeId) clearCmsBlocksCache(storeId);
      } catch (error) {
        console.error("Failed to delete CMS block", error);
        setFlashMessage({ type: 'error', message: 'Failed to delete CMS block.' });
      }
    }
  };

  const handleToggleActive = async (block) => {
    try {
      await CmsBlock.update(block.id, { ...block, is_active: !block.is_active });
      setFlashMessage({ type: 'success', message: `CMS Block ${block.is_active ? 'deactivated' : 'activated'} successfully!` });
      loadBlocks(); // Call loadBlocks
      // Clear storefront cache for instant updates
      const storeId = getSelectedStoreId();
      if (storeId) clearCmsBlocksCache(storeId);
    } catch (error) {
      console.error("Failed to toggle block status", error);
      setFlashMessage({ type: 'error', message: 'Failed to toggle block status.' });
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingBlock(null); // Changed from 'setSelectedBlock'
  };

  const getBlockTypeIcon = (identifier) => {
    if (identifier?.includes('banner')) return '🎯';
    if (identifier?.includes('hero')) return '🏆';
    if (identifier?.includes('promo')) return '🎁';
    if (identifier?.includes('footer')) return '👇';
    if (identifier?.includes('header')) return '👆';
    return '📄';
  };

  if (!selectedStore) {
    return <NoStoreSelected />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <FlashMessage message={flashMessage} onClose={() => setFlashMessage(null)} />
      <AlertComponent />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CMS Blocks</h1>
            <p className="text-gray-600 mt-1">Manage content blocks for your store</p>
          </div>
          <Button 
            onClick={() => handleEdit(null)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 material-ripple material-elevation-1"
            disabled={!selectedStore}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Block
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : blocks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {blocks.map(block => (
              <Card key={block.id} className="material-elevation-1 border-0 hover:material-elevation-2 transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-xl">{getBlockTypeIcon(block.identifier)}</span>
                      </div>
                      <div>
                        <CardTitle className="text-lg">{getBlockTitle(block)}</CardTitle>
                        <p className="text-sm text-gray-500">/{block.identifier}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active</span>
                    <Switch
                      checked={block.is_active}
                      onCheckedChange={() => handleToggleActive(block)}
                    />
                  </div>

                  <div className="text-sm text-gray-600">
                    <div className="bg-gray-50 p-2 rounded text-xs font-mono max-h-20 overflow-hidden">
                      {getBlockContent(block)?.substring(0, 100)}...
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2">
                    <Badge variant={block.is_active ? "default" : "secondary"}>
                      {block.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(block)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(block.id)} className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="material-elevation-1 border-0">
            <CardContent className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No CMS blocks found</h3>
              <p className="text-gray-600 mb-6">
                Create your first content block to customize your store's appearance.
              </p>
              <Button
                onClick={() => handleEdit(null)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 material-ripple"
                disabled={!selectedStore}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Block
              </Button>
            </CardContent>
          </Card>
        )}

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBlock ? 'Edit CMS Block' : 'Add New CMS Block'}</DialogTitle> {/* Changed from 'selectedBlock' */}
            </DialogHeader>
            <CmsBlockForm
              block={editingBlock}
              onSubmit={handleFormSubmit}
              onCancel={closeForm}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
