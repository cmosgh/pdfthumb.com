import React, { createContext, useContext } from "react";
import { cx } from "./cx";
import { textTone, type TextTone } from "./typography";

// The scrolling wrapper around a table.
const frameVariant = {
  // OveragePricingSection.
  overage: "overflow-x-auto rounded-lg shadow-lg bg-surface border border-line",
  // Docs request fields.
  docs: "overflow-x-auto rounded-lg border border-line",
  // ApiKeysManager.
  plain: "overflow-x-auto",
} as const;

export type TableFrameVariant = keyof typeof frameVariant;

export interface TableFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  variant: TableFrameVariant;
}

export const TableFrame: React.FC<TableFrameProps> = ({
  variant,
  className,
  ...rest
}) => <div className={cx(frameVariant[variant], className)} {...rest} />;

// Cell padding. comfortable: ApiKeysManager; responsive: overage;
// compact: docs.
const thDensity = {
  comfortable: "px-6 py-3",
  responsive: "px-4 sm:px-6 py-3",
  compact: "px-3 py-2",
} as const;
const tdDensity = {
  comfortable: "px-6 py-4",
  responsive: "px-4 sm:px-6 py-4",
  compact: "px-3 py-2",
} as const;

export type TableDensity = keyof typeof thDensity;

const DensityContext = createContext<TableDensity>("comfortable");

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  density?: TableDensity;
}

export const Table: React.FC<TableProps> = ({
  density = "comfortable",
  className,
  ...rest
}) => (
  <DensityContext.Provider value={density}>
    <table
      className={cx("min-w-full divide-y divide-line", className)}
      {...rest}
    />
  </DensityContext.Provider>
);

export const THead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  ...rest
}) => <thead className={cx("bg-muted", className)} {...rest} />;

export interface TBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  // bg-surface rows (overage, ApiKeysManager); docs rows are transparent.
  surface?: boolean;
}

export const TBody: React.FC<TBodyProps> = ({
  surface = false,
  className,
  ...rest
}) => (
  <tbody
    className={cx(surface && "bg-surface", "divide-y divide-line", className)}
    {...rest}
  />
);

// Column headings. Alignment (text-left, text-center) and width come from
// the caller. Overage's featured column also had font-bold, but
// .font-medium comes later in the built CSS, so it rendered medium:
// there's deliberately no "featured" prop.
export const Th: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  ...rest
}) => {
  const density = useContext(DensityContext);
  return (
    <th
      className={cx(
        thDensity[density],
        "text-xs font-medium text-fg-label uppercase tracking-wider",
        className,
      )}
      {...rest}
    />
  );
};

export interface TdProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  // text-sm unless false: a cell holding only a badge keeps the inherited
  // size, so its line box doesn't change (ApiKeysManager's Status).
  text?: boolean;
  tone?: TextTone;
  weight?: "medium";
  // A <th scope="row"> styled as a body cell: the row's name
  rowHeader?: boolean;
}

// Body cells. whitespace-*, alignment and vertical alignment come from
// the caller.
export const Td: React.FC<TdProps> = ({
  text = true,
  tone,
  weight,
  rowHeader = false,
  className,
  ...rest
}) => {
  const density = useContext(DensityContext);
  const Cell = rowHeader ? "th" : "td";
  return (
    <Cell
      scope={rowHeader ? "row" : undefined}
      className={cx(
        tdDensity[density],
        text && "text-sm",
        weight === "medium" ? "font-medium" : rowHeader && "font-normal",
        tone && textTone[tone],
        className,
      )}
      {...rest}
    />
  );
};
