import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { createStripeConnectAccount, createStripeConnectLink, checkStripeConnectStatus } from '@/api/functions';

export const SetupGuide = ({ store }) => {
    const navigate = useNavigate();

    if (!store) {
        return null;
    }

    const isDomainConnected = store.custom_domain && store.domain_status === 'active';
    const isStripeConnected = store.stripe_connect_onboarding_complete === true;

    const handleConnectStripe = async () => {
        try {
            if (!store?.id) {
                console.error("Store ID is required");
                return;
            }

            // First check if store already has a Stripe account
            const status = await checkStripeConnectStatus(store.id);
            
            let onboardingUrl;
            
            if (status.data?.connected && status.data?.account_id) {
                // Account exists, create onboarding link
                const currentUrl = window.location.origin + window.location.pathname;
                const returnUrl = `${currentUrl}?stripe_return=true`;
                const refreshUrl = `${currentUrl}?stripe_refresh=true`;
                
                const { data } = await createStripeConnectLink(returnUrl, refreshUrl, store.id);
                onboardingUrl = data?.url;
            } else {
                // No account exists, create new account
                const { data } = await createStripeConnectAccount(store.id);
                onboardingUrl = data?.onboarding_url;
            }

            if (onboardingUrl) {
                window.location.href = onboardingUrl;
            } else {
                console.error("Failed to get Stripe onboarding URL");
            }
        } catch (error) {
            console.error("Error setting up Stripe connect:", error);
        }
    };

    if (isDomainConnected && isStripeConnected) {
        return null;
    }

    return (
        <Card className="mb-8 bg-blue-50 border-blue-200 material-elevation-1">
            <CardHeader>
                <CardTitle className="text-blue-900">Finish Setting Up Your Store</CardTitle>
                <CardDescription className="text-blue-700">Complete these steps to start selling.</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-4">
                    <li className="flex items-center justify-between">
                        <div className="flex items-center">
                            {isDomainConnected ? (
                                <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-amber-600 mr-3" />
                            )}
                            <div>
                                <p className="font-semibold text-gray-800">Connect Your Domain</p>
                                <p className="text-sm text-gray-600">Make your store accessible at your own URL.</p>
                            </div>
                        </div>
                        <Button 
                            variant={isDomainConnected ? "secondary" : "default"} 
                            size="sm" 
                            onClick={() => navigate(createPageUrl('Settings'))}
                        >
                            {isDomainConnected ? 'View' : 'Connect'}
                        </Button>
                    </li>
                    <li className="flex items-center justify-between">
                        <div className="flex items-center">
                            {isStripeConnected ? (
                                <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-amber-600 mr-3" />
                            )}
                            <div>
                                <p className="font-semibold text-gray-800">Connect Stripe Account</p>
                                <p className="text-sm text-gray-600">Securely connect Stripe to receive payments.</p>
                            </div>
                        </div>
                         <Button 
                            variant={isStripeConnected ? "secondary" : "default"} 
                            size="sm" 
                            onClick={handleConnectStripe}
                        >
                            {isStripeConnected ? 'Connected' : 'Connect Stripe'}
                        </Button>
                    </li>
                </ul>
            </CardContent>
        </Card>
    );
};