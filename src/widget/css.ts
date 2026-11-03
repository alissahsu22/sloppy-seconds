/**
 * Styles injected into the embed's shadow roots.
 * `:root` is retargeted at the shadow host. `html` and `body` are left as written:
 * they do not match anything inside the shadow tree. Asset urls are rewritten to
 * the configured origin, quoted or not. Keyframe names stay as they are: a shadow
 * stylesheet does not share them with the host page.
 */
export function prepareWidgetCss(css: string, assetBase: string): string {
  const origin = assetBase.trim().replace(/\/+$/, "");
  const withAssets = css.replace(/url\(\s*(['"]?)\/assets\//g, (_match, quote: string) => {
    const prefix = origin ? `${origin}/assets/` : "/assets/";
    return `url(${quote}${prefix}`;
  });
  return withAssets.replace(/:root\b/g, ":host");
}
