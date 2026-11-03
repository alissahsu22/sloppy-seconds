/** Opt existing Squarespace blocks into reactions using configured selectors. */
export function markHostStrain(photos: string, headings: string, doc: Document = document): () => void {
  const restores: Array<() => void> = [];
  for (const [selector, kind] of [
    [photos, "photo"],
    [headings, "letters"],
  ]) {
    if (!selector) continue;
    let nodes: HTMLElement[];
    try {
      nodes = [...doc.querySelectorAll<HTMLElement>(selector)];
    } catch {
      continue;
    }
    for (const node of nodes) {
      if (node.closest("[data-ss-engine], [data-ss-mount]")) continue;
      const previous = node.getAttribute("data-ss-strain");
      node.setAttribute("data-ss-strain", kind);
      restores.push(() => {
        if (previous === null) node.removeAttribute("data-ss-strain");
        else node.setAttribute("data-ss-strain", previous);
      });
    }
  }
  return () => restores.reverse().forEach((restore) => restore());
}

/**
 * Splits text inside elements the host marked for falling letters.
 * The original markup is restored on teardown. Unmarked page copy is never touched.
 */
export function splitHostLetters(doc: Document = document): () => void {
  const restores: Array<() => void> = [];
  for (const block of doc.querySelectorAll<HTMLElement>("[data-ss-strain='letters']")) {
    if (block.closest("[data-ss-engine], [data-ss-mount]")) continue;
    if (block.querySelector(".crew-letter")) continue;
    const original = block.innerHTML;
    let index = 0;
    const texts: Text[] = [];
    const walker = doc.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const text = walker.currentNode;
      if (text instanceof Text && text.parentElement?.closest("script, style") == null) texts.push(text);
    }
    for (const text of texts) {
      const value = text.textContent ?? "";
      if (!value) continue;
      const fragment = doc.createDocumentFragment();
      for (const part of value.split(/(\s+)/)) {
        if (!part) continue;
        if (/^\s+$/.test(part)) {
          fragment.append(doc.createTextNode(part));
          continue;
        }
        const word = doc.createElement("span");
        word.className = "crew-word";
        word.style.display = "inline-block";
        word.style.whiteSpace = "nowrap";
        for (const character of Array.from(part)) {
          const letter = doc.createElement("span");
          letter.className = "crew-letter";
          letter.dataset.letter = String(index);
          letter.dataset.word = part.toLowerCase();
          letter.textContent = character;
          letter.style.display = "inline-block";
          letter.style.transformOrigin = "50% 0";
          word.append(letter);
          index += 1;
        }
        fragment.append(word);
      }
      text.parentNode?.replaceChild(fragment, text);
    }
    const letters = [...block.querySelectorAll<HTMLElement>(".crew-letter")];
    const hanger = [...letters].reverse().find((letter) => /[A-Za-z]/.test(letter.textContent ?? ""));
    if (hanger) hanger.dataset.hanger = "1";
    restores.push(() => {
      block.innerHTML = original;
    });
  }
  return () => {
    for (const restore of restores) restore();
  };
}
