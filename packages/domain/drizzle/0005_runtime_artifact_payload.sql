ALTER TABLE `artifacts` ADD `payload_ref` text;--> statement-breakpoint
ALTER TABLE `artifacts` ADD `sensitivity` text DEFAULT 'none' NOT NULL;
