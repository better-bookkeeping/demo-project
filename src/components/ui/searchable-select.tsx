import { useState, useMemo, useRef, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ id: string; name: string; isBodyWeight?: boolean }>;
  placeholder?: string;
  className?: string;
  "data-testid"?: string;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className,
  "data-testid": testId,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((o) => o.id === value);

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    return options.filter((o) => o.name.toLowerCase().includes(search.toLowerCase()));
  }, [options, search]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          data-testid={testId || "searchable-select-trigger"}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            "w-full h-12 flex items-center justify-between px-3 py-2",
            "text-sm bg-steel-900/50 border border-steel-700 rounded-md",
            "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
            "hover:border-steel-600 transition-colors",
            "text-left",
            !selectedOption && "text-steel-500",
            className
          )}
        >
          <span>{selectedOption ? selectedOption.name : placeholder}</span>
          <ChevronDown className="w-4 h-4 text-steel-500 ml-2" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        data-testid="searchable-select-popover"
        className="w-full p-0 bg-card border border-steel-700"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel-500" />
            <Input
              data-testid="searchable-select-search"
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="pl-9 bg-steel-900/50 border-steel-700 focus:border-primary"
            />
          </div>
        </div>
        <div className="max-h-[200px] overflow-y-auto" role="listbox">
          {filteredOptions.length === 0 ? (
            <div data-testid="searchable-select-empty" className="py-6 text-center text-sm text-steel-500">No results found</div>
          ) : (
            <div className="py-1">
              {filteredOptions.map((option) => (
                <button
                  data-testid={`searchable-select-option-${option.id}`}
                  key={option.id}
                  type="button"
                  role="option"
                  aria-selected={option.id === value}
                  onClick={() => {
                    onChange(option.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2",
                    "text-sm text-left hover:bg-steel-800 transition-colors",
                    "focus:bg-steel-800 focus:outline-none"
                  )}
                >
                  <span className="flex items-center gap-2">
                    {option.name}
                    {option.isBodyWeight && <span className="text-[10px] text-primary">(BW)</span>}
                  </span>
                  {option.id === value && <Check className="w-4 h-4 text-primary" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
