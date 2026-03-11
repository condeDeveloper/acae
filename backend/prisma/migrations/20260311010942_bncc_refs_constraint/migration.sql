-- CHECK constraint: ao menos 1 código BNCC em rascunhos e registros

ALTER TABLE public.rascunhos_documento
  ADD CONSTRAINT bncc_refs_required
  CHECK (cardinality(bncc_refs) >= 1);

ALTER TABLE public.registros_aluno
  ADD CONSTRAINT bncc_refs_required_registro
  CHECK (cardinality(bncc_refs) >= 1);