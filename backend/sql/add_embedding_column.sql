-- Adiciona a coluna de embedding à tabela TrainingMaterial
ALTER TABLE "TrainingMaterial" ADD COLUMN IF NOT EXISTS "embedding" JSONB; 