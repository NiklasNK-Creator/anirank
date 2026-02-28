import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Search, User } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface UserResult {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export default function SearchUsers() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    const { data } = await supabase
      .from("profiles")
      .select("username, display_name, avatar_url, bio")
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(20);
    setResults((data as UserResult[]) || []);
    setLoading(false);
  };

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="font-display text-3xl font-bold mb-6">Find Users</h1>

        <div className="relative max-w-xl mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
            placeholder="Search by username..."
            className="pl-10 bg-card border-border focus:border-primary"
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-3">
            {results.map((u) => (
              <motion.div key={u.username} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Link
                  to={`/user/${u.username}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{u.display_name || u.username}</p>
                    <p className="text-sm text-muted-foreground">@{u.username}</p>
                    {u.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{u.bio}</p>}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : searched ? (
          <p className="text-center text-muted-foreground py-12">No users found.</p>
        ) : null}
      </div>
    </Layout>
  );
}
