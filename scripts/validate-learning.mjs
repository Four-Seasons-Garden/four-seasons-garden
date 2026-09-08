import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "content/learning");
const schemaFile = path.join(root, "lesson.schema.json");
const lessonFiles = [];

function collectJsonFiles(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) collectJsonFiles(entryPath);
    else if (entry.isFile() && entry.name.endsWith(".json") && entryPath !== schemaFile) lessonFiles.push(entryPath);
  }
}

function fail(file, message) {
  throw new Error(`${path.relative(process.cwd(), file)}: ${message}`);
}

function uniqueIds(items, label, file) {
  const ids = items.map((item) => item.id).filter(Boolean);
  if (new Set(ids).size !== ids.length) fail(file, `${label} IDs must be unique`);
  return new Set(ids);
}

collectJsonFiles(root);

for (const file of lessonFiles) {
  let lesson;
  try {
    lesson = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    fail(file, `invalid JSON (${error.message})`);
  }

  for (const field of ["id", "contentType", "language", "title", "subtitle", "source", "sequence", "blocks", "sentences", "words", "grammar"]) {
    if (!(field in lesson)) fail(file, `missing required field '${field}'`);
  }
  if (!["song", "article"].includes(lesson.contentType)) fail(file, "contentType must be song or article");
  if (!lesson.source?.biomeId) fail(file, "source.biomeId is required");
  if (lesson.contentType === "song" && !lesson.source.trackYoutubeId) fail(file, "song lessons require source.trackYoutubeId");

  const sentenceIds = new Set();
  for (const sentence of lesson.sentences) {
    if (!/^s\d+$/.test(sentence.id)) fail(file, `invalid sentence ID '${sentence.id}'`);
    if (sentenceIds.has(sentence.id)) fail(file, `duplicate sentence ID '${sentence.id}'`);
    sentenceIds.add(sentence.id);
    if (!Array.isArray(sentence.parts) || sentence.parts.length === 0) fail(file, `${sentence.id} needs parts`);
    for (const part of sentence.parts) {
      if (!part.text) fail(file, `${sentence.id} has a part without text`);
      for (const id of [...(part.wordIds ?? []), ...(part.grammarIds ?? [])]) {
        if (typeof id !== "string") fail(file, `${sentence.id} has a non-string part link`);
      }
    }
  }
  for (const id of lesson.sequence) if (!sentenceIds.has(id)) fail(file, `sequence references missing sentence ID '${id}'`);
  const flattenedBlocks = lesson.blocks.flat();
  if (JSON.stringify(flattenedBlocks) !== JSON.stringify(lesson.sequence)) fail(file, "blocks must flatten to sequence exactly");
  for (const id of flattenedBlocks) if (!sentenceIds.has(id)) fail(file, `blocks reference missing sentence ID '${id}'`);

  const wordIds = uniqueIds(lesson.words, "Vocabulary", file);
  const grammarIds = uniqueIds(lesson.grammar, "Grammar", file);
  for (const sentence of lesson.sentences) {
    for (const part of sentence.parts) {
      for (const id of part.wordIds ?? []) if (!wordIds.has(id)) fail(file, `${sentence.id} references missing vocabulary ID '${id}'`);
      for (const id of part.grammarIds ?? []) if (!grammarIds.has(id)) fail(file, `${sentence.id} references missing grammar ID '${id}'`);
    }
  }
  for (const item of [...lesson.words, ...lesson.grammar]) {
    if (!Array.isArray(item.sentenceIds) || item.sentenceIds.length === 0) fail(file, "every vocabulary/grammar item needs sentenceIds");
    for (const id of item.sentenceIds) if (!sentenceIds.has(id)) fail(file, `references missing sentence ID '${id}'`);
  }

  console.log(`OK ${path.relative(process.cwd(), file)} · ${sentenceIds.size} sentences · ${lesson.words.length} words · ${lesson.grammar.length} grammar`);
}

console.log(`Validated ${lessonFiles.length} learning lesson${lessonFiles.length === 1 ? "" : "s"}.`);
