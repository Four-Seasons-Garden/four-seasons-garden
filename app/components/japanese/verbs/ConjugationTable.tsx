"use client";

import { Fragment, useEffect, useRef, useState, type CSSProperties } from "react";
import { JapaneseText } from "@/app/components/japanese/JapaneseText";
import { CellDetail } from "./CellDetail";
import {
  FAMILIES,
  FORM_BY_ID,
  conjugate,
  endingOf,
  glossFor,
  type FormId,
  type Politeness,
  type Verb,
} from "@/lib/japanese/verbs";

export type OpenDetail = { verbId: string; formId: FormId | null };

/* Godan verbs are grouped by their て/た family — the only thing that actually
   varies between them. The other classes are one undivided block. */
function groupVerbs(verbs: Verb[]) {
  if (verbs.length === 0 || verbs[0].group !== "godan") {
    return [{ id: "all", label: null as string | null, change: null as string | null, blurb: null as string | null, verbs }];
  }
  return FAMILIES.map((family) => ({
    id: family.id,
    label: family.label,
    change: family.change,
    blurb: family.blurb,
    verbs: verbs.filter((verb) => family.endings.includes(endingOf(verb))),
  })).filter((block) => block.verbs.length > 0);
}

export function ConjugationTable({
  verbs,
  forms,
  politeness,
  furigana,
  practice,
  revealed,
  onReveal,
  open,
  onOpen,
}: {
  verbs: Verb[];
  forms: FormId[];
  politeness: Politeness;
  furigana: boolean;
  practice: boolean;
  revealed: Set<string>;
  onReveal: (key: string) => void;
  open: OpenDetail | null;
  onOpen: (detail: OpenDetail | null) => void;
}) {
  const columnCount = forms.length + 1;
  const blocks = groupVerbs(verbs);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<number | null>(null);

  /* With every column switched on the table is wider than the screen, and a
     detail row spans all of it. Measuring the visible width lets the card pin
     itself to the left edge instead of trailing off past it. */
  useEffect(() => {
    const node = scrollRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      const style = window.getComputedStyle(node);
      const inner =
        node.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      setViewport(inner > 0 ? inner : null);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="verb-table-scroll"
      ref={scrollRef}
      style={viewport ? ({ "--verb-viewport": `${viewport}px` } as CSSProperties) : undefined}
    >
      <table className="verb-table" data-furigana={furigana}>
        <thead>
          <tr>
            <th scope="col" className="verb-table-corner">Verb</th>
            {forms.map((formId) => {
              const meta = FORM_BY_ID.get(formId);
              const echoesPlain = formId === "te" && politeness === "polite";
              return (
                <th scope="col" key={formId} data-echo={echoesPlain}>
                  <span className="verb-col-name">{meta?.column}</span>
                  <span className="verb-col-jp">
                    {echoesPlain ? "identical to plain" : meta?.japanese}
                  </span>
                  <span className="verb-col-gloss">{meta?.gloss}</span>
                </th>
              );
            })}
          </tr>
        </thead>

        {blocks.map((block) => (
          <tbody key={block.id}>
            {block.label && (
              <tr className="verb-family-row">
                <th scope="colgroup" colSpan={columnCount}>
                  <span className="verb-family-name">{block.label}</span>
                  <span className="verb-family-change">{block.change}</span>
                  <span className="verb-family-blurb">{block.blurb}</span>
                </th>
              </tr>
            )}

            {block.verbs.map((verb) => {
              const dictionary = conjugate(verb, "nonpast", "plain");
              const verbOpen = open?.verbId === verb.id;

              return (
                <Fragment key={verb.id}>
                <tr data-open={verbOpen}>
                  <th scope="row" className="verb-row-head">
                    <button
                      type="button"
                      className="verb-row-button"
                      aria-expanded={verbOpen && open?.formId === null}
                      onClick={() =>
                        onOpen(verbOpen && open?.formId === null ? null : { verbId: verb.id, formId: null })
                      }
                    >
                      <span className="verb-row-jp">
                        <JapaneseText parts={dictionary.parts} />
                        {verb.soundException && (
                          <span className="verb-row-flag" title="Breaks its family's sound change">exception</span>
                        )}
                      </span>
                      <span className="verb-row-meaning">{verb.meaning}</span>
                    </button>
                  </th>

                  {forms.map((formId) => {
                    const cell = conjugate(verb, formId, politeness);
                    const key = `${verb.id}:${formId}:${politeness}`;
                    const isHidden = practice && !revealed.has(key);
                    const isActive = verbOpen && open?.formId === formId;

                    return (
                      <td key={formId}>
                        <button
                          type="button"
                          className="verb-cell"
                          data-available={cell.available}
                          data-hidden={isHidden}
                          data-active={isActive}
                          aria-expanded={isActive}
                          aria-label={
                            isHidden
                              ? `Reveal ${FORM_BY_ID.get(formId)?.label} of ${verb.head}${verb.tail}`
                              : `${cell.reading || "no such form"} — ${glossFor(verb, formId)} — ${FORM_BY_ID.get(formId)?.label} of ${verb.head}${verb.tail}`
                          }
                          onClick={() => {
                            /* In practice mode the first click is the answer
                               reveal; only a second click opens the details. */
                            if (isHidden) {
                              onReveal(key);
                              return;
                            }
                            onOpen(isActive ? null : { verbId: verb.id, formId });
                          }}
                        >
                          {cell.available
                            ? <JapaneseText parts={cell.parts} />
                            : <span className="verb-cell-gap">—</span>}
                          {cell.available && (
                            <span className="verb-cell-gloss">{glossFor(verb, formId)}</span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>

                {/* The explanation opens directly beneath the row it belongs
                    to, so the form stays on screen while you read about it. */}
                {verbOpen && (
                  <tr className="verb-detail-row">
                    <td colSpan={columnCount}>
                      <CellDetail
                        verb={verb}
                        formId={open.formId}
                        politeness={politeness}
                        onClose={() => onOpen(null)}
                      />
                    </td>
                  </tr>
                )}
                </Fragment>
              );
            })}
          </tbody>
        ))}
      </table>
    </div>
  );
}
