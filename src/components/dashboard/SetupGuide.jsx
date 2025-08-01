import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, AlertCircle, CreditCard, RefreshCw, Settings, Unlink, Info } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { createStripeConnectAccount, createStripeConnectLink, checkStripeConnectStatus } from '@/api/functions';

export const SetupGuide = ({ store }) => {
    const navigate = useNavigate();
    const [connecting, setConnecting] = useState(false);

    if (!store) {
        return null;
    }

    const isDomainConnected = store.custom_domain && store.domain_status === 'active';
    const isStripeConnected = store.stripe_connect_onboarding_complete === true || !!store.stripe_account_id;

    const handleChangeStripeAccount = async () => {
        const confirmed = window.confirm(
            "Are you sure you want to connect a different Stripe account? This will replace your current Stripe connection."
        );
        
        if (confirmed) {
            await handleConnectStripe();
        }
    };

    const handleConnectStripe = async () => {
        if (!store?.id) {
            console.error("Store ID is required");
            return;
        }

        setConnecting(true);
        
        try {
            console.log("Starting Stripe Connect flow for store:", store.id);
            
            // Try to create account first - if it exists, we'll get an error we can handle
            let onboardingUrl;
            
            try {
                // First try to create a new account
                console.log("Attempting to create new Stripe account");
                const accountResponse = await createStripeConnectAccount(store.id);
                console.log("Connect account response:", accountResponse);
                console.log("Account response data structure:", JSON.stringify(accountResponse.data, null, 2));
                
                // Handle both object and array response structures
                if (Array.isArray(accountResponse.data)) {
                    onboardingUrl = accountResponse.data[0]?.onboarding_url;
                    console.log("Extracted onboarding URL from array:", onboardingUrl);
                } else {
                    onboardingUrl = accountResponse.data?.onboarding_url;
                    console.log("Extracted onboarding URL from object:", onboardingUrl);
                }
            } catch (accountError) {
                console.log("Account creation failed:", accountError);
                console.log("Error message:", accountError.message);
                console.log("Error string includes 'already exists':", accountError.message?.includes("already exists"));
                
                // If account already exists, try to create an onboarding link
                if (accountError.message?.includes("already exists")) {
                    console.log("Account exists, creating onboarding link");
                    try {
                        const currentUrl = window.location.origin + window.location.pathname;
                        const returnUrl = `${currentUrl}?stripe_return=true`;
                        const refreshUrl = `${currentUrl}?stripe_refresh=true`;
                        
                        const linkResponse = await createStripeConnectLink(returnUrl, refreshUrl, store.id);
                        console.log("Connect link response:", linkResponse);
                        console.log("Response data structure:", JSON.stringify(linkResponse.data, null, 2));
                        
                        // Handle both object and array response structures
                        if (Array.isArray(linkResponse.data)) {
                            // If data is an array, get the first item
                            onboardingUrl = linkResponse.data[0]?.url;
                            console.log("Extracted URL from array:", onboardingUrl);
                        } else {
                            // If data is an object, use the url property
                            onboardingUrl = linkResponse.data?.url;
                            console.log("Extracted URL from object:", onboardingUrl);
                        }
                    } catch (linkError) {
                        console.error("Error creating connect link:", linkError);
                        throw linkError;
                    }
                } else {
                    console.log("Different error, re-throwing:", accountError.message);
                    throw accountError; // Re-throw if it's a different error
                }
            }

            console.log("Final onboarding URL:", onboardingUrl);
            
            if (onboardingUrl) {
                window.location.href = onboardingUrl;
            } else {
                console.error("Failed to get Stripe onboarding URL");
                alert("Unable to connect to Stripe. Please try again or contact support.");
            }
        } catch (error) {
            console.error("Error setting up Stripe connect:", error);
            alert("An error occurred while setting up Stripe. Please try again.");
        } finally {
            setConnecting(false);
        }
    };

    // Only hide the setup guide if both domain and Stripe are connected
    // Keep showing if either is incomplete, allowing management of connected services
    if (isDomainConnected && isStripeConnected) {
        // Show a condensed version when everything is set up
        return (
            <Card className="mb-8 bg-green-50 border-green-200 material-elevation-1">
                <CardHeader>
                    <CardTitle className="text-green-900 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Store Setup Complete
                    </CardTitle>
                    <CardDescription className="text-green-700">Your store is ready to start selling!</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-sm text-gray-700">Domain Connected</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-sm text-gray-700">
                                    Stripe Connected {store.stripe_account_id && `(${store.stripe_account_id.substring(0, 15)}...)`}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => navigate(createPageUrl('Settings'))}
                            >
                                <Settings className="w-4 h-4 mr-1" />
                                Settings
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleChangeStripeAccount}
                                disabled={connecting}
                            >
                                {connecting ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        <Unlink className="w-4 h-4 mr-1" />
                                        Change Stripe
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
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
                                <p className="font-semibold text-gray-800">
                                    {isStripeConnected ? 'Stripe Account Connected' : 'Connect Stripe Account'}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {isStripeConnected 
                                        ? (store.stripe_account_id 
                                            ? `Account ID: ${store.stripe_account_id.substring(0, 20)}...`
                                            : 'Ready to accept payments')
                                        : 'Securely connect Stripe to receive payments.'
                                    }
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {isStripeConnected ? (
                                <>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => navigate(createPageUrl('PaymentMethods'))}
                                        title="Manage payment settings"
                                    >
                                        <Settings className="w-4 h-4 mr-1" />
                                        Manage
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={handleChangeStripeAccount}
                                        disabled={connecting}
                                        title="Connect a different Stripe account"
                                    >
                                        {connecting ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                                                Connecting...
                                            </>
                                        ) : (
                                            <>
                                                <Unlink className="w-4 h-4 mr-1" />
                                                Change
                                            </>
                                        )}
                                    </Button>
                                </>
                            ) : (
                                <Button 
                                    variant="default"
                                    size="sm" 
                                    onClick={handleConnectStripe}
                                    disabled={connecting}
                                    className="bg-orange-600 hover:bg-orange-700 text-white"
                                >
                                    {connecting ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            Connecting...
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard className="w-4 h-4 mr-2" />
                                            Connect Stripe
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </li>
                </ul>
            </CardContent>
        </Card>
    );
};