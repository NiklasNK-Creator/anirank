import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { Save, BarChart3, List, Trophy, Eye } from "lucide-react";
import { motion } from "framer-motion";
import ImageUpload from "@/components/ImageUpload";

interface ProfileData {
  username: string;
  display_name: string | null;
  bio: string;
  avatar_url: string;
  banner_url: string;
  show_watchlist: boolean;
  show_ranklist: boolean;
}

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProfileData>({ username: "", display_name: "", bio: "", avatar_url: "", banner_url: "", show_watchlist: false, show_ranklist: false });
  const [stats, setStats] = useState({ watchlist: 0, completed: 0, ranked: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadProfile();
    loadStats();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("username, display_name, bio, avatar_url, banner_url, show_watchlist, show_ranklist")
      .eq("user_id", user.id)
      .single();
    if (data) {
      const p = data as ProfileData;
      setProfile(p);
      setForm(p);
    }
  };

  const loadStats = async () => {
    if (!user) return;
    const [wl, ranked] = await Promise.all([
      supabase.from("watchlist").select("id, status", { count: "exact" }).eq("user_id", user.id),
      supabase.from("tierlist_items").select("id", { count: "exact" }).eq("user_id", user.id),
    ]);
    setStats({
      watchlist: wl.count || 0,
      completed: wl.data?.filter((i) => i.status === "completed").length || 0,
      ranked: ranked.count || 0,
    });
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        username: form.username,
        display_name: form.display_name,
        bio: form.bio,
        avatar_url: form.avatar_url,
        banner_url: form.banner_url,
        show_watchlist: form.show_watchlist,
        show_ranklist: form.show_ranklist,
      })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to save");
    } else {
      setProfile(form);
      setEditing(false);
      toast.success("Profile updated!");
    }
    setSaving(false);
  };

  if (!authLoading && !user) return <Navigate to="/auth" />;
  if (!profile) return (
    <Layout>
      <div className="container py-20 text-center">
        <div className="h-8 w-32 bg-muted animate-pulse rounded mx-auto" />
      </div>
    </Layout>
  );

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
          <div className="relative">
            <div className="w-28 h-28 rounded-2xl border-4 border-background overflow-hidden bg-muted">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-display font-bold text-primary">
                  {profile.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
          <div className="pb-1">
            <h1 className="font-display text-2xl font-bold text-foreground">
              {profile.display_name || profile.username}
            </h1>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
          </div>
          <Button
            onClick={() => setEditing(!editing)}
            variant="ghost"
            className="ml-auto text-muted-foreground hover:text-primary"
          >
            {editing ? "Cancel" : "Edit"}
          </Button>
        </div>

        {/* Visibility badges */}
        <div className="flex gap-2 mb-4">
          {profile.show_watchlist && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs">
              <Eye className="h-3 w-3" /> Watchlist Public
            </span>
          )}
          {profile.show_ranklist && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary/10 text-secondary text-xs">
              <Eye className="h-3 w-3" /> Rankings Public
            </span>
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

        {!editing && profile.bio && (
          <p className="text-muted-foreground mb-8 max-w-lg">{profile.bio}</p>
        )}

        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl bg-card border border-border p-6 space-y-4 max-w-lg"
          >
            {/* Image uploads */}
            <div>
              <Label className="text-foreground">Banner Image</Label>
              <ImageUpload
                bucket="banners"
                currentUrl={form.banner_url}
                onUpload={(url) => setForm({ ...form, banner_url: url })}
                aspectRatio="aspect-[4/1]"
                placeholder="Upload Banner"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-foreground">Avatar Image</Label>
              <ImageUpload
                bucket="avatars"
                currentUrl={form.avatar_url}
                onUpload={(url) => setForm({ ...form, avatar_url: url })}
                aspectRatio="aspect-square"
                placeholder="Upload Avatar"
                className="mt-1 w-28"
              />
            </div>

            <div>
              <Label className="text-foreground">Username</Label>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="mt-1 bg-muted border-border" />
            </div>
            <div>
              <Label className="text-foreground">Display Name</Label>
              <Input value={form.display_name || ""} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className="mt-1 bg-muted border-border" />
            </div>
            <div>
              <Label className="text-foreground">Bio</Label>
              <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="mt-1 bg-muted border-border" rows={3} />
            </div>

            {/* Visibility toggles */}
            <div className="space-y-3 pt-2 border-t border-border">
              <p className="text-sm font-medium text-foreground">Profile Visibility</p>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-muted-foreground">Show Watchlist on public profile</span>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, show_watchlist: !form.show_watchlist })}
                  className={`w-10 h-6 rounded-full transition-colors ${form.show_watchlist ? "bg-primary" : "bg-muted"}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-foreground transition-transform mx-1 ${form.show_watchlist ? "translate-x-4" : ""}`} />
                </button>
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-muted-foreground">Show Rankings on public profile</span>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, show_ranklist: !form.show_ranklist })}
                  className={`w-10 h-6 rounded-full transition-colors ${form.show_ranklist ? "bg-primary" : "bg-muted"}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-foreground transition-transform mx-1 ${form.show_ranklist ? "translate-x-4" : ""}`} />
                </button>
              </label>
            </div>

            <Button onClick={saveProfile} disabled={saving} className="bg-primary text-primary-foreground">
              <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save"}
            </Button>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
