
import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { User } from '@/api/entities';
import { CreditTransaction } from '@/api/entities';
import { createPaymentIntent } from '@/api/functions';
import { getStripePublishableKey } from '@/api/functions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Wallet, DollarSign, CheckCircle, Clock, CreditCard, RefreshCw, Info, AlertCircle } from 'lucide-react';
import { formatPrice } from '@/utils/priceUtils';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const CheckoutForm = ({ selectedPackage, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    if (!stripe || !elements) {
      console.warn('Stripe or Elements not loaded yet');
      return;
    }

    setProcessing(true);
    console.log('💳 Starting payment for:', selectedPackage);

    try {
      console.log('📤 Calling createPaymentIntent...');
      const { data: response, error: intentError } = await createPaymentIntent({
        credits: selectedPackage.credits,
        amount: selectedPackage.price
      });

      console.log('📥 Payment intent response:', { response, intentError });

      if (intentError || response?.error) {
        throw new Error(intentError?.message || response?.error);
      }

      if (!response?.data?.clientSecret) {
        console.error('No client secret in response:', response);
        throw new Error('Invalid payment response - missing client secret');
      }

      console.log('🔐 Confirming card payment...');
      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(response.data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        }
      });

      if (paymentError) {
        console.error('Payment error:', paymentError);
        throw new Error(paymentError.message);
      }

      console.log('✅ Payment successful:', paymentIntent.id);
      onSuccess();
    } catch (err) {
      console.error('❌ Payment failed:', err);
      setError(err.message);
      onError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg bg-white">
        <CardElement 
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      <Button
        type="submit"
        disabled={!stripe || processing}
        className="w-full"
      >
        {processing ? (
            <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Processing...
            </>
        ) : `Pay ${formatPrice(selectedPackage.price)}`}
      </Button>
    </form>
  );
};

export default function Billing() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [stripeConfigError, setStripeConfigError] = useState(false);
  const [stripePromise, setStripePromise] = useState(null);

  useEffect(() => {
    loadBillingData();
    const fetchKey = async () => {
        try {
            const { data } = await getStripePublishableKey();
            if (data && data.publishableKey) {
                setStripePromise(loadStripe(data.publishableKey));
                setStripeConfigError(false);
            } else {
                setStripeConfigError(true);
            }
        } catch (error) {
            console.error("Failed to fetch Stripe publishable key:", error);
            setStripeConfigError(true);
        }
    };
    fetchKey();
  }, []);

  const loadBillingData = async () => {
    setLoading(true);
    setPaymentError('');
    try {
      const userData = await User.me();
      setUser(userData);
      const transactionData = await CreditTransaction.filter({ user_id: userData.id }, "-created_date");
      setTransactions(transactionData);
    } catch (error) {
      console.error("Error loading billing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const creditOptions = [
    { credits: 100, price: 10, popular: false },
    { credits: 550, price: 50, popular: true },
    { credits: 1200, price: 100, popular: false },
  ];

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
    setSelectedPackage(null);
    // Immediately reload data when payment succeeds
    loadBillingData();
    setTimeout(() => {
        setPaymentSuccess(false);
    }, 5000);
  };

  const handlePaymentError = (error) => {
    setPaymentError(error);
     setTimeout(() => {
        setPaymentError('');
    }, 8000);
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Billing & Credits</h1>
      
      {paymentSuccess && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          Payment successful! Your credits have been added. The balance will update shortly.
        </div>
      )}

      {stripeConfigError && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-300 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-blue-900 font-medium">Stripe Payment Setup Required</p>
              <p className="text-blue-700 text-sm mt-1">
                To purchase credits and accept payments, you need to connect your Stripe account first.
              </p>
              <Button
                onClick={() => navigate(createPageUrl('Dashboard'))}
                variant="outline"
                size="sm"
                className="mt-3 border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                Go to Dashboard to Connect Stripe
              </Button>
            </div>
          </div>
        </div>
      )}

      {paymentError && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>Payment failed: {paymentError}</span>
        </div>
      )}
      
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Credits</CardTitle>
              <CardDescription>
                Your store uses 1 credit per day. Top up your balance to keep your store active.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {creditOptions.map(option => (
                  <Card key={option.price} className={`relative cursor-pointer transition-all hover:shadow-lg ${
                    option.popular ? 'border-blue-500 ring-2 ring-blue-500' : ''
                  } ${selectedPackage?.credits === option.credits ? 'bg-blue-50' : ''}`}
                  onClick={() => setSelectedPackage(option)}>
                    {option.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                        POPULAR
                      </div>
                    )}
                    <CardHeader className="text-center">
                      <CardTitle>{option.credits.toLocaleString()} Credits</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-3xl font-bold mb-4">${option.price}</p>
                      <Button 
                        className="w-full" 
                        variant={selectedPackage?.credits === option.credits ? 'default' : 'outline'}
                      >
                        {selectedPackage?.credits === option.credits ? 'Selected' : 'Select'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {selectedPackage && (
                <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">
                    Complete Payment for {selectedPackage.credits} Credits
                  </h3>
                  {stripePromise ? (
                     <Elements stripe={stripePromise}>
                       <CheckoutForm 
                         selectedPackage={selectedPackage}
                         onSuccess={handlePaymentSuccess}
                         onError={handlePaymentError}
                       />
                     </Elements>
                  ) : (
                     <div className="text-center text-gray-500 flex items-center justify-center">
                        <RefreshCw className="w-6 h-6 mr-2 animate-spin" />
                        <span>Loading payment form...</span>
                     </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Your Balance</CardTitle>
              <Wallet className="w-6 h-6 text-gray-400" />
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{user?.credits?.toLocaleString() || 0}</p>
              <p className="text-gray-600">Available Credits</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.length > 0 ? transactions.slice(0, 5).map(tx => (
                  <div key={tx.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {tx.status === 'completed' ? 
                        <CheckCircle className="w-5 h-5 text-green-500" /> : 
                        <Clock className="w-5 h-5 text-yellow-500" />
                      }
                      <div>
                        <p className="font-medium">Purchased {tx.credits_purchased} credits</p>
                        <p className="text-sm text-gray-500">{new Date(tx.created_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p className="font-medium">${tx.amount_usd}</p>
                  </div>
                )) : (
                  <p className="text-sm text-gray-500">No transactions yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
