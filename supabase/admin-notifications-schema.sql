-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  recipient_user_id UUID REFERENCES auth.users(id),
  recipient_territory TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT false,
  deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS territory TEXT DEFAULT '';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS territory_notifications BOOLEAN DEFAULT true;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
ALTER TABLE issues ADD COLUMN IF NOT EXISTS inspection_id UUID;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see their own notifications" ON notifications;
CREATE POLICY "Users see their own notifications"
ON notifications FOR SELECT
USING (
  recipient_user_id = auth.uid() OR
  (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ) AND recipient_user_id IS NULL)
);

DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;
CREATE POLICY "Service role can insert notifications"
ON notifications FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
USING (recipient_user_id = auth.uid());
