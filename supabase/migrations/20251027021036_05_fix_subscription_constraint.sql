/*
  # Fix Subscription Constraint
  
  Modifica il constraint UNIQUE su user_subscriptions per permettere
  cambio di piano. Invece di avere un solo record attivo per utente,
  manteniamo lo storico e usiamo lo status per filtrare.
*/

-- Rimuovi il constraint UNIQUE su user_id
ALTER TABLE public.user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_user_id_key;

-- Crea un indice parziale per garantire un solo piano attivo per utente
CREATE UNIQUE INDEX IF NOT EXISTS user_subscriptions_active_user_unique 
  ON public.user_subscriptions(user_id) 
  WHERE status = 'active';
