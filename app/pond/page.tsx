import { AppShell } from "@/app/components/AppShell";
import { VerbLab } from "@/app/components/verbs/VerbLab";

export const metadata = {
  title: "Pond — Japanese Verbs",
  description: "The Japanese verb system as one interactive table: every form derived, explained and exampled.",
};

export default function PondPage() {
  return (
    <AppShell title="Pond" eyebrow="日本語 · The Verb System">
      <p className="verb-lede">
        Still water holds a whole reflection at once. This is the Japanese verb system in the same way —
        every class, every form, one surface. Collapse it into a bare table when you want a reference,
        open any cell when you want the reason.
      </p>
      <div className="verb-ripple" aria-hidden="true">
        <span /><span /><span />
      </div>
      <VerbLab />
    </AppShell>
  );
}
