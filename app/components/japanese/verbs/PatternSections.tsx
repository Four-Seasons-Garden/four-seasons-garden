"use client";

import { Fragment, useState } from "react";
import { X } from "lucide-react";
import { JapaneseText } from "@/app/components/japanese/JapaneseText";
import { TE_PATTERNS, causativePassivePair } from "@/lib/japanese/verb-grammar";
import { VERBS, conjugate } from "@/lib/japanese/verbs";

export function TePatternTable() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="verb-table-scroll">
      <table className="verb-table verb-pattern-table">
        <thead>
          <tr>
            <th scope="col">pattern</th>
            <th scope="col">meaning</th>
            <th scope="col">example</th>
          </tr>
        </thead>
        <tbody>
          {TE_PATTERNS.map((pattern) => {
            const isOpen = open === pattern.id;
            return (
              <Fragment key={pattern.id}>
                <tr data-open={isOpen}>
                  <th scope="row" className="verb-row-head">
                    <button
                      type="button"
                      className="verb-row-button"
                      aria-expanded={isOpen}
                      onClick={() => setOpen(isOpen ? null : pattern.id)}
                    >
                      <span className="verb-row-jp verb-pattern-name">{pattern.pattern}</span>
                    </button>
                  </th>
                  <td className="verb-pattern-meaning">
                    <button type="button" className="verb-cell verb-cell-text" data-active={isOpen} onClick={() => setOpen(isOpen ? null : pattern.id)}>
                      {pattern.meaning}
                    </button>
                  </td>
                  <td className="verb-pattern-example">
                    <button type="button" className="verb-cell" data-active={isOpen} onClick={() => setOpen(isOpen ? null : pattern.id)}>
                      <JapaneseText parts={pattern.example.parts} />
                    </button>
                  </td>
                </tr>
                {isOpen && (
                  <tr className="verb-detail-row">
                    <td colSpan={3}>
                      <article className="verb-detail" data-variant="pattern">
                        <header className="verb-detail-head">
                          <div>
                            <p className="verb-detail-eyebrow">て-form pattern</p>
                            <h4 className="verb-detail-title">{pattern.pattern}</h4>
                            <p className="verb-detail-gloss">{pattern.meaning}</p>
                          </div>
                          <button className="verb-detail-close" type="button" onClick={() => setOpen(null)} aria-label="Close details">
                            <X size={15} />
                          </button>
                        </header>
                        <p className="verb-rule-body">{pattern.note}</p>
                        <div className="verb-example">
                          <p className="verb-example-label">Example</p>
                          <p className="verb-example-jp"><JapaneseText parts={pattern.example.parts} /></p>
                          <p className="verb-example-en">{pattern.example.translation}</p>
                        </div>
                      </article>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* Built from the conjugator rather than typed out, so the す exception and the
   ichidan non-contraction are demonstrated by the same code that renders them
   everywhere else on the page. */
export function CausativePassiveTable() {
  const rows = VERBS.filter((verb) =>
    ["kaku", "yomu", "matsu", "kau", "hanasu", "taberu", "suru", "kuru"].includes(verb.id),
  );

  return (
    <div className="verb-table-scroll">
      <table className="verb-table verb-pattern-table">
        <thead>
          <tr>
            <th scope="col">verb</th>
            <th scope="col">full form</th>
            <th scope="col">contracted</th>
            <th scope="col">why</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((verb) => {
            const pair = causativePassivePair(verb);
            const dictionary = conjugate(verb, "nonpast", "plain");
            if (!pair) return null;

            return (
              <tr key={verb.id}>
                <th scope="row" className="verb-row-head">
                  <span className="verb-row-jp"><JapaneseText parts={dictionary.parts} /></span>
                </th>
                <td className="verb-plain-cell">{pair.full}</td>
                <td className="verb-plain-cell" data-strong={Boolean(pair.contracted)}>
                  {pair.contracted ?? "—"}
                </td>
                <td className="verb-pattern-meaning verb-plain-cell">{pair.note}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
