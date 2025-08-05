import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import { AlertCircle, CheckCircle, RefreshCw, Download, Settings, Database, Package, Clock, Plus, Trash2, Edit, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useStoreSlug } from '../hooks/useStoreSlug';
import apiClient from '../api/client';
import { MultiSelect } from '../components/ui/multi-select';

const AkeneoIntegration = () => {
  const storeSlug = useStoreSlug();
  
  // Configuration state
  const [config, setConfig] = useState({
    baseUrl: '',
    clientId: '',
    clientSecret: '',
    username: '',
    password: '',
    locale: 'en_US'
  });
  const [lastImportDates, setLastImportDates] = useState({});

  // UI state
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [configSaved, setConfigSaved] = useState(false);
  // Separate import results for each tab
  const [importResults, setImportResults] = useState({
    categories: null,
    products: null,
    attributes: null,
    families: null
  });
  const [dryRun, setDryRun] = useState(true);
  const [locales, setLocales] = useState([]);
  const [activeTab, setActiveTab] = useState('configuration');
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [channels, setChannels] = useState([]);
  const [families, setFamilies] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [selectedRootCategories, setSelectedRootCategories] = useState([]);
  const [selectedFamilies, setSelectedFamilies] = useState([]);
  const [selectedFamiliesToImport, setSelectedFamiliesToImport] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingFamilies, setLoadingFamilies] = useState(false);
  
  // Advanced settings
  const [categorySettings, setCategorySettings] = useState({
    hideFromMenu: false,
    setNewActive: true,
    preventUrlKeyOverride: true, // Enabled by default to preserve existing URLs
    akeneoUrlField: 'url_key' // Default Akeneo field for URL generation
  });
  
  const [productSettings, setProductSettings] = useState({
    mode: 'standard', // standard, advanced
    completeness: 100,
    productModel: 'all_variants_complete', // at_least_one, all_variants_complete
    updatedInterval: 0, // hours
    status: 'enabled', // enabled, disabled
    includeImages: true,
    includeFiles: true,
    stockFilter: 'disabled', // disabled, in_stock, out_of_stock
    preventUrlKeyOverride: true, // Enabled by default to preserve existing URLs
    akeneoUrlField: 'url_key' // Default Akeneo field for URL generation
  });
  
  const [attributeSettings, setAttributeSettings] = useState({
    updatedInterval: 0, // hours
    selectedFamilies: []
  });

  // Custom mapping configurations
  const [customMappings, setCustomMappings] = useState({
    attributes: [
      { akeneoField: 'name', catalystField: 'product_name', enabled: true },
      { akeneoField: 'description', catalystField: 'description', enabled: true },
      { akeneoField: 'price', catalystField: 'price', enabled: true }
    ],
    images: [
      { akeneoField: 'image', catalystField: 'main_image', enabled: true },
      { akeneoField: 'images', catalystField: 'gallery', enabled: true }
    ],
    files: [
      { akeneoField: 'attachments', catalystField: 'files', enabled: true },
      { akeneoField: 'documents', catalystField: 'downloads', enabled: true }
    ]
  });
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    import_type: 'attributes',
    schedule_type: 'once',
    schedule_time: '',
    schedule_date: '',
    is_active: true,
    filters: {
      channels: [],
      families: [],
      categoryIds: [],
      attributes: {}
    },
    options: {
      locale: 'en_US',
      dryRun: false,
      batchSize: 50
    }
  });
  
  // Debug dry run changes
  const handleDryRunChange = (checked) => {
    console.log('🔧 Dry run toggle changed:', checked);
    setDryRun(checked);
  };

  // Functions to manage per-tab import results
  const setTabImportResults = (tab, results) => {
    const newResults = { ...importResults, [tab]: results };
    setImportResults(newResults);
    // Persist to localStorage
    localStorage.setItem('akeneo_import_results', JSON.stringify(newResults));
  };

  const loadImportResults = () => {
    try {
      const savedResults = localStorage.getItem('akeneo_import_results');
      if (savedResults) {
        const parsedResults = JSON.parse(savedResults);
        setImportResults(parsedResults);
        console.log('📥 Loaded saved import results:', parsedResults);
      }
    } catch (error) {
      console.warn('Failed to load saved import results:', error);
    }
  };

  // Helper functions for custom mapping
  const updateMapping = (type, index, field, value) => {
    setCustomMappings(prev => ({
      ...prev,
      [type]: prev[type].map((mapping, i) => 
        i === index ? { ...mapping, [field]: value } : mapping
      )
    }));
  };

  const addMapping = (type) => {
    setCustomMappings(prev => ({
      ...prev,
      [type]: [...prev[type], { akeneoField: '', catalystField: '', enabled: true }]
    }));
  };

  const removeMapping = (type, index) => {
    setCustomMappings(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  // Load import statistics
  const loadStats = async () => {
    console.log('🔍 Loading statistics...');
    console.log('Store slug:', storeSlug);
    
    if (!storeSlug) {
      console.log('❌ No store slug, skipping stats load');
      return;
    }
    
    setLoadingStats(true);
    try {
      const storeId = localStorage.getItem('selectedStoreId');
      console.log('Store ID from localStorage:', storeId);
      
      if (!storeId) {
        console.log('❌ No store ID found in localStorage');
        return;
      }

      console.log('📡 Making API call to /integrations/akeneo/stats');
      const response = await apiClient.get('/integrations/akeneo/stats', {
        'x-store-id': storeId
      });

      console.log('📥 Stats API response:', response);

      // Check if response has data property or is the direct response
      const responseData = response.data || response;
      
      if (responseData?.success) {
        console.log('✅ Stats loaded successfully:', responseData.stats);
        setStats(responseData.stats);
      } else {
        console.log('❌ Stats API returned unsuccessful response:', responseData);
      }
    } catch (error) {
      console.error('❌ Failed to load stats:', error);
      console.error('Error details:', {
        status: error.status,
        message: error.message,
        response: error.response?.data
      });
    } finally {
      setLoadingStats(false);
    }
  };

  // Load schedules
  const loadSchedules = async () => {
    if (!connectionStatus?.success) return;
    
    setLoadingSchedules(true);
    try {
      const storeId = localStorage.getItem('selectedStoreId');
      if (!storeId) return;

      const response = await apiClient.get('/integrations/akeneo/schedules', {
        'x-store-id': storeId
      });

      if (response.data?.success || response.success) {
        const responseData = response.data || response;
        setSchedules(responseData.schedules || []);
      }
    } catch (error) {
      console.error('Failed to load schedules:', error);
    } finally {
      setLoadingSchedules(false);
    }
  };

  // Load channels for filtering
  const loadChannels = async () => {
    if (!connectionStatus?.success) return;
    
    try {
      const storeId = localStorage.getItem('selectedStoreId');
      if (!storeId) return;

      const response = await apiClient.get('/integrations/akeneo/channels', {
        'x-store-id': storeId
      });

      if (response.data?.success || response.success) {
        const responseData = response.data || response;
        setChannels(responseData.channels || []);
      }
    } catch (error) {
      console.error('Failed to load channels:', error);
    }
  };

  const loadAvailableCategories = async () => {
    if (!connectionStatus?.success) {
      console.log('⚠️ Connection not successful, skipping category load');
      return;
    }
    
    setLoadingCategories(true);
    try {
      const storeId = localStorage.getItem('selectedStoreId');
      if (!storeId) {
        console.error('❌ No store ID found');
        return;
      }

      console.log('📡 Loading categories from Akeneo for store:', storeId);
      console.log('🔧 Current connection status:', connectionStatus);
      console.log('⚙️ Config saved:', configSaved);
      
      const response = await apiClient.get('/integrations/akeneo/categories', {
        'x-store-id': storeId
      });

      console.log('📥 Categories API response status:', response.status);
      console.log('📥 Categories API response data:', response.data);

      if (response.data?.success || response.success) {
        const responseData = response.data || response;
        const categories = responseData.categories || [];

        // Filter to only root categories (no parent)
        const rootCategories = categories.filter(cat => {
          const isRoot = !cat.parent || cat.parent === null || cat.parent === undefined || cat.parent === '';
          return isRoot;
        });
        
        setAvailableCategories(rootCategories);

        if (rootCategories.length === 0) {
          console.warn('⚠️ No root categories found. All categories might have parents.');
          toast.info('No root categories found in Akeneo. All categories appear to have parent categories.');
        }
      } else {
        console.error('❌ API response indicates failure:', responseData);
        toast.error('Failed to load categories from Akeneo API');
      }
    } catch (error) {
      console.error('❌ Failed to load categories:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      toast.error(`Failed to load categories: ${error.message}`);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Load families for filtering - try local database first, then Akeneo
  const loadFamiliesForFilter = async () => {
    try {
      const storeId = localStorage.getItem('selectedStoreId');
      console.log('🔍 loadFamiliesForFilter called with storeId:', storeId);
      
      if (!storeId) {
        console.warn('❌ No storeId found in localStorage');
        return;
      }

      setLoadingFamilies(true);
      
      // First try to load families from local database (imported AttributeSets)
      try {
        console.log('📡 Making API call to /attribute-sets with storeId:', storeId);
        const localResponse = await apiClient.get(`/attribute-sets?store_id=${storeId}`);
        console.log('📋 API response:', localResponse);

        // Handle both wrapped and raw array response formats
        let attributeSets = [];
        
        if (localResponse.success && localResponse.data?.attribute_sets?.length > 0) {
          // Wrapped response format (authenticated)
          attributeSets = localResponse.data.attribute_sets;
        } else if (Array.isArray(localResponse) && localResponse.length > 0) {
          // Raw array response format (public/unauthenticated)
          attributeSets = localResponse;
        }
        
        if (attributeSets.length > 0) {
          const localFamilies = attributeSets.map(attributeSet => ({
            code: attributeSet.name,
            labels: { en_US: attributeSet.name },
            attributes: attributeSet.attribute_ids || [],
            source: 'local'
          }));
          setFamilies(localFamilies);
          console.log(`✅ Loaded ${localFamilies.length} families from local database:`, localFamilies.slice(0, 3));
          return; // Use local families if available
        } else {
          console.warn('⚠️ API call successful but no families found:', {
            success: localResponse.success,
            hasData: !!localResponse.data,
            attributeSetsLength: localResponse.data?.attribute_sets?.length,
            isArray: Array.isArray(localResponse),
            arrayLength: Array.isArray(localResponse) ? localResponse.length : 'not array'
          });
        }
      } catch (localError) {
        console.error('❌ Failed to load families from local database:', localError);
        console.error('Error details:', {
          message: localError.message,
          status: localError.status,
          response: localError.response
        });
      }

      // Fallback to loading families directly from Akeneo if connection is successful
      if (connectionStatus?.success) {
        const response = await apiClient.get('/integrations/akeneo/families', {
          'x-store-id': storeId
        });

        if (response.success) {
          const familyData = response.families?.map(family => ({
            ...family,
            source: 'akeneo'
          })) || [];
          setFamilies(familyData);
          console.log(`Loaded ${familyData.length} families from Akeneo`);
        }
      } else {
        console.log('No Akeneo connection available, and no local families found');
      }
    } catch (error) {
      console.error('Failed to load families:', error);
      // Silently fail - families are optional for filtering
    } finally {
      setLoadingFamilies(false);
    }
  };

  // Save schedule
  const saveSchedule = async () => {
    try {
      const storeId = localStorage.getItem('selectedStoreId');
      if (!storeId) return;

      const response = await apiClient.post('/integrations/akeneo/schedules', scheduleForm, {
        'x-store-id': storeId
      });

      if (response.data?.success || response.success) {
        toast.success('Schedule saved successfully');
        setShowScheduleForm(false);
        setEditingSchedule(null);
        setScheduleForm({
          import_type: 'attributes',
          schedule_type: 'once',
          schedule_time: '',
          schedule_date: '',
          is_active: true,
          filters: { channels: [], families: [], categoryIds: [], attributes: {} },
          options: { locale: 'en_US', dryRun: false, batchSize: 50 }
        });
        await loadSchedules();
      }
    } catch (error) {
      console.error('Failed to save schedule:', error);
      toast.error('Failed to save schedule');
    }
  };

  // Delete schedule
  const deleteSchedule = async (scheduleId) => {
    try {
      const storeId = localStorage.getItem('selectedStoreId');
      if (!storeId) return;

      const response = await apiClient.delete(`/integrations/akeneo/schedules/${scheduleId}`, {
        'x-store-id': storeId
      });

      if (response.data?.success || response.success) {
        toast.success('Schedule deleted successfully');
        await loadSchedules();
      }
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      toast.error('Failed to delete schedule');
    }
  };

  // Load configuration and locales on component mount
  useEffect(() => {
    // Add a small delay to ensure localStorage is ready
    const loadData = async () => {
      // Wait a bit for localStorage to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Load saved connection status
      const savedConnectionStatus = localStorage.getItem('akeneo_connection_status');
      if (savedConnectionStatus) {
        try {
          const parsedStatus = JSON.parse(savedConnectionStatus);
          setConnectionStatus(parsedStatus);
          console.log('📥 Loaded saved connection status:', parsedStatus);
        } catch (error) {
          console.warn('⚠️ Failed to parse saved connection status:', error);
        }
      }

      // Load saved category selections
      const savedCategories = localStorage.getItem('akeneo_selected_categories');
      if (savedCategories) {
        try {
          const parsedCategories = JSON.parse(savedCategories);
          setSelectedRootCategories(parsedCategories);
          console.log('📥 Loaded saved categories:', parsedCategories);
        } catch (error) {
          console.warn('⚠️ Failed to parse saved categories:', error);
        }
      }

      // Load saved family selections
      const savedFamilies = localStorage.getItem('akeneo_selected_families');
      if (savedFamilies) {
        try {
          const parsedFamilies = JSON.parse(savedFamilies);
          setSelectedFamilies(parsedFamilies);
          console.log('📥 Loaded saved families:', parsedFamilies);
        } catch (error) {
          console.warn('⚠️ Failed to parse saved families:', error);
        }
      }

      // Load saved advanced settings
      const savedCategorySettings = localStorage.getItem('akeneo_category_settings');
      if (savedCategorySettings) {
        try {
          const parsedSettings = JSON.parse(savedCategorySettings);
          setCategorySettings(parsedSettings);
        } catch (error) {
          console.warn('⚠️ Failed to parse saved category settings:', error);
        }
      }

      const savedProductSettings = localStorage.getItem('akeneo_product_settings');
      if (savedProductSettings) {
        try {
          const parsedSettings = JSON.parse(savedProductSettings);
          setProductSettings(parsedSettings);
        } catch (error) {
          console.warn('⚠️ Failed to parse saved product settings:', error);
        }
      }

      const savedAttributeSettings = localStorage.getItem('akeneo_attribute_settings');
      if (savedAttributeSettings) {
        try {
          const parsedSettings = JSON.parse(savedAttributeSettings);
          setAttributeSettings(parsedSettings);
        } catch (error) {
          console.warn('⚠️ Failed to parse saved attribute settings:', error);
        }
      }

      const savedCustomMappings = localStorage.getItem('akeneo_custom_mappings');
      if (savedCustomMappings) {
        try {
          const parsedMappings = JSON.parse(savedCustomMappings);
          setCustomMappings(parsedMappings);
        } catch (error) {
          console.warn('⚠️ Failed to parse saved custom mappings:', error);
        }
      }

      // Load saved import results
      loadImportResults();
      
      await loadConfigStatus();
      await loadLocales();
      await loadStats();
    };
    
    loadData();
  }, []);

  // Load families on component mount (from local database)
  useEffect(() => {
    console.log('🚀 AkeneoIntegration component mounted, loading families...');
    loadFamiliesForFilter();
  }, []);

  // Load additional data when connection becomes successful
  useEffect(() => {
    if (connectionStatus?.success) {
      console.log('✅ Connection successful, reloading families and other data...');
      loadSchedules();
      loadChannels();
      loadFamiliesForFilter(); // Reload to get Akeneo families if available
      loadAvailableCategories();
    }
  }, [connectionStatus?.success]);

  // Save selections to localStorage when they change
  useEffect(() => {
    if (selectedRootCategories.length > 0) {
      localStorage.setItem('akeneo_selected_categories', JSON.stringify(selectedRootCategories));
    } else {
      localStorage.removeItem('akeneo_selected_categories');
    }
  }, [selectedRootCategories]);

  useEffect(() => {
    if (selectedFamilies.length > 0) {
      localStorage.setItem('akeneo_selected_families', JSON.stringify(selectedFamilies));
    } else {
      localStorage.removeItem('akeneo_selected_families');
    }
  }, [selectedFamilies]);

  // Save advanced settings to localStorage
  useEffect(() => {
    localStorage.setItem('akeneo_category_settings', JSON.stringify(categorySettings));
  }, [categorySettings]);

  useEffect(() => {
    localStorage.setItem('akeneo_product_settings', JSON.stringify(productSettings));
  }, [productSettings]);

  useEffect(() => {
    localStorage.setItem('akeneo_attribute_settings', JSON.stringify(attributeSettings));
  }, [attributeSettings]);

  useEffect(() => {
    localStorage.setItem('akeneo_custom_mappings', JSON.stringify(customMappings));
  }, [customMappings]);

  const loadConfigStatus = async () => {
    try {
      console.log('🔄 Loading Akeneo configuration status...');
      
      // Get store_id from localStorage
      const storeId = localStorage.getItem('selectedStoreId');
      console.log('🏪 Store ID:', storeId);
      
      if (!storeId) {
        console.warn('⚠️ No store selected, skipping config status load');
        return;
      }

      setLoading(true);
      const response = await apiClient.get('/integrations/akeneo/config-status', {
        'x-store-id': storeId
      });
      
      console.log('📥 Config status response:', response);
      
      // Handle different response structures
      const responseData = response.data || response;
      console.log('📋 Response data:', responseData);
      
      if (responseData.success && responseData.config) {
        console.log('✅ Config found, updating state with:', responseData.config);
        setConfig(prev => ({
          ...prev,
          ...responseData.config
        }));
        
        // Set last import dates if available
        if (responseData.config.lastImportDates) {
          setLastImportDates(responseData.config.lastImportDates);
          console.log('📅 Loaded last import dates:', responseData.config.lastImportDates);
        }
        
        // If we have a complete configuration, set configSaved to true
        const loadedConfig = responseData.config;
        if (loadedConfig.baseUrl && loadedConfig.clientId && loadedConfig.clientSecret && 
            loadedConfig.username && loadedConfig.password) {
          setConfigSaved(true);
          console.log('✅ Configuration marked as saved');
          
          // Auto-test connection if config is loaded and appears complete
          if (loadedConfig.clientSecret !== '' && loadedConfig.password !== '') {
            console.log('💡 Complete configuration loaded, you may want to test the connection');
          }
        } else {
          console.log('⚠️ Incomplete configuration loaded');
        }
      } else {
        console.log('⚠️ No valid config found in response');
      }
    } catch (error) {
      console.error('❌ Failed to load config status:', error);
      // Check if it's a specific API error
      if (error.status) {
        console.error('📊 Error details:', {
          status: error.status,
          message: error.message,
          data: error.data
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadLocales = async () => {
    try {
      const response = await apiClient.get('/integrations/akeneo/locales');
      
      // Handle both wrapped and direct response formats
      const responseData = response.data || response;
      
      if (responseData?.success) {
        setLocales(responseData.locales);
      }
    } catch (error) {
      console.error('Failed to load locales:', error);
    }
  };

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
    setConfigSaved(false); // Reset saved status when config changes
    setConnectionStatus(null); // Reset connection status when config changes
    localStorage.removeItem('akeneo_connection_status'); // Clear saved connection status
  };

  const testConnection = async () => {
    console.log('🔌 Test Connection button clicked!');
    console.log('🔌 Starting connection test...');
    console.log('📋 Current config:', { 
      baseUrl: config.baseUrl, 
      clientId: config.clientId, 
      username: config.username,
      hasClientSecret: !!config.clientSecret,
      hasPassword: !!config.password,
      clientSecretPlaceholder: config.clientSecret === '••••••••',
      passwordPlaceholder: config.password === '••••••••'
    });

    // Check if we have placeholder values - if so, we need actual values
    if (!config.baseUrl || !config.clientId || !config.clientSecret || !config.username || !config.password) {
      console.error('❌ Missing configuration fields');
      toast.error('Please fill in all configuration fields');
      return;
    }

    // Check if we have placeholder values - we can still test if config is saved
    const hasPlaceholders = config.clientSecret === '••••••••' || config.password === '••••••••';
    
    if (hasPlaceholders && !configSaved) {
      console.error('❌ Placeholder values detected but config not saved');
      toast.error('Please enter your actual Client Secret and Password to test the connection');
      return;
    }
    
    if (hasPlaceholders && configSaved) {
      console.log('ℹ️ Using saved configuration with placeholder values - will use stored credentials');
    }

    // Get store_id from localStorage
    const storeId = localStorage.getItem('selectedStoreId');
    console.log('🏪 Using store ID:', storeId);
    
    if (!storeId) {
      console.error('❌ No store selected');
      toast.error('No store selected. Please select a store first.');
      return;
    }

    setTesting(true);
    setConnectionStatus(null);

    try {
      console.log('📡 Making API call to test-connection...');
      
      // Prepare the request payload
      let requestPayload;
      if (hasPlaceholders && configSaved) {
        // Send empty body to trigger stored config usage
        requestPayload = {};
        console.log('🔒 Using stored configuration from database');
      } else {
        // Send full config
        requestPayload = config;
        console.log('📋 Using provided configuration for test');
      }
      
      const response = await apiClient.post('/integrations/akeneo/test-connection', requestPayload, {
        'x-store-id': storeId
      });
      
      console.log('📥 Test connection response:', response);
      
      // Handle different response structures
      const responseData = response.data || response;
      console.log('📋 Response data:', responseData);
      
      const success = responseData.success;
      const message = responseData.message || 'Connection test completed';
      
      if (success) {
        console.log('✅ Connection successful');
        const successStatus = { success: true, message };
        setConnectionStatus(successStatus);
        localStorage.setItem('akeneo_connection_status', JSON.stringify(successStatus));
        toast.success('Connection successful!');
      } else {
        console.log('❌ Connection failed:', message);
        const failureStatus = { success: false, message };
        setConnectionStatus(failureStatus);
        localStorage.setItem('akeneo_connection_status', JSON.stringify(failureStatus));
        toast.error('Connection failed');
      }
    } catch (error) {
      console.error('❌ Connection test error:', error);
      console.error('📊 Error details:', {
        status: error.status,
        message: error.message,
        response: error.response?.data
      });
      
      const message = error.response?.data?.error || error.response?.data?.message || error.message;
      const errorStatus = { success: false, message };
      setConnectionStatus(errorStatus);
      localStorage.setItem('akeneo_connection_status', JSON.stringify(errorStatus));
      toast.error(`Connection failed: ${message}`);
    } finally {
      console.log('🏁 Connection test completed');
      setTesting(false);
    }
  };

  const saveConfiguration = async () => {
    console.log('💾 Save Configuration button clicked!');
    if (!config.baseUrl || !config.clientId || !config.clientSecret || !config.username || !config.password) {
      toast.error('Please fill in all configuration fields');
      return;
    }

    if (config.clientSecret === '••••••••' || config.password === '••••••••') {
      toast.error('Please enter your actual Client Secret and Password to save the configuration');
      return;
    }

    // Get store_id from localStorage
    const storeId = localStorage.getItem('selectedStoreId');
    if (!storeId) {
      toast.error('No store selected. Please select a store first.');
      return;
    }

    setSaving(true);

    try {
      const response = await apiClient.post('/integrations/akeneo/save-config', config, {
        'x-store-id': storeId
      });
      
      // Handle different response structures
      const responseData = response.data || response;
      const success = responseData.success;
      const message = responseData.message || 'Configuration operation completed';
      
      if (success) {
        toast.success('Configuration saved successfully!');
        setConfigSaved(true);
        loadConfigStatus(); // Reload config status
      } else {
        toast.error(`Failed to save configuration: ${message}`);
      }
    } catch (error) {
      const message = error.response?.data?.error || error.response?.data?.message || error.message;
      toast.error(`Save failed: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  const importCategories = async () => {
    console.log('📦 Starting categories import...');
    console.log('🔗 Connection status:', connectionStatus);
    
    if (!connectionStatus?.success) {
      console.error('❌ Connection not tested or failed');
      toast.error('Please test the connection first');
      return;
    }

    // Validate that at least one category is selected
    if (selectedRootCategories.length === 0) {
      console.error('❌ No categories selected');
      toast.error('Please select at least 1 category to import');
      return;
    }

    // Get store_id from localStorage
    const storeId = localStorage.getItem('selectedStoreId');
    console.log('🏪 Using store ID:', storeId);
    
    if (!storeId) {
      console.error('❌ No store selected');
      toast.error('No store selected. Please select a store first.');
      return;
    }

    console.log('🔧 Import settings:', { dryRun, config });

    setImporting(true);
    setImportResults(null);

    try {
      console.log('📡 Making API call to import-categories...');
      
      // Prepare the request payload for import
      const hasPlaceholders = config.clientSecret === '••••••••' || config.password === '••••••••';
      let requestPayload;
      
      if (hasPlaceholders && configSaved) {
        // Use stored config for import
        requestPayload = { 
          dryRun,
          filters: {
            rootCategories: selectedRootCategories.length > 0 ? selectedRootCategories : undefined
          },
          settings: {
            hideFromMenu: categorySettings.hideFromMenu,
            setNewActive: categorySettings.setNewActive,
            preventUrlKeyOverride: categorySettings.preventUrlKeyOverride,
            akeneoUrlField: categorySettings.akeneoUrlField
          }
        };
        console.log('🔒 Using stored configuration for import');
      } else {
        // Use provided config
        requestPayload = { 
          ...config, 
          dryRun,
          filters: {
            rootCategories: selectedRootCategories.length > 0 ? selectedRootCategories : undefined
          },
          settings: {
            hideFromMenu: categorySettings.hideFromMenu,
            setNewActive: categorySettings.setNewActive,
            preventUrlKeyOverride: categorySettings.preventUrlKeyOverride,
            akeneoUrlField: categorySettings.akeneoUrlField
          }
        };
        console.log('📋 Using provided configuration for import');
      }
      
      console.log('🎯 Selected root categories for import:', selectedRootCategories);
      
      const response = await apiClient.post('/integrations/akeneo/import-categories', requestPayload, {
        'x-store-id': storeId
      });

      console.log('📥 Import categories response:', response);
      
      const responseData = response.data || response;
      setTabImportResults('categories', responseData);
      
      if (responseData.success) {
        console.log('✅ Categories import successful');
        const stats = responseData.stats;
        toast.success(`Categories import completed! ${stats?.imported || 0} categories imported`);
        // Reload stats and config to reflect changes
        await loadStats();
        await loadConfigStatus();
      } else {
        console.log('❌ Categories import failed:', responseData.error);
        toast.error(`Categories import failed: ${responseData.error}`);
      }
    } catch (error) {
      console.error('❌ Categories import error:', error);
      console.error('📊 Error details:', {
        status: error.status,
        message: error.message,
        response: error.response?.data
      });
      
      const message = error.response?.data?.error || error.response?.data?.message || error.message;
      setImportResults({ success: false, error: message });
      toast.error(`Import failed: ${message}`);
    } finally {
      console.log('🏁 Categories import completed');
      setImporting(false);
    }
  };

  const importAttributes = async () => {
    console.log('📦 Starting attributes import...');
    
    if (!connectionStatus?.success) {
      console.error('❌ Connection not tested or failed');
      toast.error('Please test the connection first');
      return;
    }

    // Get store_id from localStorage
    const storeId = localStorage.getItem('selectedStoreId');
    console.log('🏪 Using store ID:', storeId);
    
    if (!storeId) {
      console.error('❌ No store selected');
      toast.error('No store selected. Please select a store first.');
      return;
    }

    setImporting(true);
    setImportResults(null);

    try {
      console.log('📡 Making API call to import-attributes...');
      
      // Prepare the request payload for import
      const hasPlaceholders = config.clientSecret === '••••••••' || config.password === '••••••••';
      let requestPayload;
      
      if (hasPlaceholders && configSaved) {
        // Use stored config for import with attribute settings
        requestPayload = { 
          dryRun,
          filters: {
            families: attributeSettings.selectedFamilies.length > 0 ? attributeSettings.selectedFamilies : undefined,
            updatedSince: attributeSettings.updatedInterval
          },
          settings: attributeSettings
        };
        console.log('🔒 Using stored configuration for import');
      } else {
        // Use provided config with attribute settings
        requestPayload = { 
          ...config, 
          dryRun,
          filters: {
            families: attributeSettings.selectedFamilies.length > 0 ? attributeSettings.selectedFamilies : undefined,
            updatedSince: attributeSettings.updatedInterval
          },
          settings: attributeSettings
        };
        console.log('📋 Using provided configuration for import');
      }

      console.log('🎯 Attribute import settings:', requestPayload);
      
      const response = await apiClient.post('/integrations/akeneo/import-attributes', requestPayload, {
        'x-store-id': storeId
      });

      console.log('📥 Import attributes response:', response);
      
      const responseData = response.data || response;
      setTabImportResults('attributes', responseData);
      
      if (responseData.success) {
        console.log('✅ Attributes import successful');
        const stats = responseData.stats;
        toast.success(`Attributes import completed! ${stats?.imported || 0} attributes imported`);
        // Reload stats and config to reflect changes
        await loadStats();
        await loadConfigStatus();
      } else {
        console.log('❌ Attributes import failed:', responseData.error);
        toast.error(`Attributes import failed: ${responseData.error}`);
      }
    } catch (error) {
      console.error('❌ Attributes import error:', error);
      
      const message = error.response?.data?.error || error.response?.data?.message || error.message;
      setImportResults({ success: false, error: message });
      toast.error(`Import failed: ${message}`);
    } finally {
      console.log('🏁 Attributes import completed');
      setImporting(false);
    }
  };

  const importFamilies = async () => {
    console.log('📦 Starting families import...');
    
    if (!connectionStatus?.success) {
      console.error('❌ Connection not tested or failed');
      toast.error('Please test the connection first');
      return;
    }

    // Get store_id from localStorage
    const storeId = localStorage.getItem('selectedStoreId');
    console.log('🏪 Using store ID:', storeId);
    
    if (!storeId) {
      console.error('❌ No store selected');
      toast.error('No store selected. Please select a store first.');
      return;
    }

    console.log('🔧 Import settings:', { dryRun });

    setImporting(true);
    setImportResults(null);

    try {
      console.log('📡 Making API call to import-families...');
      
      // Prepare the request payload for import
      const hasPlaceholders = config.clientSecret === '••••••••' || config.password === '••••••••';
      let requestPayload;
      
      if (hasPlaceholders && configSaved) {
        // Use stored config for import
        requestPayload = { 
          dryRun,
          filters: {
            families: selectedFamiliesToImport.length > 0 ? selectedFamiliesToImport : undefined
          }
        };
        console.log('🔒 Using stored configuration for import');
      } else {
        // Use provided config
        requestPayload = { 
          ...config, 
          dryRun,
          filters: {
            families: selectedFamiliesToImport.length > 0 ? selectedFamiliesToImport : undefined
          }
        };
        console.log('📋 Using provided configuration for import');
      }
      
      console.log('🎯 Selected families for import:', selectedFamiliesToImport);
      
      const response = await apiClient.post('/integrations/akeneo/import-families', requestPayload, {
        'x-store-id': storeId
      });

      console.log('📥 Import families response:', response);
      
      const responseData = response.data || response;
      setTabImportResults('families', responseData);
      
      if (responseData.success) {
        console.log('✅ Families import successful');
        const stats = responseData.stats;
        toast.success(`Families import completed! ${stats?.imported || 0} families imported`);
        // Reload stats and config to reflect changes
        await loadStats();
        await loadConfigStatus();
      } else {
        console.log('❌ Families import failed:', responseData.error);
        toast.error(`Families import failed: ${responseData.error}`);
      }
    } catch (error) {
      console.error('❌ Families import error:', error);
      
      const message = error.response?.data?.error || error.response?.data?.message || error.message;
      setImportResults({ success: false, error: message });
      toast.error(`Import failed: ${message}`);
    } finally {
      console.log('🏁 Families import completed');
      setImporting(false);
    }
  };

  const importProducts = async () => {
    if (!connectionStatus?.success) {
      toast.error('Please test the connection first');
      return;
    }

    // Get store_id from localStorage
    const storeId = localStorage.getItem('selectedStoreId');
    if (!storeId) {
      toast.error('No store selected. Please select a store first.');
      return;
    }

    setImporting(true);
    setImportResults(null);

    try {
      const requestPayload = {
        ...config,
        dryRun,
        filters: {
          families: selectedFamilies.length > 0 ? selectedFamilies : undefined,
          completeness: productSettings.completeness,
          updatedSince: productSettings.updatedInterval,
          productModel: productSettings.productModel
        },
        settings: {
          mode: productSettings.mode,
          status: productSettings.status,
          includeImages: productSettings.includeImages,
          includeFiles: productSettings.includeFiles,
          stockFilter: productSettings.stockFilter,
          preventUrlKeyOverride: productSettings.preventUrlKeyOverride,
          akeneoUrlField: productSettings.akeneoUrlField
        },
        customMappings: customMappings
      };

      console.log('🎯 Product import settings:', requestPayload);

      const response = await apiClient.post('/integrations/akeneo/import-products', requestPayload, {
        'x-store-id': storeId
      });

      console.log('📥 Import products response:', response);
      console.log('📥 Import products response.data:', response.data);
      
      const responseData = response.data || response;
      console.log('📥 Final responseData:', responseData);
      console.log('📥 responseData.success:', responseData?.success);
      
      // Ensure responseData has the expected structure
      const finalResults = {
        success: responseData?.success ?? false,
        stats: responseData?.stats || {},
        message: responseData?.message || '',
        error: responseData?.error || '',
        ...responseData
      };
      
      console.log('📥 Final results to set:', finalResults);
      setTabImportResults('products', finalResults);
      
      if (responseData.success) {
        console.log('✅ Products import successful');
        const stats = responseData.stats;
        toast.success(`Products import completed! ${stats?.imported || 0} products imported`);
        // Reload stats and config to reflect changes
        await loadStats();
        await loadConfigStatus();
      } else {
        toast.error(`Products import failed: ${responseData.error}`);
      }
    } catch (error) {
      const message = error.response?.data?.error || error.response?.data?.message || error.message;
      setImportResults({ success: false, error: message });
      toast.error(`Import failed: ${message}`);
    } finally {
      setImporting(false);
    }
  };

  const importAll = async () => {
    if (!connectionStatus?.success) {
      toast.error('Please test the connection first');
      return;
    }

    // Get store_id from localStorage
    const storeId = localStorage.getItem('selectedStoreId');
    if (!storeId) {
      toast.error('No store selected. Please select a store first.');
      return;
    }

    setImporting(true);
    setImportResults(null);

    try {
      const response = await apiClient.post('/integrations/akeneo/import-all', {
        ...config,
        dryRun
      }, {
        'x-store-id': storeId
      });

      // Handle both wrapped and direct response formats
      const responseData = response.data || response;
      setImportResults(responseData);
      
      if (responseData?.success) {
        const categoryStats = responseData.results.categories.stats;
        const productStats = responseData.results.products.stats;
        toast.success(`Full import completed! ${categoryStats.imported} categories and ${productStats.imported} products imported`);
        // Reload stats and config to reflect changes
        await loadStats();
        await loadConfigStatus();
      } else {
        toast.error(`Import failed: ${responseData?.error || 'Unknown error'}`);
      }
    } catch (error) {
      const message = error.response?.data?.error || error.response?.data?.message || error.message;
      setImportResults({ success: false, error: message });
      toast.error(`Import failed: ${message}`);
    } finally {
      setImporting(false);
    }
  };

  const formatLastImportDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const renderConnectionStatus = () => {
    if (!connectionStatus) return null;

    return (
      <Alert className={connectionStatus.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
        {connectionStatus.success ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <AlertCircle className="h-4 w-4 text-red-600" />
        )}
        <AlertDescription className={connectionStatus.success ? 'text-green-800' : 'text-red-800'}>
          {connectionStatus.message}
        </AlertDescription>
      </Alert>
    );
  };

  // Render tab-specific import results
  const renderTabImportResults = (tabName) => {
    const tabResults = importResults[tabName];
    if (!tabResults) return null;

    return (
      <Alert className={(tabResults?.success ?? false) ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
        {(tabResults?.success ?? false) ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <AlertCircle className="h-4 w-4 text-red-600" />
        )}
        <AlertDescription className={(tabResults?.success ?? false) ? 'text-green-800' : 'text-red-800'}>
          {tabResults.message || tabResults.error}
          {tabResults.stats && (
            <div className="mt-2 text-sm">
              <p>Total: {tabResults.stats.total}, Imported: {tabResults.stats.imported}, Failed: {tabResults.stats.failed}</p>
              {tabResults.stats.duration && (
                <p>Duration: {tabResults.stats.duration}</p>
              )}
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  };

  const renderImportResults = () => {
    // This is kept for backward compatibility or general display
    const hasAnyResults = Object.values(importResults).some(result => result !== null);
    if (!hasAnyResults) return null;

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {(importResults?.success ?? false) ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            Import Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(importResults?.success ?? false) ? (
            <div className="space-y-4">
              {importResults.stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{importResults.stats.total}</div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{importResults.stats.imported}</div>
                    <div className="text-sm text-gray-600">Imported</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{importResults.stats.skipped}</div>
                    <div className="text-sm text-gray-600">Skipped</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{importResults.stats.failed}</div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                </div>
              )}
              
              {importResults.results && (
                <div className="space-y-3">
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Categories</h4>
                      <div className="text-sm space-y-1">
                        <div>Total: {importResults.results.categories.stats.total}</div>
                        <div>Imported: {importResults.results.categories.stats.imported}</div>
                        <div>Failed: {importResults.results.categories.stats.failed}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Products</h4>
                      <div className="text-sm space-y-1">
                        <div>Total: {importResults.results.products.stats.total}</div>
                        <div>Imported: {importResults.results.products.stats.imported}</div>
                        <div>Failed: {importResults.results.products.stats.failed}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {importResults.error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Akeneo PIM Integration</h1>
        <p className="text-gray-600">
          Import categories and products from your Akeneo PIM system into Catalyst.
        </p>
      </div>

      {/* Statistics Display */}
      {stats && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Current Import Statistics
            </CardTitle>
            <CardDescription>
              Current count of imported data in your store
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats?.attributes || 0}</div>
                <div className="text-sm text-blue-600">Attributes</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats?.families || 0}</div>
                <div className="text-sm text-green-600">Families</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats?.categories || 0}</div>
                <div className="text-sm text-purple-600">Categories</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats?.products || 0}</div>
                <div className="text-sm text-orange-600">Products</div>
              </div>
            </div>
            {loadingStats && (
              <div className="mt-4 text-center">
                <RefreshCw className="h-4 w-4 animate-spin mx-auto" />
                <span className="text-sm text-gray-500 ml-2">Updating statistics...</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="configuration" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="attributes" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Attributes
          </TabsTrigger>
          <TabsTrigger value="families" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Families
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Products
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Akeneo Configuration</CardTitle>
              <CardDescription>
                Configure your Akeneo PIM connection settings. Save your configuration first, then test the connection before importing data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="baseUrl">Base URL</Label>
                  <Input
                    id="baseUrl"
                    placeholder="https://your-akeneo.com"
                    value={config.baseUrl}
                    onChange={(e) => handleConfigChange('baseUrl', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    placeholder="Your client ID"
                    value={config.clientId}
                    onChange={(e) => handleConfigChange('clientId', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientSecret">Client Secret</Label>
                  <Input
                    id="clientSecret"
                    type="password"
                    placeholder="Your client secret"
                    value={config.clientSecret}
                    onChange={(e) => handleConfigChange('clientSecret', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="API username"
                    value={config.username}
                    onChange={(e) => handleConfigChange('username', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="API password"
                    value={config.password}
                    onChange={(e) => handleConfigChange('password', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="locale">Locale</Label>
                  <Select value={config.locale} onValueChange={(value) => handleConfigChange('locale', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select locale" />
                    </SelectTrigger>
                    <SelectContent>
                      {locales.map((locale) => (
                        <SelectItem key={locale.code} value={locale.code}>
                          {locale.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button 
                    onClick={loadConfigStatus} 
                    disabled={loading}
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    {loading ? 'Loading...' : 'Reload Settings'}
                  </Button>

                  <Button 
                    onClick={saveConfiguration} 
                    disabled={saving}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {saving ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Settings className="h-4 w-4" />
                    )}
                    {saving ? 'Saving...' : 'Save Configuration'}
                  </Button>

                  <Button 
                    onClick={testConnection} 
                    disabled={testing}
                    className="flex items-center gap-2"
                  >
                    {testing ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    {testing ? 'Testing...' : 'Test Connection'}
                  </Button>
                </div>

              </div>

              {renderConnectionStatus()}
              
              {configSaved && (
                <Alert className="border-blue-200 bg-blue-50 mt-4">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Configuration has been saved successfully. You can now test the connection or proceed with imports.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Scheduler Configuration */}
          {connectionStatus?.success && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Import Scheduler
                </CardTitle>
                <CardDescription>
                  Configure automated imports for different data types with filtering options.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Scheduled Imports</h3>
                  <Button 
                    onClick={() => setShowScheduleForm(!showScheduleForm)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Schedule
                  </Button>
                </div>

                {/* Schedule Form */}
                {showScheduleForm && (
                  <Card className="border-2 border-dashed border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Import Type</Label>
                          <Select 
                            value={scheduleForm.import_type} 
                            onValueChange={(value) => setScheduleForm(prev => ({ ...prev, import_type: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select import type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="attributes">Attributes</SelectItem>
                              <SelectItem value="families">Families</SelectItem>
                              <SelectItem value="categories">Categories</SelectItem>
                              <SelectItem value="products">Products</SelectItem>
                              <SelectItem value="all">All</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Schedule Type</Label>
                          <Select 
                            value={scheduleForm.schedule_type} 
                            onValueChange={(value) => setScheduleForm(prev => ({ ...prev, schedule_type: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select schedule type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="once">Once</SelectItem>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {scheduleForm.schedule_type === 'once' && (
                        <div className="space-y-2">
                          <Label>Schedule Date & Time</Label>
                          <Input
                            type="datetime-local"
                            value={scheduleForm.schedule_date}
                            onChange={(e) => setScheduleForm(prev => ({ ...prev, schedule_date: e.target.value }))}
                          />
                        </div>
                      )}

                      {scheduleForm.schedule_type !== 'once' && (
                        <div className="space-y-2">
                          <Label>
                            Time {scheduleForm.schedule_type === 'weekly' && '(e.g., MON-09:00)'}
                            {scheduleForm.schedule_type === 'monthly' && '(e.g., 1-09:00 for 1st of month)'}
                          </Label>
                          <Input
                            placeholder={
                              scheduleForm.schedule_type === 'daily' ? 'HH:MM (e.g., 09:00)' :
                              scheduleForm.schedule_type === 'weekly' ? 'DAY-HH:MM (e.g., MON-09:00)' :
                              'DD-HH:MM (e.g., 1-09:00)'
                            }
                            value={scheduleForm.schedule_time}
                            onChange={(e) => setScheduleForm(prev => ({ ...prev, schedule_time: e.target.value }))}
                          />
                        </div>
                      )}

                      {/* Filtering Options */}
                      <div className="space-y-4">
                        <Label className="text-base font-semibold">Filtering Options</Label>
                        
                        {/* Channels Filter */}
                        {channels.length > 0 && (
                          <div className="space-y-2">
                            <Label>Channels (leave empty for all)</Label>
                            <div className="flex flex-wrap gap-2">
                              {channels.map((channel) => (
                                <div key={channel.code} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`channel-${channel.code}`}
                                    checked={scheduleForm.filters.channels.includes(channel.code)}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setScheduleForm(prev => ({
                                        ...prev,
                                        filters: {
                                          ...prev.filters,
                                          channels: checked 
                                            ? [...prev.filters.channels, channel.code]
                                            : prev.filters.channels.filter(c => c !== channel.code)
                                        }
                                      }));
                                    }}
                                  />
                                  <Label htmlFor={`channel-${channel.code}`} className="text-sm">
                                    {channel.label}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Families Filter */}
                        {families.length > 0 && (
                          <div className="space-y-2">
                            <Label>Families (leave empty for all)</Label>
                            <MultiSelect
                              options={families.map(family => ({
                                value: family.name || family.id,
                                label: family.name || family.id
                              }))}
                              value={scheduleForm.filters.families}
                              onChange={(selectedFamilies) => {
                                setScheduleForm(prev => ({
                                  ...prev,
                                  filters: {
                                    ...prev.filters,
                                    families: selectedFamilies
                                  }
                                }));
                              }}
                              placeholder="Select families for scheduled import..."
                            />
                          </div>
                        )}

                        {/* Import Options */}
                        <div className="space-y-4">
                          <Label className="text-base font-semibold">Import Options</Label>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label>Locale</Label>
                              <Select 
                                value={scheduleForm.options.locale} 
                                onValueChange={(value) => setScheduleForm(prev => ({ 
                                  ...prev, 
                                  options: { ...prev.options, locale: value }
                                }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select locale" />
                                </SelectTrigger>
                                <SelectContent>
                                  {locales.map((locale) => (
                                    <SelectItem key={locale.code} value={locale.code}>
                                      {locale.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Batch Size</Label>
                              <Input
                                type="number"
                                min="1"
                                max="200"
                                placeholder="50"
                                value={scheduleForm.options.batchSize}
                                onChange={(e) => setScheduleForm(prev => ({ 
                                  ...prev, 
                                  options: { ...prev.options, batchSize: parseInt(e.target.value) || 50 }
                                }))}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="flex items-center space-x-2">
                                <Switch
                                  checked={scheduleForm.options.dryRun}
                                  onCheckedChange={(checked) => setScheduleForm(prev => ({ 
                                    ...prev, 
                                    options: { ...prev.options, dryRun: checked }
                                  }))}
                                />
                                <span>Dry Run</span>
                              </Label>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setShowScheduleForm(false);
                            setEditingSchedule(null);
                            setScheduleForm({
                              import_type: 'attributes',
                              schedule_type: 'once',
                              schedule_time: '',
                              schedule_date: '',
                              is_active: true,
                              filters: { channels: [], families: [], categoryIds: [], attributes: {} },
                              options: { locale: 'en_US', dryRun: false, batchSize: 50 }
                            });
                          }}
                        >
                          Cancel
                        </Button>
                        <Button onClick={saveSchedule}>
                          {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Schedules List */}
                <div className="space-y-2">
                  {loadingSchedules ? (
                    <div className="text-center py-4">
                      <RefreshCw className="h-4 w-4 animate-spin mx-auto" />
                      <span className="text-sm text-gray-500 ml-2">Loading schedules...</span>
                    </div>
                  ) : schedules.length > 0 ? (
                    schedules.map((schedule) => (
                      <Card key={schedule.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={schedule.is_active ? "default" : "secondary"}>
                                {schedule.import_type}
                              </Badge>
                              <span className="text-sm text-gray-600">
                                {schedule.schedule_type === 'once' 
                                  ? new Date(schedule.schedule_date).toLocaleString()
                                  : `${schedule.schedule_type} at ${schedule.schedule_time}`
                                }
                              </span>
                              {!schedule.is_active && (
                                <Badge variant="outline">Paused</Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {schedule.filters?.channels?.length > 0 && (
                                <span>Channels: {schedule.filters.channels.join(', ')} • </span>
                              )}
                              {schedule.filters?.families?.length > 0 && (
                                <span>Families: {schedule.filters.families.length} selected • </span>
                              )}
                              <span>Locale: {schedule.options?.locale || 'en_US'}</span>
                              {schedule.options?.dryRun && <span> • Dry Run</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingSchedule(schedule);
                                setScheduleForm({
                                  id: schedule.id,
                                  import_type: schedule.import_type,
                                  schedule_type: schedule.schedule_type,
                                  schedule_time: schedule.schedule_time || '',
                                  schedule_date: schedule.schedule_date || '',
                                  is_active: schedule.is_active,
                                  filters: schedule.filters || { channels: [], families: [], categoryIds: [], attributes: {} },
                                  options: schedule.options || { locale: 'en_US', dryRun: false, batchSize: 50 }
                                });
                                setShowScheduleForm(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteSchedule(schedule.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No scheduled imports configured</p>
                      <p className="text-sm">Click "Add Schedule" to create your first automated import</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="attributes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Import Attributes</span>
                {lastImportDates.attributes && (
                  <div className="flex items-center gap-2 text-sm font-normal text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Last import: {formatLastImportDate(lastImportDates.attributes)}</span>
                  </div>
                )}
              </CardTitle>
              <CardDescription>
                Import attribute definitions from Akeneo PIM. These define the properties and characteristics that can be assigned to products.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!connectionStatus?.success && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please test your connection first before importing attributes.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-center space-x-2">
                <Switch 
                  id="attributes-dry-run" 
                  checked={dryRun} 
                  onCheckedChange={handleDryRunChange}
                />
                <Label htmlFor="attributes-dry-run">Dry Run (Preview only)</Label>
              </div>

              {/* Advanced Attribute Settings */}
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-sm">Advanced Attribute Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Updated Interval (hours)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={attributeSettings.updatedInterval}
                      onChange={(e) => 
                        setAttributeSettings(prev => ({ ...prev, updatedInterval: parseInt(e.target.value) || 0 }))
                      }
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500">Only import attributes updated within this timeframe</p>
                  </div>

                  {families.length > 0 && (
                    <div className="space-y-2">
                      <Label>Families</Label>
                      <MultiSelect
                        options={families.map(family => ({
                          value: family.name || family.id,
                          label: family.name || family.id
                        }))}
                        value={attributeSettings.selectedFamilies}
                        onChange={(selectedFamilies) => 
                          setAttributeSettings(prev => ({ ...prev, selectedFamilies }))
                        }
                        placeholder="Select families to retrieve attributes from..."
                      />
                      <p className="text-xs text-gray-500">
                        {attributeSettings.selectedFamilies.length === 0 
                          ? 'Leave empty to import all attributes' 
                          : `${attributeSettings.selectedFamilies.length} families selected`
                        }
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex items-center gap-4">
                <Button 
                  onClick={importAttributes} 
                  disabled={importing || !connectionStatus?.success}
                  className="flex items-center gap-2"
                >
                  {importing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {importing ? 'Importing...' : 'Import Attributes'}
                </Button>
              </div>

              {renderTabImportResults('attributes')}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="families" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Import Families</span>
                {lastImportDates.families && (
                  <div className="flex items-center gap-2 text-sm font-normal text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Last import: {formatLastImportDate(lastImportDates.families)}</span>
                  </div>
                )}
              </CardTitle>
              <CardDescription>
                Import product families (attribute sets) from Akeneo PIM. Families define which attributes are available for different product types.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!connectionStatus?.success && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please test your connection first before importing families.
                  </AlertDescription>
                </Alert>
              )}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Make sure to import <strong>Attributes</strong> first, as families depend on attributes being available in the system.
                </AlertDescription>
              </Alert>

              {/* Families Selection */}
              {loadingFamilies ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Loading families from Akeneo...
                </div>
              ) : families.length > 0 ? (
                <div className="space-y-2">
                  <Label>Select Families to Import</Label>
                  <MultiSelect
                    options={families.map(family => ({
                      value: family.code || family.name || family.id,
                      label: family.code || family.name || family.id
                    }))}
                    value={selectedFamiliesToImport}
                    onChange={setSelectedFamiliesToImport}
                    placeholder="Select specific families..."
                    searchPlaceholder="Search families..."
                    emptyText="No families found"
                  />
                  <p className="text-xs text-gray-500">
                    {selectedFamiliesToImport.length === 0 
                      ? 'All families will be imported' 
                      : `${selectedFamiliesToImport.length} families selected`
                    }
                  </p>
                </div>
              ) : connectionStatus?.success ? (
                <div className="text-sm text-gray-500">
                  No families found in Akeneo or connection failed
                </div>
              ) : null}

              <div className="flex items-center space-x-2">
                <Switch 
                  id="families-dry-run" 
                  checked={dryRun} 
                  onCheckedChange={handleDryRunChange}
                />
                <Label htmlFor="families-dry-run">Dry Run (Preview only)</Label>
              </div>

              <div className="flex items-center gap-4">
                <Button 
                  onClick={importFamilies} 
                  disabled={importing || !connectionStatus?.success}
                  className="flex items-center gap-2"
                >
                  {importing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {importing ? 'Importing...' : 'Import Families'}
                </Button>
              </div>

              {renderTabImportResults('families')}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Import Categories</span>
                {lastImportDates.categories && (
                  <div className="flex items-center gap-2 text-sm font-normal text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Last import: {formatLastImportDate(lastImportDates.categories)}</span>
                  </div>
                )}
              </CardTitle>
              <CardDescription>
                Import category data from Akeneo PIM
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Categories will be imported with their hierarchical structure. Parent categories are created first.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="root-categories">Root Categories to Import (Optional)</Label>
                  <div className="mt-2">
                    {loadingCategories ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Loading categories...
                      </div>
                    ) : availableCategories.length > 0 ? (
                      <div className="space-y-2">
                        <MultiSelect
                          options={availableCategories.map(category => ({
                            value: category.code,
                            label: `${category.labels?.en_US || category.labels?.en || category.code} (${category.code})`
                          }))}
                          value={selectedRootCategories}
                          onChange={setSelectedRootCategories}
                          placeholder="Select categories to import (at least 1 required)..."
                          className={selectedRootCategories.length === 0 ? "border-red-300" : ""}
                        />
                        <div className="flex items-center justify-between">
                          <p className={`text-xs ${selectedRootCategories.length === 0 ? 'text-red-500' : 'text-gray-500'}`}>
                            {selectedRootCategories.length === 0 
                              ? '⚠️ Please select at least 1 category to import' 
                              : `${selectedRootCategories.length} categories selected`
                            }
                          </p>
                          {selectedRootCategories.length > 0 && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setSelectedRootCategories([])}
                            >
                              Clear Selection
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 p-3 border rounded-md space-y-2">
                        <p>No root categories available. Make sure:</p>
                        <ul className="text-xs ml-4 list-disc space-y-1">
                          <li>Connection has been tested successfully</li>
                          <li>Akeneo configuration is saved</li>
                          <li>Your Akeneo user has category read permissions</li>
                        </ul>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={loadAvailableCategories}
                          disabled={loadingCategories || !connectionStatus?.success}
                          className="mt-2"
                        >
                          {loadingCategories ? (
                            <>
                              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Try Loading Categories
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch 
                    id="categories-dry-run" 
                    checked={dryRun} 
                    onCheckedChange={handleDryRunChange}
                  />
                  <Label htmlFor="categories-dry-run">Dry Run (Preview only)</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                      id="prevent-category-url-override"
                      checked={categorySettings.preventUrlKeyOverride}
                      onCheckedChange={(checked) =>
                          setCategorySettings(prev => ({ ...prev, preventUrlKeyOverride: checked }))
                      }
                  />
                  <div>
                    <Label htmlFor="prevent-category-url-override">Prevent URL key override</Label>
                    <p className="text-sm text-muted-foreground">
                      Keep existing category URL slugs unchanged during import
                    </p>
                  </div>
                </div>

                {!categorySettings.preventUrlKeyOverride && (
                  <div className="space-y-2">
                    <Label htmlFor="category-akeneo-url-field">Akeneo URL field name</Label>
                    <Input
                      id="category-akeneo-url-field"
                      placeholder="e.g., url_key, slug, seo_url"
                      value={categorySettings.akeneoUrlField}
                      onChange={(e) => 
                        setCategorySettings(prev => ({ ...prev, akeneoUrlField: e.target.value }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Akeneo field to use for generating category URLs (leave empty to use category name)
                    </p>
                  </div>
                )}

                {/* Advanced Category Settings */}
                <Card className="bg-gray-50">
                  <CardHeader>
                    <CardTitle className="text-sm">Advanced Category Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="hide-from-menu"
                        checked={categorySettings.hideFromMenu}
                        onCheckedChange={(checked) => 
                          setCategorySettings(prev => ({ ...prev, hideFromMenu: checked }))
                        }
                      />
                      <Label htmlFor="hide-from-menu">Hide from menu</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="set-new-active"
                        checked={categorySettings.setNewActive}
                        onCheckedChange={(checked) => 
                          setCategorySettings(prev => ({ ...prev, setNewActive: checked }))
                        }
                      />
                      <Label htmlFor="set-new-active">Set new categories as active</Label>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex items-center gap-4">
                  <Button 
                    onClick={importCategories} 
                    disabled={importing || !connectionStatus?.success || selectedRootCategories.length === 0}
                    className="flex items-center gap-2"
                  >
                    {importing ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {importing ? 'Importing...' : 'Import Categories'}
                  </Button>

                  {availableCategories.length > 0 && !loadingCategories && (
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={loadAvailableCategories}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Refresh Categories
                    </Button>
                  )}
                </div>
              </div>

              {renderTabImportResults('categories')}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Import Products</span>
                {lastImportDates.products && (
                  <div className="flex items-center gap-2 text-sm font-normal text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Last import: {formatLastImportDate(lastImportDates.products)}</span>
                  </div>
                )}
              </CardTitle>
              <CardDescription>
                Import product data from Akeneo PIM
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Products will be imported with their attributes, images, and category assignments. Make sure to import categories first.
                </AlertDescription>
              </Alert>

              <div className="flex items-center space-x-2">
                <Switch 
                  id="products-dry-run" 
                  checked={dryRun} 
                  onCheckedChange={handleDryRunChange}
                />
                <Label htmlFor="products-dry-run">Dry Run (Preview only)</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="prevent-product-url-override"
                  checked={productSettings.preventUrlKeyOverride}
                  onCheckedChange={(checked) => 
                    setProductSettings(prev => ({ ...prev, preventUrlKeyOverride: checked }))
                  }
                />
                <div className="space-y-1">
                  <Label htmlFor="prevent-product-url-override">Prevent URL key override</Label>
                  <p className="text-sm text-muted-foreground">
                    Keep existing product URL slugs unchanged during import
                  </p>
                </div>
              </div>

              {!productSettings.preventUrlKeyOverride && (
                <div className="space-y-2">
                  <Label htmlFor="product-akeneo-url-field">Akeneo URL field name</Label>
                  <Input
                    id="product-akeneo-url-field"
                    placeholder="e.g., url_key, slug, seo_url"
                    value={productSettings.akeneoUrlField}
                    onChange={(e) => 
                      setProductSettings(prev => ({ ...prev, akeneoUrlField: e.target.value }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Akeneo field to use for generating product URLs (leave empty to use product name)
                  </p>
                </div>
              )}

              {/* Advanced Product Settings */}
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-sm">Advanced Product Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Group 1: Mode, Status, Stock Filter */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Mode Selection */}
                    <div className="space-y-2">
                      <Label>Mode</Label>
                      <Select
                        value={productSettings.mode}
                        onValueChange={(value) => 
                          setProductSettings(prev => ({ ...prev, mode: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="advanced">Advanced (JSON)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={productSettings.status}
                        onValueChange={(value) => 
                          setProductSettings(prev => ({ ...prev, status: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="enabled">Enabled</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Stock Filter Setting */}
                    <div className="space-y-2">
                      <Label>Stock Filter</Label>
                      <Select
                        value={productSettings.stockFilter}
                        onValueChange={(value) => 
                          setProductSettings(prev => ({ ...prev, stockFilter: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="disabled">Disabled (no stock filtering)</SelectItem>
                          <SelectItem value="in_stock">In Stock</SelectItem>
                          <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">Filter products from Akeneo based on their stock status</p>
                    </div>
                  </div>

                  {/* Group 2: Updated Interval, Product Completeness, Product Model */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Updated Interval */}
                    <div className="space-y-2">
                      <Label>Updated Interval (hours)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={productSettings.updatedInterval}
                        onChange={(e) => 
                          setProductSettings(prev => ({ ...prev, updatedInterval: parseInt(e.target.value) || 0 }))
                        }
                        placeholder="0"
                      />
                      <p className="text-xs text-gray-500">Only import products updated within this timeframe</p>
                    </div>

                    {/* Product Completeness */}
                    <div className="space-y-2">
                      <Label>Product Completeness (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={productSettings.completeness}
                        onChange={(e) => 
                          setProductSettings(prev => ({ ...prev, completeness: parseInt(e.target.value) || 0 }))
                        }
                        placeholder="0-100"
                      />
                      <p className="text-xs text-gray-500">Minimum completeness percentage required</p>
                    </div>

                    {/* Product Model */}
                    <div className="space-y-2">
                      <Label>Product Model</Label>
                      <Select
                        value={productSettings.productModel}
                        onValueChange={(value) => 
                          setProductSettings(prev => ({ ...prev, productModel: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="at_least_one">At least 1 variant</SelectItem>
                          <SelectItem value="all_variants_complete">All variants complete</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">Requirement for product model variants</p>
                    </div>
                  </div>

                  {/* Group 3: Families Selection */}
                  {families.length > 0 && (
                    <div className="space-y-2">
                      <Label>Families</Label>
                      <MultiSelect
                        options={families.map(family => ({
                          value: family.name || family.id,
                          label: family.name || family.id
                        }))}
                        value={selectedFamilies}
                        onChange={setSelectedFamilies}
                        placeholder="Select families to retrieve products from..."
                      />
                      <p className="text-xs text-gray-500">
                        {selectedFamilies.length === 0 
                          ? 'If empty, you may not have families in Akeneo or credentials are wrong' 
                          : `${selectedFamilies.length} families selected`
                        }
                      </p>
                    </div>
                  )}

                  {/* Media Settings */}
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-medium">Media Settings</h4>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Images</Label>
                        <p className="text-xs text-gray-500">Include product images in import</p>
                      </div>
                      <Switch
                        checked={productSettings.includeImages}
                        onCheckedChange={(checked) => 
                          setProductSettings(prev => ({ ...prev, includeImages: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Files</Label>
                        <p className="text-xs text-gray-500">Include product files in import</p>
                      </div>
                      <Switch
                        checked={productSettings.includeFiles}
                        onCheckedChange={(checked) => 
                          setProductSettings(prev => ({ ...prev, includeFiles: checked }))
                        }
                      />
                    </div>

                  </div>

                  {/* Mapping Settings */}
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-medium">Custom Field Mapping</h4>
                    <p className="text-sm text-gray-600">Configure custom mappings between Akeneo and Catalyst fields</p>
                    
                    {/* Attribute Mapping */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Attribute Mapping</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addMapping('attributes')}
                          className="flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Add Mapping
                        </Button>
                      </div>
                      <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-3">
                        <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-600 mb-2">
                          <div className="col-span-1"></div>
                          <div className="col-span-4">Akeneo Field</div>
                          <div className="col-span-4">Catalyst Field</div>
                          <div className="col-span-2">Enabled</div>
                          <div className="col-span-1">Actions</div>
                        </div>
                        {customMappings?.attributes?.map((mapping, index) => (
                          <div key={index} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-1 text-xs text-gray-400">{index + 1}</div>
                            <div className="col-span-4">
                              <Input
                                size="sm"
                                value={mapping.akeneoField}
                                onChange={(e) => updateMapping('attributes', index, 'akeneoField', e.target.value)}
                                placeholder="name"
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="col-span-4">
                              <Input
                                size="sm"
                                value={mapping.catalystField}
                                onChange={(e) => updateMapping('attributes', index, 'catalystField', e.target.value)}
                                placeholder="product_name"
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="col-span-2">
                              <Switch
                                checked={mapping.enabled}
                                onCheckedChange={(checked) => updateMapping('attributes', index, 'enabled', checked)}
                              />
                            </div>
                            <div className="col-span-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMapping('attributes', index)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Image Mapping */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Image Mapping</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addMapping('images')}
                          className="flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Add Mapping
                        </Button>
                      </div>
                      <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-3">
                        <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-600 mb-2">
                          <div className="col-span-1"></div>
                          <div className="col-span-4">Akeneo Field</div>
                          <div className="col-span-4">Catalyst Field</div>
                          <div className="col-span-2">Enabled</div>
                          <div className="col-span-1">Actions</div>
                        </div>
                        {customMappings?.images?.map((mapping, index) => (
                          <div key={index} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-1 text-xs text-gray-400">{index + 1}</div>
                            <div className="col-span-4">
                              <Input
                                size="sm"
                                value={mapping.akeneoField}
                                onChange={(e) => updateMapping('images', index, 'akeneoField', e.target.value)}
                                placeholder="image"
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="col-span-4">
                              <Input
                                size="sm"
                                value={mapping.catalystField}
                                onChange={(e) => updateMapping('images', index, 'catalystField', e.target.value)}
                                placeholder="main_image"
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="col-span-2">
                              <Switch
                                checked={mapping.enabled}
                                onCheckedChange={(checked) => updateMapping('images', index, 'enabled', checked)}
                              />
                            </div>
                            <div className="col-span-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMapping('images', index)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Files Mapping */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Files Mapping</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addMapping('files')}
                          className="flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Add Mapping
                        </Button>
                      </div>
                      <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-3">
                        <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-600 mb-2">
                          <div className="col-span-1"></div>
                          <div className="col-span-4">Akeneo Field</div>
                          <div className="col-span-4">Catalyst Field</div>
                          <div className="col-span-2">Enabled</div>
                          <div className="col-span-1">Actions</div>
                        </div>
                        {customMappings?.files?.map((mapping, index) => (
                          <div key={index} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-1 text-xs text-gray-400">{index + 1}</div>
                            <div className="col-span-4">
                              <Input
                                size="sm"
                                value={mapping.akeneoField}
                                onChange={(e) => updateMapping('files', index, 'akeneoField', e.target.value)}
                                placeholder="attachments"
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="col-span-4">
                              <Input
                                size="sm"
                                value={mapping.catalystField}
                                onChange={(e) => updateMapping('files', index, 'catalystField', e.target.value)}
                                placeholder="files"
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="col-span-2">
                              <Switch
                                checked={mapping.enabled}
                                onCheckedChange={(checked) => updateMapping('files', index, 'enabled', checked)}
                              />
                            </div>
                            <div className="col-span-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMapping('files', index)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center gap-4">
                <Button 
                  onClick={importProducts} 
                  disabled={importing || !connectionStatus?.success}
                  className="flex items-center gap-2"
                >
                  {importing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {importing ? 'Importing...' : 'Import Products'}
                </Button>
              </div>

              {renderTabImportResults('products')}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AkeneoIntegration;