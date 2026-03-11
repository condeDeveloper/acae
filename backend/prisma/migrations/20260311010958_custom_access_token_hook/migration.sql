-- Custom Access Token Hook: injeta claim 'papel' no JWT do Supabase Auth

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims    jsonb;
  user_papel text;
BEGIN
  SELECT papel::text INTO user_papel
  FROM public.professores
  WHERE supabase_user_id = (event->>'user_id')::uuid;

  claims := jsonb_set(
    event->'claims',
    '{papel}',
    to_jsonb(COALESCE(user_papel, 'professor'))
  );

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook
  FROM authenticated, anon, public;

-- ATENÇÃO: Após esta migration, acessar o Dashboard do Supabase:
-- Authentication → Hooks → Access Token Hook → selecionar public.custom_access_token_hook