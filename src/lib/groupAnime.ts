import { JikanAnime } from "./jikan";
/**
 * Normalize an anime title to a base franchise name
 * so that e.g. "Frieren Season 2" and "Frieren" group together.
 */
function normalizeTitle(anime: JikanAnime): string {
  const title = (anime.title_english || anime.title).toLowerCase();

  return title
    // Remove common sequel/season indicators
    .replace(/\s*(season|part|cour)\s*\d+/gi, "")
    .replace(/\s*\d+(st|nd|rd|th)\s*(season|cour|part)/gi, "")
    .replace(/\s*(ii|iii|iv|v|vi)(\s|$)/gi, " ")
    .replace(/\s*:\s*(part|season)\s*\w+/gi, "")
    .replace(/\s*-\s*(part|season)\s*\w+/gi, "")
    // Remove trailing numbers that look like season numbers (e.g. "Title 2")
    .replace(/\s+\d+\s*$/, "")
    // Remove special suffixes
    .replace(/\s*(final|the final|continuation|kanketsu-hen|recap|prologue|epilogue)\s*/gi, "")
    // Clean up
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export interface GroupedAnime {
  key: string;
  main: JikanAnime;
  seasons: JikanAnime[];
  totalEpisodes: number;
  bestScore: number | null;
}

/**
 * Group an array of anime by franchise.
 * Returns the highest-scored entry as the "main" representative.
 */
export function groupAnimeByFranchise(animeList: JikanAnime[]): GroupedAnime[] {
  // Disable season bundling by returning each anime as its own "group"
  return animeList.map(anime => ({
    key: anime.mal_id.toString(),
    main: anime,
    seasons: [anime],
    totalEpisodes: anime.episodes ?? 0,
    bestScore: anime.score,
  }));
}
