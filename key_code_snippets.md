# Magic Translation Wand - Key Code Snippets

## 1. Frontend: Wand Button Component
Location: src/components/admin/translations/ProductTranslationRow.jsx (lines 209-224)

```jsx
{lang.code !== 'en' && (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleAITranslate(field.key, 'en', lang.code)}
          disabled={translating[translatingKey] || !translations.en?.[field.key]}
          className="flex-shrink-0"
        >
          <Wand2 className={`w-4 h-4 ${translating[translatingKey] ? 'animate-spin' : ''}`} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Cost: 0.1 credits per translation</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)}
```

## 2. Frontend: AI Translate Handler
Location: src/components/admin/translations/ProductTranslationRow.jsx (lines 95-125)

```javascript
const handleAITranslate = async (field, fromLang, toLang) => {
  const sourceText = translations[fromLang]?.[field];
  if (!sourceText || !sourceText.trim()) {
    toast.error(`No ${fromLang.toUpperCase()} text found for ${field}`);
    return;
  }

  const translatingKey = `${field}-${toLang}`;
  try {
    setTranslating(prev => ({ ...prev, [translatingKey]: true }));

    const response = await api.post('/translations/ai-translate', {
      text: sourceText,
      fromLang,
      toLang,
      storeId,
      entityType: 'product'
    });

    if (response && response.success && response.data) {
      handleTranslationChange(toLang, field, response.data.translated);
      toast.success(`${field} translated to ${toLang.toUpperCase()}`);
    }
  } catch (error) {
    console.error('AI translate error:', error);
    toast.error(`Failed to translate ${field}`);
  } finally {
    setTranslating(prev => ({ ...prev, [translatingKey]: false }));
  }
};
```

## 3. Backend: API Endpoint - Credit Check
Location: backend/src/routes/translations.js (lines 203-218)

```javascript
// Get translation cost based on entity type
const costType = entityType || 'standard';
const translationCost = await translationService.getTranslationCost(costType);

// Check if user has enough credits
const hasCredits = await creditService.hasEnoughCredits(userId, storeId, translationCost);
if (!hasCredits) {
  const balance = await creditService.getBalance(userId);
  return res.status(402).json({
    success: false,
    code: 'INSUFFICIENT_CREDITS',
    message: `Insufficient credits. Required: ${translationCost}, Available: ${balance}`,
    required: translationCost,
    available: balance
  });
}
```

## 4. Backend: API Endpoint - Translation & Deduction
Location: backend/src/routes/translations.js (lines 220-249)

```javascript
// Perform translation
const translatedText = await translationService.aiTranslate(text, fromLang, toLang);

// Deduct credits after successful translation
await creditService.deduct(
  userId,
  storeId,
  translationCost,
  `AI Translation${entityType ? ` (${entityType})` : ''}: ${fromLang} → ${toLang}`,
  {
    entityType: entityType || 'standard',
    fromLang,
    toLang,
    textLength: text.length,
    translatedLength: translatedText.length
  },
  null,
  'ai_translation'
);

res.json({
  success: true,
  data: {
    original: text,
    translated: translatedText,
    fromLang,
    toLang
  },
  creditsDeducted: translationCost
});
```

## 5. Translation Service: Cost Lookup
Location: backend/src/services/translation-service.js (lines 510-562)

```javascript
async getTranslationCost(entityType) {
  const serviceKeyMap = {
    'standard': 'ai_translation',
    'product': 'ai_translation_product',
    'category': 'ai_translation_category',
    // ... other types
  };

  const fallbackCosts = {
    'standard': 0.1,
    'product': 0.1,
    'category': 0.1,
    'cms_page': 0.5,
    'cms_block': 0.2,
    // ... other types
  };

  const serviceKey = serviceKeyMap[entityType] || serviceKeyMap['standard'];

  try {
    const cost = await ServiceCreditCost.getCostByKey(serviceKey);
    return parseFloat(cost);
  } catch (error) {
    console.warn(`Could not fetch cost for ${serviceKey}, using fallback:`, error.message);
    return fallbackCosts[entityType] || fallbackCosts['standard'];
  }
}
```

## 6. Credit Service: Deduction Logic
Location: backend/src/services/credit-service.js (lines 48-121)

```javascript
async deduct(userId, storeId, amount, description, metadata = {}, referenceId = null, referenceType = null) {
  // Parse amount
  const creditAmount = parseFloat(amount);
  
  // Get current balance
  const balance = await this.getBalance(userId);
  
  // Check sufficient credits
  const hasCredits = await this.hasEnoughCredits(userId, storeId, creditAmount);
  if (!hasCredits) {
    throw new Error(`Insufficient credits. Required: ${creditAmount}, Available: ${balance}`);
  }

  // Atomic deduction from database
  const updateResult = await sequelize.query(`
    UPDATE users
    SET credits = credits - $1::numeric,
        updated_at = NOW()
    WHERE id = $2
    RETURNING id, credits
  `, {
    bind: [creditAmount, userId],
    type: sequelize.QueryTypes.UPDATE
  });

  // Record usage for audit trail
  const usage = await CreditUsage.create({
    user_id: userId,
    store_id: storeId,
    credits_used: creditAmount,
    usage_type: 'other',
    reference_id: referenceId,
    reference_type: referenceType,
    description: description,
    metadata: {
      deduction_time: new Date().toISOString(),
      ...metadata
    }
  });

  const newBalance = await this.getBalance(userId);

  return {
    success: true,
    usage_id: usage.id,
    credits_deducted: creditAmount,
    remaining_balance: newBalance,
    description: description
  };
}
```

## 7. Credit Service: Balance Check
Location: backend/src/services/credit-service.js (lines 17-35)

```javascript
async getBalance(userId, storeId = null) {
  const [result] = await sequelize.query(`
    SELECT credits FROM users WHERE id = $1
  `, {
    bind: [userId],
    type: sequelize.QueryTypes.SELECT
  });

  return result ? parseFloat(result.credits || 0) : 0;
}

async hasEnoughCredits(userId, storeId = null, requiredCredits) {
  const balance = await this.getBalance(userId);
  return balance >= requiredCredits;
}
```

## Summary of Flow

1. **Frontend Button Click**
   - Validates source text exists
   - Shows loading spinner
   - POST /translations/ai-translate

2. **Backend - Cost & Credit Check**
   - Get cost: 0.1 credits for products
   - Check user balance >= 0.1
   - Return 402 if insufficient

3. **Backend - Translation**
   - Call Claude AI to translate
   - Get translated text

4. **Backend - Credit Deduction**
   - UPDATE users SET credits = credits - 0.1
   - INSERT INTO credit_usage (audit log)
   - Return success response

5. **Frontend - Success**
   - Update form field with translation
   - Show success toast
   - Clear loading spinner

