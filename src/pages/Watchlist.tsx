import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Star, Eye, Clock, Pause, X } from "lucide-react";
import { toast } from "sonner";
import { Link, Navigate } from "react-router-dom";

interface WatchlistItem {
  id: string;
  anime_id: number;
  anime_title: string;
  anime_image: string;
  status: string;
  episodes_watched: number;
  total_episodes: number | null;
  rating: number | null;
}

const statusConfig: Record<string, { label: string; icon: typeof Eye }> = {
  watching: { label: "Watching", icon: Eye },
  completed: { label: "Completed", icon: Star },
  plan_to_watch: { label: "Plan to Watch", icon: Clock },
  on_hold: { label: "On Hold", icon: Pause },
  dropped: { label: "Dropped", icon: X },
};

export default function Watchlist() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("watchlist")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        if (data) setItems(data as WatchlistItem[]);
        setLoading(false);
      });
  }, [user]);

  if (!authLoading && !user) return <Navigate to="/auth" />;

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("watchlist").update({ status }).eq("id", id);
    if (!error) {
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
      toast.success("Status updated");
    }
  };

  const removeItem = async (id: string) => {
    const { error } = await supabase.from("watchlist").delete().eq("id", id);
    if (!error) {
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success("Removed");
    }
  };

  const updateEpisodes = async (id: string, episodes: number) => {
    const { error } = await supabase.from("watchlist").update({ episodes_watched: episodes }).eq("id", id);
    if (!error) {
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, episodes_watched: episodes } : item)));
    }
  };

  const filtered = (status: string) => items.filter((i) => i.status === status);

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="font-display text-3xl font-bold mb-6">My Watchlist</h1>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">No anime in your watchlist yet.</p>
            <Link to="/discover">
              <Button className="bg-primary text-primary-foreground">Discover Anime</Button>
            </Link>
          </div>
        ) : (
          <Tabs defaultValue="watching">
            <TabsList className="bg-muted mb-6 flex-wrap">
              {Object.entries(statusConfig).map(([key, config]) => (
                <TabsTrigger key={key} value={key} className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  {config.label} ({filtered(key).length})
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.keys(statusConfig).map((status) => (
              <TabsContent key={status} value={status} className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {filtered(status).map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ duration: 0.2 }}
                      layout
                      className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
                    >
                      <img
                        src={item.anime_image}
                        alt={item.anime_title}
                        className="w-16 h-20 rounded-lg object-cover shrink-0"
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{item.anime_title}</h3>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            {item.episodes_watched}/{item.total_episodes ?? "?"} episodes
                          </span>
                          <a
                            href={`https://www.anisearch.de/anime/index?q=${encodeURIComponent(item.anime_title)}&smode=2`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:text-primary/80 font-medium"
                          >
                            Watch Now ↗
                          </a>
                          {status === "watching" && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => updateEpisodes(item.id, Math.max(0, item.episodes_watched - 1))}
                                className="w-6 h-6 rounded bg-muted text-foreground text-xs hover:bg-primary/20 transition-colors"
                              >-</button>
                              <button
                                onClick={() => {
                                  const max = item.total_episodes ?? Infinity;
                                  if (item.episodes_watched < max) updateEpisodes(item.id, item.episodes_watched + 1);
                                }}
                                className="w-6 h-6 rounded bg-muted text-foreground text-xs hover:bg-primary/20 transition-colors"
                              >+</button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={item.status}
                          onChange={(e) => updateStatus(item.id, e.target.value)}
                          className="text-xs bg-muted border border-border rounded-lg px-2 py-1 text-foreground"
                        >
                          {Object.entries(statusConfig).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </select>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {filtered(status).length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">No anime in this category.</p>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </Layout>
  );
}
