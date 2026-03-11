-- Habilita Row Level Security e define políticas de isolamento por professor

ALTER TABLE public.turmas                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos_alunos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contextos_pedagogicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_aluno       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rascunhos_documento   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.versoes_documento     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "professor_own_turmas"
  ON public.turmas FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = professor_id)
  WITH CHECK ((SELECT auth.uid()) = professor_id);

CREATE POLICY "coordenador_all_turmas"
  ON public.turmas FOR SELECT TO authenticated
  USING ((SELECT auth.jwt() ->> 'papel') = 'coordenador');

CREATE POLICY "professor_own_alunos"
  ON public.alunos FOR ALL TO authenticated
  USING (
    turma_id IN (
      SELECT id FROM public.turmas
      WHERE professor_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "coordenador_all_alunos"
  ON public.alunos FOR SELECT TO authenticated
  USING ((SELECT auth.jwt() ->> 'papel') = 'coordenador');

CREATE POLICY "professor_own_rascunhos"
  ON public.rascunhos_documento FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = professor_id)
  WITH CHECK ((SELECT auth.uid()) = professor_id);

CREATE POLICY "coordenador_all_rascunhos"
  ON public.rascunhos_documento FOR SELECT TO authenticated
  USING ((SELECT auth.jwt() ->> 'papel') = 'coordenador');

CREATE POLICY "professor_own_versoes"
  ON public.versoes_documento FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = professor_id);

CREATE POLICY "coordenador_all_versoes"
  ON public.versoes_documento FOR SELECT TO authenticated
  USING ((SELECT auth.jwt() ->> 'papel') = 'coordenador');

CREATE INDEX IF NOT EXISTS idx_turmas_professor_id    ON public.turmas (professor_id);
CREATE INDEX IF NOT EXISTS idx_rascunhos_professor_id ON public.rascunhos_documento (professor_id);
CREATE INDEX IF NOT EXISTS idx_versoes_professor_id   ON public.versoes_documento (professor_id);