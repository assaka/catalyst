import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Product } from '@/api/entities';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function HeaderSearch() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current && 
        !searchRef.current.contains(event.target) &&
        resultsRef.current &&
        !resultsRef.current.contains(event.target)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchProducts = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setLoading(true);
      try {
        const products = await Product.list('-created_date', 10);
        const searchLower = searchQuery.toLowerCase();
        
        const filteredProducts = products.filter(product => 
          product.name.toLowerCase().includes(searchLower) ||
          product.sku.toLowerCase().includes(searchLower) ||
          product.short_description?.toLowerCase().includes(searchLower)
        );

        setSearchResults(filteredProducts.slice(0, 5));
        setShowResults(true);
      } catch (error) {
        console.error("Error searching products:", error);
        setSearchResults([]);
        setShowResults(false);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(createPageUrl(`Storefront?search=${encodeURIComponent(searchQuery.trim())}`));
      setShowResults(false);
      setSearchQuery('');
    }
  };

  const handleProductClick = (product) => {
    navigate(createPageUrl(`ProductDetail?id=${product.id}`));
    setShowResults(false);
    setSearchQuery('');
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  return (
    <div className="relative w-full max-w-lg" ref={searchRef}>
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-12 py-2 w-full"
          />
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={clearSearch}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </form>

      {/* Search Results Dropdown */}
      {showResults && searchQuery.trim().length >= 2 && (
        <Card className="absolute top-full mt-1 w-full z-50 shadow-lg border" ref={resultsRef}>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="max-h-80 overflow-y-auto">
                {searchResults.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleProductClick(product)}
                    className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  >
                    <img
                      src={product.images?.[0] || 'https://placehold.co/40x40?text=No+Image'}
                      alt={product.name}
                      className="w-10 h-10 object-cover rounded-md mr-3"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">
                        SKU: {product.sku}
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        ${parseFloat(product.sale_price || product.price || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
                
                {searchResults.length > 0 && (
                  <div className="p-3 bg-gray-50 border-t">
                    <Button
                      onClick={handleSearch}
                      variant="ghost"
                      size="sm"
                      className="w-full text-blue-600 hover:text-blue-800"
                    >
                      View all results for "{searchQuery}"
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                No products found for "{searchQuery}"
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}