import { createHash } from "node:crypto";

export function releaseSnippets(config, script) {
  const version = createHash("sha256").update(script).digest("hex").slice(0, 12);
  const integrity = `sha384-${createHash("sha384").update(script).digest("base64")}`;
  const footer = `<script
  src="${config.assetBase}/widget/sanctuary.js?v=${version}"
  defer
  crossorigin="anonymous"
  integrity="${integrity}"
  data-asset-base="${config.assetBase}"
  data-only-path="${config.onlyPath}"
  data-help-href="${config.helpHref}"
  data-animals="${config.animals}"
  data-clearance="${config.clearance}"
  data-strain-photos="${config.strainPhotos}"
  data-strain-letters="${config.strainLetters}"
></script>
`;
  const launcher = `<div data-ss-mount></div>
<noscript>The animal stories need JavaScript. You can still meet the animals on this page.</noscript>
`;
  return { version, integrity, footer, launcher };
}
