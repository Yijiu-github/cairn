CREATE TABLE `code_index_files` (
	`file_id` text PRIMARY KEY NOT NULL,
	`snapshot_id` text NOT NULL,
	`source_root_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`path` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`mtime_ms` integer NOT NULL,
	`digest` text NOT NULL,
	`language` text,
	`ignored` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`snapshot_id`) REFERENCES `code_index_snapshots`(`snapshot_id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`source_root_id`) REFERENCES `source_roots`(`source_root_id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`workspace_id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_code_index_files_snapshot_path` ON `code_index_files` (`snapshot_id`,`path`);--> statement-breakpoint
CREATE INDEX `idx_code_index_files_source_root_path` ON `code_index_files` (`source_root_id`,`path`);--> statement-breakpoint
CREATE INDEX `idx_code_index_files_workspace_language` ON `code_index_files` (`workspace_id`,`language`);