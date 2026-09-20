"use client";

import { useState } from "react";
import { FAMILIES, GODAN_ROWS } from "@/lib/japanese/verbs";

type Column = "a" | "i" | "u" | "e" | "o";

const COLUMNS: { id: Column; kana: string; name: string }[] = [
  { id: "a", kana: "あ", name: "あ base" },
  { id: "i", kana: "い", name: "い base" },
  { id: "u", kana: "う", name: "う base" },
  { id: "e", kana: "え", name: "え base" },
  { id: "o", kana: "お", name: "お base" },
];

/* What each base feeds. This is the whole godan system on one page: pick a
   form, and the chart shows you which kana to slide to. */
const FEEDS: { column: Column; label: string; forms: string; example: string }[] = [
  { column: "a", label: "あ base", forms: "negative · passive · causative", example: "書かない ・ 書かれる ・ 書かせる" },
  { column: "i", label: "い base", forms: "every polite form · volitional ましょう", example: "書きます ・ 書きましょう" },
  { column: "u", label: "う base", forms: "the dictionary form itself", example: "書く" },
  { column: "e", label: "え base", forms: "potential · conditional ば · imperative", example: "書ける ・ 書けば ・ 書け" },
  { column: "o", label: "お base", forms: "volitional", example: "書こう" },
];

const ENDINGS = Object.keys(GODAN_ROWS);

export function BaseChart() {
  const [active, setActive] = useState<Column | null>(null);

  return (
    <div className="verb-bases">
      <div className="verb-bases-chart">
        <div className="verb-bases-legend" role="group" aria-label="Highlight a base">
          {FEEDS.map((feed) => (
            <button
              key={feed.column}
              type="button"
              className="verb-base-chip"
              data-column={feed.column}
              aria-pressed={active === feed.column}
              onClick={() => setActive(active === feed.column ? null : feed.column)}
            >
              <span className="verb-base-chip-kana">{COLUMNS.find((column) => column.id === feed.column)?.kana}</span>
              <span className="verb-base-chip-text">
                <span className="verb-base-chip-forms">{feed.forms}</span>
                <span className="verb-base-chip-example">{feed.example}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="verb-table-scroll">
          <table className="verb-base-table" data-active={active ?? "none"}>
            <thead>
              <tr>
                <th scope="col">ends in</th>
                {COLUMNS.map((column) => (
                  <th scope="col" key={column.id} data-column={column.id} data-active={active === column.id}>
                    {column.kana}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ENDINGS.map((ending) => (
                <tr key={ending}>
                  <th scope="row">{ending}</th>
                  {COLUMNS.map((column) => (
                    <td key={column.id} data-column={column.id} data-active={active === column.id}>
                      {GODAN_ROWS[ending][column.id]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="verb-bases-caption">
          Nine endings, five bases. Every godan form in the language is one of these forty-five kana plus a suffix —
          except the past and the て-form, which take a sound change instead.
        </p>
      </div>

      <div className="verb-sound-changes">
        <p className="verb-subheading">The three sound changes</p>
        <p className="verb-note">
          Past and て-form are the same change with the last character swapped: <b>た → て</b>, <b>だ → で</b>.
          Learn one column and the other comes free.
        </p>
        <div className="verb-sound-grid">
          {FAMILIES.map((family) => (
            <div className="verb-sound-card" key={family.id} data-family={family.id}>
              <p className="verb-sound-endings">{family.endings.join(" ・ ")}</p>
              <p className="verb-sound-change">{family.change}</p>
              <p className="verb-sound-blurb">{family.blurb}</p>
            </div>
          ))}
        </div>
        <p className="verb-note verb-note-warn">
          <b>行く</b> is the one exception in the whole godan class: it ends in く but takes the っ change —
          行って / 行った, never 行いて.
        </p>
      </div>
    </div>
  );
}
