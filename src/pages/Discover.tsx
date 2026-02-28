import { useEffect, useState, useCallback } from "react";
import { searchAnime, getTopAnime, JikanAnime } from "@/lib/jikan";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { groupAnimeByFranchise, GroupedAnime } from "@/lib/groupAnime";
import AnimeCard from "@/components/AnimeCard";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { toast } from "sonner";

export default function Discover() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<GroupedAnime[]>([]);
  const [loading, setLoading] = useState(true);
  const [watchlistIds, setWatchlistIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    getTopAnime(1, 25).then((r) => { setGroups(groupAnimeByFranchise(r.data)); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("watchlist")
      .select("anime_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setWatchlistIds(new Set(data.map((d) => d.anime_id)));
      });
  }, [user]);

  const doSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await searchAnime(query);
      setGroups(groupAnimeByFranchise(res.data));
    } catch {
      toast.error("Search failed, please try again");
    }
    setLoading(false);
  }, [query]);

  const addToWatchlist = async (anime: JikanAnime) => {
    if (!user) {
      toast.error("Please sign in first!");
      return;
    }
    if (watchlistIds.has(anime.mal_id)) {
      await supabase.from("watchlist").delete().eq("user_id", user.id).eq("anime_id", anime.mal_id);
      setWatchlistIds((prev) => { const n = new Set(prev); n.delete(anime.mal_id); return n; });
      toast.success("Removed");
    } else {
      await supabase.from("watchlist").insert({
        user_id: user.id,
        anime_id: anime.mal_id,
        anime_title: anime.title_english || anime.title,
        anime_image: anime.images.webp?.large_image_url || anime.images.jpg.large_image_url,
        total_episodes: anime.episodes,
      });
      setWatchlistIds((prev) => new Set(prev).add(anime.mal_id));
      toast.success("Added to watchlist!");
    }
  };

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="font-display text-3xl font-bold mb-6">Discover Anime</h1>

        <div className="relative max-w-xl mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
            placeholder="Search anime..."
            className="pl-10 bg-card border-border focus:border-primary"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {groups.map((group) => (
              <AnimeCard
                key={group.main.mal_id}
                anime={group.main}
                onAdd={addToWatchlist}
                isInWatchlist={watchlistIds.has(group.main.mal_id)}
                seasonCount={group.seasons.length}
                totalEpisodes={group.totalEpisodes}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
