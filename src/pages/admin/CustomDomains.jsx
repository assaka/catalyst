import React, { useState, useEffect } from 'react';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Globe,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  AlertTriangle,
  ExternalLink,
  Trash2,
  Star,
  Copy,
  RefreshCw,
  Info
} from 'lucide-react';
import apiClient from '@/api/client';
import { toast } from 'sonner';

const CustomDomains = () => {
  const { selectedStore } = useStoreSelection();
  const storeId = selectedStore?.id || localStorage.getItem('selectedStoreId');

  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [dnsDialogOpen, setDnsDialogOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [newDomain, setNewDomain] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [adding, setAdding] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Cloudflare integration state
  const [cloudflareConnected, setCloudflareConnected] = useState(false);
  const [cloudflareStatus, setCloudflareStatus] = useState(null);
  const [checkingCloudflare, setCheckingCloudflare] = useState(false);
  const [cloudflareZones, setCloudflareZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [subdomain, setSubdomain] = useState('www');
  const [provisioning, setProvisioning] = useState(false);
  const [setupMethod, setSetupMethod] = useState('manual'); // 'cloudflare' or 'manual'

  useEffect(() => {
    if (storeId && storeId !== 'undefined') {
      loadDomains();
      checkCloudflareConnection();
    }
  }, [storeId]);

  useEffect(() => {
    if (cloudflareConnected && addDialogOpen) {
      loadCloudflareZones();
      setSetupMethod('cloudflare'); // Auto-select Cloudflare if connected
    }
  }, [cloudflareConnected, addDialogOpen]);

  const loadDomains = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/custom-domains');
      if (response.success) {
        setDomains(response.domains || []);
      }
    } catch (error) {
      console.error('Error loading domains:', error);
      toast.error('Failed to load domains');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = async () => {
    if (!newDomain.trim()) {
      toast.error('Please enter a domain name');
      return;
    }

    // Basic domain validation
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    if (!domainRegex.test(newDomain.trim())) {
      toast.error('Please enter a valid domain name (e.g., shop.example.com)');
      return;
    }

    try {
      setAdding(true);
      const response = await apiClient.post('/custom-domains/add', {
        domain: newDomain.trim().toLowerCase(),
        isPrimary,
        verificationMethod: 'txt',
        sslProvider: 'letsencrypt'
      });

      if (response.success) {
        toast.success('Domain added successfully! Please configure DNS records.');
        setAddDialogOpen(false);
        setNewDomain('');
        setIsPrimary(false);
        loadDomains();

        // Show DNS instructions
        setSelectedDomain(response.domain);
        setDnsDialogOpen(true);
      }
    } catch (error) {
      console.error('Error adding domain:', error);
      toast.error(error.response?.data?.message || 'Failed to add domain');
    } finally {
      setAdding(false);
    }
  };

  const handleVerifyDomain = async (domainId) => {
    try {
      setVerifying(true);
      const response = await apiClient.post(`/custom-domains/${domainId}/verify`);

      if (response.success) {
        toast.success('Domain verified successfully!');
        loadDomains();
      } else {
        toast.error(response.message || 'Domain verification failed. Please check DNS records.');
      }
    } catch (error) {
      console.error('Error verifying domain:', error);
      toast.error(error.response?.data?.message || 'Failed to verify domain');
    } finally {
      setVerifying(false);
    }
  };

  const handleCheckDNS = async (domainId) => {
    try {
      const response = await apiClient.post(`/custom-domains/${domainId}/check-dns`);

      if (response.configured) {
        toast.success('All DNS records configured correctly!');
      } else {
        const missing = response.records.filter(r => !r.configured);
        toast.warning(`Missing ${missing.length} DNS record(s). Check details below.`);
      }

      // Show results
      console.log('DNS Check Results:', response.records);
    } catch (error) {
      console.error('Error checking DNS:', error);
      toast.error('Failed to check DNS configuration');
    }
  };

  const handleSetPrimary = async (domainId) => {
    try {
      const response = await apiClient.post(`/custom-domains/${domainId}/set-primary`);

      if (response.success) {
        toast.success('Primary domain updated!');
        loadDomains();
      }
    } catch (error) {
      console.error('Error setting primary domain:', error);
      toast.error(error.response?.data?.message || 'Failed to set primary domain');
    }
  };

  const handleRemoveDomain = async (domainId, domainName) => {
    if (!confirm(`Are you sure you want to remove ${domainName}?`)) {
      return;
    }

    try {
      const response = await apiClient.delete(`/custom-domains/${domainId}`);

      if (response.success) {
        toast.success('Domain removed successfully');
        loadDomains();
      }
    } catch (error) {
      console.error('Error removing domain:', error);
      toast.error(error.response?.data?.message || 'Failed to remove domain');
    }
  };

  const showDNSInstructions = (domain) => {
    setSelectedDomain(domain);
    setDnsDialogOpen(true);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const checkCloudflareConnection = async () => {
    try {
      setCheckingCloudflare(true);
      const response = await apiClient.get('/custom-domains/cloudflare-status');

      if (response.success) {
        setCloudflareConnected(response.connected);
        setCloudflareStatus(response);
      }
    } catch (error) {
      console.error('Error checking Cloudflare connection:', error);
      setCloudflareConnected(false);
    } finally {
      setCheckingCloudflare(false);
    }
  };

  const handleConnectCloudflare = async () => {
    try {
      const response = await apiClient.post('/cloudflare/oauth/authorize', {
        store_id: storeId
      });

      if (response.success) {
        // Redirect to Cloudflare OAuth
        window.location.href = response.auth_url;
      }
    } catch (error) {
      console.error('Error initiating Cloudflare connection:', error);
      toast.error('Failed to connect to Cloudflare. Please try again.');
    }
  };

  const loadCloudflareZones = async () => {
    try {
      const response = await apiClient.get(`/cloudflare/oauth/zones/${storeId}`);
      if (response.success) {
        setCloudflareZones(response.zones || []);
      }
    } catch (error) {
      console.error('Error loading Cloudflare zones:', error);
      toast.error('Failed to load Cloudflare zones');
    }
  };

  const handleCloudflareProvision = async () => {
    if (!selectedZone) {
      toast.error('Please select a Cloudflare zone');
      return;
    }

    const selectedZoneData = cloudflareZones.find(z => z.id === selectedZone);
    if (!selectedZoneData) {
      toast.error('Invalid zone selected');
      return;
    }

    try {
      setProvisioning(true);
      const response = await apiClient.post('/custom-domains/provision-cloudflare', {
        zone_id: selectedZone,
        domain: selectedZoneData.name,
        subdomain: subdomain === '@' ? null : subdomain,
        is_primary: isPrimary
      });

      if (response.success) {
        toast.success('Domain provisioned successfully! DNS configured automatically.');
        setAddDialogOpen(false);
        setSelectedZone('');
        setSubdomain('www');
        setIsPrimary(false);
        loadDomains();
      }
    } catch (error) {
      console.error('Error provisioning domain:', error);
      toast.error(error.response?.data?.message || 'Failed to provision domain');
    } finally {
      setProvisioning(false);
    }
  };

  const getStatusBadge = (domain) => {
    if (domain.verification_status === 'verified' && domain.ssl_status === 'active') {
      return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
    } else if (domain.verification_status === 'verified') {
      return <Badge className="bg-blue-500"><Clock className="w-3 h-3 mr-1" />SSL Pending</Badge>;
    } else if (domain.verification_status === 'pending') {
      return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    } else if (domain.verification_status === 'failed') {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
    }
    return <Badge variant="secondary">Unknown</Badge>;
  };

  const getSSLBadge = (sslStatus) => {
    switch (sslStatus) {
      case 'active':
        return <Badge className="bg-green-500"><Shield className="w-3 h-3 mr-1" />Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">Not Issued</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Globe className="w-8 h-8" />
            Custom Domains
          </h1>
          <p className="text-muted-foreground mt-1">
            Connect your own domain to your store
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Domain
        </Button>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Custom domains allow you to use your own domain name (e.g., shop.example.com) instead of the default subdomain.
          SSL certificates are automatically provisioned via Let's Encrypt.
        </AlertDescription>
      </Alert>

      {/* Cloudflare Integration Card */}
      <Card className={cloudflareConnected ? "border-green-200 bg-green-50" : "border-blue-200 bg-blue-50"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Cloudflare Integration {cloudflareConnected && <Badge className="bg-green-500 ml-2">Connected</Badge>}
          </CardTitle>
          <CardDescription>
            {cloudflareConnected
              ? 'Your Cloudflare account is connected. You can now auto-provision domains with one click!'
              : 'Connect your Cloudflare account to automatically configure DNS records'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {checkingCloudflare ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Checking connection...
            </div>
          ) : cloudflareConnected ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded-md border">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium">Cloudflare Connected</p>
                    <p className="text-sm text-muted-foreground">
                      Auto-provision domains with DNS configuration
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkCloudflareConnection}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
              {cloudflareStatus?.expired && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Your Cloudflare token has expired. Please reconnect your account.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium mb-1">Why connect Cloudflare?</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>✓ Auto-configure DNS records (no manual setup)</li>
                    <li>✓ Instant domain verification</li>
                    <li>✓ Free SSL certificates</li>
                    <li>✓ Global CDN included</li>
                  </ul>
                </div>
              </div>
              <Button onClick={handleConnectCloudflare} className="w-full">
                <Globe className="w-4 h-4 mr-2" />
                Connect Cloudflare Account
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Domains List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Domains</CardTitle>
          <CardDescription>
            Manage custom domains for your store. DNS changes may take 5-60 minutes to propagate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading domains...
            </div>
          ) : domains.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No custom domains configured yet.</p>
              <p className="text-sm mt-1">Click "Add Domain" to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>SSL</TableHead>
                  <TableHead>Primary</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains.map((domain) => (
                  <TableRow key={domain.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        {domain.domain}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(domain)}
                    </TableCell>
                    <TableCell>
                      {getSSLBadge(domain.ssl_status)}
                    </TableCell>
                    <TableCell>
                      {domain.is_primary && (
                        <Badge variant="secondary">
                          <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                          Primary
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {domain.verification_status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => showDNSInstructions(domain)}
                            >
                              DNS Setup
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCheckDNS(domain.id)}
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Check DNS
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleVerifyDomain(domain.id)}
                              disabled={verifying}
                            >
                              {verifying ? (
                                <>
                                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                  Verifying...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Verify
                                </>
                              )}
                            </Button>
                          </>
                        )}

                        {domain.verification_status === 'verified' && !domain.is_primary && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetPrimary(domain.id)}
                          >
                            <Star className="w-3 h-3 mr-1" />
                            Set Primary
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDomain(domain.id, domain.domain)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Domain Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Custom Domain</DialogTitle>
            <DialogDescription>
              Choose your setup method: automatic via Cloudflare or manual DNS configuration.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={setupMethod} onValueChange={setSetupMethod} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="cloudflare" disabled={!cloudflareConnected}>
                <Globe className="w-4 h-4 mr-2" />
                Cloudflare (Auto)
                {!cloudflareConnected && <Badge variant="outline" className="ml-2 text-xs">Not Connected</Badge>}
              </TabsTrigger>
              <TabsTrigger value="manual">
                <Info className="w-4 h-4 mr-2" />
                Manual Setup
              </TabsTrigger>
            </TabsList>

            {/* Cloudflare Auto-Provision Tab */}
            <TabsContent value="cloudflare" className="space-y-4 mt-4">
              {cloudflareZones.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading your Cloudflare zones...
                </div>
              ) : (
                <>
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      DNS records will be automatically configured via Cloudflare API. No manual setup required!
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="zone">Select Cloudflare Zone</Label>
                      <Select value={selectedZone} onValueChange={setSelectedZone}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose your domain from Cloudflare" />
                        </SelectTrigger>
                        <SelectContent>
                          {cloudflareZones.map((zone) => (
                            <SelectItem key={zone.id} value={zone.id}>
                              <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4" />
                                {zone.name}
                                {zone.status === 'active' && (
                                  <Badge className="bg-green-500 text-xs">Active</Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        {cloudflareZones.length} zone(s) available in your Cloudflare account
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subdomain">Subdomain (optional)</Label>
                      <Input
                        id="subdomain"
                        value={subdomain}
                        onChange={(e) => setSubdomain(e.target.value)}
                        placeholder="www"
                      />
                      <p className="text-sm text-muted-foreground">
                        Enter "www" for www.yourdomain.com or "@" for apex domain (yourdomain.com)
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="primary-cf"
                        checked={isPrimary}
                        onChange={(e) => setIsPrimary(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="primary-cf" className="cursor-pointer">
                        Set as primary domain
                      </Label>
                    </div>

                    {selectedZone && (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Will configure: <strong>{subdomain && subdomain !== '@' ? `${subdomain}.` : ''}{cloudflareZones.find(z => z.id === selectedZone)?.name}</strong>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </>
              )}
            </TabsContent>

            {/* Manual Setup Tab */}
            <TabsContent value="manual" className="space-y-4 mt-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  You'll need to manually configure DNS records with your domain provider after adding the domain.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain Name</Label>
                  <Input
                    id="domain"
                    placeholder="shop.example.com"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter your full domain (e.g., shop.example.com or www.example.com)
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="primary"
                    checked={isPrimary}
                    onChange={(e) => setIsPrimary(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="primary" className="cursor-pointer">
                    Set as primary domain
                  </Label>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            {setupMethod === 'cloudflare' ? (
              <Button onClick={handleCloudflareProvision} disabled={provisioning || !selectedZone}>
                {provisioning ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Provisioning...
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4 mr-2" />
                    Auto-Provision Domain
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleAddDomain} disabled={adding}>
                {adding ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Domain
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DNS Instructions Dialog */}
      <Dialog open={dnsDialogOpen} onOpenChange={setDnsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>DNS Configuration for {selectedDomain?.domain}</DialogTitle>
            <DialogDescription>
              Add these DNS records to your domain provider to verify ownership and enable your custom domain.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                DNS changes can take 5-60 minutes to propagate worldwide. After adding these records,
                click "Check DNS" to verify configuration, then "Verify" to complete setup.
              </AlertDescription>
            </Alert>

            <Tabs defaultValue="instructions">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="instructions">Step-by-Step</TabsTrigger>
                <TabsTrigger value="records">DNS Records</TabsTrigger>
              </TabsList>

              <TabsContent value="instructions" className="space-y-4">
                <div className="space-y-3">
                  <div className="border-l-4 border-blue-500 pl-4 py-2">
                    <h4 className="font-semibold">Step 1: Add CNAME Record</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      This points your domain to our platform
                    </p>
                    <div className="mt-2 p-3 bg-muted rounded-md font-mono text-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-blue-600">Type:</span> CNAME<br/>
                          <span className="text-blue-600">Name:</span> @ (or your subdomain)<br/>
                          <span className="text-blue-600">Value:</span> stores.catalyst.app<br/>
                          <span className="text-blue-600">TTL:</span> 3600
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard('stores.catalyst.app')}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="border-l-4 border-green-500 pl-4 py-2">
                    <h4 className="font-semibold">Step 2: Add TXT Record</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      This verifies you own the domain
                    </p>
                    <div className="mt-2 p-3 bg-muted rounded-md font-mono text-sm break-all">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <span className="text-blue-600">Type:</span> TXT<br/>
                          <span className="text-blue-600">Name:</span> _catalyst-verification<br/>
                          <span className="text-blue-600">Value:</span> {selectedDomain?.verification_token}<br/>
                          <span className="text-blue-600">TTL:</span> 300
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(selectedDomain?.verification_token)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="border-l-4 border-yellow-500 pl-4 py-2">
                    <h4 className="font-semibold">Step 3: Wait for Propagation</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      DNS changes take 5-60 minutes to propagate globally
                    </p>
                  </div>

                  <div className="border-l-4 border-purple-500 pl-4 py-2">
                    <h4 className="font-semibold">Step 4: Verify Domain</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Click "Check DNS" to verify records, then "Verify" to complete setup
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="records" className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>TTL</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-mono">CNAME</TableCell>
                      <TableCell className="font-mono">@</TableCell>
                      <TableCell className="font-mono">stores.catalyst.app</TableCell>
                      <TableCell className="font-mono">3600</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard('stores.catalyst.app')}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono">TXT</TableCell>
                      <TableCell className="font-mono">_catalyst-verification</TableCell>
                      <TableCell className="font-mono text-xs">{selectedDomain?.verification_token}</TableCell>
                      <TableCell className="font-mono">300</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(selectedDomain?.verification_token)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <Alert>
                  <ExternalLink className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-semibold">Common DNS Providers:</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <a href="https://dash.cloudflare.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Cloudflare →
                        </a>
                        <a href="https://www.namecheap.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Namecheap →
                        </a>
                        <a href="https://dcc.godaddy.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          GoDaddy →
                        </a>
                        <a href="https://domains.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Google Domains →
                        </a>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDnsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomDomains;
