
-- Assign admin role to orders@khanya.store
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'orders@khanya.store'
ON CONFLICT (user_id, role) DO NOTHING;
