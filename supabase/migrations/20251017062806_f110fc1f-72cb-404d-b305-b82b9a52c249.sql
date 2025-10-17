-- Grant admin role to marciathabelo@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('5a4d9559-1caa-4145-a408-f7624f47dadd', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;