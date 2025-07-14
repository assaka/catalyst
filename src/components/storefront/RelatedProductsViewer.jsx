import React, { useState, useEffect } from 'react';
import { Product } from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const MiniProductCard = ({ product }) => (
    <Link to={createPageUrl(`ProductDetail?id=${product.id}`)}>
        <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-3">
                <img 
                    src={product.images?.[0] || 'https://placehold.co/150x150?text=No+Image'} 
                    alt={product.name} 
                    className="w-full h-32 object-cover rounded-md mb-3"
                />
                <h4 className="font-semibold text-sm truncate">{product.name}</h4>
                <p className="text-lg font-bold text-gray-800">${product.price.toFixed(2)}</p>
                {product.quantity > 0 || product.has_infinite_stock ? (
                     <Badge className="bg-green-100 text-green-800 mt-1">In Stock</Badge>
                ) : (
                     <Badge variant="destructive" className="mt-1">Out of Stock</Badge>
                )}
            </CardContent>
        </Card>
    </Link>
);


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
                const products = await Product.filter({ id: { $in: productIds } });
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