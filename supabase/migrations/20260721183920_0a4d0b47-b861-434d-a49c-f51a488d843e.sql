ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.otp_codes FROM anon, authenticated;
GRANT ALL ON public.otp_codes TO service_role;
CREATE POLICY "Deny all client access to otp_codes" ON public.otp_codes AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);