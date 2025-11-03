import React, { useState, useEffect } from "react";
import { EmailTemplate } from "@/api/entities";
import { useStoreSelection } from "@/contexts/StoreSelectionContext.jsx";
import NoStoreSelected from "@/components/admin/NoStoreSelected";
import EmailTemplateForm from "@/components/admin/emails/EmailTemplateForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Mail, Send, Languages } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import FlashMessage from "@/components/storefront/FlashMessage";
import { useAlertTypes } from "@/hooks/useAlert";
import BulkTranslateDialog from "@/components/admin/BulkTranslateDialog";

export default function Emails() {
  const { selectedStore, getSelectedStoreId } = useStoreSelection();
  const { showConfirm, AlertComponent } = useAlertTypes();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [flashMessage, setFlashMessage] = useState(null);
  const [showBulkTranslate, setShowBulkTranslate] = useState(false);

  useEffect(() => {
    if (selectedStore) {
      loadTemplates();
    }
  }, [selectedStore]);

  // Listen for store changes
  useEffect(() => {
    const handleStoreChange = () => {
      if (selectedStore) {
        loadTemplates();
      }
    };

    window.addEventListener('storeSelectionChanged', handleStoreChange);
    return () => window.removeEventListener('storeSelectionChanged', handleStoreChange);
  }, [selectedStore]);

  const loadTemplates = async () => {
    const storeId = getSelectedStoreId();
    if (!storeId) {
      console.warn("Emails: No store selected.");
      setTemplates([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const templatesData = await EmailTemplate.filter({ store_id: storeId });
      console.log('📧 Emails - Loaded templates:', {
        count: templatesData?.length,
        templates: templatesData
      });
      setTemplates(templatesData || []);
    } catch (error) {
      console.error("Error loading email templates:", error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (formData) => {
    const storeId = getSelectedStoreId();
    if (!storeId) {
      console.error("Cannot save email template: No store selected.");
      setFlashMessage({ type: 'error', message: 'Cannot save email template: No store selected.' });
      return;
    }

    try {
      if (editingTemplate) {
        await EmailTemplate.update(editingTemplate.id, formData);
        setFlashMessage({ type: 'success', message: 'Email template updated successfully!' });
      } else {
        await EmailTemplate.create(formData);
        setFlashMessage({ type: 'success', message: 'Email template created successfully!' });
      }
      setShowForm(false);
      setEditingTemplate(null);
      loadTemplates();
    } catch (error) {
      console.error("Failed to save email template", error);
      setFlashMessage({ type: 'error', message: 'Failed to save email template.' });
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingTemplate(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingTemplate(null);
  };

  const handleToggleActive = async (template) => {
    try {
      await EmailTemplate.update(template.id, { ...template, is_active: !template.is_active });
      setFlashMessage({ type: 'success', message: `Email template ${template.is_active ? 'deactivated' : 'activated'} successfully!` });
      loadTemplates();
    } catch (error) {
      console.error("Failed to toggle template status", error);
      setFlashMessage({ type: 'error', message: 'Failed to toggle template status.' });
    }
  };

  const handleDelete = async (templateId) => {
    const confirmed = await showConfirm("Are you sure you want to delete this email template?", "Delete Email Template");
    if (confirmed) {
      try {
        await EmailTemplate.delete(templateId);
        setFlashMessage({ type: 'success', message: 'Email template deleted successfully!' });
        loadTemplates();
      } catch (error) {
        console.error("Failed to delete email template", error);
        setFlashMessage({ type: 'error', message: 'Failed to delete email template.' });
      }
    }
  };

  const handleBulkTranslate = async (fromLang, toLang) => {
    const storeId = getSelectedStoreId();
    if (!storeId) return { success: false, message: 'No store selected' };

    try {
      const response = await EmailTemplate.bulkTranslate(storeId, fromLang, toLang);
      return response;
    } catch (error) {
      console.error("Bulk translate error:", error);
      return { success: false, message: error.message };
    }
  };

  const getEmailTypeInfo = (identifier) => {
    const types = {
      'signup_email': {
        icon: '👋',
        color: 'from-blue-500 to-purple-600',
        label: 'Welcome Email'
      },
      'email_verification': {
        icon: '✉️',
        color: 'from-indigo-500 to-blue-600',
        label: 'Email Verification'
      },
      'order_success_email': {
        icon: '📦',
        color: 'from-orange-500 to-red-600',
        label: 'Order Confirmation'
      },
      'credit_purchase_email': {
        icon: '💳',
        color: 'from-green-500 to-emerald-600',
        label: 'Credit Purchase'
      }
    };

    return types[identifier] || { icon: '📧', color: 'from-gray-500 to-gray-600', label: identifier };
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
            <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
            <p className="text-gray-600 mt-1">Manage transactional email templates for your store</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowBulkTranslate(true)}
              variant="outline"
              disabled={!selectedStore || templates.length === 0}
            >
              <Languages className="mr-2 h-4 w-4" /> Bulk Translate
            </Button>
            <Button
              onClick={handleAdd}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 material-ripple material-elevation-1"
              disabled={!selectedStore}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Custom Template
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : templates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(template => {
              const typeInfo = getEmailTypeInfo(template.identifier);
              return (
                <Card key={template.id} className="material-elevation-1 border-0 hover:material-elevation-2 transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 bg-gradient-to-r ${typeInfo.color} rounded-lg flex items-center justify-center`}>
                          <span className="text-xl">{typeInfo.icon}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{typeInfo.label}</CardTitle>
                            {template.is_system && (
                              <Badge variant="secondary" className="text-xs">System</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{template.identifier}</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Active</span>
                      <Switch
                        checked={template.is_active}
                        onCheckedChange={() => handleToggleActive(template)}
                      />
                    </div>

                    <div className="text-sm text-gray-600">
                      <div className="font-medium mb-1">Subject:</div>
                      <div className="bg-gray-50 p-2 rounded text-xs">
                        {template.subject}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Badge variant="outline" className="text-xs">
                        {template.content_type}
                      </Badge>
                      {template.attachment_enabled && (
                        <Badge variant="outline" className="text-xs">
                          📎 Attachments
                        </Badge>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <Badge variant={template.is_active ? "default" : "secondary"}>
                        {template.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!template.is_system && (
                          <Button variant="outline" size="sm" onClick={() => handleDelete(template.id, template.is_system)} className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="material-elevation-1 border-0">
            <CardContent className="text-center py-12">
              <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No email templates found</h3>
              <p className="text-gray-600 mb-6">
                System email templates should be automatically created. You can also create custom templates for plugins.
              </p>
              <Button
                onClick={handleAdd}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 material-ripple"
                disabled={!selectedStore}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Custom Template
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Bulk Translate Dialog */}
        <BulkTranslateDialog
          open={showBulkTranslate}
          onOpenChange={setShowBulkTranslate}
          entityType="email templates"
          entityName="Email Templates"
          onTranslate={handleBulkTranslate}
          onComplete={loadTemplates}
          itemCount={templates.length}
        />

        {/* Email Template Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? 'Edit Email Template' : 'Add New Email Template'}</DialogTitle>
            </DialogHeader>
            <EmailTemplateForm
              template={editingTemplate}
              onSubmit={handleFormSubmit}
              onCancel={closeForm}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
