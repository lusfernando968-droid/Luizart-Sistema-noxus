import React, { useState, useEffect } from "react";
import { Input } from "./input";

interface CurrencyInputProps extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
  value: number;
  onChange: (value: number) => void;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState("");

    // Format number to R$ string
    const formatCurrency = (val: number) => {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
      }).format(val);
    };

    // Update display value when prop value changes (from outside)
    useEffect(() => {
      setDisplayValue(formatCurrency(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let rawValue = e.target.value;
      
      // Remove all non-digits
      rawValue = rawValue.replace(/\D/g, "");
      
      // If empty after stripping non-digits, set to 0
      if (rawValue === "") {
        onChange(0);
        return;
      }
      
      // Parse as integer and divide by 100 to get cents
      const numValue = parseInt(rawValue, 10) / 100;
      
      // Update external state
      onChange(numValue);
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
      />
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";
