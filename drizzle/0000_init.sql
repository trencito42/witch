CREATE TABLE IF NOT EXISTS `user` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified` boolean NOT NULL DEFAULT false,
  `image` text,
  `last_login_at` datetime(3),
  `is_admin` boolean NOT NULL DEFAULT false,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_email_unique` (`email`)
);

CREATE TABLE IF NOT EXISTS `session` (
  `id` varchar(36) NOT NULL,
  `expires_at` datetime(3) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  `ip_address` varchar(64),
  `user_agent` text,
  `user_id` varchar(36) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_token_unique` (`token`),
  KEY `session_user_idx` (`user_id`),
  CONSTRAINT `session_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `account` (
  `id` varchar(36) NOT NULL,
  `account_id` varchar(255) NOT NULL,
  `provider_id` varchar(255) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `access_token` text,
  `refresh_token` text,
  `id_token` text,
  `access_token_expires_at` datetime(3),
  `refresh_token_expires_at` datetime(3),
  `scope` text,
  `password` text,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `account_user_idx` (`user_id`),
  CONSTRAINT `account_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `verification` (
  `id` varchar(36) NOT NULL,
  `identifier` varchar(255) NOT NULL,
  `value` varchar(255) NOT NULL,
  `expires_at` datetime(3) NOT NULL,
  `created_at` datetime(3),
  `updated_at` datetime(3),
  PRIMARY KEY (`id`),
  KEY `verification_identifier_idx` (`identifier`)
);

CREATE TABLE IF NOT EXISTS `organization` (
  `id` varchar(36) NOT NULL,
  `name` varchar(120) NOT NULL,
  `slug` varchar(80) NOT NULL,
  `billing_email` varchar(255),
  `timezone` varchar(64) NOT NULL DEFAULT 'UTC',
  `status_page_enabled` boolean NOT NULL DEFAULT false,
  `status_page_slug` varchar(80),
  `status_page_headline` varchar(160),
  `alert_on_incident` boolean NOT NULL DEFAULT true,
  `alert_on_recovery` boolean NOT NULL DEFAULT true,
  `monthly_reports_enabled` boolean NOT NULL DEFAULT true,
  `min_alert_severity` varchar(16) NOT NULL DEFAULT 'LOW',
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `organization_slug_unique` (`slug`),
  UNIQUE KEY `organization_status_page_slug_unique` (`status_page_slug`),
  KEY `org_status_slug_idx` (`status_page_slug`)
);

CREATE TABLE IF NOT EXISTS `organization_member` (
  `id` varchar(36) NOT NULL,
  `organization_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `role` varchar(16) NOT NULL,
  `created_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `org_member_unique` (`organization_id`,`user_id`),
  KEY `org_member_user_idx` (`user_id`),
  CONSTRAINT `organization_member_org_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE CASCADE,
  CONSTRAINT `organization_member_user_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `organization_invitation` (
  `id` varchar(36) NOT NULL,
  `organization_id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `role` varchar(16) NOT NULL,
  `token_hash` varchar(64) NOT NULL,
  `invited_by_user_id` varchar(36) NOT NULL,
  `expires_at` datetime(3) NOT NULL,
  `accepted_at` datetime(3),
  `revoked_at` datetime(3),
  `created_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `organization_invitation_token_hash_unique` (`token_hash`),
  KEY `invite_org_idx` (`organization_id`),
  KEY `invite_email_idx` (`email`),
  CONSTRAINT `organization_invitation_org_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE CASCADE,
  CONSTRAINT `organization_invitation_user_fk` FOREIGN KEY (`invited_by_user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `subscription` (
  `id` varchar(36) NOT NULL,
  `organization_id` varchar(36) NOT NULL,
  `plan_id` varchar(32) NOT NULL DEFAULT 'free',
  `status` varchar(32) NOT NULL DEFAULT 'active',
  `stripe_customer_id` varchar(64),
  `stripe_subscription_id` varchar(64),
  `stripe_price_id` varchar(64),
  `current_period_start` datetime(3),
  `current_period_end` datetime(3),
  `cancel_at_period_end` boolean NOT NULL DEFAULT false,
  `trial_ends_at` datetime(3),
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `subscription_organization_id_unique` (`organization_id`),
  KEY `sub_customer_idx` (`stripe_customer_id`),
  KEY `sub_stripe_idx` (`stripe_subscription_id`),
  CONSTRAINT `subscription_org_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `billing_event` (
  `id` varchar(36) NOT NULL,
  `organization_id` varchar(36),
  `stripe_event_id` varchar(255) NOT NULL,
  `type` varchar(64) NOT NULL,
  `processed_at` datetime(3) NOT NULL,
  `payload_summary` json,
  PRIMARY KEY (`id`),
  UNIQUE KEY `billing_event_stripe_event_id_unique` (`stripe_event_id`),
  KEY `billing_org_idx` (`organization_id`),
  CONSTRAINT `billing_event_org_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `site` (
  `id` varchar(36) NOT NULL,
  `organization_id` varchar(36) NOT NULL,
  `name` varchar(120) NOT NULL,
  `url` varchar(2048) NOT NULL,
  `normalized_url` varchar(2048) NOT NULL,
  `favicon_url` varchar(2048),
  `status` varchar(16) NOT NULL DEFAULT 'UNKNOWN',
  `visual_sensitivity` varchar(16) NOT NULL DEFAULT 'MEDIUM',
  `paused_at` datetime(3),
  `last_checked_at` datetime(3),
  `last_healthy_at` datetime(3),
  `status_page_visible` boolean NOT NULL DEFAULT true,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `site_org_idx` (`organization_id`),
  KEY `site_org_status_idx` (`organization_id`,`status`),
  UNIQUE KEY `site_org_url_idx` (`organization_id`,`normalized_url`(191)),
  CONSTRAINT `site_org_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `monitor` (
  `id` varchar(36) NOT NULL,
  `organization_id` varchar(36) NOT NULL,
  `site_id` varchar(36) NOT NULL,
  `type` varchar(32) NOT NULL,
  `name` varchar(120) NOT NULL,
  `enabled` boolean NOT NULL DEFAULT true,
  `interval_seconds` int NOT NULL,
  `next_run_at` datetime(3) NOT NULL,
  `last_run_at` datetime(3),
  `consecutive_failures` int NOT NULL DEFAULT 0,
  `consecutive_successes` int NOT NULL DEFAULT 0,
  `locked_at` datetime(3),
  `selector` varchar(512),
  `expected_text` varchar(512),
  `check_mode` varchar(32),
  `viewport` varchar(16),
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `monitor_due_idx` (`enabled`,`next_run_at`),
  KEY `monitor_site_idx` (`site_id`),
  KEY `monitor_org_idx` (`organization_id`),
  CONSTRAINT `monitor_org_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE CASCADE,
  CONSTRAINT `monitor_site_fk` FOREIGN KEY (`site_id`) REFERENCES `site`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `monitor_check` (
  `id` varchar(36) NOT NULL,
  `organization_id` varchar(36) NOT NULL,
  `site_id` varchar(36) NOT NULL,
  `monitor_id` varchar(36) NOT NULL,
  `started_at` datetime(3) NOT NULL,
  `completed_at` datetime(3),
  `duration_ms` int,
  `success` boolean NOT NULL DEFAULT false,
  `status_code` int,
  `error_code` varchar(64),
  `error_message` varchar(1024),
  `resolved_ip` varchar(64),
  `final_url` varchar(2048),
  `page_title` varchar(512),
  `ssl_valid` boolean,
  `ssl_expires_at` datetime(3),
  `trigger` varchar(16) NOT NULL DEFAULT 'schedule',
  `summary` json,
  `created_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `check_monitor_created_idx` (`monitor_id`,`created_at`),
  KEY `check_site_created_idx` (`site_id`,`created_at`),
  KEY `check_org_created_idx` (`organization_id`,`created_at`),
  CONSTRAINT `monitor_check_org_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE CASCADE,
  CONSTRAINT `monitor_check_site_fk` FOREIGN KEY (`site_id`) REFERENCES `site`(`id`) ON DELETE CASCADE,
  CONSTRAINT `monitor_check_monitor_fk` FOREIGN KEY (`monitor_id`) REFERENCES `monitor`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `visual_snapshot` (
  `id` varchar(36) NOT NULL,
  `organization_id` varchar(36) NOT NULL,
  `site_id` varchar(36) NOT NULL,
  `monitor_id` varchar(36) NOT NULL,
  `check_id` varchar(36),
  `viewport` varchar(16) NOT NULL,
  `storage_key` varchar(512) NOT NULL,
  `content_type` varchar(64) NOT NULL,
  `byte_size` int NOT NULL,
  `width` int NOT NULL,
  `height` int NOT NULL,
  `is_baseline` boolean NOT NULL DEFAULT false,
  `dom_signals` json,
  `created_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `snap_site_vp_idx` (`site_id`,`viewport`,`created_at`),
  KEY `snap_baseline_idx` (`monitor_id`,`is_baseline`),
  KEY `snap_org_idx` (`organization_id`),
  CONSTRAINT `visual_snapshot_org_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE CASCADE,
  CONSTRAINT `visual_snapshot_site_fk` FOREIGN KEY (`site_id`) REFERENCES `site`(`id`) ON DELETE CASCADE,
  CONSTRAINT `visual_snapshot_monitor_fk` FOREIGN KEY (`monitor_id`) REFERENCES `monitor`(`id`) ON DELETE CASCADE,
  CONSTRAINT `visual_snapshot_check_fk` FOREIGN KEY (`check_id`) REFERENCES `monitor_check`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `visual_diff` (
  `id` varchar(36) NOT NULL,
  `organization_id` varchar(36) NOT NULL,
  `site_id` varchar(36) NOT NULL,
  `monitor_id` varchar(36) NOT NULL,
  `baseline_snapshot_id` varchar(36) NOT NULL,
  `current_snapshot_id` varchar(36) NOT NULL,
  `diff_storage_key` varchar(512),
  `difference_ratio` varchar(16) NOT NULL,
  `changed_pixels` int NOT NULL,
  `width` int NOT NULL,
  `height` int NOT NULL,
  `above_threshold` boolean NOT NULL,
  `created_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `diff_site_idx` (`site_id`,`created_at`),
  CONSTRAINT `visual_diff_org_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE CASCADE,
  CONSTRAINT `visual_diff_site_fk` FOREIGN KEY (`site_id`) REFERENCES `site`(`id`) ON DELETE CASCADE,
  CONSTRAINT `visual_diff_monitor_fk` FOREIGN KEY (`monitor_id`) REFERENCES `monitor`(`id`) ON DELETE CASCADE,
  CONSTRAINT `visual_diff_baseline_fk` FOREIGN KEY (`baseline_snapshot_id`) REFERENCES `visual_snapshot`(`id`) ON DELETE CASCADE,
  CONSTRAINT `visual_diff_current_fk` FOREIGN KEY (`current_snapshot_id`) REFERENCES `visual_snapshot`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `incident` (
  `id` varchar(36) NOT NULL,
  `organization_id` varchar(36) NOT NULL,
  `site_id` varchar(36) NOT NULL,
  `monitor_id` varchar(36),
  `fingerprint` varchar(190) NOT NULL,
  `category` varchar(32) NOT NULL,
  `severity` varchar(16) NOT NULL,
  `title` varchar(255) NOT NULL,
  `summary` text NOT NULL,
  `status` varchar(16) NOT NULL DEFAULT 'OPEN',
  `first_detected_at` datetime(3) NOT NULL,
  `last_detected_at` datetime(3) NOT NULL,
  `resolved_at` datetime(3),
  `occurrence_count` int NOT NULL DEFAULT 1,
  `ai_analysis` json,
  `metadata` json,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `incident_org_status_idx` (`organization_id`,`status`),
  KEY `incident_site_status_idx` (`site_id`,`status`),
  KEY `incident_fingerprint_idx` (`organization_id`,`fingerprint`,`status`),
  CONSTRAINT `incident_org_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE CASCADE,
  CONSTRAINT `incident_site_fk` FOREIGN KEY (`site_id`) REFERENCES `site`(`id`) ON DELETE CASCADE,
  CONSTRAINT `incident_monitor_fk` FOREIGN KEY (`monitor_id`) REFERENCES `monitor`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `incident_event` (
  `id` varchar(36) NOT NULL,
  `incident_id` varchar(36) NOT NULL,
  `organization_id` varchar(36) NOT NULL,
  `type` varchar(32) NOT NULL,
  `message` varchar(1024) NOT NULL,
  `actor_user_id` varchar(36),
  `metadata` json,
  `created_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `incident_event_idx` (`incident_id`,`created_at`),
  CONSTRAINT `incident_event_incident_fk` FOREIGN KEY (`incident_id`) REFERENCES `incident`(`id`) ON DELETE CASCADE,
  CONSTRAINT `incident_event_org_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `alert_channel` (
  `id` varchar(36) NOT NULL,
  `organization_id` varchar(36) NOT NULL,
  `type` varchar(16) NOT NULL,
  `name` varchar(80) NOT NULL,
  `destination` varchar(255) NOT NULL,
  `enabled` boolean NOT NULL DEFAULT true,
  `created_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `alert_channel_org_idx` (`organization_id`),
  CONSTRAINT `alert_channel_org_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `alert_delivery` (
  `id` varchar(36) NOT NULL,
  `organization_id` varchar(36) NOT NULL,
  `channel_id` varchar(36),
  `incident_id` varchar(36),
  `type` varchar(32) NOT NULL,
  `status` varchar(16) NOT NULL,
  `error_message` varchar(512),
  `created_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `alert_delivery_org_idx` (`organization_id`),
  CONSTRAINT `alert_delivery_org_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE CASCADE,
  CONSTRAINT `alert_delivery_channel_fk` FOREIGN KEY (`channel_id`) REFERENCES `alert_channel`(`id`) ON DELETE SET NULL,
  CONSTRAINT `alert_delivery_incident_fk` FOREIGN KEY (`incident_id`) REFERENCES `incident`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `report` (
  `id` varchar(36) NOT NULL,
  `organization_id` varchar(36) NOT NULL,
  `site_id` varchar(36),
  `period_start` datetime(3) NOT NULL,
  `period_end` datetime(3) NOT NULL,
  `title` varchar(160) NOT NULL,
  `metrics` json NOT NULL,
  `created_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `report_org_idx` (`organization_id`,`created_at`),
  UNIQUE KEY `report_site_period` (`organization_id`,`site_id`,`period_start`),
  CONSTRAINT `report_org_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE CASCADE,
  CONSTRAINT `report_site_fk` FOREIGN KEY (`site_id`) REFERENCES `site`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `report_item` (
  `id` varchar(36) NOT NULL,
  `report_id` varchar(36) NOT NULL,
  `label` varchar(120) NOT NULL,
  `value` varchar(255) NOT NULL,
  `detail` text,
  PRIMARY KEY (`id`),
  KEY `report_item_idx` (`report_id`),
  CONSTRAINT `report_item_report_fk` FOREIGN KEY (`report_id`) REFERENCES `report`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `audit_log` (
  `id` varchar(36) NOT NULL,
  `organization_id` varchar(36),
  `actor_user_id` varchar(36),
  `action` varchar(64) NOT NULL,
  `target_type` varchar(32),
  `target_id` varchar(36),
  `metadata` json,
  `ip_address` varchar(64),
  `created_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `audit_org_idx` (`organization_id`,`created_at`),
  KEY `audit_actor_idx` (`actor_user_id`,`created_at`)
);

CREATE TABLE IF NOT EXISTS `api_key` (
  `id` varchar(36) NOT NULL,
  `organization_id` varchar(36) NOT NULL,
  `name` varchar(80) NOT NULL,
  `prefix` varchar(16) NOT NULL,
  `secret_hash` varchar(64) NOT NULL,
  `created_by_user_id` varchar(36) NOT NULL,
  `last_used_at` datetime(3),
  `revoked_at` datetime(3),
  `created_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `api_key_secret_hash_unique` (`secret_hash`),
  KEY `api_key_org_idx` (`organization_id`),
  CONSTRAINT `api_key_org_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE CASCADE,
  CONSTRAINT `api_key_user_fk` FOREIGN KEY (`created_by_user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `job` (
  `id` varchar(36) NOT NULL,
  `type` varchar(32) NOT NULL,
  `status` varchar(16) NOT NULL DEFAULT 'pending',
  `organization_id` varchar(36),
  `site_id` varchar(36),
  `monitor_id` varchar(36),
  `incident_id` varchar(36),
  `payload` json,
  `run_at` datetime(3) NOT NULL,
  `claimed_at` datetime(3),
  `claimed_by` varchar(80),
  `attempts` int NOT NULL DEFAULT 0,
  `max_attempts` int NOT NULL DEFAULT 5,
  `last_error` text,
  `completed_at` datetime(3),
  `created_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `job_claim_idx` (`status`,`run_at`),
  KEY `job_monitor_status_idx` (`monitor_id`,`status`),
  KEY `job_org_idx` (`organization_id`)
);

CREATE TABLE IF NOT EXISTS `system_heartbeat` (
  `name` varchar(32) NOT NULL,
  `last_seen_at` datetime(3) NOT NULL,
  `metadata` json,
  PRIMARY KEY (`name`)
);

CREATE TABLE IF NOT EXISTS `ai_usage` (
  `id` varchar(36) NOT NULL,
  `organization_id` varchar(36),
  `incident_id` varchar(36),
  `provider` varchar(32) NOT NULL,
  `model` varchar(64) NOT NULL,
  `input_tokens` int,
  `output_tokens` int,
  `estimated_cost_usd` varchar(16),
  `created_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ai_usage_org_idx` (`organization_id`,`created_at`)
);

CREATE TABLE IF NOT EXISTS `rate_limit` (
  `key_hash` varchar(64) NOT NULL,
  `window_start` datetime(3) NOT NULL,
  `count` int NOT NULL DEFAULT 0,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`key_hash`)
);
