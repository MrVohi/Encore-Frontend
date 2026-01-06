import type { Dispatch, SetStateAction } from "react";
import type { Artist } from "./artist";

type ResultsProps = { results: Artist[] };

type SearchInputArgs = {
  setResults: Dispatch<SetStateAction<Artist[]>>;
};

export function SearchInput(value: string, { setResults }: SearchInputArgs) {
    const url = new URL("http://localhost:8080/api/search")
    url.searchParams.set("q", value)
    fetch(url.toString())
        .then((r) => r.json())
        .then((json: Artist[]) => {
        const result = json
        setResults(result);
    });
}

export function ShowResults({ results }: ResultsProps) {
  if (results.length === 0) return null;

  return (
    <div className="absolute top-full left-0 mt-2 w-full z-50">
      <div className="bg-white text-black rounded-xl shadow-xl max-h-72 overflow-y-auto">
        {results.map((a) => (
          <div
            key={a.id}
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
          >
            {a.name}
          </div>
        ))}
      </div>
    </div>
  );
}
