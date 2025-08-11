const { Store } = require('../models');
const renderIntegration = require('./render-integration');

class DomainConfiguration {
  /**
   * Save domain configuration to store settings
   */
  async saveDomainConfig(storeId, domainConfig) {
    try {
      const store = await Store.findByPk(storeId);
      
      if (!store) {
        throw new Error('Store not found');
      }

      const currentSettings = store.settings || {};
      
      // Update domain configuration in store settings
      const updatedSettings = {
        ...currentSettings,
        domain: {
          ...currentSettings.domain,
          ...domainConfig,
          updated_at: new Date().toISOString()
        }
      };

      await store.update({ settings: updatedSettings });

      return {
        success: true,
        domain_config: updatedSettings.domain,
        message: 'Domain configuration saved successfully'
      };

    } catch (error) {
      console.error('Failed to save domain configuration:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get domain configuration from store settings
   */
  async getDomainConfig(storeId) {
    try {
      const store = await Store.findByPk(storeId);
      
      if (!store) {
        throw new Error('Store not found');
      }

      const domainConfig = store.settings?.domain || {};
      
      return {
        success: true,
        domain_config: domainConfig
      };

    } catch (error) {
      console.error('Failed to get domain configuration:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Add domain to store and Render (if connected)
   */
  async addDomain(storeId, domain, options = {}) {
    try {
      const {
        render_service_id,
        auto_configure_render = false,
        ssl_enabled = true,
        redirect_www = true
      } = options;

      // Validate domain format
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
      if (!domainRegex.test(domain)) {
        throw new Error('Invalid domain format');
      }

      const store = await Store.findByPk(storeId);
      if (!store) {
        throw new Error('Store not found');
      }

      // Generate DNS instructions
      let dnsInstructions;
      let renderDomain = null;

      // If Render service is provided and auto-configure is enabled
      if (render_service_id && auto_configure_render) {
        try {
          const renderResult = await renderIntegration.addCustomDomain(storeId, render_service_id, domain);
          if (renderResult.success) {
            renderDomain = renderResult.domain;
            dnsInstructions = renderIntegration.generateDNSInstructions(domain, renderDomain.dnsRecords);
          }
        } catch (renderError) {
          console.warn('Failed to add domain to Render:', renderError.message);
          // Continue with manual DNS instructions
        }
      }

      // Generate manual DNS instructions if Render setup failed or wasn't attempted
      if (!dnsInstructions) {
        dnsInstructions = renderIntegration.generateDNSInstructions(domain);
        if (render_service_id) {
          // Update CNAME to point to Render service
          dnsInstructions.records = dnsInstructions.records.map(record => {
            if (record.type === 'CNAME') {
              return {
                ...record,
                value: `${render_service_id}.onrender.com`
              };
            }
            return record;
          });
        }
      }

      // Save domain configuration to store
      const domainConfig = {
        primary_domain: domain,
        ssl_enabled,
        redirect_www,
        render_service_id,
        render_domain_id: renderDomain?.id,
        verification_status: renderDomain?.verificationStatus || 'pending',
        dns_configured: false,
        dns_instructions: dnsInstructions,
        added_at: new Date().toISOString()
      };

      const saveResult = await this.saveDomainConfig(storeId, domainConfig);

      if (!saveResult.success) {
        throw new Error(saveResult.error);
      }

      return {
        success: true,
        domain: domain,
        domain_config: domainConfig,
        render_domain: renderDomain,
        dns_instructions: dnsInstructions,
        message: 'Domain added successfully. Configure DNS to complete setup.'
      };

    } catch (error) {
      console.error('Failed to add domain:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Remove domain from store and Render
   */
  async removeDomain(storeId, domain) {
    try {
      const store = await Store.findByPk(storeId);
      if (!store) {
        throw new Error('Store not found');
      }

      const domainConfig = store.settings?.domain || {};
      
      // Remove from Render if configured
      if (domainConfig.render_service_id && domainConfig.render_domain_id) {
        try {
          await renderIntegration.removeCustomDomain(
            storeId,
            domainConfig.render_service_id,
            domainConfig.render_domain_id
          );
        } catch (renderError) {
          console.warn('Failed to remove domain from Render:', renderError.message);
        }
      }

      // Remove domain configuration from store settings
      const currentSettings = store.settings || {};
      const { domain: removedDomain, ...remainingSettings } = currentSettings;

      await store.update({ settings: remainingSettings });

      return {
        success: true,
        message: 'Domain removed successfully'
      };

    } catch (error) {
      console.error('Failed to remove domain:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check domain verification status
   */
  async checkDomainStatus(storeId) {
    try {
      const store = await Store.findByPk(storeId);
      if (!store) {
        throw new Error('Store not found');
      }

      const domainConfig = store.settings?.domain || {};
      
      if (!domainConfig.primary_domain) {
        return {
          success: true,
          domain_configured: false,
          message: 'No domain configured'
        };
      }

      let verificationStatus = domainConfig.verification_status || 'pending';
      let dnsConfigured = domainConfig.dns_configured || false;

      // Check with Render if domain is configured there
      if (domainConfig.render_service_id && domainConfig.render_domain_id) {
        try {
          const renderStatus = await renderIntegration.getDomainVerificationStatus(
            storeId,
            domainConfig.render_service_id,
            domainConfig.render_domain_id
          );

          if (renderStatus.success) {
            verificationStatus = renderStatus.domain.verification_status;
            dnsConfigured = verificationStatus === 'verified';

            // Update store settings with latest status
            const updatedConfig = {
              ...domainConfig,
              verification_status: verificationStatus,
              dns_configured: dnsConfigured,
              last_checked: new Date().toISOString()
            };

            await this.saveDomainConfig(storeId, updatedConfig);
          }
        } catch (renderError) {
          console.warn('Failed to check Render domain status:', renderError.message);
        }
      }

      return {
        success: true,
        domain_configured: true,
        domain: domainConfig.primary_domain,
        verification_status: verificationStatus,
        dns_configured: dnsConfigured,
        ssl_enabled: domainConfig.ssl_enabled,
        last_checked: domainConfig.last_checked || domainConfig.added_at
      };

    } catch (error) {
      console.error('Failed to check domain status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update domain DNS configuration status
   */
  async updateDNSStatus(storeId, dnsConfigured, additionalData = {}) {
    try {
      const store = await Store.findByPk(storeId);
      if (!store) {
        throw new Error('Store not found');
      }

      const currentDomainConfig = store.settings?.domain || {};
      
      const updatedConfig = {
        ...currentDomainConfig,
        dns_configured: dnsConfigured,
        verification_status: dnsConfigured ? 'verified' : 'pending',
        last_updated: new Date().toISOString(),
        ...additionalData
      };

      const saveResult = await this.saveDomainConfig(storeId, updatedConfig);

      return saveResult;

    } catch (error) {
      console.error('Failed to update DNS status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate comprehensive setup instructions
   */
  generateSetupInstructions(storeId, domainConfig) {
    const domain = domainConfig.primary_domain;
    const dnsInstructions = domainConfig.dns_instructions || renderIntegration.generateDNSInstructions(domain);

    return {
      domain: domain,
      setup_steps: [
        {
          step: 1,
          title: "Access Your Domain Registrar",
          description: "Log into the control panel of your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)",
          status: "pending"
        },
        {
          step: 2,
          title: "Navigate to DNS Settings",
          description: "Find DNS, Name Server, or Domain Management settings",
          status: "pending"
        },
        {
          step: 3,
          title: "Add DNS Records",
          description: "Add the CNAME record as specified below",
          status: "pending",
          dns_records: dnsInstructions.records
        },
        {
          step: 4,
          title: "Wait for DNS Propagation",
          description: "DNS changes can take 15 minutes to 48 hours to fully propagate",
          status: "pending"
        },
        {
          step: 5,
          title: "Verify Domain",
          description: "Once DNS propagates, your domain will be verified automatically",
          status: "pending"
        }
      ],
      dns_instructions: dnsInstructions,
      verification_url: `/admin/settings/domain/verify/${storeId}`,
      support_info: {
        message: "Need help? Check our detailed guides for your registrar",
        guides_url: "/docs/domain-setup",
        contact_support: "support@catalyst.com"
      }
    };
  }
}

module.exports = new DomainConfiguration();