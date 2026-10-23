import { forwardRef, type ReactNode } from "react";

/**
 * The lane the roaming pig walks along. While he is out it draws ground under
 * his feet and fades the page behind him, so he reads as standing on something
 * instead of sitting on top of the text.
 */
export const GroundStrip = forwardRef<
  HTMLElement,
  {
    children?: ReactNode;
    /** Set while a pig is roaming. */
    name?: string;
  }
>(function GroundStrip({ children, name }, ref) {
  return (
    <footer id="wilbur-ground" ref={ref} className="strip" data-lane={name ? "open" : undefined}>
      {children}
    </footer>
  );
});
