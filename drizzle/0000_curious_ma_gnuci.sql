CREATE TABLE `changelogs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` integer NOT NULL,
	`detected_at` text NOT NULL,
	`before_text` text NOT NULL,
	`after_text` text NOT NULL,
	`diff_html` text,
	`status` text NOT NULL,
	`review_notes` text,
	`reviewed_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_key` text NOT NULL,
	`company_name` text NOT NULL,
	`product_name` text NOT NULL,
	`trains_on_data_by_default` integer NOT NULL,
	`trains_on_data_nuance` text NOT NULL,
	`opt_out_available` integer NOT NULL,
	`opt_out_how` text NOT NULL,
	`retention_period` text NOT NULL,
	`data_deleted_on_request` integer NOT NULL,
	`data_deleted_on_request_timeframe` text NOT NULL,
	`third_party_sharing` text NOT NULL,
	`human_review_of_chats` integer NOT NULL,
	`human_review_conditions` text NOT NULL,
	`regional_variation` text NOT NULL,
	`children_data_policy` text NOT NULL,
	`enterprise_vs_consumer_difference` integer NOT NULL,
	`enterprise_vs_consumer_summary` text NOT NULL,
	`source_url` text NOT NULL,
	`last_verified_date` text NOT NULL,
	`last_changed_date` text,
	`confidence` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `companies_company_key_unique` ON `companies` (`company_key`);--> statement-breakpoint
CREATE TABLE `snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` integer NOT NULL,
	`fetched_at` text NOT NULL,
	`content_hash` text NOT NULL,
	`raw_content` text NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);

