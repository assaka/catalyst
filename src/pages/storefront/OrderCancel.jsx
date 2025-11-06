import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl, createPublicUrl } from '@/utils';
import { useStore } from '@/components/storefront/StoreProvider';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function OrderCancel() {
    const { store } = useStore();

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <XCircle className="w-20 h-20 text-red-500 mb-6" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Payment Canceled</h1>
            <p className="text-gray-600 mb-8 max-w-md">
                Your order was canceled or something went wrong with the payment. Your cart has been saved, so you can try again whenever you're ready.
            </p>
            <div className="flex gap-4">
                <Button asChild>
                    <Link to={createPublicUrl(store?.slug || 'store', 'CART')}>View Cart</Link>
                </Button>
                <Button variant="outline" asChild>
                    <Link to={createPublicUrl(store?.slug || 'store', 'STOREFRONT')}>Continue Shopping</Link>
                </Button>
            </div>
        </div>
    );
}