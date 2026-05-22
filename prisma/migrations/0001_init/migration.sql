-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- CreateEnum
CREATE TYPE "status_os_enum" AS ENUM ('Recebido', 'Orcamento', 'Aguardando_peca', 'Consertado', 'Entregue', 'Cancelado', 'Sem_solucao');

-- CreateEnum
CREATE TYPE "forma_pagamento_enum" AS ENUM ('PIX', 'Dinheiro', 'Cartao');

-- CreateEnum
CREATE TYPE "estado_pagamento_enum" AS ENUM ('Pago', 'Pendente', 'Sem_cobranca');

-- CreateSequence (FR-5: numero_sequencial monotônico, sem reciclar)
-- Precisa existir ANTES da tabela "os" porque o DEFAULT referencia a sequence.
CREATE SEQUENCE "os_numero_sequencial_seq" START WITH 1001 INCREMENT BY 1 NO CYCLE;

-- CreateTable
CREATE TABLE "os" (
    "id" BIGSERIAL NOT NULL,
    "numero_sequencial" INTEGER NOT NULL DEFAULT nextval('os_numero_sequencial_seq'),
    "status" "status_os_enum" NOT NULL,
    "cliente_id" BIGINT NOT NULL,
    "aparelho_tipo" TEXT NOT NULL,
    "aparelho_descricao" TEXT,
    "defeito_relatado" TEXT NOT NULL,
    "valor_cobrado_centavos" INTEGER,
    "forma_pagamento" "forma_pagamento_enum",
    "estado_pagamento" "estado_pagamento_enum" NOT NULL DEFAULT 'Sem_cobranca',
    "aprovado_em" TIMESTAMPTZ,
    "pago_em" TIMESTAMPTZ,
    "status_alterado_em" TIMESTAMPTZ NOT NULL,
    "observacoes" TEXT,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletado_em" TIMESTAMPTZ,
    "request_id" TEXT,

    CONSTRAINT "os_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cliente" (
    "id" BIGSERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "telefone_normalizado" TEXT NOT NULL,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletado_em" TIMESTAMPTZ,

    CONSTRAINT "cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "config" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "limiar_dias_parados" INTEGER NOT NULL DEFAULT 30,

    CONSTRAINT "config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_log" (
    "request_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "payload_resposta_json" JSONB NOT NULL,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_log_pkey" PRIMARY KEY ("request_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "os_numero_sequencial_key" ON "os"("numero_sequencial");

-- CreateIndex
CREATE INDEX "idx_cliente_telefone_normalizado" ON "cliente"("telefone_normalizado");

-- AddForeignKey
ALTER TABLE "os" ADD CONSTRAINT "os_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- =============================================================================
-- Apêndices manuais (Prisma 7 não cobre índices funcionais nem parciais)
-- =============================================================================

-- Índice GIN funcional para busca por nome (FR-16) — case+accent-insensitive
-- via unaccent + pg_trgm. Usa gin_trgm_ops para suportar LIKE/ILIKE/% acentos.
CREATE INDEX "idx_cliente_nome_lower_unaccent" ON "cliente"
  USING gin (lower(unaccent("nome")) gin_trgm_ops);

-- Índice parcial de OSs em status ATIVO (FR-14: Aparelhos parados; FR-6 listagem)
-- Mantém o índice pequeno (só ativas) e cobre ORDER BY status_alterado_em DESC.
CREATE INDEX "idx_os_status__ativo" ON "os" ("status", "status_alterado_em" DESC)
  WHERE "deletado_em" IS NULL
    AND "status" IN ('Recebido', 'Orcamento', 'Aguardando_peca', 'Consertado');

-- Índice parcial de pagamentos concretizados (FR-15: Resumo financeiro mensal)
CREATE INDEX "idx_os_pago_em__pago" ON "os" ("pago_em")
  WHERE "estado_pagamento" = 'Pago' AND "deletado_em" IS NULL;
