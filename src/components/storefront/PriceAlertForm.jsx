import React, { useState } from 'react';
import { PriceAlertSubscription } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, DollarSign } from 'lucide-react';
import { formatPrice } from '@/utils/priceUtils';

export default function PriceAlertForm({ productId, storeId, currentPrice }) {
    const [email, setEmail] = useState('');
    const [targetPrice, setTargetPrice] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !targetPrice) {
            setError('Please enter your email and a target price.');
            return;
        }
        if (parseFloat(targetPrice) >= currentPrice) {
            setError('Target price must be lower than the current price.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await PriceAlertSubscription.create({
                product_id: productId,
                store_id: storeId,
                email: email,
                target_price: parseFloat(targetPrice)
            });
            setIsSubmitted(true);
        } catch (err) {
            setError('Failed to subscribe. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <Card className="bg-green-50 border-green-200 mt-4">
                <CardContent className="p-6 text-center">
                    <CardTitle className="text-green-800">Price alert set!</CardTitle>
                    <CardDescription className="text-green-700 mt-2">
                        We'll email you at {email} if the price drops below {formatPrice(parseFloat(targetPrice))}.
                    </CardDescription>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle>Set a Price Alert</CardTitle>
                <CardDescription>Get notified if the price drops below your target.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            type="email"
                            placeholder="your.email@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="pl-10"
                        />
                    </div>
                     <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            type="number"
                            placeholder="Target price"
                            value={targetPrice}
                            onChange={(e) => setTargetPrice(e.target.value)}
                            required
                            min="0.01"
                            step="0.01"
                            className="pl-10"
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Subscribing...' : 'Set Alert'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}