import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getTopAnime, getSeasonNow, JikanAnime } from "@/lib/jikan";
import { supabase } from "@/integrations/supabase/client";
import { groupAnimeByFranchise, GroupedAnime } from "@/lib/groupAnime";
import AnimeCard from "@/components/AnimeCard";
import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, TrendingUp, Calendar, Bookmark } from "lucide-react";
import { toast } from "sonner";
import heroBg from "@/assets/hero-bg.jpg";

export default function Dashboard() {
  const { user } = useAuth();
  const [topGroups, setTopGroups] = useState<GroupedAnime[]>([]);
  const [seasonGroups, setSeasonGroups] = useState<GroupedAnime[]>([]);
  const [watchlistIds, setWatchlistIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [top, season] = await Promise.all([
          getTopAnime(1, 20),
          getSeasonNow(1),
        ]);
        setTopGroups(groupAnimeByFranchise(top.data).slice(0, 10));
        setSeasonGroups(groupAnimeByFranchise(season.data).slice(0, 10));
      } catch {
        // Jikan rate limit
      }
      setLoading(false);
    }
    load();
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

  const addToWatchlist = async (anime: JikanAnime) => {
    if (!user) {
      toast.error("Please sign in first!");
      return;
    }
    if (watchlistIds.has(anime.mal_id)) {
      const { error } = await supabase
        .from("watchlist")
        .delete()
        .eq("user_id", user.id)
        .eq("anime_id", anime.mal_id);
      if (!error) {
        setWatchlistIds((prev) => { const n = new Set(prev); n.delete(anime.mal_id); return n; });
        toast.success("Removed from watchlist");
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
        setWatchlistIds((prev) => new Set(prev).add(anime.mal_id));
        toast.success("Added to watchlist!");
      }
    }
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>
        <div className="container relative py-20 md:py-28">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
            <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight">
              Track, Rank &<br />
              <span className="text-primary text-glow-cyan">Discover</span> Anime
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-lg">
              Your personal anime platform. Create watchlists, rank your favorites and discover new series.
            </p>
            <div className="flex gap-3 mt-8">
              <Link to={user ? "/discover" : "/auth"}>
                <button className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all duration-200 border-glow">
                  {user ? "Discover Anime" : "Get Started"}
                </button>
              </Link>
              <Link to="/rankings">
                <button className="px-6 py-3 rounded-xl border border-border text-foreground font-semibold hover:bg-muted/50 transition-all duration-200">
                  View Rankings
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Top Anime */}
      <section className="container py-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="font-display text-2xl font-bold">Top Anime</h2>
          </div>
          <Link to="/discover" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {topGroups.map((group) => (
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
      </section>

      {/* This Season */}
      <section className="container py-12">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="h-5 w-5 text-secondary" />
          <h2 className="font-display text-2xl font-bold">This Season</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {seasonGroups.map((group) => (
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
      </section>

      {/* CTA */}
      {!user && (
        <section className="container py-16">
          <div className="rounded-2xl border border-border p-8 md:p-12 text-center" style={{ background: "var(--gradient-hero)" }}>
            <Bookmark className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="font-display text-3xl font-bold mb-3">Get Started with AniRank</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create your profile, track your anime and share your rankings with the community.
            </p>
            <Link to="/auth">
              <button className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all">
                Sign Up Free
              </button>
            </Link>
          </div>
        </section>
      )}
    </Layout>
  );
}
