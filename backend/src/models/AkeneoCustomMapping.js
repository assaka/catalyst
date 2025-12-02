/**
 * AkeneoCustomMapping - Pure service class (NO SEQUELIZE)
 *
 * This class provides methods to interact with akeneo_custom_mappings table
 * using ConnectionManager for proper tenant database isolation.
 *
 * All methods are static and use direct Supabase queries through ConnectionManager.
 */

const AkeneoCustomMapping = {};

// Static methods for common operations
AkeneoCustomMapping.getMappings = async function(storeId, mappingType = null) {
  const ConnectionManager = require('../services/database/ConnectionManager');

  try {
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    let query = tenantDb
      .from('akeneo_custom_mappings')
      .select('*')
      .eq('store_id', storeId);

    if (mappingType) {
      query = query.eq('mapping_type', mappingType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching akeneo custom mappings:', error);
      return mappingType ? [] : { attributes: [], images: [], files: [] };
    }

    if (mappingType) {
      return data?.[0]?.mappings || [];
    }

    // Return object with all mapping types
    const result = {
      attributes: [],
      images: [],
      files: []
    };

    (data || []).forEach(m => {
      result[m.mapping_type] = m.mappings || [];
    });

    return result;
  } catch (error) {
    console.error('AkeneoCustomMapping.getMappings error:', error);
    return mappingType ? [] : { attributes: [], images: [], files: [] };
  }
};

AkeneoCustomMapping.saveMappings = async function(storeId, mappingType, mappings, userId = null) {
  const ConnectionManager = require('../services/database/ConnectionManager');
  const { v4: uuidv4 } = require('uuid');

  try {
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    // Check if mapping exists
    const { data: existing } = await tenantDb
      .from('akeneo_custom_mappings')
      .select('*')
      .eq('store_id', storeId)
      .eq('mapping_type', mappingType)
      .maybeSingle();

    if (existing) {
      // Update existing
      const { data: updated, error: updateError } = await tenantDb
        .from('akeneo_custom_mappings')
        .update({
          mappings: mappings || [],
          updated_by: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating akeneo custom mapping:', updateError);
        throw updateError;
      }

      return updated;
    } else {
      // Create new
      const { data: created, error: createError } = await tenantDb
        .from('akeneo_custom_mappings')
        .insert({
          id: uuidv4(),
          store_id: storeId,
          mapping_type: mappingType,
          mappings: mappings || [],
          created_by: userId,
          updated_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating akeneo custom mapping:', createError);
        throw createError;
      }

      return created;
    }
  } catch (error) {
    console.error('AkeneoCustomMapping.saveMappings error:', error);
    throw error;
  }
};

AkeneoCustomMapping.saveAllMappings = async function(storeId, allMappings, userId = null) {
  const promises = [];

  if (allMappings.attributes) {
    promises.push(this.saveMappings(storeId, 'attributes', allMappings.attributes, userId));
  }
  if (allMappings.images) {
    promises.push(this.saveMappings(storeId, 'images', allMappings.images, userId));
  }
  if (allMappings.files) {
    promises.push(this.saveMappings(storeId, 'files', allMappings.files, userId));
  }

  await Promise.all(promises);

  return this.getMappings(storeId);
};

AkeneoCustomMapping.destroy = async function({ where }) {
  const ConnectionManager = require('../services/database/ConnectionManager');

  try {
    const tenantDb = await ConnectionManager.getStoreConnection(where.store_id);

    let query = tenantDb
      .from('akeneo_custom_mappings')
      .delete()
      .eq('store_id', where.store_id);

    if (where.mapping_type) {
      query = query.eq('mapping_type', where.mapping_type);
    }

    const { error } = await query;

    if (error) {
      console.error('Error deleting akeneo custom mapping:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('AkeneoCustomMapping.destroy error:', error);
    throw error;
  }
};

module.exports = AkeneoCustomMapping;
