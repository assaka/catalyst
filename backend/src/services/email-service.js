const SibApiV3Sdk = require('@getbrevo/brevo');
const { EmailTemplate, EmailTemplateTranslation, EmailSendLog, Store } = require('../models');
const brevoService = require('./brevo-service');
const {
  renderTemplate,
  formatOrderItemsHtml,
  formatAddress,
  getExampleData
} = require('./email-template-variables');

/**
 * Email Service
 * Handles email sending through Brevo with template rendering
 */
class EmailService {
  /**
   * Send email using template
   * @param {string} storeId - Store ID
   * @param {string} templateIdentifier - Email template identifier (signup_email, etc.)
   * @param {string} recipientEmail - Recipient email address
   * @param {Object} variables - Variables to replace in template
   * @param {string} languageCode - Language code for translation (default: 'en')
   * @param {Array} attachments - Optional attachments
   * @returns {Promise<Object>} Send result
   */
  async sendEmail(storeId, templateIdentifier, recipientEmail, variables, languageCode = 'en', attachments = []) {
    try {
      console.log(`📧 [EMAIL SERVICE] Attempting to send email:`, {
        storeId,
        templateIdentifier,
        recipientEmail,
        languageCode
      });

      // Check if Brevo is configured
      const isConfigured = await brevoService.isConfigured(storeId);
      if (!isConfigured) {
        const errorMsg = `Brevo email service is not configured for store ${storeId}. Please configure Brevo in Settings > Email to enable email sending.`;
        console.error(`❌ [EMAIL SERVICE] ${errorMsg}`);

        // Log as failed
        await this.logEmail(storeId, null, recipientEmail, 'Email not sent', 'failed', null, errorMsg, { templateIdentifier, variables });
        return {
          success: false,
          message: 'Email service not configured. Please contact the store administrator to configure email settings.'
        };
      }

      console.log(`✅ [EMAIL SERVICE] Brevo is configured for store ${storeId}`);

      // Get template
      const template = await EmailTemplate.findOne({
        where: { store_id: storeId, identifier: templateIdentifier, is_active: true },
        include: [{
          model: EmailTemplateTranslation,
          as: 'translationsData',
          where: { language_code: languageCode },
          required: false
        }]
      });

      if (!template) {
        const errorMsg = `Email template '${templateIdentifier}' not found or not active for store ${storeId}. Please create and activate the template in Settings > Email Templates.`;
        console.error(`❌ [EMAIL SERVICE] ${errorMsg}`);
        throw new Error(errorMsg);
      }

      console.log(`✅ [EMAIL SERVICE] Email template found: ${template.subject}`);

      // Get translation or fall back to default
      const translation = template.translationsData && template.translationsData.length > 0
        ? template.translationsData[0]
        : null;

      const subject = translation?.subject || template.subject;
      let content;

      // Choose content based on template type
      if (template.content_type === 'html' || template.content_type === 'both') {
        content = translation?.html_content || template.html_content;
      } else {
        content = translation?.template_content || template.template_content;
      }

      // Render template with variables
      const renderedSubject = renderTemplate(subject, variables);
      const renderedContent = renderTemplate(content, variables);

      // Send via Brevo
      const result = await this.sendViaBrevo(
        storeId,
        recipientEmail,
        renderedSubject,
        renderedContent,
        attachments
      );

      // Log successful send
      await this.logEmail(
        storeId,
        template.id,
        recipientEmail,
        renderedSubject,
        'sent',
        result.messageId,
        null,
        { templateIdentifier, variables, languageCode }
      );

      console.log(`✅ [EMAIL SERVICE] Email sent successfully:`, {
        messageId: result.messageId,
        recipientEmail,
        subject: renderedSubject
      });

      return {
        success: true,
        message: 'Email sent successfully',
        messageId: result.messageId
      };
    } catch (error) {
      console.error('❌ [EMAIL SERVICE] Email send error:', error.message);
      console.error('❌ [EMAIL SERVICE] Full error:', error);

      // Log failed send
      await this.logEmail(
        storeId,
        null,
        recipientEmail,
        'Email failed',
        'failed',
        null,
        error.message,
        { templateIdentifier, variables }
      );

      throw error;
    }
  }

