import React, { useEffect, useState } from "react";
import type { ParsedLetterboxdDiaryEntry } from "./types";

type MoviesSummaryProps = {
  diaryData: ParsedLetterboxdDiaryEntry[];
  prefixSeparator?: string;
};

interface GroupedMovies {
  [key: string | number]: string[] | GroupedMovies;
}

function buildMoviesByTag(
  diaryData: ParsedLetterboxdDiaryEntry[],
  prefixSeparator: string,
  groupBy: "year" | "month" | "week",
) {
  console.log(diaryData);
  const groupedMovies: GroupedMovies = {};

  diaryData.forEach((entry) => {
    if (!entry.name) return;

    // Parse the watched date to get year, month, and week
    const watchedDate = new Date(entry.watchedDate);
    const year = watchedDate.getFullYear();
    const month = watchedDate.getMonth() + 1; // getMonth() returns 0-11
    const week = `Week ${Math.ceil(watchedDate.getDate() / 7)}`;

    // console.log({ watched: entry.watchedDate, year, month, week });
    let parentGroup: GroupedMovies;

    if (groupBy === "year") {
      if (!groupedMovies[year]) {
        groupedMovies[year] = {};
      }

      parentGroup = groupedMovies;
    } else if (groupBy === "month") {
      if (!groupedMovies[year]) {
        groupedMovies[year] = {};
      }
      if (!groupedMovies[year][month]) {
        groupedMovies[year][month] = {};
      }
      parentGroup = groupedMovies[year][month] as GroupedMovies;
    } else {
      if (!groupedMovies[year]) {
        groupedMovies[year] = {};
      }
      if (!groupedMovies[year][month]) {
        groupedMovies[year][month] = {};
      }
      if (!(groupedMovies[year][month] as GroupedMovies)[week]) {
        (groupedMovies[year][month] as GroupedMovies)[week] = {};
      }
      parentGroup = (groupedMovies[year][month] as GroupedMovies)[
        week
      ] as GroupedMovies;
    }

    // Add movies by tags under the date group
    if (entry.parsedTags) {
      entry.parsedTags.forEach((tag) => {
        let tagParent = parentGroup;
        const parts = tag.split(prefixSeparator).map((part) => part.trim());
        //   .filter(Boolean);
        // if (parts.length === 0) return;

        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (!tagParent[part]) {
            tagParent[part] = {};
          }
          tagParent = tagParent[part] as GroupedMovies;
        }
        const lastPart = parts[parts.length - 1];
        if (!tagParent[lastPart]) {
          tagParent[lastPart] = [];
        }
        (tagParent[lastPart] as string[]).push(entry.name);
      });
    }

    // Also group by movie release decade under the date group
    if (entry.year && !isNaN(entry.year)) {
      const decade = Math.floor(entry.year / 10) * 10;
      const decadeKey = `${decade}s`;
      if (!parentGroup[decadeKey]) {
        parentGroup[decadeKey] = [];
      }
      (parentGroup[decadeKey] as string[]).push(entry.name);
    }
  });

  console.log(groupedMovies);
  return groupedMovies;
}

interface ExpandableSectionProps {
  title: string;
  children: React.ReactNode;
  level: number;
  isExpanded: boolean;
  onToggle: () => void;
}

const ExpandableSection: React.FC<ExpandableSectionProps> = ({
  title,
  children,
  level,
  isExpanded,
  onToggle,
}) => {
  return (
    <div style={{ marginLeft: level * 20, marginBottom: 8 }}>
      <button
        onClick={onToggle}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          padding: 4,
          fontSize: "inherit",
          fontWeight: "bold",
        }}
      >
        <span style={{ marginRight: 8, fontSize: "1.2em" }}>
          {isExpanded ? "▼" : "▶"}
        </span>
        {title}
      </button>
      {isExpanded && (
        <div style={{ marginLeft: 20, marginTop: 4 }}>{children}</div>
      )}
    </div>
  );
};

function renderMoviesByTag(
  moviesByTag: GroupedMovies,
  level: number = 0,
  expandedSections: Set<string>,
  toggleSection: (key: string) => void,
) {
  if (!moviesByTag || typeof moviesByTag !== "object") return null;

  return (
    <div>
      {Object.entries(moviesByTag).map(([tag, value]) => {
        const sectionKey = `${level}-${tag}`;
        const isExpanded = expandedSections.has(sectionKey);

        if (Array.isArray(value)) {
          return (
            <ExpandableSection
              key={tag}
              title={`${tag}: ${value.length}`}
              level={level}
              isExpanded={isExpanded}
              onToggle={() => toggleSection(sectionKey)}
            >
              <ul
                key={tag}
                style={{
                  marginLeft: level * 20,
                  marginBottom: 8,
                  paddingLeft: 20,
                }}
              >
                {value.map((movie, index) => (
                  <li key={index} style={{ marginBottom: 4 }}>
                    {movie}
                  </li>
                ))}
              </ul>
            </ExpandableSection>
          );
        }

        return (
          <ExpandableSection
            key={tag}
            title={tag}
            level={level}
            isExpanded={isExpanded}
            onToggle={() => toggleSection(sectionKey)}
          >
            {renderMoviesByTag(
              value as GroupedMovies,
              level + 1,
              expandedSections,
              toggleSection,
            )}
          </ExpandableSection>
        );
      })}
    </div>
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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    setMoviesByTag(buildMoviesByTag(diaryData, prefixSeparator, groupBy));
    // Reset expanded sections when data changes
    setExpandedSections(new Set());
  }, [diaryData, prefixSeparator, groupBy]);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  return (
    <div>
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
        <h2>Movies by {groupBy}</h2>
        {moviesByTag &&
          renderMoviesByTag(moviesByTag, 0, expandedSections, toggleSection)}
      </div>
    </div>
  );
};

export default MoviesSummary;
