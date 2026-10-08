import { useState, useEffect, type ChangeEvent } from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface DateInputProps {
  id?: string;
  value: string; // Expected format: yyyy-mm-dd (ISO) or empty
  onChange: (value: string) => void; // Returns yyyy-mm-dd format for API
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

// Convert yyyy-mm-dd to dd/mm/yyyy
function isoToEgypt(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return '';
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// Convert dd/mm/yyyy to yyyy-mm-dd
function egyptToIso(egyptDate: string): string {
  if (!egyptDate) return '';
  const parts = egyptDate.split('/');
  if (parts.length !== 3) return '';
  const [day, month, year] = parts;
  if (!day || !month || !year) return '';
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Validate dd/mm/yyyy format
function isValidEgyptDate(value: string): boolean {
  if (!value) return true;
  const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = value.match(regex);
  if (!match) return false;

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false;

  // Check days in month
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day > daysInMonth) return false;

  return true;
}

export function DateInput({ id, value, onChange, placeholder = 'dd/mm/yyyy', className, disabled }: DateInputProps) {
  const [displayValue, setDisplayValue] = useState(() => isoToEgypt(value));
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    setDisplayValue(isoToEgypt(value));
  }, [value]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;

    // Auto-format: add slashes after dd and mm
    const digits = inputValue.replace(/\D/g, '');
    if (digits.length <= 2) {
      inputValue = digits;
    } else if (digits.length <= 4) {
      inputValue = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else {
      inputValue = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    }

    setDisplayValue(inputValue);

    // Validate and convert
    if (inputValue === '') {
      setIsValid(true);
      onChange('');
    } else if (isValidEgyptDate(inputValue)) {
      setIsValid(true);
      const isoValue = egyptToIso(inputValue);
      if (isoValue) {
        onChange(isoValue);
      }
    } else {
      setIsValid(false);
    }
  };

  const handleBlur = () => {
    // On blur, try to fix incomplete dates
    if (displayValue && !isValidEgyptDate(displayValue)) {
      setDisplayValue(isoToEgypt(value));
      setIsValid(true);
    }
  };

  return (
    <Input
      id={id}
      type="text"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={cn(
        !isValid && 'border-red-500 focus-visible:ring-red-500',
        className
      )}
      disabled={disabled}
      maxLength={10}
    />
  );
}
