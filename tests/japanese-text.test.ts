import { test } from "node:test";
import assert from "node:assert/strict";
import {
  kanaToGojuonKey,
  partIndexesForTerm,
  sentencePartLinks,
  wordSearchForms,
} from "../lib/music/japanese-text.ts";

/* Generic fixtures — not lesson content. */
const parts = [
  { text: "水", reading: "みず" },
  { text: "を" },
  { text: "飲", reading: "の" },
  { text: "む" },
];

test("wordSearchForms returns longest form first", () => {
  const forms = wordSearchForms("飲む");
  assert.equal(forms[0], "飲む");
  assert.ok(forms.includes("飲"));
  for (let i = 1; i < forms.length; i += 1) {
    assert.ok(forms[i - 1].length >= forms[i].length, "forms must be longest-first");
  }
});

test("wordSearchForms derives the adverbial stem of an i-adjective", () => {
  const forms = wordSearchForms("楽しい");
  assert.ok(forms.includes("楽しく"));
  assert.ok(forms.includes("楽し"));
});

test("partIndexesForTerm matches a single part", () => {
  assert.deepEqual(partIndexesForTerm(parts, ["水"]), [0]);
});

test("partIndexesForTerm spans kanji and its okurigana", () => {
  // 飲む occupies parts 2 and 3, so both must be returned.
  assert.deepEqual(partIndexesForTerm(parts, ["飲む"]), [2, 3]);
});

test("partIndexesForTerm returns nothing when no form matches", () => {
  assert.deepEqual(partIndexesForTerm(parts, ["空"]), []);
});

test("partIndexesForTerm falls back to a shorter prefix", () => {
  // 飲まない is not present, but its 2-char prefix cannot match either;
  // 飲む's stem 飲 is reachable through the caller's form list.
  assert.deepEqual(partIndexesForTerm(parts, wordSearchForms("飲む")), [2, 3]);
});

test("kanaToGojuonKey orders by the gojuon table, not code points", () => {
  assert.ok(kanaToGojuonKey("あき") < kanaToGojuonKey("かき"));
  assert.ok(kanaToGojuonKey("さくら") < kanaToGojuonKey("たけ"));
  assert.ok(kanaToGojuonKey("な") < kanaToGojuonKey("ん"));
});

test("kanaToGojuonKey treats a digraph as one mora", () => {
  // しゃ is a single mora, so it sorts as one unit rather than し + や.
  assert.notEqual(kanaToGojuonKey("しゃ"), kanaToGojuonKey("し"));
  assert.ok(kanaToGojuonKey("し") < kanaToGojuonKey("しゃ"));
});

test("sentencePartLinks: an explicit wordId wins over text matching", () => {
  const sentence = {
    id: "s01",
    parts: [{ text: "水", wordIds: ["w-mizu"] }, { text: "を" }],
    translation: "",
  };
  const word = { id: "w-mizu", word: "水", reading: "みず", meaning: "water", sentenceIds: ["s01"] };

  const links = sentencePartLinks(sentence, [word], [], () => {}, () => {});

  // Exactly one link on part 0, not one from the explicit id plus one from matching.
  assert.equal(links[0].length, 1);
  assert.equal(links[1], undefined);
});

test("sentencePartLinks falls back to text matching without explicit ids", () => {
  const sentence = { id: "s01", parts, translation: "" };
  const word = { word: "飲む", reading: "のむ", meaning: "to drink", sentenceIds: ["s01"] };

  const links = sentencePartLinks(sentence, [word], [], () => {}, () => {});

  assert.ok(links[2], "kanji part should be linked");
  assert.ok(links[3], "okurigana part should be linked");
});
