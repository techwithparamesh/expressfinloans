"use client";

import * as React from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DateInputProps extends Omit<React.ComponentProps<"input">, "type"> {
  /** Optional class for the wrapper */
  wrapperClassName?: string;
}

/**
 * Date input with a visible calendar icon that opens the native date picker.
 * Manual keyboard entry is disabled; users select the date via the calendar only.
 */
const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, wrapperClassName, onKeyDown, readOnly: _readOnly, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    const openPicker = React.useCallback(() => {
      const el = inputRef.current;
      if (!el) return;
      // showPicker() cannot be used when input is readOnly (immutable). We block typing via onKeyDown instead.
      if (typeof el.showPicker === "function") {
        el.showPicker();
      } else {
        el.click();
      }
    }, []);

    return (
      <div className={cn("relative flex items-center", wrapperClassName)}>
        <input
          type="date"
          ref={(node) => {
            (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
          }}
          onKeyDown={(e) => {
            e.preventDefault();
            onKeyDown?.(e);
          }}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent pl-3 pr-10 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm [color-scheme:light]",
            "[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:pointer-events-none",
            className
          )}
          style={{ colorScheme: "light" }}
          title="Select date from calendar"
          {...props}
        />
        <button
          type="button"
          onClick={openPicker}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          title="Open calendar"
          aria-label="Open calendar to select date"
        >
          <Calendar className="h-4 w-4" />
        </button>
      </div>
    );
  }
);
DateInput.displayName = "DateInput";

export { DateInput };
