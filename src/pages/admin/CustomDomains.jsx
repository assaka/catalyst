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
import { getStoreBaseUrl, getExternalStoreUrl } from '@/utils/urlUtils';

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
  const [checkingSSL, setCheckingSSL] = useState(false);

  useEffect(() => {
    if (storeId && storeId !== 'undefined') {
      loadDomains();
    }
  }, [storeId]);

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

  const handleDebugDNS = async (domainId) => {
    try {
      const response = await apiClient.get(`/custom-domains/${domainId}/debug-dns`);

      if (response.success) {
        console.log('=== DNS DEBUG REPORT ===');
        console.log('Domain:', response.debug.domain);
        console.log('\nExpected Records:');
        console.log(response.debug.expected_records);
        console.log('\nActual Records:');
        console.log(response.debug.actual_records);
        console.log('\nRecommendations:');
        console.log(response.recommendations);
        console.log('=====================');

        // Show recommendations as toast
        response.recommendations.forEach(rec => {
          if (rec.type === 'error') {
            toast.error(rec.message, { duration: 8000 });
          } else if (rec.type === 'warning') {
            toast.warning(rec.message, { duration: 6000 });
          } else {
            toast.success(rec.message, { duration: 4000 });
          }
        });

        // Create detailed alert
        const details = [
          `Domain: ${response.debug.domain}`,
          '',
          'DNS Records Found:',
          `  CNAME: ${response.debug.actual_records.cname?.found ? '✓ ' + response.debug.actual_records.cname.values.join(', ') : '✗ Not found'}`,
          `  TXT: ${response.debug.actual_records.txt?.found ? '✓ Found' : '✗ Not found'}`,
          `  TXT Match: ${response.debug.actual_records.txt?.matches_expected ? '✓ Correct' : '✗ Incorrect or missing'}`,
          '',
          'Can Verify: ' + (response.debug.can_verify ? '✓ YES' : '✗ NO')
        ].join('\n');

        alert('DNS Debug Report\n\n' + details + '\n\nCheck console for full details.');
      }
    } catch (error) {
      console.error('Error debugging DNS:', error);
      toast.error('Failed to debug DNS configuration');
    }
  };

  const handleCheckSSL = async (domainId) => {
    try {
      setCheckingSSL(true);
      const response = await apiClient.post(`/custom-domains/${domainId}/check-ssl`);

      if (response.success) {
        if (response.ssl_status === 'active') {
          toast.success('SSL certificate is active!');
        } else {
          toast.info(`SSL status: ${response.ssl_status}. Vercel is provisioning the certificate...`);
        }
        loadDomains();
      } else {
        toast.warning(response.message || 'SSL status check failed');
      }
    } catch (error) {
      console.error('Error checking SSL:', error);
      toast.error(error.response?.data?.message || 'Failed to check SSL status');
    } finally {
      setCheckingSSL(false);
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

  const getStoreUrl = (domain) => {
    // If domain is verified and SSL is active, show custom domain URL
    if (domain.verification_status === 'verified' && domain.ssl_status === 'active') {
      return `https://${domain.domain}`;
    }
    // Otherwise show the default platform URL with /public/storecode
    const storeCode = selectedStore?.code || selectedStore?.slug;
    if (!storeCode) {
      return 'Store code not available';
    }
    return getExternalStoreUrl(storeCode);
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

      {/* Current Store URL */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Store URL</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              {(() => {
                const primaryDomain = domains.find(d => d.is_primary && d.verification_status === 'verified' && d.ssl_status === 'active');
                const storeCode = selectedStore?.code || selectedStore?.slug;
                const currentUrl = primaryDomain
                  ? `https://${primaryDomain.domain}`
                  : storeCode ? getExternalStoreUrl(storeCode) : 'Store code not available';

                return (
                  <>
                    <a
                      href={currentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-mono text-lg flex items-center gap-2"
                    >
                      {currentUrl}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    {!primaryDomain && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Using default platform URL. Add a custom domain to use your own domain name.
                      </p>
                    )}
                    {primaryDomain && (
                      <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Using custom domain: {primaryDomain.domain}
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const primaryDomain = domains.find(d => d.is_primary && d.verification_status === 'verified' && d.ssl_status === 'active');
                const storeCode = selectedStore?.code || selectedStore?.slug;
                const currentUrl = primaryDomain
                  ? `https://${primaryDomain.domain}`
                  : storeCode ? getExternalStoreUrl(storeCode) : '';
                copyToClipboard(currentUrl);
              }}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy URL
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Custom domains allow you to use your own domain name (e.g., www.myshop.com) instead of /public/storecode URLs.<br/>
          <strong> Costs 0.5 credits per day</strong>
        </AlertDescription>
      </Alert>

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
                  <TableHead>Store URL</TableHead>
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
                      <div className="flex items-center gap-2">
                        <a
                          href={getStoreUrl(domain)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm font-mono flex items-center gap-1"
                        >
                          {getStoreUrl(domain)}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(getStoreUrl(domain))}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
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
                              onClick={() => handleDebugDNS(domain.id)}
                              className="bg-blue-50"
                            >
                              <AlertTriangle className="w-3 h-3 mr-1 text-blue-600" />
                              Debug DNS
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

                        {domain.verification_status === 'verified' && domain.ssl_status !== 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCheckSSL(domain.id)}
                            disabled={checkingSSL}
                          >
                            {checkingSSL ? (
                              <>
                                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                Checking...
                              </>
                            ) : (
                              <>
                                <Shield className="w-3 h-3 mr-1" />
                                Check SSL
                              </>
                            )}
                          </Button>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Domain</DialogTitle>
            <DialogDescription>
              Enter your domain name. You'll configure DNS records in the next step.
            </DialogDescription>
          </DialogHeader>

          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Daily Cost:</strong> 0.5 credits per day will be automatically deducted for active custom domains.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Domain Name</Label>
              <Input
                id="domain"
                placeholder="www.myshop.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Enter your full domain (e.g., www.myshop.com or shop.example.com)
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DNS Instructions Dialog */}
      <Dialog open={dnsDialogOpen} onOpenChange={setDnsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>DNS Configuration for {selectedDomain?.domain}</DialogTitle>
            <DialogDescription>
              Add these DNS records to your domain provider to verify ownership and enable your custom domain.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto pr-2 flex-1">
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
                <Alert className="bg-blue-50 border-blue-200 mb-4">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>TransIP Users:</strong> Use A records instead of CNAME to avoid domain appending issues.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <div className="border-l-4 border-blue-500 pl-4 py-2">
                    <h4 className="font-semibold">Step 1A: Add A Records (Recommended for TransIP)</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add BOTH A records for best reliability
                    </p>
                    <div className="mt-2 space-y-2">
                      <div className="p-3 bg-muted rounded-md font-mono text-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-blue-600">Type:</span> A<br/>
                            <span className="text-blue-600">Name:</span> www<br/>
                            <span className="text-blue-600">Value:</span> 76.76.21.21<br/>
                            <span className="text-blue-600">TTL:</span> 3600
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard('76.76.21.21')}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-3 bg-muted rounded-md font-mono text-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-blue-600">Type:</span> A<br/>
                            <span className="text-blue-600">Name:</span> www<br/>
                            <span className="text-blue-600">Value:</span> 76.76.21.22<br/>
                            <span className="text-blue-600">TTL:</span> 3600
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard('76.76.21.22')}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-l-4 border-purple-500 pl-4 py-2">
                    <h4 className="font-semibold">Step 1B: OR Add CNAME Record (Alternative)</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Only if your DNS provider supports CNAME properly
                    </p>
                    <div className="mt-2 p-3 bg-muted rounded-md font-mono text-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-blue-600">Type:</span> CNAME<br/>
                          <span className="text-blue-600">Name:</span> www<br/>
                          <span className="text-blue-600">Value:</span> cname.vercel-dns.com<br/>
                          <span className="text-blue-600">TTL:</span> 3600
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard('cname.vercel-dns.com')}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="border-l-4 border-green-500 pl-4 py-2">
                    <h4 className="font-semibold">Step 2: Add TXT Record (Required)</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      This verifies you own the domain
                    </p>
                    <div className="mt-2 p-3 bg-muted rounded-md font-mono text-sm break-all">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <span className="text-blue-600">Type:</span> TXT<br/>
                          <span className="text-blue-600">Name:</span> _catalyst-verification.www<br/>
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
                    <Alert className="mt-2 bg-yellow-50 border-yellow-200">
                      <AlertTriangle className="h-3 w-3 text-yellow-600" />
                      <AlertDescription className="text-xs text-yellow-800">
                        <strong>TransIP:</strong> Use name <code>_catalyst-verification.www</code> (or try <code>www._catalyst-verification</code> if the first doesn't work)
                      </AlertDescription>
                    </Alert>
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
                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>For TransIP:</strong> Use A records (Option A). CNAME may cause issues.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Option A: A Records (Recommended for TransIP)</h4>
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
                        <TableRow className="bg-green-50">
                          <TableCell className="font-mono font-bold">A</TableCell>
                          <TableCell className="font-mono">www</TableCell>
                          <TableCell className="font-mono">76.76.21.21</TableCell>
                          <TableCell className="font-mono">3600</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard('76.76.21.21')}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow className="bg-green-50">
                          <TableCell className="font-mono font-bold">A</TableCell>
                          <TableCell className="font-mono">www</TableCell>
                          <TableCell className="font-mono">76.76.21.22</TableCell>
                          <TableCell className="font-mono">3600</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard('76.76.21.22')}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Option B: CNAME (Alternative)</h4>
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
                          <TableCell className="font-mono">www</TableCell>
                          <TableCell className="font-mono">cname.vercel-dns.com</TableCell>
                          <TableCell className="font-mono">3600</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard('cname.vercel-dns.com')}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Required: TXT Record</h4>
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
                        <TableRow className="bg-yellow-50">
                          <TableCell className="font-mono font-bold">TXT</TableCell>
                          <TableCell className="font-mono">_catalyst-verification.www</TableCell>
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
                  </div>
                </div>

                <Alert>
                  <ExternalLink className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-semibold">Common DNS Providers:</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <a href="https://www.transip.nl/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          TransIP →
                        </a>
                        <a href="https://dash.cloudflare.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Cloudflare →
                        </a>
                        <a href="https://www.namecheap.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Namecheap →
                        </a>
                        <a href="https://dcc.godaddy.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          GoDaddy →
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
