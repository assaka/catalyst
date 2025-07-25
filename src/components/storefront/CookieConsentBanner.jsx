import React, { useState, useEffect } from 'react';
import { User, ConsentLog } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { X, Settings, Shield } from 'lucide-react';
import { useStore } from './StoreProvider';

const getUserCountry = async () => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return data.country_code;
  } catch (error) {
    console.warn('Could not detect user country:', error);
    return 'US';
  }
};

const getSessionId = () => {
  let sessionId = localStorage.getItem('cookie_consent_session');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('cookie_consent_session', sessionId);
  }
  return sessionId;
};

export default function CookieConsentBanner() {
  const { store, settings } = useStore();
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [userCountry, setUserCountry] = useState('US');
  const [selectedCategories, setSelectedCategories] = useState({});
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (store?.id && settings?.cookie_consent) {
      console.log('Cookie consent settings:', settings.cookie_consent);
      detectUserCountry();
      loadUser();
      checkExistingConsent();
    }
  }, [store?.id, settings?.cookie_consent]);

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      setUser(null);
    }
  };

  const detectUserCountry = async () => {
    const country = await getUserCountry();
    setUserCountry(country);
  };

  const checkExistingConsent = () => {
    const consent = localStorage.getItem('cookie_consent');
    const consentExpiry = localStorage.getItem('cookie_consent_expiry');
    
    if (consent && consentExpiry) {
      const expiryDate = new Date(consentExpiry);
      if (expiryDate > new Date()) {
        console.log('Valid consent exists, not showing banner');
        return;
      }
    }
    
    // Show banner if should be shown
    if (shouldShowBanner()) {
      console.log('Showing cookie consent banner');
      setShowBanner(true);
      
      // Initialize selected categories
      const cookieSettings = settings.cookie_consent;
      if (cookieSettings?.categories) {
        const initialCategories = {};
        cookieSettings.categories.forEach(cat => {
          initialCategories[cat.id] = cat.required || cat.default_enabled;
        });
        setSelectedCategories(initialCategories);
      }
    }
  };

  const isGDPRCountry = () => {
    const gdprCountries = settings?.cookie_consent?.gdpr_countries || [
      "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", 
      "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", 
      "PL", "PT", "RO", "SK", "SI", "ES", "SE"
    ];
    return gdprCountries.includes(userCountry);
  };

  const shouldShowBanner = () => {
    const cookieSettings = settings?.cookie_consent;
    if (!cookieSettings?.enabled) return false;
    
    if (cookieSettings.gdpr_mode && cookieSettings.auto_detect_country) {
      return isGDPRCountry();
    }
    return true;
  };

  const saveConsent = async (consentGiven, categories) => {
    const sessionId = getSessionId();
    const cookieSettings = settings.cookie_consent;
    
    // Store consent in localStorage
    localStorage.setItem('cookie_consent', JSON.stringify(categories));
    localStorage.setItem('cookie_consent_expiry', 
      new Date(Date.now() + ((cookieSettings?.consent_expiry_days || 365) * 24 * 60 * 60 * 1000)).toISOString()
    );
    
    console.log('Consent saved locally:', categories);
    
    // Save consent to backend for audit purposes
    try {
      const consentMethod = categories.length === (cookieSettings?.categories?.length || 0) ? 'accept_all' : 
                           categories.filter(cat => !cookieSettings?.categories?.find(c => c.id === cat && c.required)).length === 0 ? 'reject_all' : 
                           'custom';
      
      await ConsentLog.create({
        store_id: store?.id,
        session_id: sessionId,
        user_id: user?.id || null,
        consent_given: consentGiven,
        categories_accepted: categories,
        country_code: userCountry,
        consent_method: consentMethod,
        page_url: window.location.href
      });
      
      console.log('Consent saved to backend for audit');
    } catch (error) {
      console.warn('Failed to save consent to backend (non-critical):', error);
    }
    
    setShowBanner(false);
    setShowPreferences(false);
  };

  const handleAcceptAll = () => {
    const cookieSettings = settings.cookie_consent;
    const allCategories = cookieSettings?.categories?.map(cat => cat.id) || [];
    saveConsent(true, allCategories);
  };

  const handleRejectAll = () => {
    const cookieSettings = settings.cookie_consent;
    const essentialOnly = cookieSettings?.categories?.filter(cat => cat.required).map(cat => cat.id) || [];
    saveConsent(false, essentialOnly);
  };

  const handleSavePreferences = () => {
    const acceptedCategories = Object.keys(selectedCategories).filter(key => selectedCategories[key]);
    saveConsent(true, acceptedCategories);
  };

  const handleCategoryChange = (categoryId, checked) => {
    setSelectedCategories(prev => ({
      ...prev,
      [categoryId]: checked
    }));
  };

  if (!showBanner || !settings?.cookie_consent?.enabled) {
    return null;
  }

  const cookieSettings = settings.cookie_consent;

  return (
    <>
      {cookieSettings.custom_css && (
        <style dangerouslySetInnerHTML={{ __html: cookieSettings.custom_css }} />
      )}
      
      <div className={`cookie-banner fixed inset-x-0 z-50 ${
        cookieSettings.banner_position === 'top' ? 'top-0' : 
        cookieSettings.banner_position === 'center' ? 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2' :
        'bottom-0'
      }`}>
        <Card className={`mx-4 mb-4 shadow-lg ${cookieSettings.banner_position === 'center' ? 'max-w-lg' : 'max-w-4xl mx-auto'}`}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Cookie Preferences</h3>
              </div>
              {cookieSettings.show_close_button && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBanner(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              {cookieSettings.banner_message || 'We use cookies to enhance your browsing experience.'}
            </p>

            {showPreferences && cookieSettings.categories && (
              <div className="mb-4 space-y-3">
                {cookieSettings.categories.map(category => (
                  <div key={category.id} className="flex items-start justify-between p-3 border rounded">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Label className="font-medium">{category.name}</Label>
                        {category.required && (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">Required</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{category.description}</p>
                    </div>
                    <Switch
                      checked={selectedCategories[category.id] || false}
                      onCheckedChange={(checked) => handleCategoryChange(category.id, checked)}
                      disabled={category.required}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleAcceptAll}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {cookieSettings.accept_all_text || 'Accept All'}
              </Button>
              
              <Button
                onClick={handleRejectAll}
                variant="outline"
              >
                {cookieSettings.reject_all_text || 'Reject All'}
              </Button>
              
              {!showPreferences ? (
                <Button
                  onClick={() => setShowPreferences(true)}
                  variant="outline"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {cookieSettings.manage_preferences_text || 'Manage Preferences'}
                </Button>
              ) : (
                <Button
                  onClick={handleSavePreferences}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Save Preferences
                </Button>
              )}

              <a
                href={cookieSettings.privacy_policy_url || '/privacy-policy'}
                className="text-sm text-blue-600 hover:text-blue-800 underline self-center"
              >
                {cookieSettings.privacy_policy_text || 'Privacy Policy'}
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}