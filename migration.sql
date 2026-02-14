-- Migration: Change verified column type from BIT(1) to TINYINT(1)
-- This allows storing values: 0 (pending), 1 (approved), 2 (rejected)

ALTER TABLE `advertisement` MODIFY COLUMN `verified` TINYINT(1) NOT NULL DEFAULT 0;
