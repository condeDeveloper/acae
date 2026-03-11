-- Trigger: versoes_documento é INSERT-ONLY (imutabilidade de documentos finalizados)

CREATE OR REPLACE FUNCTION prevent_versao_documento_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION
    'versoes_documento é append-only. Operação % não é permitida.',
    TG_OP
    USING ERRCODE = 'restrict_violation';
END;
$$;

CREATE TRIGGER versao_documento_insert_only
  BEFORE UPDATE OR DELETE
  ON public.versoes_documento
  FOR EACH ROW
  EXECUTE FUNCTION prevent_versao_documento_mutation();