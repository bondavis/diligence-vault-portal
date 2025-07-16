-- Remove the foreign key constraint that's preventing profile creation
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;