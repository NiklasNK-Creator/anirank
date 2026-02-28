const BASE_URL = "https://api.jikan.moe/v4";

export interface JikanAnime {
  mal_id: number;
  title: string;
  title_english: string | null;
  images: {
    jpg: { large_image_url: string; image_url: string };
    webp: { large_image_url: string; image_url: string };
  };
  synopsis: string | null;
  score: number | null;
  episodes: number | null;
  status: string;
  genres: { mal_id: number; name: string }[];
  year: number | null;
  season: string | null;
  type: string;
}

interface JikanResponse<T> {
  data: T;
  pagination?: { last_visible_page: number; has_next_page: boolean };
}

async function fetchJikan<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`);
  if (!res.ok) throw new Error(`Jikan API error: ${res.status}`);
  return res.json();
}

export async function getTopAnime(page = 1, limit = 25) {
  return fetchJikan<JikanResponse<JikanAnime[]>>(`/top/anime?page=${page}&limit=${limit}`);
}

export async function searchAnime(query: string, page = 1) {
  return fetchJikan<JikanResponse<JikanAnime[]>>(`/anime?q=${encodeURIComponent(query)}&page=${page}&limit=20&sfw=true`);
}

export async function getAnimeById(id: number) {
  return fetchJikan<JikanResponse<JikanAnime>>(`/anime/${id}`);
}

export async function getSeasonNow(page = 1) {
  return fetchJikan<JikanResponse<JikanAnime[]>>(`/seasons/now?page=${page}&limit=20`);
}

export async function getAnimeRecommendations() {
  return fetchJikan<JikanResponse<JikanAnime[]>>(`/top/anime?filter=bypopularity&limit=10`);
}
