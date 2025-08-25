const BaseJobHandler = require('./BaseJobHandler');
const CronJob = require('../../models/CronJob');
const axios = require('axios');
const { sequelize } = require('../../database/connection');

/**
 * Dynamic Cron Job Handler
 * Executes user-defined cron jobs stored in the database
 */
class DynamicCronJob extends BaseJobHandler {
  constructor(job) {
    super(job);
    this.cronJobId = job.payload.cronJobId;
  }

  async execute() {
    if (!this.cronJobId) {
      throw new Error('cronJobId is required in job payload');
    }

    // Get the cron job configuration from database
    const cronJob = await CronJob.findByPk(this.cronJobId);
    if (!cronJob) {
      throw new Error(`Cron job not found: ${this.cronJobId}`);
    }

    // Check if job can run
    if (!cronJob.canRun()) {
      console.log(`⏭️ Skipping cron job ${cronJob.name} - cannot run (paused, max runs reached, or too many failures)`);
      return {
        success: true,
        skipped: true,
        reason: 'Job cannot run (paused, max runs reached, or too many failures)'
      };
    }

    console.log(`🔄 Executing dynamic cron job: ${cronJob.name} (${cronJob.job_type})`);

    let execution;
    try {
      // Create execution record
      execution = await cronJob.createExecution({
        status: 'running',
        triggered_by: 'scheduler',
        server_instance: process.env.SERVER_INSTANCE_ID || 'unknown'
      });

      // Execute based on job type
      const result = await this.executeJobType(cronJob);

      // Record successful execution
      await execution.complete('success', result);
      await cronJob.recordExecution('success', result);

      console.log(`✅ Cron job ${cronJob.name} completed successfully`);
      
      return {
        success: true,
        cronJobId: cronJob.id,
        jobName: cronJob.name,
        jobType: cronJob.job_type,
        result,
        executionId: execution.id
      };

    } catch (error) {
      console.error(`❌ Cron job ${cronJob.name} failed:`, error.message);

      // Record failed execution
      if (execution) {
        await execution.complete('failed', null, error);
      }
      await cronJob.recordExecution('failed', null, error);

      throw error;
    }
  }

  /**
   * Execute job based on its type
   */
  async executeJobType(cronJob) {
    const { job_type, configuration } = cronJob;

    switch (job_type) {
      case 'webhook':
        return await this.executeWebhook(configuration);
      
      case 'email':
        return await this.executeEmail(configuration);
      
      case 'database_query':
        return await this.executeDatabaseQuery(configuration);
      
      case 'api_call':
        return await this.executeApiCall(configuration);
      
      case 'cleanup':
        return await this.executeCleanup(configuration);
      
      default:
        throw new Error(`Unsupported job type: ${job_type}`);
    }
  }

  /**
   * Execute webhook job type
   */
  async executeWebhook(config) {
    const { url, method = 'GET', headers = {}, body, timeout = 30 } = config;

    const requestConfig = {
      method: method.toUpperCase(),
      url,
      headers: {
        'User-Agent': 'Catalyst-CronJob/1.0',
        ...headers
      },
      timeout: timeout * 1000
    };

    if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      requestConfig.data = typeof body === 'string' ? body : JSON.stringify(body);
      requestConfig.headers['Content-Type'] = requestConfig.headers['Content-Type'] || 'application/json';
    }

    const response = await axios(requestConfig);

    return {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      responseTime: Date.now() - this.startTime
    };
  }

  /**
   * Execute email job type
   */
  async executeEmail(config) {
    const { to, subject, body, template, variables = {} } = config;

    // This would integrate with your email service
    // For now, we'll just log the email details
    console.log(`📧 Sending email to ${to}: ${subject}`);
    
    // In a real implementation, you would use nodemailer, SendGrid, etc.
    // const emailService = require('../../services/email-service');
    // const result = await emailService.send({ to, subject, body, template, variables });

    return {
      to,
      subject,
      sent: true,
      messageId: 'fake-message-id-' + Date.now()
    };
  }

  /**
   * Execute database query job type
   */
  async executeDatabaseQuery(config) {
    const { query, parameters = {}, operation_type } = config;

    // Validate operation type for security
    const allowedOperations = ['SELECT', 'UPDATE', 'DELETE', 'INSERT'];
    if (!allowedOperations.includes(operation_type.toUpperCase())) {
      throw new Error(`Operation type not allowed: ${operation_type}`);
    }

    // Execute query with parameters
    const [results, metadata] = await sequelize.query(query, {
      replacements: parameters,
      type: sequelize.QueryTypes.RAW
    });

    return {
      operation: operation_type,
      rowsAffected: metadata.rowCount || (Array.isArray(results) ? results.length : 0),
      results: operation_type.toUpperCase() === 'SELECT' ? results : null
    };
  }

  /**
   * Execute API call job type
   */
  async executeApiCall(config) {
    const { endpoint, method = 'GET', payload = {}, headers = {} } = config;

    // Build full URL (assuming internal API)
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}/api${endpoint}`;

    const requestConfig = {
      method: method.toUpperCase(),
      url,
      headers: {
        'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN || ''}`,
        'User-Agent': 'Catalyst-CronJob/1.0',
        ...headers
      },
      timeout: 30000
    };

    if (payload && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      requestConfig.data = payload;
      requestConfig.headers['Content-Type'] = 'application/json';
    }

    const response = await axios(requestConfig);

    return {
      status: response.status,
      data: response.data,
      headers: response.headers
    };
  }

  /**
   * Execute cleanup job type
   */
  async executeCleanup(config) {
    const { table, condition, older_than_days, max_records = 1000 } = config;

    // Validate table name for security (whitelist approach)
    const allowedTables = [
      'job_executions', 'cron_job_executions', 'logs', 
      'sessions', 'password_reset_tokens', 'email_verification_tokens'
    ];
    
    if (!allowedTables.includes(table)) {
      throw new Error(`Table not allowed for cleanup: ${table}`);
    }

    // Build cleanup query
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - older_than_days);

    let query = `DELETE FROM ${table} WHERE created_at < :cutoffDate`;
    const replacements = { cutoffDate };

    if (condition) {
      query += ` AND ${condition}`;
    }

    query += ` LIMIT ${max_records}`;

    const [results, metadata] = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.DELETE
    });

    return {
      table,
      recordsDeleted: metadata.rowCount || 0,
      cutoffDate,
      condition
    };
  }

  /**
   * Get job type identifier
   */
  static getJobType() {
    return 'system:dynamic_cron';
  }

  /**
   * Get job description for logging
   */
  getDescription() {
    return `Dynamic cron job execution (ID: ${this.cronJobId})`;
  }

  /**
   * Validate job payload
   */
  validatePayload() {
    if (!this.job.payload.cronJobId) {
      throw new Error('cronJobId is required in job payload');
    }
    return true;
  }
}

module.exports = DynamicCronJob;