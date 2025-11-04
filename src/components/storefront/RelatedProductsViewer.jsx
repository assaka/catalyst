import React, { useState, useEffect } from 'react';
import { StorefrontProduct } from '@/api/storefront-entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/utils/priceUtils';
import { useStore } from '@/components/storefront/StoreProvider';
import { getStockLabel, getStockLabelStyle } from '@/utils/stockUtils';
import { useTranslation } from '@/contexts/TranslationContext';

const MiniProductCard = ({ product }) => {
    const { store, settings, taxes, selectedCountry } = useStore();
    const { translations } = useTranslation();

    return (
        <Link to={createPageUrl(`ProductDetail?id=${product.id}`)}>
            <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-3">
                    <img
                        src={product.images?.[0] || 'https://placehold.co/150x150?text=No+Image'}
                        alt={product.name}
                        className="w-full h-32 object-cover rounded-md mb-3"
                    />
                    <h4 className="font-semibold text-sm truncate">{product.name}</h4>
                    <p className="text-lg font-bold text-gray-800">
                        {formatPrice(product.price)}
                    </p>
                    {(() => {
                        const stockLabelInfo = getStockLabel(product, settings, null, translations);
                        const stockLabelStyle = getStockLabelStyle(product, settings, null, translations);

                        if (!stockLabelInfo) return null;

                        return (
                            <Badge className="mt-1" style={stockLabelStyle}>
                                {stockLabelInfo.text}
                            </Badge>
                        );
                    })()}
                </CardContent>
            </Card>
        </Link>
    );
};


export default function RelatedProductsViewer({ productIds }) {
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!productIds || productIds.length === 0) {
            setLoading(false);
            return;
        }

        const fetchRelatedProducts = async () => {
            try {
                const products = await StorefrontProduct.filter({ id: { $in: productIds } });
                setRelatedProducts(products || []);
            } catch (error) {
                console.error("Failed to fetch related products:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRelatedProducts();
    }, [productIds]);

    if (loading) {
        return <div>Loading related products...</div>;
    }
    
    if (relatedProducts.length === 0) {
        return null;
    }

    return (
        <div className="mt-12">
            <h3 className="text-2xl font-bold mb-6">You Might Also Like</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedProducts.map(product => (
                    <MiniProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    );
}