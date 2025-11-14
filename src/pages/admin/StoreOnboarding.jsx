import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Store, Database, CreditCard, DollarSign, CheckCircle2, Rocket, ArrowRight, AlertCircle } from 'lucide-react';
import { api } from '@/services/api';

const STEPS = [
  { id: 1, title: 'Create Store', icon: Store, required: true },
  { id: 2, title: 'Connect Database', icon: Database, required: true },
  { id: 3, title: 'Setup Stripe', icon: CreditCard, required: false, skippable: true },
  { id: 4, title: 'Purchase Credits', icon: DollarSign, required: false, skippable: true },
];

export default function StoreOnboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [storeId, setStoreId] = useState(null);
  const [completedSteps, setCompletedSteps] = useState([]);

  const [storeData, setStoreData] = useState({
    name: '',
    slug: '',
  });

  const [dbData, setDbData] = useState({
    projectUrl: '',
    serviceRoleKey: '',
  });

  // Auto-generate slug from store name
  const handleNameChange = (name) => {
    setStoreData({
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    });
  };

  // Step 1: Create Store
  const handleCreateStore = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/stores/mt', {
        name: storeData.name
      });

      if (response.success) {
        setStoreId(response.data.store.id);
        setStep(2);
      } else {
        setError(response.error || 'Failed to create store');
      }
    } catch (err) {
      console.error('Create store error:', err);
      setError(err.message || 'Failed to create store');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Connect Database
  const handleConnectDatabase = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post(`/api/stores/mt/${storeId}/connect-database`, {
        projectUrl: dbData.projectUrl,
        serviceRoleKey: dbData.serviceRoleKey,
        storeName: storeData.name,
        storeSlug: storeData.slug
      });

      if (response.success) {
        setStep(3);
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          window.location.href = '/admin/dashboard';
        }, 2000);
      } else {
        setError(response.error || 'Failed to connect database');
      }
    } catch (err) {
      console.error('Connect database error:', err);
      setError(err.message || 'Failed to connect database');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {step === 1 && <Store className="w-16 h-16 text-blue-600" />}
            {step === 2 && <Database className="w-16 h-16 text-indigo-600" />}
            {step === 3 && <Rocket className="w-16 h-16 text-green-600" />}
          </div>

          <CardTitle className="text-3xl font-bold">
            {step === 1 && "Welcome! Let's Create Your First Store"}
            {step === 2 && "Connect Your Database"}
            {step === 3 && "All Set! 🎉"}
          </CardTitle>

          <CardDescription className="text-lg mt-2">
            {step === 1 && "Choose a name for your store to get started"}
            {step === 2 && "Connect a Supabase database to store your products and data"}
            {step === 3 && "Your store is ready! Redirecting to dashboard..."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Create Store */}
          {step === 1 && (
            <form onSubmit={handleCreateStore} className="space-y-6">
              <div>
                <Label htmlFor="storeName" className="text-base font-semibold">
                  Store Name
                </Label>
                <Input
                  id="storeName"
                  type="text"
                  placeholder="My Awesome Store"
                  value={storeData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  className="mt-2"
                  autoFocus
                />
                <p className="text-sm text-gray-500 mt-1">
                  This will be the name of your store
                </p>
              </div>

              <div>
                <Label htmlFor="storeSlug" className="text-base font-semibold">
                  Store URL (Slug)
                </Label>
                <Input
                  id="storeSlug"
                  type="text"
                  value={storeData.slug}
                  onChange={(e) => setStoreData({ ...storeData, slug: e.target.value })}
                  required
                  className="mt-2"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Your store URL: <span className="font-mono">{storeData.slug || 'your-store'}.catalyst.com</span>
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg"
                disabled={loading || !storeData.name}
              >
                {loading ? 'Creating Store...' : 'Continue →'}
              </Button>
            </form>
          )}

          {/* Step 2: Connect Database */}
          {step === 2 && (
            <form onSubmit={handleConnectDatabase} className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">How to get Supabase credentials:</h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline">supabase.com</a></li>
                  <li>Create a new project (or use existing)</li>
                  <li>Go to Settings → API</li>
                  <li>Copy Project URL and service_role key</li>
                </ol>
              </div>

              <div>
                <Label htmlFor="projectUrl" className="text-base font-semibold">
                  Supabase Project URL
                </Label>
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
                <Label htmlFor="serviceRoleKey" className="text-base font-semibold">
                  Service Role Key
                </Label>
                <Input
                  id="serviceRoleKey"
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={dbData.serviceRoleKey}
                  onChange={(e) => setDbData({ ...dbData, serviceRoleKey: e.target.value })}
                  required
                  className="mt-2 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  ⚠️ Keep this secret! Never share publicly.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                  disabled={loading}
                >
                  ← Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-12 text-lg"
                  disabled={loading || !dbData.projectUrl || !dbData.serviceRoleKey}
                >
                  {loading ? 'Connecting...' : 'Connect Database →'}
                </Button>
              </div>
            </form>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="text-center py-8">
              <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
              <h3 className="text-2xl font-bold mb-3">Store Created Successfully!</h3>
              <p className="text-gray-600 mb-6">
                Your database has been connected and provisioned with all necessary tables.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  ✅ Store created<br />
                  ✅ Database connected<br />
                  ✅ Tables provisioned<br />
                  ✅ Ready to use!
                </p>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Redirecting to dashboard...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
