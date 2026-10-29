-- Update 64: columns added to Aethex Doctors tables (the Worker adds them on first use too).
ALTER TABLE find_doctors ADD COLUMN education TEXT;
ALTER TABLE find_doctors ADD COLUMN awards TEXT;
ALTER TABLE find_doctors ADD COLUMN memberships TEXT;
ALTER TABLE find_doctors ADD COLUMN timeoff TEXT;
ALTER TABLE find_reviews ADD COLUMN recommend INTEGER;
ALTER TABLE find_reviews ADD COLUMN wait TEXT;
ALTER TABLE find_reviews ADD COLUMN visited TEXT;
ALTER TABLE find_reviews ADD COLUMN reply TEXT;
