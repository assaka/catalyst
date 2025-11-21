/**
 * DEPRECATED: This file only exists to prevent import errors in model files.
 *
 * DO NOT USE THIS CONNECTION DIRECTLY.
 *
 * Models are defined for structure/associations but should NOT be used directly.
 * All database queries MUST go through:
 * - Master DB: use masterSequelize from masterConnection.js
 * - Tenant DB: use ConnectionManager.getStoreConnection(storeId)
 *
 * See MASTER_TENANT_DATABASE_ARCHITECTURE.md for guidance.
 */

const { Sequelize } = require('sequelize');

// Create a stub sequelize that throws errors when used
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: ':memory:',
  logging: false
});

// Override ALL query methods to throw errors
const throwError = () => {
  throw new Error(
    'FATAL: Sequelize model methods cannot be used directly.\n' +
    'For MASTER DB: use masterSequelize from masterConnection.js\n' +
    'For TENANT DB: use ConnectionManager.getStoreConnection(storeId)\n' +
    'See MASTER_TENANT_DATABASE_ARCHITECTURE.md'
  );
};

sequelize.query = throwError;
sequelize.authenticate = throwError;
sequelize.sync = throwError;

// Deprecated supabase export (should not be used)
const supabase = null;

module.exports = { sequelize, supabase };
