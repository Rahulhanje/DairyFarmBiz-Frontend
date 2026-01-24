import React, { useState } from 'react';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLanguage } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onDateChange: (start: Date | undefined, end: Date | undefined) => void;
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onDateChange,
  className,
}) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const presets = [
    {
      label: t('today'),
      onClick: () => {
        const today = new Date();
        onDateChange(today, today);
      },
    },
    {
      label: t('this_week'),
      onClick: () => {
        const today = new Date();
        onDateChange(startOfWeek(today), endOfWeek(today));
      },
    },
    {
      label: t('this_month'),
      onClick: () => {
        const today = new Date();
        onDateChange(startOfMonth(today), endOfMonth(today));
      },
    },
    {
      label: 'Last 7 Days',
      onClick: () => {
        const today = new Date();
        onDateChange(subDays(today, 7), today);
      },
    },
    {
      label: 'Last 30 Days',
      onClick: () => {
        const today = new Date();
        onDateChange(subDays(today, 30), today);
      },
    },
  ];

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {presets.slice(0, 3).map((preset) => (
        <Button
          key={preset.label}
          variant="outline"
          size="sm"
          onClick={preset.onClick}
          className="text-xs"
        >
          {preset.label}
        </Button>
      ))}
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="text-xs gap-2">
            <CalendarIcon className="h-3.5 w-3.5" />
            {startDate && endDate
              ? `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}`
              : t('custom_range')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 border-b border-border">
            <div className="flex flex-wrap gap-1">
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    preset.onClick();
                    setIsOpen(false);
                  }}
                  className="text-xs"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
          <Calendar
            mode="range"
            selected={{ from: startDate, to: endDate }}
            onSelect={(range) => {
              onDateChange(range?.from, range?.to);
              if (range?.from && range?.to) {
                setIsOpen(false);
              }
            }}
            numberOfMonths={1}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
