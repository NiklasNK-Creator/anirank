import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Navigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, X, User } from "lucide-react";

interface FriendshipRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  requester_profile?: { username: string; display_name: string | null; avatar_url: string | null };
  addressee_profile?: { username: string; display_name: string | null; avatar_url: string | null };
}

export default function Friends() {
  const { user, loading: authLoading } = useAuth();
  const [incoming, setIncoming] = useState<FriendshipRow[]>([]);
  const [accepted, setAccepted] = useState<FriendshipRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadFriends();
  }, [user]);

  const loadFriends = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("friendships")
      .select("*")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    if (!data) { setLoading(false); return; }

    // Load profiles for all friend user IDs
    const friendIds = new Set<string>();
    data.forEach((f: any) => {
      friendIds.add(f.requester_id);
      friendIds.add(f.addressee_id);
    });
    friendIds.delete(user.id);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username, display_name, avatar_url")
      .in("user_id", Array.from(friendIds));

    const profileMap = new Map<string, any>();
    profiles?.forEach((p: any) => profileMap.set(p.user_id, p));

    const enriched = data.map((f: any) => ({
      ...f,
      requester_profile: profileMap.get(f.requester_id),
      addressee_profile: profileMap.get(f.addressee_id),
    }));

    setIncoming(enriched.filter((f: any) => f.status === "pending" && f.addressee_id === user.id));
    setAccepted(enriched.filter((f: any) => f.status === "accepted"));
    setLoading(false);
  };

  const acceptRequest = async (id: string) => {
    const { error } = await supabase.from("friendships").update({ status: "accepted" }).eq("id", id);
    if (!error) {
      toast.success("Friend request accepted!");
      loadFriends();
    }
  };

  const declineRequest = async (id: string) => {
    const { error } = await supabase.from("friendships").delete().eq("id", id);
    if (!error) {
      toast.success("Request declined");
      loadFriends();
    }
  };

  const removeFriend = async (id: string) => {
    const { error } = await supabase.from("friendships").delete().eq("id", id);
    if (!error) {
      toast.success("Friend removed");
      loadFriends();
    }
  };

  if (!authLoading && !user) return <Navigate to="/auth" />;

  const getFriendProfile = (f: FriendshipRow) => {
    if (!user) return null;
    return f.requester_id === user.id ? f.addressee_profile : f.requester_profile;
  };

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="font-display text-3xl font-bold mb-6">Friends</h1>

        {/* Incoming Requests */}
        {incoming.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display text-lg font-semibold mb-3 text-foreground">Pending Requests</h2>
            <div className="space-y-3">
              {incoming.map((f) => {
                const profile = f.requester_profile;
                return (
                  <motion.div key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border"
                  >
                    <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <Link to={`/user/${profile?.username}`} className="font-semibold text-foreground hover:text-primary">
                        {profile?.display_name || profile?.username}
                      </Link>
                      <p className="text-xs text-muted-foreground">@{profile?.username}</p>
                    </div>
                    <Button size="sm" onClick={() => acceptRequest(f.id)} className="bg-primary text-primary-foreground">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => declineRequest(f.id)} className="text-destructive">
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Friends List */}
        <h2 className="font-display text-lg font-semibold mb-3 text-foreground">Your Friends</h2>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : accepted.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No friends yet.</p>
            <Link to="/users">
              <Button className="bg-primary text-primary-foreground">Find Users</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {accepted.map((f) => {
              const profile = getFriendProfile(f);
              return (
                <motion.div key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border"
                >
                  <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Link to={`/user/${profile?.username}`} className="font-semibold text-foreground hover:text-primary">
                      {profile?.display_name || profile?.username}
                    </Link>
                    <p className="text-xs text-muted-foreground">@{profile?.username}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => removeFriend(f.id)} className="text-muted-foreground hover:text-destructive">
                    Remove
                  </Button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
