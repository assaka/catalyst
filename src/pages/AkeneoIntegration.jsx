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
import { AlertCircle, CheckCircle, RefreshCw, Download, Settings, Database, Package, Clock, Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { useStoreSlug } from '../hooks/useStoreSlug';
import apiClient from '../api/client';

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
  const [importResults, setImportResults] = useState(null);
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

  // Load families for filtering (using stats to get existing families)
  const loadFamiliesForFilter = async () => {
    try {
      const storeId = localStorage.getItem('selectedStoreId');
      if (!storeId) return;

      // For now, we'll load this from the database, but could be enhanced
      // to load directly from Akeneo
      const response = await apiClient.get('/attribute-sets', {
        'x-store-id': storeId,
        limit: 100
      });

      if (response.data?.success) {
        const familyData = response.data.data.attributes || [];
        setFamilies(familyData);
      }
    } catch (error) {
      console.error('Failed to load families:', error);
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
      
      await loadConfigStatus();
      await loadLocales();
      await loadStats();
    };
    
    loadData();
  }, []);

  // Load additional data when connection becomes successful
  useEffect(() => {
    if (connectionStatus?.success) {
      loadSchedules();
      loadChannels();
      loadFamiliesForFilter();
    }
  }, [connectionStatus?.success]);

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
      if (response.data.success) {
        setLocales(response.data.locales);
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
        requestPayload = { dryRun };
        console.log('🔒 Using stored configuration for import');
      } else {
        // Use provided config
        requestPayload = { ...config, dryRun };
        console.log('📋 Using provided configuration for import');
      }
      
      const response = await apiClient.post('/integrations/akeneo/import-categories', requestPayload, {
        'x-store-id': storeId
      });

      console.log('📥 Import categories response:', response);
      
      const responseData = response.data || response;
      setImportResults(responseData);
      
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

    console.log('🔧 Import settings:', { dryRun });

    setImporting(true);
    setImportResults(null);

    try {
      console.log('📡 Making API call to import-attributes...');
      
      // Prepare the request payload for import
      const hasPlaceholders = config.clientSecret === '••••••••' || config.password === '••••••••';
      let requestPayload;
      
      if (hasPlaceholders && configSaved) {
        // Use stored config for import
        requestPayload = { dryRun };
        console.log('🔒 Using stored configuration for import');
      } else {
        // Use provided config
        requestPayload = { ...config, dryRun };
        console.log('📋 Using provided configuration for import');
      }
      
      const response = await apiClient.post('/integrations/akeneo/import-attributes', requestPayload, {
        'x-store-id': storeId
      });

      console.log('📥 Import attributes response:', response);
      
      const responseData = response.data || response;
      setImportResults(responseData);
      
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
        requestPayload = { dryRun };
        console.log('🔒 Using stored configuration for import');
      } else {
        // Use provided config
        requestPayload = { ...config, dryRun };
        console.log('📋 Using provided configuration for import');
      }
      
      const response = await apiClient.post('/integrations/akeneo/import-families', requestPayload, {
        'x-store-id': storeId
      });

      console.log('📥 Import families response:', response);
      
      const responseData = response.data || response;
      setImportResults(responseData);
      
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
      const response = await apiClient.post('/integrations/akeneo/import-products', {
        ...config,
        dryRun
      }, {
        'x-store-id': storeId
      });

      setImportResults(response.data);
      
      if (response.data.success) {
        toast.success(`Products import completed! ${response.data.stats.imported} products imported`);
        // Reload stats and config to reflect changes
        await loadStats();
        await loadConfigStatus();
      } else {
        toast.error(`Products import failed: ${response.data.error}`);
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

      setImportResults(response.data);
      
      if (response.data.success) {
        const categoryStats = response.data.results.categories.stats;
        const productStats = response.data.results.products.stats;
        toast.success(`Full import completed! ${categoryStats.imported} categories and ${productStats.imported} products imported`);
        // Reload stats and config to reflect changes
        await loadStats();
        await loadConfigStatus();
      } else {
        toast.error(`Import failed: ${response.data.error}`);
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

  const renderImportResults = () => {
    if (!importResults) return null;

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {importResults.success ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            Import Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          {importResults.success ? (
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
                <div className="text-2xl font-bold text-blue-600">{stats.attributes}</div>
                <div className="text-sm text-blue-600">Attributes</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.families}</div>
                <div className="text-sm text-green-600">Families</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.categories}</div>
                <div className="text-sm text-purple-600">Categories</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.products}</div>
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

                <div className="flex items-center space-x-2">
                  <Switch
                    id="dry-run"
                    checked={dryRun}
                    onCheckedChange={handleDryRunChange}
                    disabled={false}
                  />
                  <Label htmlFor="dry-run" className="cursor-pointer">Dry Run</Label>
                  <span className="text-sm text-gray-500">
                    ({dryRun ? 'Preview only' : 'Live import'})
                  </span>
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
                            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                              {families.map((family) => (
                                <div key={family.id} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`family-${family.id}`}
                                    checked={scheduleForm.filters.families.includes(family.name)}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setScheduleForm(prev => ({
                                        ...prev,
                                        filters: {
                                          ...prev.filters,
                                          families: checked 
                                            ? [...prev.filters.families, family.name]
                                            : prev.filters.families.filter(f => f !== family.name)
                                        }
                                      }));
                                    }}
                                  />
                                  <Label htmlFor={`family-${family.id}`} className="text-sm">
                                    {family.name}
                                  </Label>
                                </div>
                              ))}
                            </div>
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

              {importResults && (
                <Alert className={importResults.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                  {importResults.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={importResults.success ? 'text-green-800' : 'text-red-800'}>
                    {importResults.message || importResults.error}
                    {importResults.stats && (
                      <div className="mt-2 text-sm">
                        <p>Total: {importResults.stats.total}, Imported: {importResults.stats.imported}, Failed: {importResults.stats.failed}</p>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
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

              {importResults && (
                <Alert className={importResults.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                  {importResults.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={importResults.success ? 'text-green-800' : 'text-red-800'}>
                    {importResults.message || importResults.error}
                    {importResults.stats && (
                      <div className="mt-2 text-sm">
                        <p>Total: {importResults.stats.total}, Imported: {importResults.stats.imported}, Failed: {importResults.stats.failed}</p>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
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

              <div className="flex items-center gap-4">
                <Button 
                  onClick={importCategories} 
                  disabled={importing || !connectionStatus?.success}
                  className="flex items-center gap-2"
                >
                  {importing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {importing ? 'Importing...' : 'Import Categories'}
                </Button>

                {dryRun && (
                  <Badge variant="outline">Dry Run Mode</Badge>
                )}
              </div>
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

                <Button 
                  onClick={importAll} 
                  disabled={importing || !connectionStatus?.success}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {importing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {importing ? 'Importing...' : 'Import All (Categories + Products)'}
                </Button>

                {dryRun && (
                  <Badge variant="outline">Dry Run Mode</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {renderImportResults()}
    </div>
  );
};

export default AkeneoIntegration;