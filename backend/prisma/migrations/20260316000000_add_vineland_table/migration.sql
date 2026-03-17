-- CreateTable: avaliacoes_vineland (Vineland-3 por aluno)
CREATE TABLE "avaliacoes_vineland" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "avaliador" TEXT NOT NULL,
    "data_teste" DATE NOT NULL,

    -- Comunicação
    "com_bruta"     INTEGER NOT NULL,
    "com_padrao"    INTEGER NOT NULL,
    "com_nivel"     TEXT NOT NULL,
    "com_ic"        TEXT,
    "com_percentil" TEXT,

    -- Atividades de Vida Diária
    "avd_bruta"     INTEGER NOT NULL,
    "avd_padrao"    INTEGER NOT NULL,
    "avd_nivel"     TEXT NOT NULL,
    "avd_ic"        TEXT,
    "avd_percentil" TEXT,

    -- Socialização
    "soc_bruta"     INTEGER NOT NULL,
    "soc_padrao"    INTEGER NOT NULL,
    "soc_nivel"     TEXT,
    "soc_ic"        TEXT,
    "soc_percentil" TEXT,

    -- Composto
    "soma_padroes"  INTEGER NOT NULL,
    "cca_composto"  INTEGER NOT NULL,
    "cca_ic"        TEXT,
    "cca_percentil" TEXT,

    -- FK
    "aluno_id" UUID NOT NULL,

    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avaliacoes_vineland_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "avaliacoes_vineland"
    ADD CONSTRAINT "avaliacoes_vineland_aluno_id_fkey"
    FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "avaliacoes_vineland_aluno_id_idx" ON "avaliacoes_vineland"("aluno_id");
