import secretBaseLesson from "@/content/learning/ja/kyoto/secret-base.json";

export type LearningContentType = "song" | "article";

export type JapaneseLessonSource = {
  biomeId: string;
  trackYoutubeId?: string;
  url?: string;
  attribution?: string;
};

export type JapanesePart = {
  text: string;
  reading?: string;
  wordIds?: string[];
  grammarIds?: string[];
};

export type JapaneseSentence = {
  id: string;
  parts: JapanesePart[];
  translation: string;
};

export type JapaneseWord = {
  id?: string;
  word: string;
  reading: string;
  meaning: string;
  sentenceIds: string[];
};

export type JapaneseGrammar = {
  id?: string;
  title: string;
  explanation: string;
  example: JapanesePart[];
  translation: string;
  sentenceIds: string[];
};

export type JapaneseLearningLesson = {
  id: string;
  contentType: LearningContentType;
  language: string;
  translationLanguage?: string;
  title: string;
  subtitle: string;
  source: JapaneseLessonSource;
  sequence: string[];
  sentences: JapaneseSentence[];
  words: JapaneseWord[];
  grammar: JapaneseGrammar[];
};

export const SECRET_BASE_LESSON: JapaneseLearningLesson = secretBaseLesson;

export function getJapaneseLearningLesson(track: { biomeId: string; youtubeId?: string }) {
  if (track.biomeId === "kyoto" && track.youtubeId === "mIIb3Jf06AA") return SECRET_BASE_LESSON;
  return null;
}
