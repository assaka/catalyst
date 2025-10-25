/**
 * Cookie Consent Settings Helpers for Normalized Translations
 *
 * These helpers construct the same format that the frontend expects
 * from normalized translation tables.
 */

const { sequelize } = require('../database/connection');

/**
 * Get cookie consent settings with translations from normalized tables
 *
 * @param {Object} where - WHERE clause conditions
 * @param {string} lang - Language code (optional, not used but kept for compatibility)
 * @returns {Promise<Array>} Cookie consent settings with full translations object
 */
async function getCookieConsentSettingsWithTranslations(where = {}, lang = 'en') {
  const whereConditions = Object.entries(where)
    .map(([key, value]) => {
      if (value === true || value === false) {
        return `ccs.${key} = ${value}`;
      }
      return `ccs.${key} = '${value}'`;
    })
    .join(' AND ');

  const whereClause = whereConditions ? `WHERE ${whereConditions}` : '';

  // Build translations JSON from normalized table using json_object_agg
  const query = `
    SELECT
      ccs.id,
      ccs.store_id,
      ccs.is_enabled,
      ccs.banner_position,
      ccs.banner_text,
      ccs.privacy_policy_url,
      ccs.accept_button_text,
      ccs.reject_button_text,
      ccs.settings_button_text,
      ccs.privacy_policy_text,
      ccs.necessary_cookies,
      ccs.analytics_cookies,
      ccs.marketing_cookies,
      ccs.functional_cookies,
      ccs.theme,
      ccs.primary_color,
      ccs.background_color,
      ccs.text_color,
      ccs.gdpr_mode,
      ccs.auto_detect_country,
      ccs.audit_enabled,
      ccs.consent_expiry_days,
      ccs.show_close_button,
      ccs.categories,
      ccs.gdpr_countries,
      ccs.google_analytics_id,
      ccs.google_tag_manager_id,
      ccs.custom_css,
      ccs.accept_button_bg_color,
      ccs.accept_button_text_color,
      ccs.reject_button_bg_color,
      ccs.reject_button_text_color,
      ccs.save_preferences_button_bg_color,
      ccs.save_preferences_button_text_color,
      ccs.created_at,
      ccs.updated_at,
      COALESCE(
        json_object_agg(
          ccst.language_code,
          json_build_object(
            'banner_text', ccst.banner_text,
            'accept_button_text', ccst.accept_button_text,
            'reject_button_text', ccst.reject_button_text,
            'settings_button_text', ccst.settings_button_text,
            'privacy_policy_text', ccst.privacy_policy_text,
            'save_preferences_button_text', ccst.save_preferences_button_text,
            'necessary_name', ccst.necessary_name,
            'necessary_description', ccst.necessary_description,
            'analytics_name', ccst.analytics_name,
            'analytics_description', ccst.analytics_description,
            'marketing_name', ccst.marketing_name,
            'marketing_description', ccst.marketing_description,
            'functional_name', ccst.functional_name,
            'functional_description', ccst.functional_description
          )
        ) FILTER (WHERE ccst.language_code IS NOT NULL),
        '{}'::json
      ) as translations
    FROM cookie_consent_settings ccs
    LEFT JOIN cookie_consent_settings_translations ccst
      ON ccs.id = ccst.cookie_consent_settings_id
    ${whereClause}
    GROUP BY ccs.id
    ORDER BY ccs.created_at DESC
  `;

  console.log('🔍 SQL Query for cookie consent:', query.replace(/\s+/g, ' '));

  const results = await sequelize.query(query, {
    type: sequelize.QueryTypes.SELECT
  });

  console.log('✅ Query returned', results.length, 'cookie consent settings');
  if (results.length > 0) {
    console.log('📝 Sample settings:', JSON.stringify({
      id: results[0].id,
      translations: results[0].translations
    }, null, 2));
  }

  return results;
}

/**
 * Get single cookie consent settings with translations
 *
 * @param {string} id - Cookie consent settings ID
 * @param {string} lang - Language code (optional, not used but kept for compatibility)
 * @returns {Promise<Object|null>} Cookie consent settings with full translations object
 */
