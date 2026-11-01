/** The letter that hangs loose when the page strains: the last letter, or a named one. */
export type Hanger = "last-letter" | { word: string; character: string };

/** Splits a heading into letters the page reactions can shake loose. The real text sits beside it for screen readers. */
export function SplitText({ text, hanger }: { text: string; hanger?: Hanger }) {
  const words = text.split(" ");
  let lastLetter = -1;
  if (hanger === "last-letter") {
    let count = 0;
    for (const word of words) {
      Array.from(word).forEach((character, index) => {
        if (/[A-Za-z]/.test(character)) lastLetter = count + index;
      });
      count += Array.from(word).length;
    }
  }
  let letterIndex = 0;
  return (
    <span aria-hidden="true" className="crew-title-art">
      {words.map((word, wordIndex) => (
        <span key={`${word}-${wordIndex}`}>
          {wordIndex > 0 ? " " : null}
          <span className="crew-word">
            {Array.from(word).map((character) => {
              const index = letterIndex;
              letterIndex += 1;
              const hang =
                hanger === "last-letter"
                  ? index === lastLetter
                  : hanger?.word === word && hanger.character === character;
              return (
                <span
                  key={index}
                  className="crew-letter"
                  data-letter={index}
                  data-word={word.toLowerCase()}
                  {...(hang ? { "data-hanger": "1" } : {})}
                >
                  {character}
                </span>
              );
            })}
          </span>
        </span>
      ))}
    </span>
  );
}
