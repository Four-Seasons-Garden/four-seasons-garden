import secretBaseLesson from "@/content/learning/ja/kyoto/secret-base.json";

export type JapanesePart = {
  text: string;
  reading?: string;
};

export type JapaneseSentence = {
  id: string;
  parts: JapanesePart[];
  translation: string;
};

export type JapaneseWord = {
  word: string;
  reading: string;
  meaning: string;
  sentenceIds: string[];
};

export type JapaneseGrammar = {
  title: string;
  explanation: string;
  example: JapanesePart[];
  translation: string;
  sentenceIds: string[];
};

export type JapaneseLearningLesson = {
  language: string;
  title: string;
  subtitle: string;
  sentences: JapaneseSentence[];
  words: JapaneseWord[];
  grammar: JapaneseGrammar[];
};

export const SECRET_BASE_LESSON: JapaneseLearningLesson = secretBaseLesson;

export function getJapaneseLearningLesson(track: { biomeId: string; youtubeId?: string }) {
  if (track.biomeId === "kyoto" && track.youtubeId === "mIIb3Jf06AA") return SECRET_BASE_LESSON;
  return null;
}