async function getCookieConsentSettingsById(id, lang = 'en') {
  const query = `
    SELECT
      ccs.id,
      ccs.store_id,
      ccs.is_enabled,
      ccs.banner_position,
      ccs.banner_text,
      ccs.privacy_policy_url,
      ccs.accept_button_text,
      ccs.reject_button_text,
      ccs.settings_button_text,
      ccs.privacy_policy_text,
      ccs.necessary_cookies,
      ccs.analytics_cookies,
      ccs.marketing_cookies,
      ccs.functional_cookies,
      ccs.theme,
      ccs.primary_color,
      ccs.background_color,
      ccs.text_color,
      ccs.gdpr_mode,
      ccs.auto_detect_country,
      ccs.audit_enabled,
      ccs.consent_expiry_days,
      ccs.show_close_button,
      ccs.categories,
      ccs.gdpr_countries,
      ccs.google_analytics_id,
      ccs.google_tag_manager_id,
      ccs.custom_css,
      ccs.accept_button_bg_color,
      ccs.accept_button_text_color,
      ccs.reject_button_bg_color,
      ccs.reject_button_text_color,
      ccs.save_preferences_button_bg_color,
      ccs.save_preferences_button_text_color,
      ccs.created_at,
      ccs.updated_at,
      COALESCE(
        json_object_agg(
          ccst.language_code,
          json_build_object(
            'banner_text', ccst.banner_text,
            'accept_button_text', ccst.accept_button_text,
            'reject_button_text', ccst.reject_button_text,
            'settings_button_text', ccst.settings_button_text,
            'privacy_policy_text', ccst.privacy_policy_text,
            'save_preferences_button_text', ccst.save_preferences_button_text,
            'necessary_name', ccst.necessary_name,
            'necessary_description', ccst.necessary_description,
            'analytics_name', ccst.analytics_name,
            'analytics_description', ccst.analytics_description,
            'marketing_name', ccst.marketing_name,
            'marketing_description', ccst.marketing_description,
            'functional_name', ccst.functional_name,
            'functional_description', ccst.functional_description
          )
        ) FILTER (WHERE ccst.language_code IS NOT NULL),
        '{}'::json
      ) as translations
    FROM cookie_consent_settings ccs
    LEFT JOIN cookie_consent_settings_translations ccst
      ON ccs.id = ccst.cookie_consent_settings_id
    WHERE ccs.id = :id
    GROUP BY ccs.id
  `;

  const results = await sequelize.query(query, {
    replacements: { id },
    type: sequelize.QueryTypes.SELECT
  });

  return results[0] || null;
}

/**
 * Create cookie consent settings with translations
 *
 * @param {Object} settingsData - Cookie consent settings data (without translations)
 * @param {Object} translations - Translations object { en: {...}, nl: {...} }
 * @returns {Promise<Object>} Created cookie consent settings with translations
 */
