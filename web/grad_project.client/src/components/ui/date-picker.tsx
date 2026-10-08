import { useRef } from 'react';
import { Input } from './input';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  id?: string;
  value: string; // yyyy-mm-dd format
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

// Convert yyyy-mm-dd to dd/mm/yyyy for display
function formatToEgypt(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return '';
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = 'dd/mm/yyyy',
  className,
  disabled,
  required
}: DatePickerProps) {
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const handleCalendarClick = () => {
    if (hiddenInputRef.current && !disabled) {
      hiddenInputRef.current.showPicker();
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="relative">
      {/* Visible input showing dd/mm/yyyy format */}
      <Input
        id={id}
        type="text"
        value={formatToEgypt(value)}
        placeholder={placeholder}
        className={cn('pr-10 cursor-pointer', className)}
        onClick={handleCalendarClick}
        readOnly
        disabled={disabled}
        required={required}
      />

      {/* Calendar icon */}
      <button
        type="button"
        onClick={handleCalendarClick}
        disabled={disabled}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-50"
      >
        <Calendar className="h-4 w-4" />
      </button>

      {/* Hidden native date input for the picker */}
      <input
        ref={hiddenInputRef}
        type="date"
        value={value}
        onChange={handleDateChange}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}
