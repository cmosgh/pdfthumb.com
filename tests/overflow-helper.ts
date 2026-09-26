import type { Locator } from "@playwright/test";

export interface Overflow {
  /** A short CSS-ish selector: tag#id.class */
  selector: string;
  /** The element's right edge, in the same viewport-relative px used for `limit`. */
  right: number;
  /** The element's width, in px. */
  width: number;
}

/**
 * Finds the element inside `container` whose right edge extends furthest
 * past `limit` (a viewport-relative px coordinate, e.g. the viewport width
 * or a container's own right edge). Used to name the offending element in a
 * fit assertion's failure message, since "overflow is 7px" alone doesn't say
 * which element to fix. Returns null when nothing overflows.
 */
export async function widestOverflow(
  container: Locator,
  limit: number,
): Promise<Overflow | null> {
  return container.evaluate((root, limit) => {
    const shortSelector = (el: Element): string => {
      const tag = el.tagName.toLowerCase();
      const id = el.id ? `#${el.id}` : "";
      const cls = el.classList.length
        ? `.${Array.from(el.classList).slice(0, 2).join(".")}`
        : "";
      return `${tag}${id}${cls}`;
    };

    let widest: { selector: string; right: number; width: number } | null =
      null;
    for (const el of root.querySelectorAll("*")) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      if (rect.right > limit && (!widest || rect.right > widest.right)) {
        widest = {
          selector: shortSelector(el),
          right: rect.right,
          width: rect.width,
        };
      }
    }
    return widest;
  }, limit);
}

/** Formats a `widestOverflow` result for an assertion's failure message. */
export function describeOverflow(overflow: Overflow | null): string {
  if (!overflow) return "no element overflows the limit";
  return `${overflow.selector} right edge ${overflow.right.toFixed(1)}px, width ${overflow.width.toFixed(1)}px`;
}
