ALTER TABLE `visual_diff` ADD COLUMN IF NOT EXISTS `metadata` json;
ALTER TABLE `site` ADD COLUMN IF NOT EXISTS `ignore_selectors` json;
