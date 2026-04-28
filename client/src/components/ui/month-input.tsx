"use client";

import * as React from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MonthInputProps extends Omit<React.ComponentProps<"input">, "type"> {
  wrapperClassName?: string;
}

/**
 * Month picker (YYYY-MM) with a calendar icon that opens the native month picker.
 * Keyboard entry is blocked; users choose via the picker (same pattern as DateInput).
 */
const MonthInput = React.forwardRef<HTMLInputElement, MonthInputProps>(
  ({ className, wrapperClassName, onKeyDown, readOnly: _readOnly, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    const openPicker = React.useCallback(() => {
      const el = inputRef.current;
      if (!el) return;
      if (typeof (el as HTMLInputElement & { showPicker?: () => void }).showPicker === "function") {
        (el as HTMLInputElement & { showPicker: () => void }).showPicker();
      } else {
        el.click();
      }
    }, []);

    return (
      <div className={cn("relative flex items-center", wrapperClassName)}>
        <input
          type="month"
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
            "flex h-9 min-w-[150px] rounded-md border border-input bg-transparent pl-3 pr-10 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm [color-scheme:light]",
            "[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:pointer-events-none",
            className
          )}
          style={{ colorScheme: "light" }}
          title="Select month from calendar"
          {...props}
        />
        <button
          type="button"
          onClick={openPicker}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          title="Open month calendar"
          aria-label="Open calendar to select month"
        >
          <Calendar className="h-4 w-4" />
        </button>
      </div>
    );
  }
);
MonthInput.displayName = "MonthInput";

export { MonthInput };
