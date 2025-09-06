export interface LetterboxdDiaryEntry {
  /** The date when the entry was logged (YYYY-MM-DD format) */
  date: string;

  /** The name/title of the movie */
  name: string;

  /** The year the movie was released */
  year: number;

  /** The Letterboxd URI for the movie */
  letterboxdUri: string;

  /** The user's rating for the movie (0.5 to 5.0, or empty if not rated) */
  rating?: number;

  /** Whether this is a rewatch (Yes/empty) */
  rewatch?: boolean;

  /** Tags associated with the movie (comma-separated string) */
  tags?: string;

  /** The date when the movie was actually watched (YYYY-MM-DD format) */
  watchedDate: string;
}

export interface ParsedLetterboxdDiaryEntry
  extends Omit<LetterboxdDiaryEntry, "year" | "rating" | "rewatch"> {
  /** The year the movie was released (parsed as number) */
  year: number;

  /** The user's rating for the movie (parsed as number, undefined if not rated) */
  rating?: number;

  /** Whether this is a rewatch (parsed as boolean) */
  rewatch?: boolean;

  /** Parsed tags as an array of strings */
  parsedTags?: string[];
}
