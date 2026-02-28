
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT NOT NULL,
  display_name TEXT,
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  banner_url TEXT DEFAULT '',
  theme TEXT DEFAULT 'default',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Watchlist table
CREATE TABLE public.watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  anime_id INTEGER NOT NULL,
  anime_title TEXT NOT NULL,
  anime_image TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'plan_to_watch' CHECK (status IN ('watching', 'completed', 'plan_to_watch', 'dropped', 'on_hold')),
  episodes_watched INTEGER DEFAULT 0,
  total_episodes INTEGER,
  rating INTEGER CHECK (rating >= 0 AND rating <= 10),
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, anime_id)
);

ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watchlist" ON public.watchlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public watchlists viewable" ON public.watchlist FOR SELECT USING (true);
CREATE POLICY "Users can insert own watchlist" ON public.watchlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own watchlist" ON public.watchlist FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own watchlist" ON public.watchlist FOR DELETE USING (auth.uid() = user_id);

-- Tier lists / Rankings
CREATE TABLE public.tierlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'My Anime Ranking',
  description TEXT DEFAULT '',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tierlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public tierlists viewable" ON public.tierlists FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can insert own tierlist" ON public.tierlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tierlist" ON public.tierlists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tierlist" ON public.tierlists FOR DELETE USING (auth.uid() = user_id);

-- Tier list items
CREATE TABLE public.tierlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tierlist_id UUID REFERENCES public.tierlists(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  anime_id INTEGER NOT NULL,
  anime_title TEXT NOT NULL,
  anime_image TEXT DEFAULT '',
  tier TEXT NOT NULL DEFAULT 'B' CHECK (tier IN ('S', 'A', 'B', 'C', 'D', 'F')),
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tierlist_id, anime_id)
);

ALTER TABLE public.tierlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tierlist items viewable with tierlist" ON public.tierlist_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.tierlists WHERE id = tierlist_id AND (is_public = true OR user_id = auth.uid()))
);
CREATE POLICY "Users can insert own tierlist items" ON public.tierlist_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tierlist items" ON public.tierlist_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tierlist items" ON public.tierlist_items FOR DELETE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)), COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_watchlist_updated_at BEFORE UPDATE ON public.watchlist FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tierlists_updated_at BEFORE UPDATE ON public.tierlists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
