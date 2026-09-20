"use client";

import type { JapanesePart } from "@/lib/music/learning";
import type { JapaneseTextLink } from "@/lib/music/japanese-text";

/* Renders furigana over each kanji group. Parts without a reading stay plain so
   particles remain visible beside the ruby text. */
export function JapaneseText({
  parts,
  partLinks,
}: {
  parts: JapanesePart[];
  partLinks?: Record<number, JapaneseTextLink[]>;
}) {
  return (
    <span className="japanese-text">
      {parts.map((part, index) => {
        const links = partLinks?.[index] ?? [];
        const content = part.reading ? (
          <ruby>
            {part.text}
            <rt>{part.reading}</rt>
          </ruby>
        ) : (
          <span className="japanese-text-plain-part">{part.text}</span>
        );

        if (links.length === 0) {
          return <span key={`${part.text}-${index}`}>{content}</span>;
        }

        return (
          <button
            className="japanese-text-part-link"
            key={`${part.text}-${index}`}
            type="button"
            onClick={links[0].onClick}
            aria-label={`Open ${links.map((link) => link.label).join(" and ")}`}
            title={links.map((link) => link.label).join(" · ")}
          >
            {content}
          </button>
        );
      })}
    </span>
  );
}
