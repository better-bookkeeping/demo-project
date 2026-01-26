import { useState, useRef, useEffect, useCallback } from "react";
import { Check, Search, Plus, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { searchFoodsQueryOptions } from "@/routes/__index/_layout.nutrition/-queries/foods";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface Food {
  id: string;
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string | null;
  isCustom: boolean;
  userId: string | null;
}

interface FoodAutocompleteProps {
  value: string;
  onChange: (food: Food | null) => void;
  onManualEntry?: () => void;
  onCustomFood?: () => void;
  placeholder?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Protein - Meat": "bg-red-500/20 text-red-400 border-red-500/30",
  "Protein - Fish": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Protein - Egg": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Protein - Dairy": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Protein - Supplement": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Protein - Plant": "bg-green-500/20 text-green-400 border-green-500/30",
  "Carbs - Grains": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Carbs - Tubers": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Carbs - Fruit": "bg-pink-500/20 text-pink-400 border-pink-500/30",
  "Carbs - Vegetable": "bg-green-500/20 text-green-400 border-green-500/30",
  "Fat - Oil": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Fat - Whole Food": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Fat - Nuts": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Fat - Seeds": "bg-lime-500/20 text-lime-400 border-lime-500/30",
  "Fat - Dairy": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Vegetable": "bg-green-500/20 text-green-400 border-green-500/30",
  "Beverage - Dairy": "bg-sky-500/20 text-sky-400 border-sky-500/30",
  "Beverage - Supplement": "bg-violet-500/20 text-violet-400 border-violet-500/30",
  "Beverage": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "Snack": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
};

const DEFAULT_CATEGORY_COLOR = "bg-steel-700/30 text-steel-400 border-steel-600/30";

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || DEFAULT_CATEGORY_COLOR;
}

function getCategoryIcon(category: string) {
  const lowerCategory = category.toLowerCase();
  if (lowerCategory.includes("protein") || lowerCategory.includes("meat") || lowerCategory.includes("fish")) {
    return "🥩";
  }
  if (lowerCategory.includes("carbs") || lowerCategory.includes("grain") || lowerCategory.includes("fruit")) {
    return "🍚";
  }
  if (lowerCategory.includes("fat") || lowerCategory.includes("nut") || lowerCategory.includes("oil")) {
    return "🥑";
  }
  if (lowerCategory.includes("vegetable")) {
    return "🥦";
  }
  if (lowerCategory.includes("beverage") || lowerCategory.includes("drink")) {
    return "🥤";
  }
  if (lowerCategory.includes("snack")) {
    return "🍿";
  }
  return "🍽️";
}

export function FoodAutocomplete({
  value,
  onChange,
  onManualEntry,
  onCustomFood,
  placeholder = "Search for a food...",
}: FoodAutocompleteProps) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: foods = [], isLoading } = useQuery({
    ...searchFoodsQueryOptions(inputValue),
    enabled: isOpen && inputValue.length > 0,
  });

  const handleSelect = useCallback(
    (food: Food) => {
      setInputValue(food.name);
      onChange(food);
      setIsOpen(false);
      setSelectedIndex(-1);
      inputRef.current?.blur();
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    onChange(null);
    setInputValue("");
    inputRef.current?.focus();
  }, [onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          if (foods.length > 0) {
            setSelectedIndex((prev) => (prev < foods.length - 1 ? prev + 1 : foods.length - 1));
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < foods.length) {
            handleSelect(foods[selectedIndex]);
          }
          break;
        case "Escape":
          setIsOpen(false);
          setSelectedIndex(-1);
          break;
      }
    },
    [isOpen, foods, selectedIndex, handleSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      if (!isOpen && newValue.length > 0) {
        setIsOpen(true);
      }
    },
    [isOpen]
  );

  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[role='option']");
      items[selectedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!value) {
      setInputValue("");
    }
  }, [value]);

  const showDropdown = isOpen;
  const hasInput = inputValue.length > 0;
  const showResults = hasInput && foods.length > 0;
  const showNoResults = hasInput && !isLoading && foods.length === 0;
  const showEmptyState = !hasInput && isOpen;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="bg-steel-900/50 border-steel-700 pr-20"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls="food-listbox"
          aria-autocomplete="list"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="text-steel-500 hover:text-steel-300 transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <Search className="w-4 h-4 text-steel-500" />
        </div>
      </div>

      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-card/95 backdrop-blur-sm border border-steel-700 rounded-lg shadow-lg overflow-hidden">
          <div ref={listRef} className="max-h-[300px] overflow-y-auto">
            {isLoading && hasInput ? (
              <div className="p-4 text-center text-steel-500 text-sm">Searching...</div>
            ) : showResults ? (
              <div role="listbox" id="food-listbox" className="py-1">
                {foods.map((food, index) => (
                  <button
                    key={food.id}
                    type="button"
                    role="option"
                    aria-selected={value === food.id}
                    onClick={() => handleSelect(food)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full text-left px-3 py-2 transition-colors flex items-start gap-3 ${
                      index === selectedIndex
                        ? "bg-primary/20"
                        : value === food.id
                        ? "bg-primary/10"
                        : "hover:bg-steel-800/50"
                    }`}
                  >
                    <div className="flex-shrink-0 text-lg">{getCategoryIcon(food.category)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white text-sm truncate">{food.name}</span>
                        {food.isCustom && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-steel-700 text-steel-300 shrink-0">
                            Custom
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${getCategoryColor(food.category)}`}
                        >
                          {food.category}
                        </span>
                        <span className="text-xs text-steel-400">
                          {food.calories} kcal • {food.protein}p / {food.carbs}c / {food.fat}f
                        </span>
                        {food.servingSize && (
                          <span className="text-xs text-steel-500">({food.servingSize})</span>
                        )}
                      </div>
                    </div>
                    {value === food.id && (
                      <Check className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                    )}
                  </button>
                ))}
                {onCustomFood && (
                  <div className="border-t border-steel-800 mt-1 pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onCustomFood();
                        setIsOpen(false);
                      }}
                      className="w-full justify-start text-steel-400 hover:text-white hover:bg-steel-800 rounded-none"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create custom food
                    </Button>
                  </div>
                )}
              </div>
            ) : showNoResults ? (
              <div className="p-4 space-y-2">
                <div className="text-center text-steel-500 text-sm">No foods found</div>
                {onManualEntry && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onManualEntry();
                      setIsOpen(false);
                    }}
                    className="w-full justify-start text-steel-400 hover:text-white hover:bg-steel-800"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Enter manually instead
                  </Button>
                )}
              </div>
            ) : showEmptyState ? (
              <div className="p-4 text-center text-steel-500 text-sm">
                Type to search for foods
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
