"use client";

import { ArrowRight, X } from "lucide-react";
import { JapaneseText } from "@/app/components/japanese/JapaneseText";
import {
  FORM_BY_ID,
  conjugate,
  familyOf,
  glossFor,
  type Cell,
  type FormId,
  type Politeness,
  type Verb,
} from "@/lib/japanese/verbs";
import { FORM_EXAMPLES, VERB_EXAMPLES, ruleFor, type Example } from "@/lib/japanese/verb-grammar";

const GROUP_LABEL: Record<Verb["group"], string> = {
  godan: "Godan · 五段",
  ichidan: "Ichidan · 一段",
  irregular: "Irregular · 不規則",
};

const ROLE_LABEL: Record<string, string> = {
  stem: "stem",
  base: "base",
  sound: "sound change",
  suffix: "suffix",
};

function ExampleBlock({ example, label }: { example: Example; label: string }) {
  return (
    <div className="verb-example">
      <p className="verb-example-label">{label}</p>
      <p className="verb-example-jp"><JapaneseText parts={example.parts} /></p>
      <p className="verb-example-en">{example.translation}</p>
    </div>
  );
}

/* The derivation strip: the same pieces `conjugate()` used, laid out left to
   right so the written word and its explanation share a reading order. */
function Derivation({ cell }: { cell: Cell }) {
  if (cell.segments.length === 0) return null;

  return (
    <div className="verb-derivation" role="group" aria-label="How this form is built">
      {cell.segments.map((segment, index) => (
        <span className="verb-derivation-step" key={`${segment.text}-${index}`}>
          {index > 0 && <ArrowRight className="verb-derivation-arrow" size={13} aria-hidden="true" />}
          <span className="verb-chip" data-role={segment.role}>
            <span className="verb-chip-kana">
              {segment.text ? <ruby>{segment.text}<rt>{segment.reading}</rt></ruby> : <em>—</em>}
            </span>
            <span className="verb-chip-role">{ROLE_LABEL[segment.role]}</span>
            <span className="verb-chip-note">{segment.label}</span>
          </span>
        </span>
      ))}
    </div>
  );
}

export function CellDetail({
  verb,
  formId,
  politeness,
  onClose,
}: {
  verb: Verb;
  /* null renders the verb overview rather than a single form. */
  formId: FormId | null;
  politeness: Politeness;
  onClose: () => void;
}) {
  const family = familyOf(verb);
  const dictionary = conjugate(verb, "nonpast", "plain");

  if (!formId) {
    return (
      <article className="verb-detail" data-variant="verb">
        <header className="verb-detail-head">
          <div>
            <p className="verb-detail-eyebrow">
              {GROUP_LABEL[verb.group]}
              {family ? ` · ${family.label}` : ""}
            </p>
            <h4 className="verb-detail-title"><JapaneseText parts={dictionary.parts} /></h4>
            <p className="verb-detail-gloss">{verb.meaning}</p>
          </div>
          <button className="verb-detail-close" type="button" onClick={onClose} aria-label="Close details">
            <X size={15} />
          </button>
        </header>

        {family && (
          <div className="verb-rule">
            <p className="verb-rule-title">{family.label}</p>
            <p className="verb-rule-formula">{family.change}</p>
            <p className="verb-rule-body">{family.blurb}</p>
          </div>
        )}

        {verb.notes && verb.notes.length > 0 && (
          <ul className="verb-warnings">
            {verb.notes.map((note) => <li key={note}>{note}</li>)}
          </ul>
        )}

        {VERB_EXAMPLES[verb.id] && <ExampleBlock example={VERB_EXAMPLES[verb.id]} label="In use" />}
      </article>
    );
  }

  const meta = FORM_BY_ID.get(formId);
  const cell = conjugate(verb, formId, politeness);
  const rule = ruleFor(verb.group, politeness, formId);
  const example = FORM_EXAMPLES[formId][politeness];

  return (
    <article className="verb-detail" data-variant="form" data-available={cell.available}>
      <header className="verb-detail-head">
        <div>
          <p className="verb-detail-eyebrow">
            {GROUP_LABEL[verb.group]} · {politeness === "polite" ? "Polite" : "Plain"} · {meta?.label}
            <span className="verb-detail-jp">{meta?.japanese}</span>
          </p>
          <h4 className="verb-detail-title">
            {cell.available ? <JapaneseText parts={cell.parts} /> : <span className="verb-detail-gap">does not exist</span>}
          </h4>
          {cell.available && <p className="verb-detail-english">{glossFor(verb, formId)}</p>}
          <p className="verb-detail-gloss">
            <JapaneseText parts={dictionary.parts} /> — {verb.meaning} · {meta?.label} ({meta?.gloss})
          </p>
        </div>
        <button className="verb-detail-close" type="button" onClick={onClose} aria-label="Close details">
          <X size={15} />
        </button>
      </header>

      {cell.available ? (
        <Derivation cell={cell} />
      ) : (
        <div className="verb-gap-note">
          <p>{cell.unavailable?.reason}</p>
          <p className="verb-gap-instead">{cell.unavailable?.instead}</p>
        </div>
      )}

      <div className="verb-rule">
        <p className="verb-rule-title">{rule.title}</p>
        <p className="verb-rule-formula">{rule.formula}</p>
        <p className="verb-rule-body">{rule.body}</p>
        {rule.warnings && rule.warnings.length > 0 && (
          <ul className="verb-warnings">
            {rule.warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        )}
      </div>

      <div className="verb-detail-examples">
        <ExampleBlock example={example} label={`${meta?.label} in a sentence`} />
        {VERB_EXAMPLES[verb.id] && <ExampleBlock example={VERB_EXAMPLES[verb.id]} label={`${verb.head}${verb.tail} in use`} />}
      </div>

      {verb.notes && verb.notes.length > 0 && (
        <ul className="verb-warnings verb-warnings-verb">
          {verb.notes.map((note) => <li key={note}>{note}</li>)}
        </ul>
      )}
    </article>
  );
}
