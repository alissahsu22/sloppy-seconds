import { forwardRef, type ReactNode } from "react";

export const GroundStrip = forwardRef<HTMLElement, { children?: ReactNode }>(function GroundStrip(
  { children },
  ref,
) {
  return (
    <footer id="wilbur-ground" ref={ref} className="strip">
      {children}
    </footer>
  );
});
