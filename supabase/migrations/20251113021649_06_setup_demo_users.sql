/*
  # Setup Demo Users and Admin Roles
  
  Configurazione degli utenti demo nel database e assegnazione ruoli admin.
  Questo garantisce che i demo account funzionino correttamente.
*/

-- Assegna il ruolo admin agli account con email admin@demo.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'admin@demo.com'
ON CONFLICT DO NOTHING;

-- Assegna il ruolo user agli account con email user@demo.com  
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'::app_role
FROM auth.users
WHERE email = 'user@demo.com'
ON CONFLICT DO NOTHING;
