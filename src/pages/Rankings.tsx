import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import TierRow from "@/components/TierRow";
import { Button } from "@/components/ui/button";
import { Plus, Heart } from "lucide-react";
import { toast } from "sonner";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";

interface TierlistItemData {
  id: string;
  anime_id: number;
  anime_title: string;
  anime_image: string;
  tier: string;
  position: number;
}

interface WatchlistItem {
  anime_id: number;
  anime_title: string;
  anime_image: string;
}

const TIERS = ["S", "A", "B", "C", "D", "F"];

export default function Rankings() {
  const { user, loading: authLoading } = useAuth();
  const [tierlistId, setTierlistId] = useState<string | null>(null);
  const [items, setItems] = useState<TierlistItemData[]>([]);
  const [watchlistAnime, setWatchlistAnime] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    let { data: tierlists } = await supabase
      .from("tierlists")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);

    let listId: string;
    if (!tierlists || tierlists.length === 0) {
      const { data: newList } = await supabase
        .from("tierlists")
        .insert({ user_id: user.id, title: "My Anime Ranking" })
        .select("id")
        .single();
      listId = newList!.id;
    } else {
      listId = tierlists[0].id;
    }
    setTierlistId(listId);

    const [tierItems, wl, likes] = await Promise.all([
      supabase.from("tierlist_items").select("*").eq("tierlist_id", listId).order("position"),
      supabase.from("watchlist").select("anime_id, anime_title, anime_image").eq("user_id", user.id),
      supabase.from("tierlist_likes").select("id, user_id").eq("tierlist_id", listId),
    ]);

    if (tierItems.data) setItems(tierItems.data as TierlistItemData[]);
    if (wl.data) setWatchlistAnime(wl.data as WatchlistItem[]);
    if (likes.data) {
      setLikeCount(likes.data.length);
      setLiked(likes.data.some((l: any) => l.user_id === user.id));
    }
    setLoading(false);
  };

  const toggleLike = async () => {
    if (!user || !tierlistId) return;
    if (liked) {
      await supabase.from("tierlist_likes").delete().eq("user_id", user.id).eq("tierlist_id", tierlistId);
      setLiked(false);
      setLikeCount(prev => prev - 1);
    } else {
      await supabase.from("tierlist_likes").insert({ user_id: user.id, tierlist_id: tierlistId });
      setLiked(true);
      setLikeCount(prev => prev + 1);
    }
  };

  const addAnimeToTier = async (anime: WatchlistItem, tier: string) => {
    if (!user || !tierlistId) return;
    if (items.some((i) => i.anime_id === anime.anime_id)) {
      toast.error("Already in ranking!");
      return;
    }

    const { data, error } = await supabase
      .from("tierlist_items")
      .insert({
        tierlist_id: tierlistId,
        user_id: user.id,
        anime_id: anime.anime_id,
        anime_title: anime.anime_title,
        anime_image: anime.anime_image,
        tier,
        position: items.filter((i) => i.tier === tier).length,
      })
      .select()
      .single();

    if (!error && data) {
      setItems((prev) => [...prev, data as TierlistItemData]);
      toast.success(`${anime.anime_title} added to Tier ${tier}`);
    }
  };

  const changeTier = async (itemId: string, newTier: string) => {
    const { error } = await supabase
      .from("tierlist_items")
      .update({ tier: newTier })
      .eq("id", itemId);

    if (!error) {
      setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, tier: newTier } : i)));
    }
  };

  const removeFromRanking = async (itemId: string) => {
    const { error } = await supabase.from("tierlist_items").delete().eq("id", itemId);
    if (!error) {
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      toast.success("Removed");
    }
  };

  if (!authLoading && !user) return <Navigate to="/auth" />;

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="font-display text-3xl font-bold">My Rankings</h1>
            <button onClick={toggleLike} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-secondary transition-colors">
              <Heart className={`h-5 w-5 ${liked ? "fill-secondary text-secondary" : ""}`} />
              <span>{likeCount}</span>
            </button>
          </div>
          <Button
            onClick={() => setShowAdd(!showAdd)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Anime
          </Button>
        </div>

        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-6 p-4 rounded-xl bg-card border border-border"
          >
            <h3 className="font-semibold mb-3 text-foreground">Add from Watchlist</h3>
            {watchlistAnime.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Add anime to your <Link to="/watchlist" className="text-primary hover:underline">Watchlist</Link> first.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {watchlistAnime
                  .filter((w) => !items.some((i) => i.anime_id === w.anime_id))
                  .map((anime) => (
                    <div key={anime.anime_id} className="group relative">
                      <img
                        src={anime.anime_image}
                        alt={anime.anime_title}
                        className="w-full aspect-[3/4] object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-1">
                        <p className="text-xs font-medium text-foreground text-center px-2 line-clamp-2">{anime.anime_title}</p>
                        <div className="flex gap-1 mt-1">
                          {TIERS.map((t) => (
                            <button
                              key={t}
                              onClick={() => addAnimeToTier(anime, t)}
                              className="w-7 h-7 rounded text-xs font-bold text-primary-foreground hover:scale-110 transition-transform"
                              style={{ backgroundColor: `hsl(var(--tier-${t.toLowerCase()}))` }}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </motion.div>
        )}

        {loading ? (
          <div className="space-y-3">
            {TIERS.map((t) => (
              <div key={t} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {TIERS.map((tier) => (
              <TierRow key={tier} tier={tier}>
                {items
                  .filter((i) => i.tier === tier)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="group relative flex items-center gap-2 bg-muted/50 rounded-lg p-1 pr-2"
                    >
                      <img
                        src={item.anime_image}
                        alt={item.anime_title}
                        className="w-12 h-16 object-cover rounded"
                      />
                      <span className="text-xs font-medium text-foreground max-w-[100px] truncate">
                        {item.anime_title}
                      </span>
                      <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                        <select
                          value={item.tier}
                          onChange={(e) => changeTier(item.id, e.target.value)}
                          className="text-[10px] bg-card border border-border rounded px-1 py-0.5 text-foreground"
                        >
                          {TIERS.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => removeFromRanking(item.id)}
                          className="w-5 h-5 rounded bg-destructive/80 text-foreground text-[10px] flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
              </TierRow>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
