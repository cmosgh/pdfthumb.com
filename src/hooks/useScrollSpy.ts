import { useEffect, useState } from "react";

// The section a reader is on (#142): of the sections whose box crosses a
// band below the sticky header, the first in page order. Between sections
// the last one stays current.
export function useScrollSpy(ids: readonly string[]): string {
  const [current, setCurrent] = useState(ids[0]);

  useEffect(() => {
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        const first = ids.find((id) => visible.has(id));
        if (first) setCurrent(first);
      },
      // From just under the header (and the phone's docs bar) to 40% down.
      { rootMargin: "-120px 0px -60% 0px" },
    );
    for (const id of ids) {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [ids]);

  return current;
}
