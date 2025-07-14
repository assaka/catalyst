
import React, { useState, useEffect } from "react";
import { CmsPage } from "@/api/entities";
import { Store } from "@/api/entities";
import { Product } from "@/api/entities";
import { User } from "@/api/entities"; // Added User import
import { 
  FileText, 
  Plus, 
  Search, 
  Edit,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import FlashMessage from "../components/storefront/FlashMessage";
import CmsPageForm from "../components/cms/CmsPageForm";

export default function CmsPages() {
  const [pages, setPages] = useState([]); // Renamed from cmsPages
  const [store, setStore] = useState(null); // Renamed from stores, now singular
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingPage, setEditingPage] = useState(null); // Renamed from selectedPage
  const [showForm, setShowForm] = useState(false); // Renamed from showPageForm
  const [flashMessage, setFlashMessage] = useState(null);

  useEffect(() => {
    loadPages(); // Changed to loadPages
  }, []);

  const loadPages = async () => { // Renamed from loadData
    setLoading(true);
    try {
      const user = await User.me();
      const stores = await Store.filter({ owner_email: user.email });
      if (stores && stores.length > 0) {
        const currentStore = stores[0];
        setStore(currentStore);
        
        const pagesData = await CmsPage.filter({ store_id: currentStore.id });
        setPages(pagesData || []); // Updated state setter
        
        const productsData = await Product.filter({ store_id: currentStore.id });
        setProducts(productsData || []);
      } else {
        setPages([]); // Updated state setter
        setProducts([]);
        setStore(null); // Ensure store is null if no store found
        console.warn("No store found for user. Cannot load CMS pages or products.");
      }
    } catch (error) {
      console.error("Error loading CMS pages:", error);
      setFlashMessage({ type: 'error', message: 'Failed to load CMS pages.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePage = async (pageData) => {
    try {
      if (store && !pageData.store_id) { // Use singular 'store' state
        pageData.store_id = store.id;
      } else if (!store) {
        setFlashMessage({ type: 'error', message: 'Cannot create page: No store associated with user.' });
        return;
      }
      
      await CmsPage.create(pageData);
      await loadPages(); // Changed to loadPages
      setShowForm(false); // Updated state setter
      setFlashMessage({ type: 'success', message: 'CMS Page created successfully!' });
    } catch (error) {
      console.error("Error creating CMS page:", error);
      setFlashMessage({ type: 'error', message: 'Failed to create CMS page.' });
    }
  };

  const handleUpdatePage = async (pageData) => {
    try {
      await CmsPage.update(editingPage.id, pageData); // Updated state variable
      await loadPages(); // Changed to loadPages
      setShowForm(false); // Updated state setter
      setEditingPage(null); // Updated state setter
      setFlashMessage({ type: 'success', message: 'CMS Page updated successfully!' });
    } catch (error) {
      console.error("Error updating CMS page:", error);
      setFlashMessage({ type: 'error', message: 'Failed to update CMS page.' });
    }
  };

  const handleDeletePage = async (pageId) => {
    if (window.confirm("Are you sure you want to delete this CMS page?")) {
      try {
        await CmsPage.delete(pageId);
        await loadPages(); // Changed to loadPages
        setFlashMessage({ type: 'success', message: 'CMS Page deleted successfully!' });
      } catch (error) {
        console.error("Error deleting CMS page:", error);
        setFlashMessage({ type: 'error', message: 'Failed to delete CMS page.' });
      }
    }
  };

  const filteredPages = pages.filter(page => // Filter 'pages' state
    page.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <FlashMessage message={flashMessage} onClose={() => setFlashMessage(null)} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CMS Pages</h1>
            <p className="text-gray-600 mt-1">Manage your content pages</p>
          </div>
          <Button
            onClick={() => {
              setEditingPage(null); // Updated state setter
              setShowForm(true); // Updated state setter
            }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 material-ripple material-elevation-1"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add CMS Page
          </Button>
        </div>

        <Card className="material-elevation-1 border-0 mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPages.map((page) => ( // Mapping over filteredPages
            <Card key={page.id} className="material-elevation-1 border-0 hover:material-elevation-2 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span>{page.title}</span>
                  <Badge variant={page.is_active ? "default" : "secondary"}>
                    {page.is_active ? "Active" : "Inactive"}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-500">/{page.slug}</p>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end space-x-2">
                   <Link to={createPageUrl(`CmsPageViewer?slug=${page.slug}`)} target="_blank">
                      <Button variant="outline" size="sm">View</Button>
                   </Link>
                   <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingPage(page); // Updated state setter
                      setShowForm(true); // Updated state setter
                    }}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeletePage(page.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={showForm} onOpenChange={setShowForm}> {/* Updated state variable and setter */}
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPage ? 'Edit CMS Page' : 'Add New CMS Page'} {/* Updated state variable */}
              </DialogTitle>
            </DialogHeader>
            <CmsPageForm
              page={editingPage} // Updated state variable
              stores={store ? [store] : []} // Pass store as an array if it exists, otherwise empty array
              products={products}
              onSubmit={editingPage ? handleUpdatePage : handleCreatePage} // Updated state variable
              onCancel={() => setShowForm(false)} // Updated state setter
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
