-- Update 72: doctors can register without an Aethex account (the Worker adds these on first use too).
ALTER TABLE find_doctors ADD COLUMN contact_email TEXT;
ALTER TABLE find_doctors ADD COLUMN contact_phone TEXT;
