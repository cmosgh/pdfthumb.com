import React from "react";
import { cx } from "./cx";

const tab = "px-3 py-1 rounded-md text-sm font-medium";
const tabSelected = "bg-accent text-on-accent";
const tabIdle = "bg-muted text-fg-2 hover:bg-muted-hover";

export interface TabItem<T extends string> {
  id: T;
  label: React.ReactNode;
}

export interface TabsProps<T extends string> {
  items: readonly TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  // The id of each tab button; the panel's aria-labelledby uses it too.
  idFor: (value: T) => string;
  // The id of the panel every tab controls.
  panelId: string;
  // The tablist's aria-label.
  label: string;
  // Merged onto the tablist (margins).
  className?: string;
}

// A WAI-ARIA tablist: one tab in the tab order (roving tabIndex); the
// arrow keys move and select, wrapping at the ends.
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  idFor,
  panelId,
  label,
  className,
}: TabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cx("flex flex-wrap gap-1", className)}
    >
      {items.map((item, index) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            id={idFor(item.id)}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={panelId}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(event) => {
              const step =
                event.key === "ArrowRight"
                  ? 1
                  : event.key === "ArrowLeft"
                    ? -1
                    : 0;
              if (!step) return;
              event.preventDefault();
              const count = items.length;
              const next = items[(index + step + count) % count].id;
              onChange(next);
              document.getElementById(idFor(next))?.focus();
            }}
            className={cx(tab, selected ? tabSelected : tabIdle)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
