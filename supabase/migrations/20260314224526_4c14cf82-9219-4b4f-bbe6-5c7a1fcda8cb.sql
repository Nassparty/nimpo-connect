
-- Fix overly permissive notifications INSERT policy
DROP POLICY IF EXISTS "Notifications can be inserted" ON public.notifications;
CREATE POLICY "Authenticated users can create notifications" ON public.notifications 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
