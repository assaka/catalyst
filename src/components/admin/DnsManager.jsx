import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Globe,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Settings,
  Zap,
  Database,
  Route,
  Key
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/api/client';

const DnsManager = ({ storeId, storeDomain }) => {
  const [domains, setDomains] = useState([]);
  const [dnsRecords, setDnsRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [cloudflareStatus, setCloudflareStatus] = useState(null);
  const [sslStatus, setSslStatus] = useState({});
  const [verificationStatus, setVerificationStatus] = useState({});
  const [copiedText, setCopiedText] = useState(null);

  useEffect(() => {
    loadDomainData();
    checkCloudflareIntegration();
  }, [storeId]);

  const loadDomainData = async () => {
    try {
      setLoading(true);
      
      // Load custom domains for the store
      const domainsResponse = await apiClient.get(`/stores/${storeId}/domains`);
      if (domainsResponse.data.success) {
        setDomains(domainsResponse.data.data);
      }

      // Load DNS records
      const dnsResponse = await apiClient.get(`/stores/${storeId}/dns-records`);
      if (dnsResponse.data.success) {
        setDnsRecords(dnsResponse.data.data);
      }

      // Load SSL status for domains
      const sslResponse = await apiClient.get(`/stores/${storeId}/ssl-status`);
      if (sslResponse.data.success) {
        setSslStatus(sslResponse.data.data);
      }
    } catch (error) {
      console.error('Load domain data error:', error);
      toast.error('Failed to load domain data');
    } finally {
      setLoading(false);
    }
  };

  const checkCloudflareIntegration = async () => {
    try {
      const response = await apiClient.get(`/stores/${storeId}/integrations/cloudflare/status`);
      if (response.data.success) {
        setCloudflareStatus(response.data.data);
      }
    } catch (error) {
      console.error('Cloudflare status error:', error);
    }
  };

  const addCustomDomain = async () => {
    if (!newDomain.trim()) {
      toast.error('Please enter a domain name');
      return;
    }

    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.([a-zA-Z]{2,})+$/;
    if (!domainRegex.test(newDomain.trim())) {
      toast.error('Please enter a valid domain name');
      return;
    }

    try {
      const response = await apiClient.post(`/stores/${storeId}/domains`, {
        domain: newDomain.trim().toLowerCase(),
        auto_setup_dns: cloudflareStatus?.connected || false,
        ssl_enabled: true
      });

      if (response.data.success) {
        toast.success('Custom domain added successfully');
        setNewDomain('');
        loadDomainData();
      }
    } catch (error) {
      console.error('Add domain error:', error);
      toast.error(error.response?.data?.error || 'Failed to add domain');
    }
  };

  const removeDomain = async (domainId) => {
    if (!confirm('Are you sure you want to remove this domain? This action cannot be undone.')) return;

    try {
      const response = await apiClient.delete(`/stores/${storeId}/domains/${domainId}`);
      
      if (response.data.success) {
        toast.success('Domain removed successfully');
        loadDomainData();
      }
    } catch (error) {
      console.error('Remove domain error:', error);
      toast.error('Failed to remove domain');
    }
  };

  const verifyDomain = async (domainId) => {
    try {
      const response = await apiClient.post(`/stores/${storeId}/domains/${domainId}/verify`);
      
      if (response.data.success) {
        toast.success('Domain verification initiated');
        loadDomainData();
      }
    } catch (error) {
      console.error('Verify domain error:', error);
      toast.error('Failed to verify domain');
    }
  };

  const setupSSL = async (domainId) => {
    try {
      const response = await apiClient.post(`/stores/${storeId}/domains/${domainId}/ssl/setup`);
      
      if (response.data.success) {
        toast.success('SSL setup initiated');
        loadDomainData();
      }
    } catch (error) {
      console.error('Setup SSL error:', error);
      toast.error('Failed to setup SSL');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedText(null), 2000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': 
      case 'verified':
      case 'valid': return 'text-green-600';
      case 'pending':
      case 'verifying': return 'text-yellow-600';
      case 'failed':
      case 'invalid': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
      case 'verified':
      case 'valid': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
      case 'verifying': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
      case 'invalid': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const requiredDnsRecords = [
    {
      type: 'A',
      name: '@',
      value: '76.76.19.23', // Example IP
      description: 'Points your root domain to our servers'
    },
    {
      type: 'CNAME',
      name: 'www',
      value: 'catalyst.pages.dev',
      description: 'Points www subdomain to our CDN'
    },
    {
      type: 'TXT',
      name: '_acme-challenge',
      value: 'verification-token-here',
      description: 'SSL certificate verification'
    }
  ];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="domains" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="domains">Custom Domains</TabsTrigger>
          <TabsTrigger value="dns">DNS Records</TabsTrigger>
          <TabsTrigger value="ssl">SSL Certificates</TabsTrigger>
        </TabsList>

        <TabsContent value="domains" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Domain Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current domain info */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-2">Current Store Domain</h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span className="font-mono">{storeDomain}</span>
                    <Badge variant="outline">Default</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(`https://${storeDomain}`, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Add new domain */}
              <div className="flex gap-2">
                <Input
                  placeholder="Enter your custom domain (e.g., shop.yourdomain.com)"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomDomain()}
                />
                <Button onClick={addCustomDomain} disabled={!newDomain.trim()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Domain
                </Button>
              </div>

              {/* Cloudflare integration status */}
              {cloudflareStatus && (
                <Alert className={cloudflareStatus.connected ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
                  <Zap className="w-4 h-4" />
                  <AlertDescription>
                    {cloudflareStatus.connected ? (
                      <>
                        <strong>Cloudflare Connected:</strong> DNS records will be managed automatically.
                      </>
                    ) : (
                      <>
                        <strong>Manual DNS Setup Required:</strong> You'll need to configure DNS records manually.
                        <Button variant="link" className="p-0 h-auto ml-2" onClick={() => {/* Navigate to integrations */}}>
                          Connect Cloudflare
                        </Button>
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Custom domains list */}
              <div className="space-y-3">
                <h4 className="font-medium">Custom Domains</h4>
                {domains.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No custom domains configured</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Add a custom domain to make your store accessible from your own domain
                    </p>
                  </div>
                ) : (
                  domains.map((domain) => (
                    <div key={domain.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getStatusIcon(domain.status)}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{domain.domain}</span>
                              <Badge variant={domain.is_primary ? 'default' : 'outline'}>
                                {domain.is_primary ? 'Primary' : 'Secondary'}
                              </Badge>
                              {domain.ssl_enabled && (
                                <Badge variant="outline" className="text-green-600">
                                  <Shield className="w-3 h-3 mr-1" />
                                  SSL
                                </Badge>
                              )}
                            </div>
                            <p className={`text-sm ${getStatusColor(domain.status)}`}>
                              Status: {domain.status}
                            </p>
                            <p className="text-xs text-gray-500">
                              Added: {new Date(domain.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {domain.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => verifyDomain(domain.id)}
                            >
                              <RefreshCw className="w-4 h-4 mr-1" />
                              Verify
                            </Button>
                          )}
                          
                          {domain.status === 'verified' && !domain.ssl_enabled && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setupSSL(domain.id)}
                            >
                              <Shield className="w-4 h-4 mr-1" />
                              Setup SSL
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(`https://${domain.domain}`, '_blank')}
                            disabled={domain.status !== 'active'}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeDomain(domain.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>DNS Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Route className="w-4 h-4" />
                <AlertDescription>
                  Configure these DNS records in your domain registrar's control panel to point your domain to our servers.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h4 className="font-medium">Required DNS Records</h4>
                {requiredDnsRecords.map((record, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{record.type}</Badge>
                          <span className="font-mono text-sm">{record.name}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{record.description}</p>
                        <div className="bg-gray-50 p-2 rounded font-mono text-sm">
                          {record.value}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(record.value)}
                      >
                        {copiedText === record.value ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Current DNS Status</h4>
                {dnsRecords.length === 0 ? (
                  <p className="text-sm text-gray-500">No DNS records found. Add a custom domain to see DNS status.</p>
                ) : (
                  dnsRecords.map((record, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(record.status)}
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{record.type}</Badge>
                            <span className="font-mono text-sm">{record.name}</span>
                          </div>
                          <p className="text-xs text-gray-500 font-mono">{record.value}</p>
                        </div>
                      </div>
                      <Badge variant={record.status === 'valid' ? 'default' : 'destructive'}>
                        {record.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>

              <Button
                variant="outline"
                onClick={loadDomainData}
                disabled={loading}
                className="w-full"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Check DNS Status
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ssl" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                SSL Certificates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Key className="w-4 h-4" />
                <AlertDescription>
                  SSL certificates are automatically issued and renewed for verified domains. This ensures secure HTTPS connections.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                {domains.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">
                    No domains configured. Add a custom domain to manage SSL certificates.
                  </p>
                ) : (
                  domains.map((domain) => {
                    const ssl = sslStatus[domain.domain];
                    
                    return (
                      <div key={domain.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <Shield className={`w-5 h-5 mt-0.5 ${ssl?.status === 'active' ? 'text-green-600' : 'text-gray-400'}`} />
                            <div>
                              <p className="font-medium">{domain.domain}</p>
                              <p className="text-sm text-gray-600">
                                Status: <span className={getStatusColor(ssl?.status || 'pending')}>
                                  {ssl?.status || 'pending'}
                                </span>
                              </p>
                              {ssl?.expires_at && (
                                <p className="text-xs text-gray-500">
                                  Expires: {new Date(ssl.expires_at).toLocaleDateString()}
                                </p>
                              )}
                              {ssl?.issuer && (
                                <p className="text-xs text-gray-500">
                                  Issued by: {ssl.issuer}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {ssl?.status === 'active' && (
                              <Badge variant="default" className="bg-green-600">
                                <Shield className="w-3 h-3 mr-1" />
                                Secure
                              </Badge>
                            )}
                            
                            {(!ssl || ssl.status === 'failed') && domain.status === 'verified' && (
                              <Button
                                size="sm"
                                onClick={() => setupSSL(domain.id)}
                              >
                                <Shield className="w-4 h-4 mr-1" />
                                Setup SSL
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DnsManager;