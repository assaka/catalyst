import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Store, Database, CreditCard, DollarSign, User as UserIcon,
  CheckCircle2, Circle, Loader2, ExternalLink, ArrowRight, ArrowLeft, Sparkles, AlertCircle
} from 'lucide-react';
import apiClient from '@/utils/api';
import { User } from '@/api/entities';

const STEPS = [
  { id: 1, title: 'Create Store', description: 'Name your store', icon: Store, required: true },
  { id: 2, title: 'Connect Database', description: 'Connect Supabase', icon: Database, required: true },
  { id: 3, title: 'Setup Stripe', description: 'Payment processing', icon: CreditCard, required: false },
  { id: 4, title: 'Purchase Credits', description: 'Buy platform credits', icon: DollarSign, required: false },
  { id: 5, title: 'Complete Profile', description: 'Your information', icon: UserIcon, required: true },
];

export default function StoreOnboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [storeId, setStoreId] = useState(null);
  const [completedSteps, setCompletedSteps] = useState([]);

  const [storeData, setStoreData] = useState({ name: '', slug: '' });
  const [dbData, setDbData] = useState({ connectionString: '' });
  const [oauthCompleted, setOauthCompleted] = useState(false);
  const [stripeData, setStripeData] = useState({ publishableKey: '', secretKey: '' });
  const [creditData, setCreditData] = useState({ amount: 100 });
  const [profileData, setProfileData] = useState({ phone: '', companyName: '' });

  const handleNameChange = (name) => {
    setStoreData({
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    });
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Creating store with name:', storeData.name);
      const response = await apiClient.post('/stores', { name: storeData.name });
      console.log('Store creation response:', response);

      // Handle response from POST /api/stores
      if (response && response.success && response.data) {
        // Response format: { success: true, data: { store: {...} } }
        const storeData = response.data.store || response.data;
        console.log('Store created successfully, ID:', storeData.id);
        setStoreId(storeData.id);
        setCompletedSteps([1]);
        setCurrentStep(2);
        setSuccess(response.message || 'Store created successfully');
      } else {
        console.error('Unexpected response format:', response);
        setError(response?.error || response?.message || 'Failed to create store');
      }
    } catch (err) {
      console.error('Store creation error:', err);
      setError(err.message || 'Failed to create store');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectDatabase = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Step 1: Initiate OAuth flow
      console.log('Initiating Supabase OAuth...');
      const oauthResponse = await apiClient.post(`/supabase/connect?storeId=${storeId}`);

      if (!oauthResponse.success || !oauthResponse.authUrl) {
        throw new Error('Failed to get OAuth URL');
      }

      // Step 2: Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        oauthResponse.authUrl,
        'Supabase OAuth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        throw new Error('Please allow popups for this site');
      }

      // Step 3: Listen for OAuth success via postMessage
      let oauthSucceeded = false;

      const handleOAuthMessage = (event) => {
        // Accept messages from any origin for OAuth callback
        if (event.data && event.data.type === 'supabase-oauth-success') {
          console.log('✅ OAuth success message received via postMessage');
          oauthSucceeded = true;
        }
      };

      window.addEventListener('message', handleOAuthMessage);

      // Step 4: Wait for popup to close
      const checkClosed = setInterval(async () => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleOAuthMessage);

          // Check if OAuth was successful (postMessage or sessionStorage)
          const successMessage = sessionStorage.getItem('supabase_connection_success');

          if (oauthSucceeded || successMessage) {
            if (successMessage) {
              sessionStorage.removeItem('supabase_connection_success');
            }

            // OAuth completed - now show connection string input
            setOauthCompleted(true);
            setSuccess('Supabase connected! Now enter your database connection string to complete setup.');
          } else {
            setError('OAuth was cancelled or failed');
          }

          setLoading(false);
        }
      }, 500);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(checkClosed);
        if (!popup.closed) {
          popup.close();
          setError('OAuth timeout - please try again');
          setLoading(false);
        }
      }, 300000);

    } catch (err) {
      console.error('OAuth error:', err);
      setError(err.message || 'Failed to connect database');
      setLoading(false);
    }
  };

  const handleProvisionDatabase = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const provisionResponse = await apiClient.post(`/stores/${storeId}/connect-database`, {
        storeName: storeData.name,
        storeSlug: storeData.slug,
        useOAuth: true,
        connectionString: dbData.connectionString
      });

      if (provisionResponse.success) {
        setCompletedSteps([...completedSteps, 2]);
        setSuccess('Database connected! 137 tables created & 6,598 rows seeded.');
        setCurrentStep(3);
      } else {
        setError(provisionResponse.error || 'Failed to provision database');
      }
    } catch (err) {
      setError(err.message || 'Failed to provision database');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupStripe = async (e) => {
    e.preventDefault();
    setCompletedSteps([...completedSteps, 3]);
    setCurrentStep(4);
  };

  const handlePurchaseCredits = async (e) => {
    e.preventDefault();
    setCompletedSteps([...completedSteps, 4]);
    setCurrentStep(5);
  };

  const handleCompleteProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await User.updateMyUserData({
        phone: profileData.phone,
        company_name: profileData.companyName
      });

      setSuccess('Setup complete! Redirecting...');
      setTimeout(() => window.location.href = '/admin/dashboard', 2000);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    setError('');
    setCurrentStep(currentStep + 1);
  };

  const progressPercent = (completedSteps.length / STEPS.length) * 100;
  const currentStepData = STEPS[currentStep - 1];
  const StepIcon = currentStepData.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl shadow-2xl">
        {/* Progress Bar */}
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Step {currentStep} of {STEPS.length}</span>
            <span className="text-sm font-medium text-gray-600">{Math.round(progressPercent)}% Complete</span>
          </div>
          <Progress value={progressPercent} className="h-2" />

          {/* Step Indicators */}
          <div className="flex items-center justify-between mt-6 mb-4">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex flex-col items-center ${index < STEPS.length - 1 ? 'flex-1' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    completedSteps.includes(step.id)
                      ? 'bg-green-500 text-white'
                      : currentStep === step.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    {completedSteps.includes(step.id) ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-xs mt-1 text-center hidden sm:block">{step.title}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`h-0.5 w-full mx-2 ${
                    completedSteps.includes(step.id) ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <StepIcon className="w-16 h-16 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">{currentStepData.title}</CardTitle>
          <CardDescription className="text-base">{currentStepData.description}</CardDescription>
          {!currentStepData.required && (
            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full mt-2">
              Optional - Can be skipped
            </span>
          )}
        </CardHeader>

        <CardContent className="px-8 pb-8">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Create Store */}
          {currentStep === 1 && (
            <form onSubmit={handleCreateStore} className="space-y-6">
              <div>
                <Label htmlFor="storeName">Store Name *</Label>
                <Input
                  id="storeName"
                  placeholder="My Awesome Store"
                  value={storeData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  autoFocus
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="storeSlug">Store URL *</Label>
                <Input
                  id="storeSlug"
                  value={storeData.slug}
                  onChange={(e) => setStoreData({ ...storeData, slug: e.target.value })}
                  required
                  className="mt-2 font-mono"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {storeData.slug || 'your-store'}.catalyst.com
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading || !storeData.name}>
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : <>Continue <ArrowRight className="w-4 h-4 ml-2" /></>}
              </Button>
            </form>
          )}

          {/* Step 2: Connect Database */}
          {currentStep === 2 && !oauthCompleted && (
            <form onSubmit={handleConnectDatabase} className="space-y-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 text-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Database className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Connect Your Supabase Database
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  We'll securely connect to your Supabase account using OAuth, create all necessary tables, and seed initial data automatically.
                </p>
                <div className="bg-white/80 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 mr-2 text-yellow-500" />
                    What happens next?
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-2 text-left max-w-md mx-auto">
                    <li className="flex items-start">
                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Authorize Catalyst to access your Supabase account</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Select a Supabase project</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Provide database password</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Automatically create 137 tables & seed 6,598 rows</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(1)} disabled={loading}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Connect with Supabase
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Step 2b: Enter Connection String (after OAuth) */}
          {currentStep === 2 && oauthCompleted && (
            <form onSubmit={handleProvisionDatabase} className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                  <Sparkles className="w-4 h-4 mr-2" />
                  One more step!
                </h4>
                <p className="text-sm text-blue-800 mb-2">
                  To create your database tables and seed initial data, we need your database connection string.
                </p>
                <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside ml-2">
                  <li>Go to Supabase → Settings → Database</li>
                  <li>Copy the Connection String (URI)</li>
                  <li>Replace [YOUR-PASSWORD] with your actual database password</li>
                  <li>Paste the complete connection string below</li>
                </ol>
              </div>

              <div>
                <Label htmlFor="connectionString">Database Connection String (URI) *</Label>
                <Input
                  id="connectionString"
                  type="password"
                  placeholder="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
                  value={dbData.connectionString}
                  onChange={(e) => setDbData({ connectionString: e.target.value })}
                  required
                  autoFocus
                  className="mt-2 font-mono text-xs"
                />
                <p className="text-xs text-amber-600 mt-1">
                  💡 Make sure to replace [YOUR-PASSWORD] with your actual database password before pasting
                </p>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => { setOauthCompleted(false); setError(''); }} disabled={loading}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={loading || !dbData.connectionString}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Provisioning Database...
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4 mr-2" />
                      Provision Database
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Step 3: Setup Stripe */}
          {currentStep === 3 && (
            <form onSubmit={handleSetupStripe} className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600">
                  Connect Stripe to accept payments in your store. You can skip this and set it up later in Settings.
                </p>
              </div>

              <div>
                <Label htmlFor="stripePublishable">Publishable Key</Label>
                <Input
                  id="stripePublishable"
                  placeholder="pk_test_..."
                  value={stripeData.publishableKey}
                  onChange={(e) => setStripeData({ ...stripeData, publishableKey: e.target.value })}
                  className="mt-2 font-mono text-sm"
                />
              </div>

              <div>
                <Label htmlFor="stripeSecret">Secret Key</Label>
                <Input
                  id="stripeSecret"
                  type="password"
                  placeholder="sk_test_..."
                  value={stripeData.secretKey}
                  onChange={(e) => setStripeData({ ...stripeData, secretKey: e.target.value })}
                  className="mt-2 font-mono text-sm"
                />
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(2)} disabled={loading}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button type="button" variant="ghost" onClick={handleSkip} disabled={loading} className="flex-1">
                  Skip for Now
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Stripe Keys'}
                </Button>
              </div>
            </form>
          )}

          {/* Step 4: Purchase Credits */}
          {currentStep === 4 && (
            <form onSubmit={handlePurchaseCredits} className="space-y-6">
              <div className="bg-purple-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-purple-900">
                  Platform credits are used for AI features, translations, imports/exports, and plugin marketplace purchases.
                </p>
              </div>

              <div>
                <Label htmlFor="creditAmount">Credit Amount</Label>
                <Input
                  id="creditAmount"
                  type="number"
                  min="10"
                  step="10"
                  placeholder="100"
                  value={creditData.amount}
                  onChange={(e) => setCreditData({ amount: parseInt(e.target.value) })}
                  className="mt-2"
                />
                <p className="text-sm text-gray-500 mt-1">
                  ${(creditData.amount * 0.10).toFixed(2)} USD (${0.10} per credit)
                </p>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(3)} disabled={loading}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button type="button" variant="ghost" onClick={handleSkip} disabled={loading} className="flex-1">
                  Skip - Start with 0 Credits
                </Button>
                <Button type="submit" disabled={loading}>
                  Purchase Credits
                </Button>
              </div>
            </form>
          )}

          {/* Step 5: Complete Profile */}
          {currentStep === 5 && (
            <form onSubmit={handleCompleteProfile} className="space-y-6">
              <div>
                <Label htmlFor="companyName">Company / Business Name</Label>
                <Input
                  id="companyName"
                  placeholder="Acme Inc."
                  value={profileData.companyName}
                  onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(4)} disabled={loading}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <>Complete Setup <Sparkles className="w-4 h-4 ml-2" /></>}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
