import React from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { getCategoryName as getTranslatedCategoryName } from "@/utils/translationUtils";

export default function ProductFilters({ filters, setFilters, categories }) {
  
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Filters:</span>
      </div>

      <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.category} onValueChange={(value) => handleFilterChange("category", value)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {getTranslatedCategoryName(category)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.priceRange} onValueChange={(value) => handleFilterChange("priceRange", value)}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Price Range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Prices</SelectItem>
          <SelectItem value="under50">Under $50</SelectItem>
          <SelectItem value="50-200">$50 - $200</SelectItem>
          <SelectItem value="over200">Over $200</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}