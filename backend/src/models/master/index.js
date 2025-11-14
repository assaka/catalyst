/**
 * Master Database Models Index
 *
 * All models that connect to the master database
 * Platform-level data: users, stores registry, subscriptions, credits
 */

const MasterUser = require('./MasterUser');
const MasterStore = require('./MasterStore');
const StoreDatabase = require('./StoreDatabase');
const StoreHostname = require('./StoreHostname');
const CreditBalance = require('./CreditBalance');
const CreditTransaction = require('./CreditTransaction');
const SupabaseOAuthToken = require('../SupabaseOAuthToken');

// Define associations
function setupMasterAssociations() {
  // User → Stores (one-to-many)
  MasterUser.hasMany(MasterStore, {
    foreignKey: 'user_id',
    as: 'stores'
  });
  MasterStore.belongsTo(MasterUser, {
    foreignKey: 'user_id',
    as: 'owner'
  });

  // Store → StoreDatabase (one-to-one)
  MasterStore.hasOne(StoreDatabase, {
    foreignKey: 'store_id',
    as: 'database'
  });
  StoreDatabase.belongsTo(MasterStore, {
    foreignKey: 'store_id',
    as: 'store'
  });

  // Store → StoreHostnames (one-to-many)
  MasterStore.hasMany(StoreHostname, {
    foreignKey: 'store_id',
    as: 'hostnames'
  });
  StoreHostname.belongsTo(MasterStore, {
    foreignKey: 'store_id',
    as: 'store'
  });

  // Store → CreditBalance (one-to-one)
  MasterStore.hasOne(CreditBalance, {
    foreignKey: 'store_id',
    as: 'creditBalance'
  });
  CreditBalance.belongsTo(MasterStore, {
    foreignKey: 'store_id',
    as: 'store'
  });

  // Store → CreditTransactions (one-to-many)
  MasterStore.hasMany(CreditTransaction, {
    foreignKey: 'store_id',
    as: 'creditTransactions'
  });
  CreditTransaction.belongsTo(MasterStore, {
    foreignKey: 'store_id',
    as: 'store'
  });

  // User → CreditTransactions (processed_by)
  MasterUser.hasMany(CreditTransaction, {
    foreignKey: 'processed_by',
    as: 'processedTransactions'
  });
  CreditTransaction.belongsTo(MasterUser, {
    foreignKey: 'processed_by',
    as: 'processor'
  });

  // Store → Supabase OAuth Token (one-to-one)
  MasterStore.hasOne(SupabaseOAuthToken, {
    foreignKey: 'store_id',
    as: 'supabaseOAuth'
  });
  SupabaseOAuthToken.belongsTo(MasterStore, {
    foreignKey: 'store_id',
    as: 'store'
  });
}

// Setup associations
setupMasterAssociations();

// Export all master models
module.exports = {
  MasterUser,
  MasterStore,
  StoreDatabase,
  StoreHostname,
  CreditBalance,
  CreditTransaction,
  SupabaseOAuthToken,
  setupMasterAssociations
};
