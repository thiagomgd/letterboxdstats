import { useState } from "react";
import "./App.css";
import type { ParsedLetterboxdDiaryEntry } from "./types";
import MoviesSummary from "./MoviesSumary";

function App() {
  const [prefixSeparator, setPrefixSeparator] = useState(":");
  const [diaryData, setDiaryData] = useState<ParsedLetterboxdDiaryEntry[]>([]);

  return (
    <>
      <h1>Letterboxd Diary Stats</h1>
      <p>
        This is a tool to create weekly and monthly stats for your Letterboxd
        diary based on your tags.
      </p>
      <p>
        It will generate totals by tag, but also group tags that use common
        prefixes. Use field below to indicate the prefix separator - default is
        :
      </p>
      <label>
        Prefix separator:{" "}
        <input
          type="text"
          value={prefixSeparator}
          onChange={(e) => setPrefixSeparator(e.target.value)}
          style={{ width: "2em", textAlign: "center" }}
        />
      </label>
      <div style={{ marginTop: "1em" }}>
        <label>
          Upload your Letterboxd diary CSV:{" "}
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (event) => {
                // You can handle the CSV content here
                // For now, just log it to the console

                if (event.target?.result) {
                  const csv = event.target.result as string;
                  const lines = csv
                    .split(/\r?\n/)
                    .filter((line) => line.trim() !== "");
                  if (lines.length < 2) return; // no data
                  const headers = lines[0].split(",");
                  const entries: ParsedLetterboxdDiaryEntry[] = lines
                    .slice(1)
                    .map((line) => {
                      const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
                      // Map columns by header
                      const get = (header: string) => {
                        const idx = headers.indexOf(header);
                        return idx >= 0 ? cols[idx] : "";
                      };
                      // Parse fields
                      const year = Number(get("Year"));
                      const ratingStr = get("Rating");
                      const rating = ratingStr ? Number(ratingStr) : undefined;
                      const rewatchStr = get("Rewatch");
                      const rewatch = rewatchStr
                        ? rewatchStr.toLowerCase() === "yes"
                        : undefined;
                      const tagsStr = get("Tags");
                      const parsedTags = tagsStr
                        ? tagsStr
                            .replace(/^"|"$/g, "")
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean)
                        : [];
                      return {
                        date: get("Date"),
                        name: get("Name"),
                        year,
                        letterboxdUri: get("Letterboxd URI"),
                        rating,
                        rewatch,
                        tags: tagsStr,
                        watchedDate: get("Watched Date"),
                        parsedTags,
                      };
                    });
                  // Aggregate movie titles by tag group and value, supporting multiple separators for nested grouping
                  // For example: "with: family: kids" becomes moviesByTag['with']['family']['kids']
                  const moviesByTag: any = {};
                  entries.forEach((entry) => {
                    if (entry.parsedTags && entry.name) {
                      entry.parsedTags.forEach((tag) => {
                        const parts = tag
                          .split(prefixSeparator)
                          .map((part) => part.trim())
                          .filter(Boolean);
                        if (parts.length === 0) return;
                        let current = moviesByTag;
                        // Traverse/create nested objects for each part except the last
                        for (let i = 0; i < parts.length - 1; i++) {
                          const part = parts[i];
                          if (!current[part]) {
                            current[part] = {};
                          }
                          current = current[part];
                        }
                        // The last part is where we store the movie title
                        const lastPart = parts[parts.length - 1];
                        if (!current[lastPart]) {
                          current[lastPart] = [];
                        }
                        current[lastPart].push(entry.name);
                      });
                    }
                  });
                  setDiaryData(entries);
                }
              };
              reader.readAsText(file);
            }}
          />
        </label>
      </div>

      {/* Render DiaryList and pass diaryData */}
      <MoviesSummary diaryData={diaryData} prefixSeparator={prefixSeparator} />
    </>
  );
}

export default App;
