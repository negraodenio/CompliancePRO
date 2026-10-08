-- Concrete import consistency defect: owner/discovery attributes had no durable slot.
ALTER TABLE agents ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
