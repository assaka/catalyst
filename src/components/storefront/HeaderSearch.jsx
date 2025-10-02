import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { StorefrontProduct } from '@/api/storefront-entities';
import { useStore } from '@/components/storefront/StoreProvider';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatDisplayPrice } from '@/utils/priceUtils';

export default function HeaderSearch({ styles = {} }) {
  const navigate = useNavigate();
  const { store, settings, taxes, selectedCountry } = useStore();

  // Get currency symbol from settings
  const currencySymbol = settings?.currency_symbol || '$';

  // Extract input styles from slot configuration
  const inputStyles = {
    backgroundColor: styles?.backgroundColor,
    borderColor: styles?.borderColor,
    borderRadius: styles?.borderRadius,
  };
  
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
        const products = await StorefrontProduct.list('-created_date', 10);
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
      // Track search event
      if (typeof window !== 'undefined' && window.catalyst?.trackSearch) {
        window.catalyst.trackSearch(searchQuery.trim(), searchResults.length);
      }
      
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
    <div className="relative w-full" ref={searchRef}>
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-12 py-2 w-full"
            style={inputStyles}
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
                        {product.compare_price && parseFloat(product.compare_price) > 0 && parseFloat(product.compare_price) !== parseFloat(product.price) ? (
                          <>
                            <span className="text-red-600">
                              {formatDisplayPrice(
                                Math.min(parseFloat(product.price || 0), parseFloat(product.compare_price || 0)),
                                currencySymbol,
                                store,
                                taxes,
                                selectedCountry
                              )}
                            </span>
                            <span className="text-gray-500 line-through ml-1 text-xs">
                              {formatDisplayPrice(
                                Math.max(parseFloat(product.price || 0), parseFloat(product.compare_price || 0)),
                                currencySymbol,
                                store,
                                taxes,
                                selectedCountry
                              )}
                            </span>
                          </>
                        ) : (
                          <span>{formatDisplayPrice(product.price, currencySymbol, store, taxes, selectedCountry)}</span>
                        )}
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