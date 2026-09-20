"use client";

import { ChevronDown, Eye, EyeOff, RotateCcw } from "lucide-react";
import { useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { BaseChart } from "./BaseChart";
import { ConjugationTable, type OpenDetail } from "./ConjugationTable";
import { CausativePassiveTable, TePatternTable } from "./PatternSections";
import {
  CORE_FORMS,
  EXTENDED_FORMS,
  FORMS,
  VERBS,
  type FormId,
  type VerbGroup,
} from "@/lib/japanese/verbs";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  subscribeToSettings,
  writeSettings,
  type VerbSettings,
} from "@/lib/japanese/verb-settings";

const CLASS_SECTIONS: { id: VerbGroup; title: string; japanese: string; blurb: string }[] = [
  {
    id: "godan",
    title: "Godan",
    japanese: "五段動詞",
    blurb:
      "Five-row verbs: the final kana slides up and down the あいうえお row it belongs to. Most verbs in the language are godan, and all of the system's difficulty lives here.",
  },
  {
    id: "ichidan",
    title: "Ichidan",
    japanese: "一段動詞",
    blurb:
      "One-row verbs: drop る and attach. One stem serves every form, with no base swaps and no sound changes anywhere in the paradigm.",
  },
  {
    id: "irregular",
    title: "Irregular",
    japanese: "不規則動詞",
    blurb:
      "There are two. They are also the two most common verbs in Japanese, so the memorisation pays for itself within a week.",
  },
];

/* Collapsible section. Content stays mounted only while open — these tables are
   large, and an open detail row inside a closed section helps nobody. */
