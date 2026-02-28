import Layout from "@/components/Layout";

export default function Imprint() {
  return (
    <Layout>
      <div className="container py-12 max-w-3xl">
        <h1 className="font-display text-3xl font-bold mb-6">Imprint</h1>
        <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground">
          <h2 className="text-xl font-semibold text-foreground">AniRank</h2>
          <p>AniRank is a community-driven anime tracking and ranking platform.</p>
          <h2 className="text-xl font-semibold text-foreground mt-6">Disclaimer</h2>
          <p>AniRank is a fan project and is not affiliated with any anime studios or streaming services. All anime data is sourced from publicly available APIs (Jikan/MyAnimeList). Streaming links redirect to third-party services.</p>
          <h2 className="text-xl font-semibold text-foreground mt-6">Content Responsibility</h2>
          <p>We are responsible for our own content on these pages. However, we are not obligated to monitor transmitted or stored third-party information.</p>
        </div>
      </div>
    </Layout>
  );
}
