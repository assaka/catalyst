import React, { useState } from 'react';
import { StockAlertSubscription } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail } from 'lucide-react';

export default function StockAlertForm({ productId, storeId }) {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            setError('Please enter your email address.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await StockAlertSubscription.create({
                product_id: productId,
                store_id: storeId,
                email: email,
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
            <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6 text-center">
                    <CardTitle className="text-green-800">You're on the list!</CardTitle>
                    <CardDescription className="text-green-700 mt-2">
                        We'll notify you at {email} as soon as this product is back in stock.
                    </CardDescription>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Out of Stock</CardTitle>
                <CardDescription>Enter your email to be notified when it's available again.</CardDescription>
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
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Subscribing...' : 'Notify Me'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}