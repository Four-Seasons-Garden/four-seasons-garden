"use client";

import { BookOpen, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type {
  JapaneseGrammar,
  JapaneseLearningLesson,
  JapanesePart,
  JapaneseSentence,
  JapaneseWord,
} from "@/lib/music/learning";
import {
  japaneseGrammarKey,
  japaneseWordKey,
  kanaToGojuonKey,
  sentencePartLinks,
  type JapaneseTextLink,
} from "@/lib/music/japanese-text";
import type { LocationTrack } from "@/lib/music/tracks";

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

export function JapaneseLearningModal({
  open,
  track,
  lesson,
  onClose,
}: {
  open: boolean;
  track: LocationTrack;
  lesson: JapaneseLearningLesson | null;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"sentences" | "words" | "grammar">("sentences");
  const [wordSort, setWordSort] = useState<"sequence" | "gojuon">("sequence");
  const [highlightedSentenceId, setHighlightedSentenceId] = useState<string | null>(null);
  const [highlightedWord, setHighlightedWord] = useState<string | null>(null);
  const [highlightedGrammar, setHighlightedGrammar] = useState<string | null>(null);
  const sentenceRefs = useRef<Record<string, HTMLElement | null>>({});
  const wordRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const grammarRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || tab !== "sentences" || !highlightedSentenceId) return;

    const frame = window.requestAnimationFrame(() => {
      sentenceRefs.current[highlightedSentenceId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    const clearHighlight = window.setTimeout(() => setHighlightedSentenceId(null), 1800);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(clearHighlight);
    };
  }, [open, tab, highlightedSentenceId]);

  useEffect(() => {
    if (!open) return;
    const target = tab === "words"
      ? wordRefs.current[highlightedWord ?? ""]
      : tab === "grammar"
        ? grammarRefs.current[highlightedGrammar ?? ""]
        : null;
    if (!target) return;

    const frame = window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    const clearHighlight = window.setTimeout(() => {
      if (tab === "words") setHighlightedWord(null);
      if (tab === "grammar") setHighlightedGrammar(null);
    }, 1800);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(clearHighlight);
    };
  }, [open, tab, highlightedWord, highlightedGrammar]);

  if (!open || typeof document === "undefined") return null;

  const sortedWords = lesson
    ? wordSort === "gojuon"
      ? [...lesson.words].sort((first, second) =>
        kanaToGojuonKey(first.reading).localeCompare(kanaToGojuonKey(second.reading)),
      )
      : lesson.words
    : [];
  const sentenceById = lesson ? new Map(lesson.sentences.map((sentence) => [sentence.id, sentence])) : new Map();
  let sentenceOccurrenceIndex = 0;
  const sentenceBlocks = lesson
    ? lesson.blocks.map((block) => block.map((sentenceId) => {
      const item = {
        sentence: sentenceById.get(sentenceId),
        occurrenceIndex: sentenceOccurrenceIndex,
      };
      sentenceOccurrenceIndex += 1;
      return item;
    }).filter((item): item is { sentence: JapaneseSentence; occurrenceIndex: number } => Boolean(item.sentence)))
    : [];

  function jumpToSentence(sentenceId?: string) {
    if (!sentenceId) return;
    setHighlightedSentenceId(sentenceId);
    setHighlightedWord(null);
    setHighlightedGrammar(null);
    setTab("sentences");
  }

  function jumpToWord(word: JapaneseWord) {
    setHighlightedSentenceId(null);
    setHighlightedWord(japaneseWordKey(word));
    setHighlightedGrammar(null);
    setTab("words");
  }

  function jumpToGrammar(item: JapaneseGrammar) {
    setHighlightedSentenceId(null);
    setHighlightedWord(null);
    setHighlightedGrammar(japaneseGrammarKey(item));
    setTab("grammar");
  }

  const modal = (
    <div
      className="learning-modal-backdrop has-floating-player"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="learning-modal" role="dialog" aria-modal="true" aria-labelledby="learning-modal-title">
        <div className="learning-modal-header">
          <div>
            <span className="learning-kicker">{lesson?.language ?? "Language study"} · {track.biomeId}</span>
            <h2 id="learning-modal-title">{lesson?.title ?? track.title}</h2>
            <p>{lesson?.subtitle ?? "Learning notes for this playlist are coming soon."}</p>
          </div>
          <button className="learning-close" type="button" onClick={onClose} aria-label="Close learning notes" title="Close">
            <X size={18} />
          </button>
        </div>

        {lesson ? (
          <>
            <nav className="learning-tabs" aria-label="Learning sections">
              <button type="button" className={tab === "sentences" ? "is-active" : ""} onClick={() => setTab("sentences")}>句子 <small>Sentences</small></button>
              <button type="button" className={tab === "words" ? "is-active" : ""} onClick={() => setTab("words")}>单词 <small>Words</small></button>
              <button type="button" className={tab === "grammar" ? "is-active" : ""} onClick={() => setTab("grammar")}>语法 <small>Grammar</small></button>
            </nav>

            <div className="learning-modal-scroll">
              {tab === "sentences" && (
                <div className="learning-sentence-list">
                  <p className="learning-hint">Lyrics · {lesson.sequence.length} source lines · {lesson.sentences.length} linked entries. Each kanji includes its hiragana reading above it. Tap underlined Japanese text or a link chip to study it.</p>
                  {sentenceBlocks.map((block, blockIndex) => (
                    <div className="learning-lyric-block" key={`lyric-block-${blockIndex}`}>
                      {block.map(({ sentence, occurrenceIndex }) => {
                        const sentenceWords = lesson.words.filter((word) => word.sentenceIds.includes(sentence.id));
                        const sentenceGrammar = lesson.grammar.filter((item) => item.sentenceIds.includes(sentence.id));
                        const partLinks = sentencePartLinks(
                          sentence,
                          sentenceWords,
                          sentenceGrammar,
                          jumpToWord,
                          jumpToGrammar,
                        );

                        return (
                          <article
                            id={`learning-${sentence.id}-${occurrenceIndex + 1}`}
                            ref={(element) => { sentenceRefs.current[sentence.id] = element; }}
                            className={`learning-sentence ${sentence.id === highlightedSentenceId ? "is-target" : ""}`}
                            key={`${sentence.id}-${occurrenceIndex}`}
                          >
                            <span className="learning-index">{String(occurrenceIndex + 1).padStart(2, "0")}</span>
                            <div>
                              <p className="learning-japanese"><JapaneseText parts={sentence.parts} partLinks={partLinks} /></p>
                              <p className="learning-translation">{sentence.translation}</p>
                              {(sentenceWords.length > 0 || sentenceGrammar.length > 0) && (
                                <div className="learning-sentence-links" aria-label={`Study links for sentence ${occurrenceIndex + 1}`}>
                                  {sentenceWords.length > 0 && <span className="learning-link-label">Vocabulary</span>}
                                  {sentenceWords.map((word) => (
                                    <button key={japaneseWordKey(word)} type="button" onClick={() => jumpToWord(word)}>
                                      {word.word}
                                    </button>
                                  ))}
                                  {sentenceGrammar.length > 0 && <span className="learning-link-label">Grammar</span>}
                                  {sentenceGrammar.map((item) => (
                                    <button key={japaneseGrammarKey(item)} type="button" onClick={() => jumpToGrammar(item)}>
                                      {item.title}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}

              {tab === "words" && (
                <div>
                  <div className="learning-section-toolbar">
                    <span>Vocabulary · {lesson.words.length}</span>
                    <div className="learning-sort-controls" role="group" aria-label="Sort vocabulary">
                      <button
                        type="button"
                        className={wordSort === "sequence" ? "is-active" : ""}
                        onClick={() => setWordSort("sequence")}
                      >
                        Sequence
                      </button>
                      <button
                        type="button"
                        className={wordSort === "gojuon" ? "is-active" : ""}
                        onClick={() => setWordSort("gojuon")}
                      >
                        あいうえお順
                      </button>
                    </div>
                  </div>
                  <div className="learning-word-grid">
                    {sortedWords.map((word) => (
                      <button
                        key={japaneseWordKey(word)}
                        type="button"
                        ref={(element) => { wordRefs.current[japaneseWordKey(word)] = element; }}
                        className={`learning-word ${japaneseWordKey(word) === highlightedWord ? "is-target" : ""}`}
                        onClick={() => jumpToSentence(word.sentenceIds[0])}
                        aria-label={`View ${word.word} in sentence ${word.sentenceIds[0]}`}
                      >
                        <p className="learning-word-japanese"><ruby>{word.word}<rt>{word.reading}</rt></ruby></p>
                        <p>{word.meaning}</p>
                        <span className="learning-reference">Sentences {word.sentenceIds.map((id) => id.slice(1)).join(" · ")} ↗</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {tab === "grammar" && (
                <div className="learning-grammar-list">
                  {lesson.grammar.map((item) => (
                    <button
                      className={`learning-grammar ${japaneseGrammarKey(item) === highlightedGrammar ? "is-target" : ""}`}
                      key={japaneseGrammarKey(item)}
                      type="button"
                      ref={(element) => { grammarRefs.current[japaneseGrammarKey(item)] = element; }}
                      onClick={() => jumpToSentence(item.sentenceIds[0])}
                      aria-label={`View ${item.title} in sentence ${item.sentenceIds[0]}`}
                    >
                      <h3>{item.title}</h3>
                      <p>{item.explanation}</p>
                      <p className="learning-grammar-example"><JapaneseText parts={item.example} /></p>
                      <p className="learning-translation">{item.translation}</p>
                      <span className="learning-reference">Sentences {item.sentenceIds.map((id) => id.slice(1)).join(" · ")} ↗</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="learning-empty">
            <BookOpen size={22} />
            <p>We’re preparing sentence notes, readings, vocabulary, and grammar for this playlist.</p>
          </div>
        )}
      </section>
    </div>
  );

  return createPortal(modal, document.body);
}