async function createCookieConsentSettingsWithTranslations(settingsData, translations = {}) {
  const transaction = await sequelize.transaction();

  try {
    // Insert cookie consent settings
    const [settings] = await sequelize.query(`
      INSERT INTO cookie_consent_settings (
        id, store_id, is_enabled, banner_position, banner_text, privacy_policy_url,
        accept_button_text, reject_button_text, settings_button_text,
        necessary_cookies, analytics_cookies, marketing_cookies, functional_cookies,
        theme, primary_color, background_color, text_color,
        gdpr_mode, auto_detect_country, audit_enabled, consent_expiry_days,
        show_close_button, privacy_policy_text, categories, gdpr_countries,
        google_analytics_id, google_tag_manager_id, custom_css,
        created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        :store_id, :is_enabled, :banner_position, :banner_text, :privacy_policy_url,
        :accept_button_text, :reject_button_text, :settings_button_text,
        :necessary_cookies, :analytics_cookies, :marketing_cookies, :functional_cookies,
        :theme, :primary_color, :background_color, :text_color,
        :gdpr_mode, :auto_detect_country, :audit_enabled, :consent_expiry_days,
        :show_close_button, :privacy_policy_text, :categories, :gdpr_countries,
        :google_analytics_id, :google_tag_manager_id, :custom_css,
        NOW(), NOW()
      )
      RETURNING *
    `, {
      replacements: {
        store_id: settingsData.store_id,
        is_enabled: settingsData.is_enabled !== false,
        banner_position: settingsData.banner_position || 'bottom',
        banner_text: settingsData.banner_text || '',
        privacy_policy_url: settingsData.privacy_policy_url || '',
        accept_button_text: settingsData.accept_button_text || 'Accept All',
        reject_button_text: settingsData.reject_button_text || 'Reject All',
        settings_button_text: settingsData.settings_button_text || 'Cookie Settings',
        necessary_cookies: settingsData.necessary_cookies !== false,
        analytics_cookies: settingsData.analytics_cookies || false,
        marketing_cookies: settingsData.marketing_cookies || false,
        functional_cookies: settingsData.functional_cookies || false,
        theme: settingsData.theme || 'light',
        primary_color: settingsData.primary_color || '#007bff',
        background_color: settingsData.background_color || '#ffffff',
        text_color: settingsData.text_color || '#333333',
        gdpr_mode: settingsData.gdpr_mode !== false,
        auto_detect_country: settingsData.auto_detect_country !== false,
        audit_enabled: settingsData.audit_enabled !== false,
        consent_expiry_days: settingsData.consent_expiry_days || 365,
        show_close_button: settingsData.show_close_button !== false,
        privacy_policy_text: settingsData.privacy_policy_text || 'Privacy Policy',
        categories: JSON.stringify(settingsData.categories || {}),
        gdpr_countries: JSON.stringify(settingsData.gdpr_countries || []),
        google_analytics_id: settingsData.google_analytics_id || null,
        google_tag_manager_id: settingsData.google_tag_manager_id || null,
        custom_css: settingsData.custom_css || null
      },
      type: sequelize.QueryTypes.SELECT,
      transaction
    });

    // Insert translations
    for (const [langCode, data] of Object.entries(translations)) {
      if (data && Object.keys(data).length > 0) {
        await sequelize.query(`
          INSERT INTO cookie_consent_settings_translations (
            cookie_consent_settings_id, language_code, banner_text,
            accept_button_text, reject_button_text, settings_button_text,
            privacy_policy_text, save_preferences_button_text,
            necessary_name, necessary_description,
            analytics_name, analytics_description,
            marketing_name, marketing_description,
            functional_name, functional_description,
            created_at, updated_at
          ) VALUES (
            :settings_id, :lang_code, :banner_text,
            :accept_button_text, :reject_button_text, :settings_button_text,
            :privacy_policy_text, :save_preferences_button_text,
            :necessary_name, :necessary_description,
            :analytics_name, :analytics_description,
            :marketing_name, :marketing_description,
            :functional_name, :functional_description,
            NOW(), NOW()
          )
          ON CONFLICT (cookie_consent_settings_id, language_code) DO UPDATE
          SET
            banner_text = EXCLUDED.banner_text,
            accept_button_text = EXCLUDED.accept_button_text,
            reject_button_text = EXCLUDED.reject_button_text,
            settings_button_text = EXCLUDED.settings_button_text,
            privacy_policy_text = EXCLUDED.privacy_policy_text,
            save_preferences_button_text = EXCLUDED.save_preferences_button_text,
            necessary_name = EXCLUDED.necessary_name,
            necessary_description = EXCLUDED.necessary_description,
            analytics_name = EXCLUDED.analytics_name,
            analytics_description = EXCLUDED.analytics_description,
            marketing_name = EXCLUDED.marketing_name,
            marketing_description = EXCLUDED.marketing_description,
            functional_name = EXCLUDED.functional_name,
            functional_description = EXCLUDED.functional_description,
            updated_at = NOW()
        `, {
          replacements: {
            settings_id: settings.id,
            lang_code: langCode,
            banner_text: data.banner_text || null,
            accept_button_text: data.accept_button_text || null,
            reject_button_text: data.reject_button_text || null,
            settings_button_text: data.settings_button_text || null,
            privacy_policy_text: data.privacy_policy_text || null,
            save_preferences_button_text: data.save_preferences_button_text || null,
            necessary_name: data.necessary_name || null,
            necessary_description: data.necessary_description || null,
            analytics_name: data.analytics_name || null,
            analytics_description: data.analytics_description || null,
            marketing_name: data.marketing_name || null,
            marketing_description: data.marketing_description || null,
            functional_name: data.functional_name || null,
            functional_description: data.functional_description || null
          },
          transaction
        });
      }
    }

    await transaction.commit();

    // Return the created settings with translations
    return await getCookieConsentSettingsById(settings.id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * Update cookie consent settings with translations
 *
 * @param {string} id - Cookie consent settings ID
 * @param {Object} settingsData - Cookie consent settings data (without translations)
 * @param {Object} translations - Translations object { en: {...}, nl: {...} }
 * @returns {Promise<Object>} Updated cookie consent settings with translations
 */
async function updateCookieConsentSettingsWithTranslations(id, settingsData, translations = {}) {
  const transaction = await sequelize.transaction();

  try {
    // Build update fields
    const updateFields = [];
    const replacements = { id };

    // Add all possible fields
    const fieldMappings = {
      is_enabled: 'is_enabled',
      banner_position: 'banner_position',
      banner_text: 'banner_text',
      privacy_policy_url: 'privacy_policy_url',
      accept_button_text: 'accept_button_text',
      reject_button_text: 'reject_button_text',
      settings_button_text: 'settings_button_text',
      necessary_cookies: 'necessary_cookies',
      analytics_cookies: 'analytics_cookies',
      marketing_cookies: 'marketing_cookies',
      functional_cookies: 'functional_cookies',
      theme: 'theme',
      primary_color: 'primary_color',
      background_color: 'background_color',
      text_color: 'text_color',
      gdpr_mode: 'gdpr_mode',
      auto_detect_country: 'auto_detect_country',
      audit_enabled: 'audit_enabled',
      consent_expiry_days: 'consent_expiry_days',
      show_close_button: 'show_close_button',
      privacy_policy_text: 'privacy_policy_text',
      google_analytics_id: 'google_analytics_id',
      google_tag_manager_id: 'google_tag_manager_id',
      custom_css: 'custom_css',
      accept_button_bg_color: 'accept_button_bg_color',
      accept_button_text_color: 'accept_button_text_color',
      reject_button_bg_color: 'reject_button_bg_color',
      reject_button_text_color: 'reject_button_text_color',
      save_preferences_button_bg_color: 'save_preferences_button_bg_color',
      save_preferences_button_text_color: 'save_preferences_button_text_color'
    };

    Object.entries(fieldMappings).forEach(([key, field]) => {
      if (settingsData[key] !== undefined) {
        updateFields.push(`${field} = :${key}`);
        replacements[key] = settingsData[key];
      }
    });

    // Handle JSON fields separately
    if (settingsData.categories !== undefined) {
      updateFields.push('categories = :categories');
      replacements.categories = JSON.stringify(settingsData.categories);
    }
    if (settingsData.gdpr_countries !== undefined) {
      updateFields.push('gdpr_countries = :gdpr_countries');
      replacements.gdpr_countries = JSON.stringify(settingsData.gdpr_countries);
    }

    if (updateFields.length > 0) {
      updateFields.push('updated_at = NOW()');

      await sequelize.query(`
        UPDATE cookie_consent_settings
        SET ${updateFields.join(', ')}
        WHERE id = :id
      `, {
        replacements,
        transaction
      });
    }

    // Update translations
    for (const [langCode, data] of Object.entries(translations)) {
      if (data && Object.keys(data).length > 0) {
        await sequelize.query(`
          INSERT INTO cookie_consent_settings_translations (
            cookie_consent_settings_id, language_code, banner_text,
            accept_button_text, reject_button_text, settings_button_text,
            privacy_policy_text, save_preferences_button_text,
            necessary_name, necessary_description,
            analytics_name, analytics_description,
            marketing_name, marketing_description,
            functional_name, functional_description,
            created_at, updated_at
          ) VALUES (
            :settings_id, :lang_code, :banner_text,
            :accept_button_text, :reject_button_text, :settings_button_text,
            :privacy_policy_text, :save_preferences_button_text,
            :necessary_name, :necessary_description,
            :analytics_name, :analytics_description,
            :marketing_name, :marketing_description,
            :functional_name, :functional_description,
            NOW(), NOW()
          )
          ON CONFLICT (cookie_consent_settings_id, language_code) DO UPDATE
          SET
            banner_text = COALESCE(EXCLUDED.banner_text, cookie_consent_settings_translations.banner_text),
            accept_button_text = COALESCE(EXCLUDED.accept_button_text, cookie_consent_settings_translations.accept_button_text),
            reject_button_text = COALESCE(EXCLUDED.reject_button_text, cookie_consent_settings_translations.reject_button_text),
            settings_button_text = COALESCE(EXCLUDED.settings_button_text, cookie_consent_settings_translations.settings_button_text),
            privacy_policy_text = COALESCE(EXCLUDED.privacy_policy_text, cookie_consent_settings_translations.privacy_policy_text),
            save_preferences_button_text = COALESCE(EXCLUDED.save_preferences_button_text, cookie_consent_settings_translations.save_preferences_button_text),
            necessary_name = COALESCE(EXCLUDED.necessary_name, cookie_consent_settings_translations.necessary_name),
            necessary_description = COALESCE(EXCLUDED.necessary_description, cookie_consent_settings_translations.necessary_description),
            analytics_name = COALESCE(EXCLUDED.analytics_name, cookie_consent_settings_translations.analytics_name),
            analytics_description = COALESCE(EXCLUDED.analytics_description, cookie_consent_settings_translations.analytics_description),
            marketing_name = COALESCE(EXCLUDED.marketing_name, cookie_consent_settings_translations.marketing_name),
            marketing_description = COALESCE(EXCLUDED.marketing_description, cookie_consent_settings_translations.marketing_description),
            functional_name = COALESCE(EXCLUDED.functional_name, cookie_consent_settings_translations.functional_name),
            functional_description = COALESCE(EXCLUDED.functional_description, cookie_consent_settings_translations.functional_description),
            updated_at = NOW()
        `, {
          replacements: {
            settings_id: id,
            lang_code: langCode,
            banner_text: data.banner_text,
            accept_button_text: data.accept_button_text,
            reject_button_text: data.reject_button_text,
            settings_button_text: data.settings_button_text,
            privacy_policy_text: data.privacy_policy_text,
            save_preferences_button_text: data.save_preferences_button_text,
            necessary_name: data.necessary_name,
            necessary_description: data.necessary_description,
            analytics_name: data.analytics_name,
            analytics_description: data.analytics_description,
            marketing_name: data.marketing_name,
            marketing_description: data.marketing_description,
            functional_name: data.functional_name,
            functional_description: data.functional_description
          },
          transaction
        });
      }
    }

    await transaction.commit();

    // Return the updated settings with translations
    return await getCookieConsentSettingsById(id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * Delete cookie consent settings (translations are CASCADE deleted)
 *
 * @param {string} id - Cookie consent settings ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteCookieConsentSettings(id) {
  await sequelize.query(`
    DELETE FROM cookie_consent_settings WHERE id = :id
  `, {
    replacements: { id },
    type: sequelize.QueryTypes.DELETE
  });

  return true;
}

module.exports = {
  getCookieConsentSettingsWithTranslations,
  getCookieConsentSettingsById,
  createCookieConsentSettingsWithTranslations,
  updateCookieConsentSettingsWithTranslations,
  deleteCookieConsentSettings
};
