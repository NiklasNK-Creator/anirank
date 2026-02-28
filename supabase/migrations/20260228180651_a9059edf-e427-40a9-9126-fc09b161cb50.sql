
-- Notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  link text,
  from_user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id, read);

-- Storage buckets for avatars and banners
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true);

-- Storage policies
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Banner images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banners');

CREATE POLICY "Users can upload their own banner"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own banner"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own banner"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Trigger function to create notification on friend request
CREATE OR REPLACE FUNCTION public.notify_friend_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  requester_name text;
BEGIN
  SELECT username INTO requester_name FROM public.profiles WHERE user_id = NEW.requester_id;
  INSERT INTO public.notifications (user_id, type, title, message, link, from_user_id)
  VALUES (NEW.addressee_id, 'friend_request', 'New Friend Request', requester_name || ' sent you a friend request', '/friends', NEW.requester_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_friend_request
  AFTER INSERT ON public.friendships
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION public.notify_friend_request();

-- Trigger function to create notification on tierlist like
CREATE OR REPLACE FUNCTION public.notify_tierlist_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  liker_name text;
  tierlist_owner uuid;
BEGIN
  SELECT username INTO liker_name FROM public.profiles WHERE user_id = NEW.user_id;
  SELECT user_id INTO tierlist_owner FROM public.tierlists WHERE id = NEW.tierlist_id;
  IF tierlist_owner != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, title, message, link, from_user_id)
    VALUES (tierlist_owner, 'tierlist_like', 'Ranking Liked', liker_name || ' liked your ranking', '/rankings', NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_tierlist_like
  AFTER INSERT ON public.tierlist_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_tierlist_like();
