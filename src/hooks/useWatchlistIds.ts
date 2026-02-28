import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { JikanAnime } from "@/lib/jikan";
import { toast } from "sonner";
import { useCallback } from "react";

export function useWatchlistIds() {
  const { user } = useAuth();

  const { data: watchlistIds = new Set<number>() } = useQuery({
    queryKey: ["watchlist-ids", user?.id],
    queryFn: async () => {
      if (!user) return new Set<number>();
      const { data } = await supabase
        .from("watchlist")
        .select("anime_id")
        .eq("user_id", user.id);
      return new Set(data?.map((d) => d.anime_id) ?? []);
    },
    enabled: !!user,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  const queryClient = useQueryClient();

  const toggleWatchlist = useCallback(async (anime: JikanAnime) => {
    if (!user) {
      toast.error("Please sign in first!");
      return;
    }
    const isIn = watchlistIds.has(anime.mal_id);
    if (isIn) {
      const { error } = await supabase
        .from("watchlist")
        .delete()
        .eq("user_id", user.id)
        .eq("anime_id", anime.mal_id);
      if (!error) {
        toast.success("Removed from watchlist");
        queryClient.invalidateQueries({ queryKey: ["watchlist-ids", user.id] });
      }
    } else {
      const { error } = await supabase.from("watchlist").insert({
        user_id: user.id,
        anime_id: anime.mal_id,
        anime_title: anime.title_english || anime.title,
        anime_image: anime.images.webp?.large_image_url || anime.images.jpg.large_image_url,
        total_episodes: anime.episodes,
      });
      if (!error) {
        toast.success("Added to watchlist!");
        queryClient.invalidateQueries({ queryKey: ["watchlist-ids", user.id] });
      }
    }
  }, [user, watchlistIds, queryClient]);

  return { watchlistIds, toggleWatchlist };
}