  /**
   * Send email via Brevo API
   * @param {string} storeId - Store ID
   * @param {string} recipientEmail - Recipient email
   * @param {string} subject - Email subject
   * @param {string} htmlContent - HTML content
   * @param {Array} attachments - Attachments
   * @returns {Promise<Object>} Send result
   */
  async sendViaBrevo(storeId, recipientEmail, subject, htmlContent, attachments = []) {
    try {
      // Get valid API key
      const apiKey = await brevoService.getValidApiKey(storeId);
      const config = await brevoService.getConfiguration(storeId);

      // Initialize Brevo API client
      const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
      apiInstance.authentications['apiKey'].apiKey = apiKey;

      // Prepare email
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      sendSmtpEmail.sender = {
        name: config.sender_name,
        email: config.sender_email
      };
      sendSmtpEmail.to = [{ email: recipientEmail }];
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = htmlContent;

      // Add attachments if provided
      if (attachments && attachments.length > 0) {
        sendSmtpEmail.attachment = attachments.map(att => ({
          name: att.filename,
          content: att.content, // Base64 encoded
          contentType: att.contentType || 'application/pdf'
        }));
      }

      // Send email
      const response = await apiInstance.sendTransacEmail(sendSmtpEmail);

      return {
        success: true,
        messageId: response.messageId
      };
    } catch (error) {
      console.error('Brevo send error:', error.response?.body || error.message);
      throw new Error(`Failed to send email via Brevo: ${error.response?.body?.message || error.message}`);
    }
  }

  /**
   * Send transactional email (wrapper for common email types)
   * @param {string} storeId - Store ID
   * @param {string} emailType - Email type (signup, credit_purchase, order_success)
   * @param {Object} data - Email data
   * @returns {Promise<Object>} Send result
   */
  async sendTransactionalEmail(storeId, emailType, data) {
    const templateMap = {
      'signup': 'signup_email',
      'credit_purchase': 'credit_purchase_email',
      'order_success': 'order_success_email'
    };

    const templateIdentifier = templateMap[emailType];
    if (!templateIdentifier) {
      throw new Error(`Unknown email type: ${emailType}`);
    }

    // Build variables based on email type
    let variables = {};

    switch (emailType) {
      case 'signup':
        variables = this.buildSignupVariables(data);
        break;
      case 'credit_purchase':
        variables = this.buildCreditPurchaseVariables(data);
        break;
      case 'order_success':
        variables = await this.buildOrderSuccessVariables(data);
        break;
    }

    return await this.sendEmail(
      storeId,
      templateIdentifier,
      data.recipientEmail,
      variables,
      data.languageCode || 'en',
      data.attachments || []
    );
  }

  /**
   * Build variables for signup email
   * @param {Object} data - Signup data
   * @returns {Object} Variables
   */
  buildSignupVariables(data) {
    const { customer, store } = data;

    return {
      customer_name: `${customer.first_name} ${customer.last_name}`,
      customer_first_name: customer.first_name,
      customer_email: customer.email,
      store_name: store?.name || 'Our Store',
      store_url: store?.domain || process.env.CORS_ORIGIN,
      login_url: `${store?.domain || process.env.CORS_ORIGIN}/login`,
      signup_date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      current_year: new Date().getFullYear()
    };
  }

