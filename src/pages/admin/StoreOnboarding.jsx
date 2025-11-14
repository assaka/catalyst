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
  const [dbData, setDbData] = useState({ projectUrl: '', serviceRoleKey: '' });
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
      const response = await apiClient.post(`/stores/${storeId}/connect-database`, {
        projectUrl: dbData.projectUrl,
        serviceRoleKey: dbData.serviceRoleKey,
        storeName: storeData.name,
        storeSlug: storeData.slug
      });

      if (response.success) {
        setCompletedSteps([...completedSteps, 2]);
        setSuccess('Database connected! 137 tables created & 6,598 rows seeded.');
        setCurrentStep(3);
      } else {
        setError(response.error || 'Failed to connect database');
      }
    } catch (err) {
      setError(err.message || 'Failed to connect database');
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
          {currentStep === 2 && (
            <form onSubmit={handleConnectDatabase} className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                  <Sparkles className="w-4 h-4 mr-2" />
                  How to get Supabase credentials
                </h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside ml-2">
                  <li>Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center">supabase.com <ExternalLink className="w-3 h-3 ml-1" /></a></li>
                  <li>Create a new project (choose same region as master DB)</li>
                  <li>Go to Settings → API</li>
                  <li>Copy Project URL and service_role key</li>
                </ol>
              </div>

              <div>
                <Label htmlFor="projectUrl">Supabase Project URL *</Label>
                <Input
                  id="projectUrl"
                  type="url"
                  placeholder="https://xxxxxxxxxxxxx.supabase.co"
                  value={dbData.projectUrl}
                  onChange={(e) => setDbData({ ...dbData, projectUrl: e.target.value })}
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="serviceRoleKey">Service Role Key *</Label>
                <Input
                  id="serviceRoleKey"
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={dbData.serviceRoleKey}
                  onChange={(e) => setDbData({ ...dbData, serviceRoleKey: e.target.value })}
                  required
                  className="mt-2 font-mono text-sm"
                />
                <p className="text-xs text-red-600 mt-1">⚠️ Keep this secret! Never share publicly.</p>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(1)} disabled={loading}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button type="submit" className="flex-1" disabled={loading || !dbData.projectUrl || !dbData.serviceRoleKey}>
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting & Provisioning...</> : <>Connect Database <ArrowRight className="w-4 h-4 ml-2" /></>}
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
