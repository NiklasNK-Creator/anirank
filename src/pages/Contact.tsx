import Layout from "@/components/Layout";
import { Mail } from "lucide-react";

export default function Contact() {
  return (
    <Layout>
      <div className="container py-12 max-w-3xl">
        <h1 className="font-display text-3xl font-bold mb-6">Contact</h1>
        <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground">
          <p>Have questions, feedback, or found a bug? We'd love to hear from you.</p>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border mt-6">
            <Mail className="h-5 w-5 text-primary" />
            <span className="text-foreground">contact@anirank.app</span>
          </div>
          <h2 className="text-xl font-semibold text-foreground mt-6">Feature Requests</h2>
          <p>Got an idea for AniRank? Feel free to reach out — community suggestions help shape the platform.</p>
          <h2 className="text-xl font-semibold text-foreground mt-6">Bug Reports</h2>
          <p>If you encounter any issues, please describe the problem and steps to reproduce it so we can fix it quickly.</p>
        </div>
      </div>
    </Layout>
  );
}
