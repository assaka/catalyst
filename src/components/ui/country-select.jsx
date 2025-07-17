import React, { useState } from "react";
import { ChevronsUpDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

// Default country data in case import fails
const defaultCountryData = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "GB", label: "United Kingdom" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "AU", label: "Australia" },
  { value: "JP", label: "Japan" },
  { value: "BR", label: "Brazil" },
  { value: "IN", label: "India" },
  { value: "CN", label: "China" },
];

let countryData = defaultCountryData;

// Simply use the default country data to avoid require() issues
// The full country list can be loaded dynamically if needed

export function CountrySelect({ value, onChange, placeholder = "Select country...", multiple = false, allowedCountries = [] }) {
  const [open, setOpen] = useState(false);
  
  console.log(`🔍 CountrySelect render:`, {
    value,
    valueType: typeof value,
    isValueArray: Array.isArray(value),
    multiple,
    allowedCountries,
    allowedCountriesType: typeof allowedCountries,
    isAllowedCountriesArray: Array.isArray(allowedCountries)
  });

  const handleSelect = (currentValue) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(currentValue)
        ? currentValues.filter((v) => v !== currentValue)
        : [...currentValues, currentValue];
      onChange(newValues);
    } else {
      onChange(currentValue === value ? "" : currentValue);
      setOpen(false);
    }
  };
  
  // Ensure countryData is always an array before filtering
  const safeCountryData = Array.isArray(countryData) ? countryData : defaultCountryData;
  
  console.log(`🔍 CountrySelect filtering:`, {
    countryData,
    countryDataType: typeof countryData,
    isCountryDataArray: Array.isArray(countryData),
    safeCountryData,
    safeCountryDataLength: safeCountryData.length,
    allowedCountries,
    allowedCountriesType: typeof allowedCountries,
    isAllowedCountriesArray: Array.isArray(allowedCountries),
    allowedCountriesLength: Array.isArray(allowedCountries) ? allowedCountries.length : 'N/A'
  });
  
  const filteredCountries = Array.isArray(allowedCountries) && allowedCountries.length > 0 
    ? safeCountryData.filter(c => c && c.value && allowedCountries.includes(c.value)) 
    : safeCountryData;
    
  console.log(`🔍 CountrySelect filtered result:`, {
    filteredCountries,
    filteredCountriesType: typeof filteredCountries,
    isFilteredCountriesArray: Array.isArray(filteredCountries),
    filteredCountriesLength: Array.isArray(filteredCountries) ? filteredCountries.length : 'N/A'
  });

  const safeValue = multiple 
    ? (Array.isArray(value) ? value : (value ? [value] : []))
    : value;

  const selectedLabels = multiple
    ? (Array.isArray(safeValue) ? safeValue : [])
        .map((v) => filteredCountries.find((country) => country && country.value === v)?.label)
        .filter(Boolean)
        .join(", ")
    : filteredCountries.find((country) => country && country.value === value)?.label;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {(multiple ? (Array.isArray(safeValue) && safeValue.length > 0) : value) ? selectedLabels : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {filteredCountries.map((country) => {
                if (!country || !country.value) return null;
                
                const isSelected = multiple 
                  ? (Array.isArray(safeValue) && safeValue.includes(country.value))
                  : value === country.value;
                
                return (
                  <CommandItem
                    key={country.value}
                    value={country.label}
                    onSelect={() => handleSelect(country.value)}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        isSelected ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    {country.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}