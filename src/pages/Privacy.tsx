import Layout from "@/components/Layout";

export default function Privacy() {
  return (
    <Layout>
      <div className="container py-12 max-w-3xl">
        <h1 className="font-display text-3xl font-bold mb-6">Privacy Policy</h1>
        <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground">
          <p>Your privacy is important to us. AniRank collects only the data necessary to provide our service.</p>
          <h2 className="text-xl font-semibold text-foreground mt-6">Data We Collect</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Account information (email, username)</li>
            <li>Watchlist and ranking data you create</li>
            <li>Profile information you choose to share</li>
          </ul>
          <h2 className="text-xl font-semibold text-foreground mt-6">How We Use Your Data</h2>
          <p>We use your data solely to provide the AniRank service, including displaying your watchlist, rankings, and enabling social features like friend connections.</p>
          <h2 className="text-xl font-semibold text-foreground mt-6">Data Sharing</h2>
          <p>We do not sell your personal data. Profile information is only visible to others if you enable the visibility toggles in your profile settings.</p>
          <h2 className="text-xl font-semibold text-foreground mt-6">Contact</h2>
          <p>For privacy-related inquiries, please use the contact page.</p>
        </div>
      </div>
    </Layout>
  );
}
