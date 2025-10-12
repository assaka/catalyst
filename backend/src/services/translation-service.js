const { Translation, Language, Product, Category, CmsPage, CmsBlock } = require('../models');
const { Op } = require('sequelize');

class TranslationService {
  /**
   * Get all UI labels for a specific language
   */
  async getUILabels(languageCode) {
    const translations = await Translation.findAll({
      where: { language_code: languageCode },
      attributes: ['key', 'value', 'category']
    });

    // Convert to key-value object
    const result = {};
    translations.forEach(t => {
      result[t.key] = t.value;
    });

    return result;
  }

  /**
   * Get UI labels for all languages
   */
  async getAllUILabels() {
    const translations = await Translation.findAll({
      attributes: ['key', 'language_code', 'value', 'category']
    });

    // Group by key
    const result = {};
    translations.forEach(t => {
      if (!result[t.key]) {
        result[t.key] = {
          category: t.category,
          translations: {}
        };
      }
      result[t.key].translations[t.language_code] = t.value;
    });

    return result;
  }

  /**
   * Save or update a UI label translation
   */
  async saveUILabel(key, languageCode, value, category = 'common') {
    const [translation, created] = await Translation.findOrCreate({
      where: { key, language_code: languageCode },
      defaults: { key, language_code: languageCode, value, category }
    });

    if (!created) {
      translation.value = value;
      if (category) translation.category = category;
      await translation.save();
    }

    return translation;
  }

  /**
   * Save multiple UI labels at once
   */
  async saveBulkUILabels(labels) {
    const promises = labels.map(({ key, language_code, value, category }) =>
      this.saveUILabel(key, language_code, value, category)
    );
    return await Promise.all(promises);
  }

  /**
   * Delete a UI label translation
   */
  async deleteUILabel(key, languageCode) {
    return await Translation.destroy({
      where: { key, language_code: languageCode }
    });
  }

  /**
   * AI Translation using Anthropic Claude API
   * Falls back to returning original text if API key not configured
   */
  async aiTranslate(text, fromLang, toLang) {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.warn('No AI API key configured for translation');
      return text; // Return original text if no API key
    }

    try {
      // Use Anthropic Claude API
      if (process.env.ANTHROPIC_API_KEY) {
        return await this._translateWithClaude(text, fromLang, toLang);
      }

      // Use OpenAI API as fallback
      if (process.env.OPENAI_API_KEY) {
        return await this._translateWithOpenAI(text, fromLang, toLang);
      }

      return text;
    } catch (error) {
      console.error('AI translation error:', error);
      return text; // Return original text on error
    }
  }

  async _translateWithClaude(text, fromLang, toLang) {
    const fetch = (await import('node-fetch')).default;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Translate the following text from ${fromLang} to ${toLang}. Return ONLY the translated text, no explanations:\n\n${text}`
        }]
      })
    });

    const data = await response.json();
    return data.content[0].text.trim();
  }

  async _translateWithOpenAI(text, fromLang, toLang) {
    const fetch = (await import('node-fetch')).default;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `Translate the following text from ${fromLang} to ${toLang}. Return ONLY the translated text, no explanations:\n\n${text}`
        }],
        temperature: 0.3
      })
    });

    const data = await response.json();
    return data.choices[0].message.content.trim();
  }

  /**
   * Get entity translation (Product, Category, CmsPage, CmsBlock)
   */
  async getEntityTranslation(entityType, entityId, languageCode) {
    const Model = this._getEntityModel(entityType);
    const entity = await Model.findByPk(entityId);

    if (!entity || !entity.translations) {
      return null;
    }

    return entity.translations[languageCode] || null;
  }

  /**
   * Save entity translation
   */
  async saveEntityTranslation(entityType, entityId, languageCode, translationData) {
    const Model = this._getEntityModel(entityType);
    const entity = await Model.findByPk(entityId);

    if (!entity) {
      throw new Error(`${entityType} not found`);
    }

    const translations = entity.translations || {};
    translations[languageCode] = translationData;

    entity.translations = translations;
    entity.changed('translations', true); // Mark as changed for Sequelize
    await entity.save();

    return entity;
  }

  /**
   * Translate all fields of an entity using AI
   */
  async aiTranslateEntity(entityType, entityId, fromLang, toLang) {
    const Model = this._getEntityModel(entityType);
    const entity = await Model.findByPk(entityId);

    if (!entity || !entity.translations || !entity.translations[fromLang]) {
      throw new Error('Source translation not found');
    }

    const sourceTranslation = entity.translations[fromLang];
    const translatedData = {};

    // Translate each field
    for (const [key, value] of Object.entries(sourceTranslation)) {
      if (typeof value === 'string' && value.trim()) {
        translatedData[key] = await this.aiTranslate(value, fromLang, toLang);
      }
    }

    // Save the translation
    return await this.saveEntityTranslation(entityType, entityId, toLang, translatedData);
  }

  /**
   * Get missing translations report
   */
  async getMissingTranslationsReport() {
    const languages = await Language.findAll({
      where: { is_active: true },
      attributes: ['code', 'name']
    });

    const defaultLang = languages.find(l => l.code === 'en') || languages[0];
    const uiLabels = await Translation.findAll({
      where: { language_code: defaultLang.code },
      attributes: ['key']
    });

    const report = {
      ui_labels: {},
      entities: {}
    };

    // Check UI labels
    for (const label of uiLabels) {
      for (const lang of languages) {
        if (lang.code === defaultLang.code) continue;

        const exists = await Translation.findOne({
          where: { key: label.key, language_code: lang.code }
        });

        if (!exists) {
          if (!report.ui_labels[lang.code]) {
            report.ui_labels[lang.code] = [];
          }
          report.ui_labels[lang.code].push(label.key);
        }
      }
    }

    return report;
  }

  /**
   * Helper to get entity model
   */
  _getEntityModel(entityType) {
    const models = {
      product: Product,
      category: Category,
      cms_page: CmsPage,
      cms_block: CmsBlock
    };

    const Model = models[entityType.toLowerCase()];
    if (!Model) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }

    return Model;
  }
}

module.exports = new TranslationService();
