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
import { countries } from "./country-list-data";
import { useTranslation } from "@/contexts/TranslationContext";

// Transform the country data to match expected format
const countryData = countries.map(country => ({
  value: country.code,
  label: country.name,
  flag: country.flag
}));

export function CountrySelect({ value, onValueChange, onChange, placeholder = "Select country...", multiple = false, allowedCountries = [], style = {}, dropdownStyle = {} }) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  // Use onValueChange if provided, otherwise use onChange for backward compatibility
  const handleChange = onValueChange || onChange;

  const handleSelect = (currentValue) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(currentValue)
        ? currentValues.filter((v) => v !== currentValue)
        : [...currentValues, currentValue];
      handleChange(newValues);
    } else {
      handleChange(currentValue === value ? "" : currentValue);
      setOpen(false);
    }
  };

  // Filter countries based on allowed countries from store settings
  // Ensure allowedCountries is always an array to prevent rendering issues
  const safeAllowedCountries = Array.isArray(allowedCountries) ? allowedCountries : [];
  const filteredCountries = safeAllowedCountries.length > 0
    ? countryData.filter(country => safeAllowedCountries.includes(country.value))
    : countryData;

  const safeValue = multiple 
    ? (Array.isArray(value) ? value : (value ? [value] : []))
    : value;

  const selectedLabels = multiple
    ? (Array.isArray(safeValue) ? safeValue : [])
        .map((v) => filteredCountries.find((country) => country && country.value === v)?.label)
        .filter(Boolean)
        .join(", ")
    : filteredCountries.find((country) => country && country.value === value)?.label;

  // Ensure selectedLabels is always a string or undefined, never an object
  const safeSelectedLabels = typeof selectedLabels === 'string' ? selectedLabels : (selectedLabels ? String(selectedLabels) : undefined);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          style={style}
        >
          {(multiple ? (Array.isArray(safeValue) && safeValue.length > 0) : value) ? safeSelectedLabels : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0" style={dropdownStyle}>
        <Command>
          <CommandInput placeholder={t('common.search_country', 'Search country...')} />
          <CommandList>
            <CommandEmpty>{t('common.no_country_found', 'No country found.')}</CommandEmpty>
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
                    className={` ${
                        isSelected ? "bg-gray-200" : ""
                    }`}
                  >
                    <span className="mr-2">{country.flag}</span>
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