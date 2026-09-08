import { test } from "node:test";
import assert from "node:assert/strict";
import {
  activeLyricIndex,
  fallbackLyrics,
  parseLrcEntries,
  visibleLyrics,
} from "../lib/music/lrc.ts";

test("parseLrcEntries reads mm:ss.xx into seconds", () => {
  const [entry] = parseLrcEntries("[01:30.50]line one");
  assert.equal(entry.time, 90.5);
  assert.equal(entry.text, "line one");
});

test("parseLrcEntries expands a line carrying several timestamps", () => {
  // A repeated line is timestamped once per occurrence.
  const entries = parseLrcEntries("[00:10.00][00:40.00]repeated");
  assert.equal(entries.length, 2);
  assert.deepEqual(entries.map((e) => e.time), [10, 40]);
  assert.ok(entries.every((e) => e.text === "repeated"));
});

test("parseLrcEntries sorts by time regardless of file order", () => {
  const entries = parseLrcEntries("[00:20.00]second\n[00:05.00]first");
  assert.deepEqual(entries.map((e) => e.text), ["first", "second"]);
});

test("parseLrcEntries skips metadata and timestamp-less lines", () => {
  const entries = parseLrcEntries("[ar:Someone]\n\n[00:01.00]kept");
  assert.equal(entries.length, 1);
  assert.equal(entries[0].text, "kept");
});

test("fallbackLyrics spaces plain lines evenly", () => {
  assert.deepEqual(fallbackLyrics(["a", "b"]), [
    { time: 0, text: "a" },
    { time: 8, text: "b" },
  ]);
});

const entries = [0, 10, 20, 30, 40].map((time) => ({ time, text: `${time}` }));

test("activeLyricIndex returns -1 with no entries", () => {
  assert.equal(activeLyricIndex([], 5), -1);
});

test("activeLyricIndex holds the current line until the next one starts", () => {
  assert.equal(activeLyricIndex(entries, 0), 0);
  assert.equal(activeLyricIndex(entries, 9.9), 0);
  assert.equal(activeLyricIndex(entries, 10), 1);
  assert.equal(activeLyricIndex(entries, 999), 4);
});

test("activeLyricIndex stays on the first line before playback starts", () => {
  assert.equal(activeLyricIndex(entries, -5), 0);
});

test("visibleLyrics returns a four-line window", () => {
  const window = visibleLyrics(entries, 2);
  assert.equal(window.length, 4);
  // One line of lead-in above the active line.
  assert.deepEqual(window.map((w) => w.index), [1, 2, 3, 4]);
});

test("visibleLyrics clamps at both ends", () => {
  assert.deepEqual(visibleLyrics(entries, 0).map((w) => w.index), [0, 1, 2, 3]);
  assert.deepEqual(visibleLyrics(entries, 4).map((w) => w.index), [1, 2, 3, 4]);
});

test("visibleLyrics handles fewer entries than the window", () => {
  const short = entries.slice(0, 2);
  assert.equal(visibleLyrics(short, 0).length, 2);
  assert.deepEqual(visibleLyrics([], 0), []);
});