  /**
   * Build variables for credit purchase email
   * @param {Object} data - Credit purchase data
   * @returns {Object} Variables
   */
  buildCreditPurchaseVariables(data) {
    const { customer, transaction, store } = data;

    return {
      customer_name: `${customer.first_name} ${customer.last_name}`,
      customer_first_name: customer.first_name,
      customer_email: customer.email,
      store_name: store?.name || 'Our Store',
      credits_purchased: transaction.credits_purchased,
      amount_usd: `$${parseFloat(transaction.amount_usd).toFixed(2)}`,
      transaction_id: transaction.id,
      balance: transaction.balance || 'N/A',
      purchase_date: new Date(transaction.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      payment_method: transaction.metadata?.payment_method || 'Credit Card',
      current_year: new Date().getFullYear()
    };
  }

  /**
   * Build variables for order success email
   * @param {Object} data - Order data
   * @returns {Promise<Object>} Variables
   */
  async buildOrderSuccessVariables(data) {
    const { order, customer, store } = data;

    // Format order items as HTML table
    const itemsHtml = formatOrderItemsHtml(order.OrderItems || []);

    // Format addresses
    const shippingAddress = formatAddress(order.shipping_address);
    const billingAddress = formatAddress(order.billing_address);

    return {
      customer_name: `${customer.first_name} ${customer.last_name}`,
      customer_first_name: customer.first_name,
      customer_email: customer.email || order.customer_email,
      store_name: store?.name || 'Our Store',
      order_number: order.order_number,
      order_date: new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      order_total: `$${parseFloat(order.total_amount).toFixed(2)}`,
      order_subtotal: `$${parseFloat(order.subtotal_amount || order.total_amount).toFixed(2)}`,
      order_tax: `$${parseFloat(order.tax_amount || 0).toFixed(2)}`,
      order_shipping: `$${parseFloat(order.shipping_amount || 0).toFixed(2)}`,
      items_html: itemsHtml,
      items_count: order.OrderItems?.length || 0,
      shipping_address: shippingAddress,
      billing_address: billingAddress,
      payment_method: order.payment_method || 'Credit Card',
      tracking_url: order.tracking_url || '#',
      order_status: order.status || 'Processing',
      estimated_delivery: order.estimated_delivery || 'TBD',
      store_url: store?.domain || process.env.CORS_ORIGIN,
      order_details_url: `${store?.domain || process.env.CORS_ORIGIN}/order/${order.id}`,
      current_year: new Date().getFullYear()
    };
  }

  /**
   * Log email send attempt
   * @param {string} storeId - Store ID
   * @param {string} templateId - Email template ID
   * @param {string} recipientEmail - Recipient email
   * @param {string} subject - Email subject
   * @param {string} status - Send status
   * @param {string} brevoMessageId - Brevo message ID
   * @param {string} errorMessage - Error message if failed
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Log entry
   */
  async logEmail(storeId, templateId, recipientEmail, subject, status, brevoMessageId, errorMessage, metadata) {
    try {
      return await EmailSendLog.create({
        store_id: storeId,
        email_template_id: templateId,
        recipient_email: recipientEmail,
        subject,
        status,
        brevo_message_id: brevoMessageId,
        error_message: errorMessage,
        metadata,
        sent_at: status === 'sent' ? new Date() : null
      });
    } catch (error) {
      console.error('Failed to log email:', error.message);
      // Don't throw error - logging failure shouldn't break email sending
    }
  }

  /**
   * Send test email with example data
   * @param {string} storeId - Store ID
   * @param {string} templateIdentifier - Template identifier
   * @param {string} testEmail - Test email address
   * @param {string} languageCode - Language code
   * @returns {Promise<Object>} Send result
   */
  async sendTestEmail(storeId, templateIdentifier, testEmail, languageCode = 'en') {
    const exampleData = getExampleData(templateIdentifier);

    // Add store context
    const store = await Store.findByPk(storeId);
    exampleData.store_name = store?.name || 'Test Store';
    exampleData.store_url = store?.domain || process.env.CORS_ORIGIN;

    return await this.sendEmail(
      storeId,
      templateIdentifier,
      testEmail,
      exampleData,
      languageCode
    );
  }

  /**
   * Get email statistics for a store
   * @param {string} storeId - Store ID
   * @param {number} days - Number of days to look back
   * @returns {Promise<Object>} Statistics
   */
  async getEmailStatistics(storeId, days = 30) {
    const { Op } = require('sequelize');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await EmailSendLog.findAll({
      where: {
        store_id: storeId,
        created_at: {
          [Op.gte]: startDate
        }
      },
      attributes: ['status']
    });

    const stats = {
      total: logs.length,
      sent: logs.filter(l => l.status === 'sent').length,
      failed: logs.filter(l => l.status === 'failed').length,
      pending: logs.filter(l => l.status === 'pending').length,
      delivered: logs.filter(l => l.status === 'delivered').length,
      opened: logs.filter(l => l.status === 'opened').length,
      clicked: logs.filter(l => l.status === 'clicked').length
    };

    return stats;
  }
}

module.exports = new EmailService();
