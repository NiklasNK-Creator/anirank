import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import TierRow from "@/components/TierRow";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { UserPlus, UserCheck, Heart, BarChart3, List, Trophy } from "lucide-react";

interface ProfileData {
  user_id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  show_watchlist: boolean;
  show_ranklist: boolean;
}

interface WatchlistItem {
  anime_title: string;
  anime_image: string;
  status: string;
  episodes_watched: number;
  total_episodes: number | null;
}

interface TierlistItemData {
  id: string;
  anime_title: string;
  anime_image: string;
  tier: string;
  position: number;
}

const TIERS = ["S", "A", "B", "C", "D", "F"];

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [tierItems, setTierItems] = useState<TierlistItemData[]>([]);
  const [friendStatus, setFriendStatus] = useState<string | null>(null);
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ watchlist: 0, completed: 0, ranked: 0 });
  const [tierlistId, setTierlistId] = useState<string | null>(null);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!username) return;
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    const { data: p } = await supabase
      .from("profiles")
      .select("user_id, username, display_name, bio, avatar_url, banner_url, show_watchlist, show_ranklist")
      .eq("username", username)
      .single();

    if (!p) {
      setLoading(false);
      return;
    }
    setProfile(p as ProfileData);

    // Load stats & data
    const [wlRes, tierlistRes] = await Promise.all([
      supabase.from("watchlist").select("anime_title, anime_image, status, episodes_watched, total_episodes").eq("user_id", p.user_id),
      supabase.from("tierlists").select("id").eq("user_id", p.user_id).eq("is_public", true).limit(1),
    ]);

    const wlData = wlRes.data || [];
    setStats({
      watchlist: wlData.length,
      completed: wlData.filter((i: any) => i.status === "completed").length,
      ranked: 0,
    });

    if ((p as ProfileData).show_watchlist) {
      setWatchlist(wlData as WatchlistItem[]);
    }

    if ((p as ProfileData).show_ranklist && tierlistRes.data && tierlistRes.data.length > 0) {
      const tId = tierlistRes.data[0].id;
      setTierlistId(tId);

      const [itemsRes, likesRes] = await Promise.all([
        supabase.from("tierlist_items").select("id, anime_title, anime_image, tier, position").eq("tierlist_id", tId).order("position"),
        supabase.from("tierlist_likes").select("id, user_id").eq("tierlist_id", tId)
      ]);

      if (itemsRes.data) {
        setTierItems(itemsRes.data as TierlistItemData[]);
        setStats(prev => ({ ...prev, ranked: itemsRes.data.length }));
      }
      if (likesRes.data) {
        setLikeCount(likesRes.data.length);
        // Since `user` is from useAuth, we need to pass it, but loadProfile doesn't have `user` as dependency natively without warning.
        // Actually `user.id` is accessible here because we can check the auth state. Wait, we'll check it.
        const currentUser = (await supabase.auth.getUser()).data.user;
        if (currentUser) {
          setLiked(likesRes.data.some((l: any) => l.user_id === currentUser.id));
        }
      }
    }

    // Check friendship
    if (user && user.id !== p.user_id) {
      const { data: friends } = await supabase
        .from("friendships")
        .select("id, status, requester_id")
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${p.user_id}),and(requester_id.eq.${p.user_id},addressee_id.eq.${user.id})`);
      if (friends && friends.length > 0) {
        setFriendStatus(friends[0].status);
        setFriendshipId(friends[0].id);
      }
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

  const sendFriendRequest = async () => {
    if (!user || !profile) return;
    const { error } = await supabase.from("friendships").insert({
      requester_id: user.id,
      addressee_id: profile.user_id,
    });
    if (!error) {
      setFriendStatus("pending");
      toast.success("Friend request sent!");
    } else {
      toast.error("Failed to send request");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <div className="h-8 w-32 bg-muted animate-pulse rounded mx-auto" />
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="font-display text-2xl font-bold text-foreground">User not found</h1>
          <p className="text-muted-foreground mt-2">No user with that username exists.</p>
        </div>
      </Layout>
    );
  }

  const isOwnProfile = user?.id === profile.user_id;

  return (
    <Layout>
      {/* Banner */}
      <div className="relative h-48 md:h-64 overflow-hidden">
        {profile.banner_url ? (
          <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: "var(--gradient-neon)", opacity: 0.3 }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="container -mt-16 relative z-10 pb-12">
        <div className="flex items-end gap-4 mb-6">
          <div className="w-28 h-28 rounded-2xl border-4 border-background overflow-hidden bg-muted">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-display font-bold text-primary">
                {profile.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="pb-1">
            <h1 className="font-display text-2xl font-bold text-foreground">
              {profile.display_name || profile.username}
            </h1>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
          </div>
          {!isOwnProfile && user && (
            <div className="ml-auto">
              {friendStatus === "accepted" ? (
                <Button variant="ghost" className="text-primary" disabled>
                  <UserCheck className="h-4 w-4 mr-2" /> Friends
                </Button>
              ) : friendStatus === "pending" ? (
                <Button variant="ghost" className="text-muted-foreground" disabled>
                  Request Pending
                </Button>
              ) : (
                <Button onClick={sendFriendRequest} className="bg-primary text-primary-foreground">
                  <UserPlus className="h-4 w-4 mr-2" /> Add Friend
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: List, label: "Watchlist", value: stats.watchlist },
            { icon: BarChart3, label: "Completed", value: stats.completed },
            { icon: Trophy, label: "Ranked", value: stats.ranked },
          ].map(({ icon: Icon, label, value }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-card border border-border p-4 text-center"
            >
              <Icon className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-display font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </motion.div>
          ))}
        </div>

        {profile.bio && <p className="text-muted-foreground mb-8 max-w-lg">{profile.bio}</p>}

        {/* Watchlist (if public) */}
        {profile.show_watchlist && watchlist.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display text-xl font-bold mb-4 text-foreground">Watchlist</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {watchlist.slice(0, 12).map((item, i) => (
                <div key={i} className="rounded-lg overflow-hidden bg-card border border-border">
                  <img src={item.anime_image} alt={item.anime_title} className="w-full aspect-[3/4] object-cover" />
                  <div className="p-2">
                    <p className="text-xs font-medium text-foreground truncate">{item.anime_title}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{item.status.replace("_", " ")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rankings (if public) */}
        {profile.show_ranklist && tierItems.length > 0 && (
          <div>
            <div className="flex items-center gap-4 mb-4">
              <h2 className="font-display text-xl font-bold text-foreground">Rankings</h2>
              {tierlistId && (
                <button onClick={toggleLike} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-secondary transition-colors">
                  <Heart className={`h-5 w-5 ${liked ? "fill-secondary text-secondary" : ""}`} />
                  <span>{likeCount}</span>
                </button>
              )}
            </div>
            <div className="space-y-3">
              {TIERS.map((tier) => {
                const tierAnime = tierItems.filter((i) => i.tier === tier);
                if (tierAnime.length === 0) return null;
                return (
                  <TierRow key={tier} tier={tier}>
                    {tierAnime.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 bg-muted/50 rounded-lg p-1 pr-2">
                        <img src={item.anime_image} alt={item.anime_title} className="w-12 h-16 object-cover rounded" />
                        <span className="text-xs font-medium text-foreground max-w-[100px] truncate">{item.anime_title}</span>
                      </div>
                    ))}
                  </TierRow>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
