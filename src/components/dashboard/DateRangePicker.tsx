import React, { useState } from "react";
import type { DateRange } from "../../types";

interface DateRangePickerProps {
  onDateRangeChange: (dateRange: DateRange) => void;
  initialRange?: DateRange;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  onDateRangeChange,
  initialRange,
}) => {
  const [dateRange, setDateRange] = useState<DateRange>(
    initialRange || {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      end: new Date(),
    },
  );

  const [, setIsOpen] = useState(false);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = new Date(e.target.value);
    const newRange = { ...dateRange, start: newStart };
    setDateRange(newRange);
    onDateRangeChange(newRange);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = new Date(e.target.value);
    const newRange = { ...dateRange, end: newEnd };
    setDateRange(newRange);
    onDateRangeChange(newRange);
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const handleQuickSelect = (days: number) => {
    const end = new Date();
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const newRange = { start, end };
    setDateRange(newRange);
    onDateRangeChange(newRange);
    setIsOpen(false);
  };

  return (
    <div
      className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
      data-testid="date-range-picker"
    >
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
          From:
        </label>
        <input
          type="date"
          value={formatDateForInput(dateRange.start)}
          onChange={handleStartDateChange}
          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100"
          data-testid="date-start-input"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
          To:
        </label>
        <input
          type="date"
          value={formatDateForInput(dateRange.end)}
          onChange={handleEndDateChange}
          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100"
          data-testid="date-end-input"
        />
      </div>

      {/* Quick Select Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => handleQuickSelect(7)}
          className="px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          data-testid="quick-range-7d"
        >
          7 days
        </button>
        <button
          onClick={() => handleQuickSelect(30)}
          className="px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          data-testid="quick-range-30d"
        >
          30 days
        </button>
        <button
          onClick={() => handleQuickSelect(90)}
          className="px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          data-testid="quick-range-90d"
        >
          90 days
        </button>
      </div>
    </div>
  );
};
