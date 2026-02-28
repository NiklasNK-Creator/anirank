import { useQuery } from "@tanstack/react-query";
import { getTopAnime, getSeasonNow, searchAnime } from "@/lib/jikan";
import { groupAnimeByFranchise } from "@/lib/groupAnime";

export function useTopAnime(limit = 20) {
  return useQuery({
    queryKey: ["jikan", "top", limit],
    queryFn: async () => {
      const res = await getTopAnime(1, limit);
      return groupAnimeByFranchise(res.data);
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useSeasonNow() {
  return useQuery({
    queryKey: ["jikan", "season-now"],
    queryFn: async () => {
      const res = await getSeasonNow(1);
      return groupAnimeByFranchise(res.data);
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useAnimeSearch(query: string, enabled: boolean) {
  return useQuery({
    queryKey: ["jikan", "search", query],
    queryFn: async () => {
      const res = await searchAnime(query);
      return groupAnimeByFranchise(res.data);
    },
    enabled: enabled && query.trim().length > 0,
    staleTime: 2 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
