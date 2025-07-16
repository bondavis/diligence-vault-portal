-- Update the role check constraint to include all valid roles used in the application
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role = ANY (ARRAY[
    'view_only'::text, 
    'upload_only'::text, 
    'admin'::text,
    'seller'::text,
    'bbt_execution_team'::text,
    'affiliate_team'::text
]));