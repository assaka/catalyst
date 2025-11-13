const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const ImportStatistic = sequelize.define('ImportStatistic', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  store_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'stores',
      key: 'id'
    }
  },
  import_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [['categories', 'attributes', 'families', 'products']]
    }
  },
  import_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  total_processed: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  successful_imports: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  failed_imports: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  skipped_imports: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  import_source: {
    type: DataTypes.STRING(100),
    defaultValue: 'akeneo'
  },
  import_method: {
    type: DataTypes.STRING(50),
    defaultValue: 'manual',
    validate: {
      isIn: [['manual', 'scheduled', 'webhook']]
    }
  },
  error_details: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  processing_time_seconds: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'akeneo_import_statistics',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Static method to get latest stats for a store
ImportStatistic.getLatestStats = async function(storeId) {
  const stats = await this.findAll({
    where: { store_id: storeId },
    order: [['import_date', 'DESC']],
    limit: 4, // Get latest for each import type
    raw: true
  });

  // Group by import_type and get the most recent for each
  const latestStats = {};
  const processedTypes = new Set();
  
  for (const stat of stats) {
    if (!processedTypes.has(stat.import_type)) {
      latestStats[stat.import_type] = {
        total_processed: stat.total_processed,
        successful_imports: stat.successful_imports,
        failed_imports: stat.failed_imports,
        skipped_imports: stat.skipped_imports,
        import_date: stat.import_date,
        processing_time_seconds: stat.processing_time_seconds,
        error_details: stat.error_details
      };
      processedTypes.add(stat.import_type);
    }
  }

  return {
    categories: latestStats.categories || { total_processed: 0, successful_imports: 0, failed_imports: 0, skipped_imports: 0 },
    attributes: latestStats.attributes || { total_processed: 0, successful_imports: 0, failed_imports: 0, skipped_imports: 0 },
    families: latestStats.families || { total_processed: 0, successful_imports: 0, failed_imports: 0, skipped_imports: 0 },
    products: latestStats.products || { total_processed: 0, successful_imports: 0, failed_imports: 0, skipped_imports: 0 }
  };
};

// Static method to save import results
ImportStatistic.saveImportResults = async function(storeId, importType, results) {
  const {
    totalProcessed = 0,
    successfulImports = 0,
    failedImports = 0,
    skippedImports = 0,
    errorDetails = null,
    processingTimeSeconds = null,
    importMethod = 'manual'
  } = results;

  return await this.create({
    store_id: storeId,
    import_type: importType,
    total_processed: totalProcessed,
    successful_imports: successfulImports,
    failed_imports: failedImports,
    skipped_imports: skippedImports,
    error_details: errorDetails,
    processing_time_seconds: processingTimeSeconds,
    import_method: importMethod,
    import_date: new Date()
  });
};

module.exports = ImportStatistic;