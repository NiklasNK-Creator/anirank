import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      toast.success("Reset link sent! Check your inbox.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--gradient-hero)" }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-8"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-primary text-glow-cyan">AniRank</h1>
          <p className="text-muted-foreground mt-2">Reset your password</p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <Mail className="h-12 w-12 text-primary mx-auto" />
            <p className="text-foreground">We sent a reset link to <strong>{email}</strong>.</p>
            <p className="text-sm text-muted-foreground">Check your inbox and click the link to set a new password.</p>
            <Link to="/auth" className="text-primary hover:underline text-sm font-medium inline-block mt-4">
              <ArrowLeft className="h-4 w-4 inline mr-1" /> Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="mt-1 bg-muted border-border focus:border-primary"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
            <Link to="/auth" className="text-primary hover:underline text-sm font-medium block text-center mt-4">
              <ArrowLeft className="h-4 w-4 inline mr-1" /> Back to Sign In
            </Link>
          </form>
        )}
      </motion.div>
    </div>
  );
}
