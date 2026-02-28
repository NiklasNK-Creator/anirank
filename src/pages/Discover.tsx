import { useState, useCallback } from "react";
import { useTopAnime, useAnimeSearch } from "@/hooks/useJikan";
import { useWatchlistIds } from "@/hooks/useWatchlistIds";
import AnimeCard from "@/components/AnimeCard";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

export default function Discover() {
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { data: topGroups = [], isLoading: topLoading } = useTopAnime(25);
  const { data: searchGroups = [], isLoading: searchLoading, isFetching } = useAnimeSearch(searchTerm, searchTerm.length > 0);
  const { watchlistIds, toggleWatchlist } = useWatchlistIds();

  const isSearching = searchTerm.length > 0;
  const groups = isSearching ? searchGroups : topGroups;
  const loading = isSearching ? searchLoading : topLoading;

  const doSearch = useCallback(() => {
    if (query.trim()) setSearchTerm(query.trim());
  }, [query]);

  const clearSearch = useCallback(() => {
    setQuery("");
    setSearchTerm("");
  }, []);

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="font-display text-3xl font-bold mb-6">Discover Anime</h1>

        <div className="relative max-w-xl mb-8 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSearch()}
              placeholder="Search anime..."
              className="pl-10 bg-card border-border focus:border-primary"
            />
            {query && (
              <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button onClick={doSearch} disabled={!query.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Search
          </Button>
        </div>

        {(loading || isFetching) ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No results found. Try a different search.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {groups.map((group) => (
              <AnimeCard
                key={group.main.mal_id}
                anime={group.main}
                onAdd={toggleWatchlist}
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
