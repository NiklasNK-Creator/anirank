import { forwardRef } from "react";
import { JikanAnime } from "@/lib/jikan";
import { Star, Plus, Check, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

interface AnimeCardProps {
  anime: JikanAnime;
  onAdd?: (anime: JikanAnime) => void;
  isInWatchlist?: boolean;
  showRating?: boolean;
  seasonCount?: number;
  totalEpisodes?: number;
}

function getAnisearchUrl(anime: JikanAnime) {
  const title = anime.title_english || anime.title;
  return `https://www.anisearch.de/anime/index?q=${encodeURIComponent(title)}&smode=2`;
}

const AnimeCard = forwardRef<HTMLDivElement, AnimeCardProps>(
  ({ anime, onAdd, isInWatchlist, showRating = true, seasonCount, totalEpisodes }, ref) => {
    const displayEpisodes = totalEpisodes ?? anime.episodes;

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="group relative rounded-xl overflow-hidden bg-card card-hover cursor-pointer"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="aspect-[3/4] overflow-hidden">
          <img
            src={anime.images.webp?.large_image_url || anime.images.jpg.large_image_url}
            alt={anime.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>

        {showRating && anime.score && (
          <div className="absolute top-3 left-3 flex items-center gap-1 rounded-lg bg-background/80 backdrop-blur-sm px-2 py-1">
            <Star className="h-3.5 w-3.5 text-tier-s fill-tier-s" />
            <span className="text-xs font-semibold text-foreground">{anime.score}</span>
          </div>
        )}

        {onAdd && (
          <button
            onClick={(e) => { e.stopPropagation(); onAdd(anime); }}
            className={`absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${
              isInWatchlist
                ? "bg-primary/20 text-primary"
                : "bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-primary hover:bg-primary/20"
            }`}
          >
            {isInWatchlist ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">
            {anime.title_english || anime.title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            {displayEpisodes ? (
              <span className="text-xs text-muted-foreground">{displayEpisodes} eps</span>
            ) : null}
            {seasonCount && seasonCount > 1 && (
              <span className="text-xs text-secondary font-medium">{seasonCount} seasons</span>
            )}
            {anime.type && (
              <span className="text-xs text-primary/70">{anime.type}</span>
            )}
          </div>
          <a
            href={getAnisearchUrl(anime)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-2 flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
          >
            <ExternalLink className="h-3 w-3" />
            Watch Now
          </a>
        </div>
      </motion.div>
    );
  }
);

AnimeCard.displayName = "AnimeCard";
export default AnimeCard;
