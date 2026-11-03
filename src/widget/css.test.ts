import { describe, expect, it } from "vitest";
import { prepareWidgetCss } from "./css";

describe("widget CSS", () => {
  const source = `
    :root { --lane: 96px; color: black; }
    @media (max-width: 720px) { :root { --text-xl: 24px; } }
    .field { background: url("/assets/toodles/environment/backdrops/tuft.png") repeat-x; }
    body { margin: 0; }
  `;

  it("moves document selectors onto the shadow host and keeps same-origin asset paths", () => {
    const css = prepareWidgetCss(source, "");
    expect(css).not.toContain(":root");
    expect(css).toContain(":host { --lane: 96px; color: black; }");
    expect(css).toContain(":host { --text-xl: 24px; }");
    expect(css).toContain('url("/assets/toodles/environment/backdrops/tuft.png")');
    expect(css).toContain("body { margin: 0; }");
  });

  it("points root-relative assets at the hosted origin", () => {
    const css = prepareWidgetCss(source, "https://sloppy-seconds.vercel.app/");
    expect(css).toContain('url("https://sloppy-seconds.vercel.app/assets/toodles/environment/backdrops/tuft.png")');
  });

  it("rewrites the unquoted urls a production CSS minify emits", () => {
    const css = prepareWidgetCss(
      "background:url(/assets/toodles/environment/backdrops/tuft.png) repeat-x",
      "https://cdn.example.test",
    );
    expect(css).toContain("url(https://cdn.example.test/assets/toodles/environment/backdrops/tuft.png)");
  });
});
