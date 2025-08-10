const BaseJobHandler = require('./BaseJobHandler');
const Job = require('../../models/Job');
const JobHistory = require('../../models/JobHistory');

/**
 * Background job handler for system cleanup tasks
 */
class SystemCleanupJob extends BaseJobHandler {
  async execute() {
    this.log('Starting system cleanup job');

    const payload = this.getPayload();
    const {
      cleanupOldJobs = true,
      cleanupOldHistory = true,
      jobRetentionDays = 30,
      historyRetentionDays = 90
    } = payload;

    const results = {};

    try {
      await this.updateProgress(10, 'Starting cleanup operations...');

      if (cleanupOldJobs) {
        await this.updateProgress(25, 'Cleaning up old job records...');
        const deletedJobs = await Job.cleanupOldJobs(jobRetentionDays);
        results.deletedJobs = deletedJobs;
        this.log(`Cleaned up ${deletedJobs} old job records`);
      }

      if (cleanupOldHistory) {
        await this.updateProgress(60, 'Cleaning up old job history...');
        const deletedHistory = await JobHistory.cleanupOldHistory(historyRetentionDays);
        results.deletedHistory = deletedHistory;
        this.log(`Cleaned up ${deletedHistory} old history records`);
      }

      await this.updateProgress(100, 'System cleanup completed');

      const result = {
        success: true,
        message: 'System cleanup completed successfully',
        results,
        settings: {
          jobRetentionDays,
          historyRetentionDays
        }
      };

      this.log(`System cleanup completed: ${JSON.stringify(results)}`);
      return result;

    } catch (error) {
      this.log(`System cleanup failed: ${error.message}`, 'error');
      throw error;
    }
  }
}

module.exports = SystemCleanupJob;