function Section({
  id,
  eyebrow,
  title,
  japanese,
  blurb,
  open,
  onToggle,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  japanese?: string;
  blurb?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="verb-section" data-open={open}>
      <button
        className="verb-section-head"
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-body`}
        onClick={onToggle}
      >
        <span className="verb-section-heading">
          <span className="verb-section-eyebrow">{eyebrow}</span>
          <span className="verb-section-title">
            {title}
            {japanese && <em>{japanese}</em>}
          </span>
        </span>
        <ChevronDown className="verb-section-chevron" size={18} aria-hidden="true" />
      </button>
      {open && (
        <div className="verb-section-body" id={`${id}-body`}>
          {blurb && <p className="verb-section-blurb">{blurb}</p>}
          {children}
        </div>
      )}
    </section>
  );
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (next: T) => void;
}) {
  return (
    <div className="verb-control">
      <span className="field-label">{label}</span>
      <div className="verb-segmented" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={value === option.id}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function VerbLab() {
  const settings = useSyncExternalStore(
    subscribeToSettings,
    getSettingsSnapshot,
    getServerSettingsSnapshot,
  );
  const [practice, setPractice] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<OpenDetail | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    bases: true,
    godan: true,
    ichidan: true,
    irregular: true,
    te: true,
    causativePassive: false,
  });

  const forms = useMemo(
    () => FORMS.filter((form) => settings.forms.includes(form.id)).map((form) => form.id),
    [settings.forms],
  );

  const verbsByGroup = useMemo(
    () => ({
      godan: VERBS.filter((verb) => verb.group === "godan"),
      ichidan: VERBS.filter((verb) => verb.group === "ichidan"),
      irregular: VERBS.filter((verb) => verb.group === "irregular"),
    }),
    [],
  );

  function update(patch: Partial<VerbSettings>) {
    writeSettings((current) => ({ ...current, ...patch }));
    setOpen(null);
  }

  function toggleForm(formId: FormId) {
    setOpen(null);
    writeSettings((current) => {
      const next = current.forms.includes(formId)
        ? current.forms.filter((id) => id !== formId)
        : [...current.forms, formId];
      /* An empty table is never what anyone wants. */
      return next.length === 0 ? current : { ...current, forms: next };
    });
  }

  function toggleSection(id: string) {
    setOpenSections((current) => ({ ...current, [id]: !current[id] }));
  }

  return (
    <div className="verb-lab" data-density={settings.density} data-furigana={settings.furigana}>
      <aside className="tool-sidebar verb-sidebar">
        <Segmented
          label="Register"
          value={settings.politeness}
          options={[{ id: "polite" as const, label: "Polite" }, { id: "plain" as const, label: "Plain" }]}
          onChange={(politeness) => update({ politeness })}
        />

        <div className="verb-control">
          <span className="field-label">Columns</span>
          <div className="verb-preset-row">
            <button type="button" onClick={() => update({ forms: CORE_FORMS })}>Core five</button>
            <button type="button" onClick={() => update({ forms: EXTENDED_FORMS })}>The rest</button>
            <button type="button" onClick={() => update({ forms: FORMS.map((form) => form.id) })}>All twelve</button>
          </div>
          <div className="verb-form-chips">
            {FORMS.map((form) => (
              <button
                key={form.id}
                type="button"
                className="verb-form-chip"
                data-tier={form.tier}
                aria-pressed={settings.forms.includes(form.id)}
                title={form.gloss}
                onClick={() => toggleForm(form.id)}
              >
                {form.column}
              </button>
            ))}
          </div>
        </div>

        <Segmented
          label="Density"
          value={settings.density}
          options={[{ id: "study" as const, label: "Study" }, { id: "compact" as const, label: "Table" }]}
          onChange={(density) => update({ density })}
        />

        <div className="verb-control">
          <span className="field-label">Reading aids</span>
          <button
            type="button"
            className="verb-toggle"
            aria-pressed={settings.furigana}
            onClick={() => update({ furigana: !settings.furigana })}
          >
            {settings.furigana ? <Eye size={13} /> : <EyeOff size={13} />}
            Furigana
          </button>
          <button
            type="button"
            className="verb-toggle"
            aria-pressed={practice}
            onClick={() => {
              setPractice((current) => !current);
              setRevealed(new Set());
              setOpen(null);
            }}
          >
            {practice ? <Eye size={13} /> : <EyeOff size={13} />}
            Practice — hide forms
          </button>
          {practice && (
            <button type="button" className="verb-toggle verb-toggle-quiet" onClick={() => setRevealed(new Set())}>
              <RotateCcw size={13} />
              Hide them again
            </button>
          )}
        </div>

        <p className="verb-sidebar-note">
          {practice
            ? "Cells are blurred. Click once to check your answer, twice to see how it is built."
            : "Click any cell for its derivation, its rule and an example sentence. Click a verb for its class notes."}
        </p>
      </aside>

      <div className="verb-main">
        <Section
          id="bases"
          eyebrow="Start here"
          title="The five bases"
          japanese="五段の活用"
          blurb="Godan conjugation is not a list of endings to memorise. It is one kana sliding along its row, plus three sound changes. Everything in the tables below is built from this chart."
          open={openSections.bases}
          onToggle={() => toggleSection("bases")}
        >
          <BaseChart />
        </Section>

        {CLASS_SECTIONS.map((section) => (
          <Section
            key={section.id}
            id={section.id}
            eyebrow={settings.politeness === "polite" ? "Polite forms" : "Plain forms"}
            title={section.title}
            japanese={section.japanese}
            blurb={section.blurb}
            open={openSections[section.id]}
            onToggle={() => toggleSection(section.id)}
          >
            {forms.length < FORMS.length && (
              /* The column chooser lives in the sidebar, which is easy to miss.
                 Say out loud that there are more forms, next to the table that
                 is not showing them. */
              <p className="verb-column-hint">
                <span>
                  Showing <b>{forms.length}</b> of {FORMS.length} forms
                </span>
                <button type="button" onClick={() => update({ forms: FORMS.map((form) => form.id) })}>
                  Show all twelve
                </button>
                {forms !== EXTENDED_FORMS && (
                  <button type="button" onClick={() => update({ forms: EXTENDED_FORMS })}>
                    Potential, volitional, passive…
                  </button>
                )}
              </p>
            )}

            <ConjugationTable
              verbs={verbsByGroup[section.id]}
              forms={forms}
              politeness={settings.politeness}
              furigana={settings.furigana}
              practice={practice}
              revealed={revealed}
              onReveal={(key) => setRevealed((current) => new Set(current).add(key))}
              open={open}
              onOpen={setOpen}
            />
          </Section>
        ))}

        <Section
          id="te"
          eyebrow="Why it matters"
          title="What the て-form unlocks"
          japanese="て形の用法"
          blurb="て-form means nothing on its own. It is a connector, and learning it hands you this entire column of patterns at once — which is why it is worth the trouble the sound changes cost."
          open={openSections.te}
          onToggle={() => toggleSection("te")}
        >
          <TePatternTable />
        </Section>

        <Section
          id="causativePassive"
          eyebrow="Last one"
          title="Causative-passive"
          japanese="使役受身形"
          blurb="Causative stem plus られる: to be made to do something. Godan verbs contract せられる down to される, and the contraction is what people actually say — except after す, where the sounds would collide."
          open={openSections.causativePassive}
          onToggle={() => toggleSection("causativePassive")}
        >
          <CausativePassiveTable />
        </Section>
      </div>
    </div>
  );
}
