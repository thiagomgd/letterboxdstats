import React, { useEffect } from "react";
import type { ParsedLetterboxdDiaryEntry } from "./types";

type MoviesSummaryProps = {
  diaryData: ParsedLetterboxdDiaryEntry[];
  prefixSeparator?: string;
};

type GroupedMovies = Record<
  string,
  string[] | Record<string, string[] | Record<string, string[]>>
>;

function buildMoviesByTag(
  diaryData: ParsedLetterboxdDiaryEntry[],
  prefixSeparator: string,
  groupBy: "year" | "month" | "week",
) {
  const groupedMovies: GroupedMovies = {};

  diaryData.forEach((entry) => {
    if (!entry.name) return;

    // Parse the watched date to get year, month, and week
    const watchedDate = new Date(entry.watchedDate);
    const year = watchedDate.getFullYear();
    const month = watchedDate.getMonth() + 1; // getMonth() returns 0-11
    const week = Math.ceil(watchedDate.getDate() / 7);

    // Determine the grouping structure based on groupBy
    let dateKey: string;
    let parentGroup: GroupedMovies;

    switch (groupBy) {
      case "year":
        dateKey = year.toString();
        parentGroup = groupedMovies;
        break;
      case "month":
        dateKey = `${year}-${month.toString().padStart(2, "0")}`;
        if (!groupedMovies[year]) {
          groupedMovies[year] = {};
        }
        parentGroup = groupedMovies[year] as GroupedMovies;
        break;
      case "week":
        dateKey = `Week ${week}`;
        if (!groupedMovies[year]) {
          groupedMovies[year] = {};
        }
        if (!(groupedMovies[year] as GroupedMovies)[month]) {
          (groupedMovies[year] as GroupedMovies)[month] = {};
        }
        parentGroup = (groupedMovies[year] as GroupedMovies)[
          month
        ] as GroupedMovies;
        break;
    }

    // Initialize the date group if it doesn't exist
    if (!parentGroup[dateKey]) {
      parentGroup[dateKey] = {};
    }

    // Add movies by tags under the date group
    if (entry.parsedTags) {
      entry.parsedTags.forEach((tag) => {
        const parts = tag
          .split(prefixSeparator)
          .map((part) => part.trim())
          .filter(Boolean);
        if (parts.length === 0) return;

        let current = parentGroup[dateKey] as GroupedMovies;
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part] as GroupedMovies;
        }
        const lastPart = parts[parts.length - 1];
        if (!current[lastPart]) {
          current[lastPart] = [];
        }
        (current[lastPart] as string[]).push(entry.name);
      });
    }

    // Also group by movie release decade under the date group
    if (entry.year && !isNaN(entry.year)) {
      const decade = Math.floor(entry.year / 10) * 10;
      const decadeKey = `${decade}s`;
      if (!(parentGroup[dateKey] as GroupedMovies)[decadeKey]) {
        (parentGroup[dateKey] as GroupedMovies)[decadeKey] = [];
      }
      ((parentGroup[dateKey] as GroupedMovies)[decadeKey] as string[]).push(
        entry.name,
      );
    }
  });

  return groupedMovies;
}

function renderMoviesByTag(moviesByTag: GroupedMovies, level: number = 0) {
  if (!moviesByTag || typeof moviesByTag !== "object") return null;
  return (
    <ul style={{ marginLeft: level * 20 }}>
      {Object.entries(moviesByTag).map(([tag, value]) => (
        <li key={tag}>
          <strong>{tag}</strong>
          {Array.isArray(value) ? (
            <>: {value.join(", ")}</>
          ) : (
            renderMoviesByTag(value as GroupedMovies, level + 1)
          )}
        </li>
      ))}
    </ul>
  );
}

const MoviesSummary: React.FC<MoviesSummaryProps> = ({
  diaryData,
  prefixSeparator = ":",
}) => {
  const [groupBy, setGroupBy] = React.useState<"year" | "month" | "week">(
    "month",
  );
  const [moviesByTag, setMoviesByTag] = React.useState<GroupedMovies | null>(
    null,
  );

  useEffect(() => {
    setMoviesByTag(buildMoviesByTag(diaryData, prefixSeparator, groupBy));
  }, [diaryData, prefixSeparator, groupBy]);

  return (
    <div>
      <h2>Movies by Tag</h2>

      <div>
        <label>
          Group by:{" "}
          <select
            value={groupBy}
            onChange={(e) =>
              setGroupBy(e.target.value as "year" | "month" | "week")
            }
          >
            <option value="year">Year</option>
            <option value="month">Month</option>
            <option value="week">Week</option>
          </select>
        </label>
        <h2>Movies by Tag</h2>
        {moviesByTag && renderMoviesByTag(moviesByTag)}
      </div>
    </div>
  );
};

export default MoviesSummary;
