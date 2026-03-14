-- CreateTable: avatar_imagens (tabela de lookup de avatares)
CREATE TABLE "avatar_imagens" (
    "id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "arquivo" TEXT NOT NULL,

    CONSTRAINT "avatar_imagens_pkey" PRIMARY KEY ("id")
);

-- Dados iniciais de avatares
INSERT INTO "avatar_imagens" ("id", "nome", "arquivo") VALUES
  (1, 'Criança I',    'kidI.png'),
  (2, 'Criança II',   'kidII.png'),
  (3, 'Criança III',  'kidIII.png'),
  (4, 'Criança IV',   'kidIV.png'),
  (5, 'Criança V',    'kidV.png'),
  (6, 'Criança VI',   'kidVI.png'),
  (7, 'Criança VII',  'kidVII.png'),
  (8, 'Criança VIII', 'kidVIII.png');

-- AlterTable: adiciona coluna avatar_id a alunos
ALTER TABLE "alunos" ADD COLUMN "avatar_id" INTEGER;

-- AddForeignKey
ALTER TABLE "alunos" ADD CONSTRAINT "alunos_avatar_id_fkey"
  FOREIGN KEY ("avatar_id") REFERENCES "avatar_imagens"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- RLS: avatar_imagens é leitura pública para autenticados (tabela estática)
ALTER TABLE public.avatar_imagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "avatar_imagens_leitura"
  ON public.avatar_imagens FOR SELECT TO authenticated
  USING (true);
