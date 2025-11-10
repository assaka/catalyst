import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { User } from '@/api/entities';
import { Store } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building, ArrowLeft } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function Onboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    companyName: '',
    phone: '',
  });

  // Handle post-OAuth setup
  useEffect(() => {
    const handlePostOAuth = async () => {
      try {
        const user = await User.me();
        if (user && !user.account_type) {
          const savedFormData = localStorage.getItem('onboarding_form_data');

          if (savedFormData) {
            const storedFormData = JSON.parse(savedFormData);

            await User.updateMyUserData({
              account_type: 'agency', // Always set to agency now
              role: 'store_owner',
              credits: 20,
              company_name: storedFormData.companyName,
              phone: storedFormData.phone,
            });

            const storeName = storedFormData.companyName || `${user.full_name}'s Store`;
            const storeSlug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

            await Store.create({
              name: storeName,
              slug: storeSlug,
              user_id: user.id,
            });

            localStorage.removeItem('onboarding_form_data');
            navigate(createPageUrl('Dashboard'));
          } else {
            console.warn('Onboarding data missing from localStorage after OAuth redirect.');
            setError('Failed to retrieve your onboarding details. Please try again.');
          }
        } else if (user && user.account_type) {
          navigate(createPageUrl('Dashboard'));
        }
      } catch (error) {
        if (error.response?.status !== 401) {
          console.error('An unexpected error occurred during post-OAuth setup:', error);
          setError('Failed to complete account setup. Please try again or sign in.');
        } else {
        }
      }
    };

    handlePostOAuth();
  }, [navigate]);

  const handleInputChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    localStorage.setItem('onboarding_form_data', JSON.stringify(newFormData));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await User.loginWithRedirect(window.location.href);
    } catch (err) {
      console.error('Onboarding failed during redirect initiation:', err);
      setError('Failed to start registration process. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Building className="w-12 h-12 mx-auto text-blue-600 mb-4" />
          <CardTitle className="text-2xl font-bold">
            Create Your Store Builder Account
          </CardTitle>
          <CardDescription>
            Complete your registration to start building and managing your e-commerce stores. You'll get 20 free credits to begin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="companyName">Store / Company Name</Label>
              <Input
                id="companyName"
                type="text"
                placeholder="My Awesome Store"
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Starting Registration...' : `Continue with Google`}
            </Button>
          </form>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to={createPageUrl("Auth")} className="text-blue-600 hover:text-blue-800 font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}