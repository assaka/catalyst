import React, { useState, useEffect } from 'react';
import { Product } from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const retryApiCall = async (apiCall, maxRetries = 3, baseDelay = 2000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      const isRateLimit = error.response?.status === 429 || 
                         error.message?.includes('Rate limit') || 
                         error.message?.includes('429') ||
                         error.detail?.includes('Rate limit');
      
      if (isRateLimit && i < maxRetries - 1) {
        const delayTime = baseDelay * Math.pow(2, i) + Math.random() * 1000;
        console.warn(`RecommendedProducts: Rate limit hit, waiting ${delayTime.toFixed(0)}ms before retry ${i + 1}/${maxRetries}`);
        await delay(delayTime);
        continue;
      }
      
      if (isRateLimit) {
        console.error('RecommendedProducts: Rate limit exceeded after all retries');
        return [];
      }
      
      throw error;
    }
  }
};

// A simplified ProductCard for this component
const SimpleProductCard = ({ product }) => (
    <Card className="group overflow-hidden">
        <CardContent className="p-0">
            <Link to={createPageUrl(`ProductDetail?id=${product.id}`)}>
                <img
                    src={product.images?.[0] || 'https://placehold.co/400x400?text=No+Image'}
                    alt={product.name}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                />
            </Link>
            <div className="p-4">
                <h3 className="font-semibold text-lg truncate mt-1">
                    <Link to={createPageUrl(`ProductDetail?id=${product.id}`)}>{product.name}</Link>
                </h3>
                <div className="flex items-center justify-between mt-4">
                    <p className="font-bold text-xl text-gray-900">${(product.sale_price || product.price || 0).toFixed(2)}</p>
                </div>
            </div>
        </CardContent>
    </Card>
);

export default function RecommendedProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecommended = async () => {
            try {
                await delay(800);
                const recommended = await retryApiCall(() => Product.filter({ is_featured: true }, '-created_date', 4));
                setProducts(recommended || []);
            } catch (error) {
                console.error("Failed to load recommended products:", error);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };
        fetchRecommended();
    }, []);

    if (loading || products.length === 0) {
        return null;
    }

    return (
        <div className="py-12">
            <h2 className="text-3xl font-bold text-center mb-8">You Might Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {products.map(product => (
                    <SimpleProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    );
}