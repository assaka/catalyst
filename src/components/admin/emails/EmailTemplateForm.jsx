import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import SaveButton from '@/components/ui/save-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, Copy, Eye } from 'lucide-react';
import TranslationFields from '@/components/admin/TranslationFields';
import { useStoreSelection } from '@/contexts/StoreSelectionContext.jsx';

export default function EmailTemplateForm({ template, onSubmit, onCancel }) {
  const { getSelectedStoreId } = useStoreSelection();
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showTranslations, setShowTranslations] = useState(false);

  const [formData, setFormData] = useState({
    identifier: 'signup_email',
    subject: '',
    content_type: 'both',
    template_content: '',
    html_content: '',
    is_active: true,
    sort_order: 0,
    attachment_enabled: false,
    attachment_config: {},
    translations: {
      en: {
        subject: '',
        template_content: '',
        html_content: ''
      }
    }
  });

  // Email template types with their default variables
  const emailTypes = {
    signup_email: {
      label: 'Signup/Welcome Email',
      defaultSubject: 'Welcome to {{store_name}}!',
      variables: [
        { key: '{{customer_name}}', desc: 'Full name' },
        { key: '{{customer_first_name}}', desc: 'First name' },
        { key: '{{customer_email}}', desc: 'Email address' },
        { key: '{{store_name}}', desc: 'Store name' },
        { key: '{{store_url}}', desc: 'Store URL' },
        { key: '{{login_url}}', desc: 'Login URL' },
        { key: '{{signup_date}}', desc: 'Signup date' },
        { key: '{{current_year}}', desc: 'Current year' }
      ]
    },
    credit_purchase_email: {
      label: 'Credit Purchase Confirmation',
      defaultSubject: 'Credit Purchase Confirmation - {{credits_purchased}} Credits',
      variables: [
        { key: '{{customer_name}}', desc: 'Full name' },
        { key: '{{customer_first_name}}', desc: 'First name' },
        { key: '{{credits_purchased}}', desc: 'Credits purchased' },
        { key: '{{amount_usd}}', desc: 'Amount paid' },
        { key: '{{transaction_id}}', desc: 'Transaction ID' },
        { key: '{{balance}}', desc: 'Current balance' },
        { key: '{{purchase_date}}', desc: 'Purchase date' },
        { key: '{{store_name}}', desc: 'Store name' },
        { key: '{{current_year}}', desc: 'Current year' }
      ]
    },
    order_success_email: {
      label: 'Order Confirmation',
      defaultSubject: 'Order Confirmation #{{order_number}} - Thank You!',
      variables: [
        { key: '{{customer_name}}', desc: 'Full name' },
        { key: '{{customer_first_name}}', desc: 'First name' },
        { key: '{{order_number}}', desc: 'Order number' },
        { key: '{{order_date}}', desc: 'Order date' },
        { key: '{{order_total}}', desc: 'Total amount' },
        { key: '{{order_subtotal}}', desc: 'Subtotal' },
        { key: '{{order_tax}}', desc: 'Tax amount' },
        { key: '{{order_shipping}}', desc: 'Shipping cost' },
        { key: '{{items_html}}', desc: 'Items table (HTML)' },
        { key: '{{items_count}}', desc: 'Items count' },
        { key: '{{shipping_address}}', desc: 'Shipping address' },
        { key: '{{billing_address}}', desc: 'Billing address' },
        { key: '{{payment_method}}', desc: 'Payment method' },
        { key: '{{store_name}}', desc: 'Store name' },
        { key: '{{store_url}}', desc: 'Store URL' },
        { key: '{{current_year}}', desc: 'Current year' }
      ]
    }
  };

  useEffect(() => {
    if (template) {
      const translations = template.translations || {
        en: {
          subject: template.subject || '',
          template_content: template.template_content || '',
          html_content: template.html_content || ''
        }
      };

      setFormData({
        identifier: template.identifier,
        subject: translations.en?.subject || template.subject || '',
        content_type: template.content_type || 'both',
        template_content: translations.en?.template_content || template.template_content || '',
        html_content: translations.en?.html_content || template.html_content || '',
        is_active: template.is_active !== false,
        sort_order: template.sort_order || 0,
        attachment_enabled: template.attachment_enabled || false,
        attachment_config: template.attachment_config || {},
        translations
      });
    }
  }, [template]);

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // Sync subject/content fields with en translations
      if (['subject', 'template_content', 'html_content'].includes(field)) {
        updated.translations = {
          ...prev.translations,
          en: {
            ...prev.translations?.en,
            [field]: value
          }
        };
      }

      return updated;
    });
  };

  const handleTranslationsChange = (translations) => {
    setFormData(prev => ({
      ...prev,
      translations
    }));
  };

  const copyVariable = (variable) => {
    navigator.clipboard.writeText(variable);
    // Could add a toast notification here
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const storeId = getSelectedStoreId();
      const dataToSubmit = {
        ...formData,
        store_id: storeId
      };

      await onSubmit(dataToSubmit);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Form submit error:', error);
    } finally {
      setSaving(false);
    }
  };

  const selectedType = emailTypes[formData.identifier] || emailTypes.signup_email;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="identifier">Email Type</Label>
            <Select
              value={formData.identifier}
              onValueChange={(value) => {
                handleInputChange('identifier', value);
                // Set default subject when type changes
                if (!template) {
                  handleInputChange('subject', emailTypes[value]?.defaultSubject || '');
                }
              }}
              disabled={!!template} // Don't allow changing type for existing templates
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(emailTypes).map(([key, type]) => (
                  <SelectItem key={key} value={key}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject Line</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="e.g., Welcome to {{store_name}}!"
              required
            />
            <p className="text-xs text-gray-500">Use variables like {'{{'} customer_name {'}}'}  for dynamic content</p>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Active</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Content Type & Editor */}
      <Card>
        <CardHeader>
          <CardTitle>Email Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content_type">Content Type</Label>
            <Select
              value={formData.content_type}
              onValueChange={(value) => handleInputChange('content_type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="template">Template (Text with Variables)</SelectItem>
                <SelectItem value="html">HTML Only</SelectItem>
                <SelectItem value="both">Both (Template + HTML)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Template Content */}
          {(formData.content_type === 'template' || formData.content_type === 'both') && (
            <div className="space-y-2">
              <Label htmlFor="template_content">Template Content</Label>
              <Textarea
                id="template_content"
                value={formData.template_content}
                onChange={(e) => handleInputChange('template_content', e.target.value)}
                placeholder="Enter email content with variables like {{customer_name}}"
                rows={10}
                className="font-mono text-sm"
              />
            </div>
          )}

          {/* HTML Content */}
          {(formData.content_type === 'html' || formData.content_type === 'both') && (
            <div className="space-y-2">
              <Label htmlFor="html_content">HTML Content</Label>
              <Textarea
                id="html_content"
                value={formData.html_content}
                onChange={(e) => handleInputChange('html_content', e.target.value)}
                placeholder="Enter full HTML email content"
                rows={15}
                className="font-mono text-sm"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Variables */}
      <Card>
        <CardHeader>
          <CardTitle>Available Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {selectedType.variables.map((variable) => (
              <div
                key={variable.key}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                onClick={() => copyVariable(variable.key)}
              >
                <div className="flex-1">
                  <code className="text-xs text-blue-600 font-mono">{variable.key}</code>
                  <p className="text-xs text-gray-500">{variable.desc}</p>
                </div>
                <Copy className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">Click to copy variable to clipboard</p>
        </CardContent>
      </Card>

      {/* Attachment Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Attachment Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="attachment_enabled">Enable Attachments</Label>
              <p className="text-xs text-gray-500">Attach files like PDF invoices to emails</p>
            </div>
            <Switch
              id="attachment_enabled"
              checked={formData.attachment_enabled}
              onCheckedChange={(checked) => handleInputChange('attachment_enabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Translations */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setShowTranslations(!showTranslations)}>
          <div className="flex items-center justify-between">
            <CardTitle>Translations</CardTitle>
            <Badge variant="outline">{Object.keys(formData.translations || {}).length} languages</Badge>
          </div>
        </CardHeader>
        {showTranslations && (
          <CardContent>
            <TranslationFields
              entityType="email_template"
              translations={formData.translations || {}}
              fields={[
                { key: 'subject', label: 'Subject', type: 'text' },
                { key: 'template_content', label: 'Template Content', type: 'textarea', rows: 6 },
                { key: 'html_content', label: 'HTML Content', type: 'textarea', rows: 10 }
              ]}
              onChange={handleTranslationsChange}
            />
          </CardContent>
        )}
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <SaveButton
          saving={saving}
          saveSuccess={saveSuccess}
          type="submit"
        >
          {template ? 'Update Template' : 'Create Template'}
        </SaveButton>
      </div>
    </form>
  );
}
