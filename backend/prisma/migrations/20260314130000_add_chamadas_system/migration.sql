-- CreateTable: chamadas (frequência diária por turma)
CREATE TABLE "chamadas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "data" DATE NOT NULL,
    "turma_id" UUID NOT NULL,
    "professor_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chamadas_pkey" PRIMARY KEY ("id")
);

-- CreateTable: presencas_chamada (uma linha por aluno por chamada)
CREATE TABLE "presencas_chamada" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "presente" BOOLEAN NOT NULL DEFAULT false,
    "chamada_id" UUID NOT NULL,
    "aluno_id" UUID NOT NULL,

    CONSTRAINT "presencas_chamada_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique chamada por turma por dia
CREATE UNIQUE INDEX "chamadas_turma_id_data_key" ON "chamadas"("turma_id", "data");

-- CreateIndex: professor index
CREATE INDEX "chamadas_professor_id_idx" ON "chamadas"("professor_id");

-- CreateIndex: unique aluno por chamada
CREATE UNIQUE INDEX "presencas_chamada_chamada_id_aluno_id_key" ON "presencas_chamada"("chamada_id", "aluno_id");

-- CreateIndex: aluno index
CREATE INDEX "presencas_chamada_aluno_id_idx" ON "presencas_chamada"("aluno_id");

-- AddForeignKey: chamadas -> turmas
ALTER TABLE "chamadas" ADD CONSTRAINT "chamadas_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: chamadas -> professores
ALTER TABLE "chamadas" ADD CONSTRAINT "chamadas_professor_id_fkey" FOREIGN KEY ("professor_id") REFERENCES "professores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: presencas_chamada -> chamadas (cascade delete)
ALTER TABLE "presencas_chamada" ADD CONSTRAINT "presencas_chamada_chamada_id_fkey" FOREIGN KEY ("chamada_id") REFERENCES "chamadas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: presencas_chamada -> alunos
ALTER TABLE "presencas_chamada" ADD CONSTRAINT "presencas_chamada_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Trigger to auto-update updated_at on chamadas
CREATE OR REPLACE FUNCTION update_chamadas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chamadas_updated_at
  BEFORE UPDATE ON "chamadas"
  FOR EACH ROW EXECUTE FUNCTION update_chamadas_updated_at();
