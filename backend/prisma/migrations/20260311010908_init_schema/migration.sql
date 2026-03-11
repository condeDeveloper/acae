-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('professor', 'coordenador');

-- CreateEnum
CREATE TYPE "StatusProfessor" AS ENUM ('ativo', 'inativo');

-- CreateEnum
CREATE TYPE "Turno" AS ENUM ('manha', 'tarde', 'integral');

-- CreateEnum
CREATE TYPE "StatusTurma" AS ENUM ('ativa', 'inativa');

-- CreateEnum
CREATE TYPE "StatusAluno" AS ENUM ('ativo', 'inativo', 'excluido');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('portfolio_semanal', 'relatorio_individual', 'atividade_adaptada', 'resumo_pedagogico');

-- CreateEnum
CREATE TYPE "StatusDocumento" AS ENUM ('rascunho', 'em_revisao', 'finalizado');

-- CreateTable
CREATE TABLE "professores" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "papel" "Papel" NOT NULL DEFAULT 'professor',
    "escola" TEXT NOT NULL,
    "status" "StatusProfessor" NOT NULL DEFAULT 'ativo',
    "supabase_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turmas" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "ano_letivo" INTEGER NOT NULL,
    "turno" "Turno" NOT NULL,
    "escola" TEXT NOT NULL,
    "status" "StatusTurma" NOT NULL DEFAULT 'ativa',
    "professor_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turmas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alunos" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "data_nascimento" DATE NOT NULL,
    "necessidades_educacionais" TEXT,
    "status" "StatusAluno" NOT NULL DEFAULT 'ativo',
    "turma_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alunos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grupos" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "turma_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grupos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grupos_alunos" (
    "grupo_id" UUID NOT NULL,
    "aluno_id" UUID NOT NULL,

    CONSTRAINT "grupos_alunos_pkey" PRIMARY KEY ("grupo_id","aluno_id")
);

-- CreateTable
CREATE TABLE "competencias_bncc" (
    "id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "area_conhecimento" TEXT NOT NULL,
    "nivel_educacional" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competencias_bncc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contextos_pedagogicos" (
    "id" UUID NOT NULL,
    "periodo" TEXT NOT NULL,
    "metodologia" TEXT NOT NULL,
    "objetivos" TEXT NOT NULL,
    "dinamica_grupo" TEXT,
    "turma_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contextos_pedagogicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_aluno" (
    "id" UUID NOT NULL,
    "periodo" TEXT NOT NULL,
    "objetivos" TEXT NOT NULL,
    "atividades" TEXT NOT NULL,
    "mediacoes" TEXT,
    "ocorrencias" TEXT,
    "bncc_refs" TEXT[],
    "aluno_id" UUID NOT NULL,
    "turma_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registros_aluno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rascunhos_documento" (
    "id" UUID NOT NULL,
    "tipo" "TipoDocumento" NOT NULL,
    "status" "StatusDocumento" NOT NULL DEFAULT 'rascunho',
    "conteudo_gerado" TEXT NOT NULL,
    "conteudo_editado" TEXT,
    "conteudo_final" TEXT,
    "periodo" TEXT NOT NULL,
    "bncc_refs" TEXT[],
    "prompt_hash" TEXT NOT NULL,
    "duracao_geracao_ms" INTEGER,
    "finalizado_em" TIMESTAMP(3),
    "professor_id" UUID NOT NULL,
    "aluno_id" UUID,
    "turma_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rascunhos_documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "versoes_documento" (
    "id" UUID NOT NULL,
    "numero_versao" INTEGER NOT NULL,
    "conteudo" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "bncc_refs" TEXT[],
    "finalizado_em" TIMESTAMP(3) NOT NULL,
    "rascunho_id" UUID NOT NULL,
    "professor_id" UUID NOT NULL,
    "aluno_id" UUID,
    "turma_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "versoes_documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "controle_cotas" (
    "id" UUID NOT NULL,
    "data" DATE NOT NULL,
    "contagem_requisicoes" INTEGER NOT NULL DEFAULT 0,
    "ultima_requisicao_em" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "controle_cotas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "professores_email_key" ON "professores"("email");

-- CreateIndex
CREATE UNIQUE INDEX "professores_supabase_user_id_key" ON "professores"("supabase_user_id");

-- CreateIndex
CREATE INDEX "turmas_professor_id_idx" ON "turmas"("professor_id");

-- CreateIndex
CREATE INDEX "alunos_turma_id_idx" ON "alunos"("turma_id");

-- CreateIndex
CREATE UNIQUE INDEX "competencias_bncc_codigo_key" ON "competencias_bncc"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "contextos_pedagogicos_turma_id_periodo_key" ON "contextos_pedagogicos"("turma_id", "periodo");

-- CreateIndex
CREATE INDEX "registros_aluno_turma_id_periodo_idx" ON "registros_aluno"("turma_id", "periodo");

-- CreateIndex
CREATE UNIQUE INDEX "registros_aluno_aluno_id_periodo_key" ON "registros_aluno"("aluno_id", "periodo");

-- CreateIndex
CREATE INDEX "rascunhos_documento_professor_id_status_idx" ON "rascunhos_documento"("professor_id", "status");

-- CreateIndex
CREATE INDEX "rascunhos_documento_aluno_id_periodo_idx" ON "rascunhos_documento"("aluno_id", "periodo");

-- CreateIndex
CREATE INDEX "versoes_documento_professor_id_idx" ON "versoes_documento"("professor_id");

-- CreateIndex
CREATE UNIQUE INDEX "versoes_documento_rascunho_id_numero_versao_key" ON "versoes_documento"("rascunho_id", "numero_versao");

-- CreateIndex
CREATE UNIQUE INDEX "controle_cotas_data_key" ON "controle_cotas"("data");

-- AddForeignKey
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_professor_id_fkey" FOREIGN KEY ("professor_id") REFERENCES "professores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alunos" ADD CONSTRAINT "alunos_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupos" ADD CONSTRAINT "grupos_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupos_alunos" ADD CONSTRAINT "grupos_alunos_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupos_alunos" ADD CONSTRAINT "grupos_alunos_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contextos_pedagogicos" ADD CONSTRAINT "contextos_pedagogicos_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_aluno" ADD CONSTRAINT "registros_aluno_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_aluno" ADD CONSTRAINT "registros_aluno_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rascunhos_documento" ADD CONSTRAINT "rascunhos_documento_professor_id_fkey" FOREIGN KEY ("professor_id") REFERENCES "professores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rascunhos_documento" ADD CONSTRAINT "rascunhos_documento_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rascunhos_documento" ADD CONSTRAINT "rascunhos_documento_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versoes_documento" ADD CONSTRAINT "versoes_documento_rascunho_id_fkey" FOREIGN KEY ("rascunho_id") REFERENCES "rascunhos_documento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versoes_documento" ADD CONSTRAINT "versoes_documento_professor_id_fkey" FOREIGN KEY ("professor_id") REFERENCES "professores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versoes_documento" ADD CONSTRAINT "versoes_documento_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versoes_documento" ADD CONSTRAINT "versoes_documento_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
