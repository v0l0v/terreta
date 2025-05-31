import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type ComparisonOperator = "all" | "eq" | "gt" | "gte" | "lt" | "lte";

export interface MinimalComparisonFilterProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  operator: ComparisonOperator;
  onOperatorChange: (operator: ComparisonOperator) => void;
  options: Array<{ value: string; label: string }>;
  className?: string;
  compact?: boolean;
}

export function MinimalComparisonFilter({
  label,
  value,
  onValueChange,
  operator,
  onOperatorChange,
  options,
  className,
  compact = false,
}: MinimalComparisonFilterProps) {
  // Combine operator and value into a single meaningful string
  const getCombinedValue = () => {
    if (operator === "all") return "all";
    return `${operator}-${value}`;
  };
  
  const setCombinedValue = (combined: string) => {
    if (combined === "all") {
      onOperatorChange("all");
      return;
    }
    
    const [op, val] = combined.split('-');
    onOperatorChange(op as ComparisonOperator);
    onValueChange(val);
  };
  
  const getDisplayText = (combined: string) => {
    if (combined === "all") return `All ${label.toLowerCase()}s`;
    
    const [op, val] = combined.split('-');
    const option = options.find(o => o.value === val);
    if (!option) return "Select...";
    
    const rating = compact ? option.label.split(' - ')[0] : option.label;
    
    switch (op) {
      case "eq": return rating;
      case "gte": return `${rating}+`;
      case "lte": return `≤ ${rating.split(' - ')[0]}`;
      default: return rating;
    }
  };
  
  return (
    <div className={cn("space-y-1", className)}>
      {!compact && (
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          {label}
        </label>
      )}
      
      <Select value={getCombinedValue()} onValueChange={setCombinedValue}>
        <SelectTrigger className="h-9">
          <SelectValue>
            <span className={cn(
              "text-sm",
              operator === "all" ? "text-gray-600 dark:text-gray-400" : "text-gray-900 dark:text-gray-100"
            )}>
              {getDisplayText(getCombinedValue())}
            </span>
          </SelectValue>
        </SelectTrigger>
        
        <SelectContent>
          {/* All option */}
          <SelectItem value="all">
            <span className="text-gray-600">All {label.toLowerCase()}s</span>
          </SelectItem>
          
          {/* Simplified options - only the most useful ones */}
          {options.map((option) => (
            <React.Fragment key={option.value}>
              {/* Exact match */}
              <SelectItem value={`eq-${option.value}`}>
                <div className="flex justify-between items-center w-full">
                  <span>{option.label}</span>
                  <span className="text-xs text-gray-500 ml-4">exactly</span>
                </div>
              </SelectItem>
              
              {/* At least (most common for difficulty/terrain) */}
              <SelectItem value={`gte-${option.value}`}>
                <div className="flex justify-between items-center w-full">
                  <span>{option.label}+</span>
                  <span className="text-xs text-gray-500 ml-4">or harder</span>
                </div>
              </SelectItem>
              
              {/* At most */}
              <SelectItem value={`lte-${option.value}`}>
                <div className="flex justify-between items-center w-full">
                  <span>≤ {option.label.split(' - ')[0]}</span>
                  <span className="text-xs text-gray-500 ml-4">or easier</span>
                </div>
              </SelectItem>
            </React.Fragment>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}