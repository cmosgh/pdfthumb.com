// Joins class names, dropping falsy ones. Order is irrelevant to the
// result: Tailwind orders the CSS, not the class attribute.
export type ClassValue = string | false | null | undefined | 0;

export function cx(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
