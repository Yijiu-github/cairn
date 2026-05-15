CREATE TABLE `code_index_snapshots` (
	`snapshot_id` text PRIMARY KEY NOT NULL,
	`source_root_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`status` text NOT NULL,
	`index_version` text NOT NULL,
	`file_count` integer NOT NULL,
	`created_at` text NOT NULL,
	`metadata` text,
	FOREIGN KEY (`source_root_id`) REFERENCES `source_roots`(`source_root_id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`workspace_id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_code_index_snapshots_source_root_created` ON `code_index_snapshots` (`source_root_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_code_index_snapshots_workspace_created` ON `code_index_snapshots` (`workspace_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `context_packs` (
	`context_pack_id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`orchestration_run_id` text,
	`task_id` text,
	`source_root_ids` text NOT NULL,
	`created_for` text NOT NULL,
	`query` text NOT NULL,
	`items` text NOT NULL,
	`token_estimate` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`workspace_id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`orchestration_run_id`) REFERENCES `orchestration_runs`(`orchestration_run_id`) ON UPDATE cascade ON DELETE set null,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`task_id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_context_packs_workspace_created` ON `context_packs` (`workspace_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_context_packs_run` ON `context_packs` (`orchestration_run_id`);--> statement-breakpoint
CREATE INDEX `idx_context_packs_task` ON `context_packs` (`task_id`);--> statement-breakpoint
CREATE TABLE `source_roots` (
	`source_root_id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`kind` text NOT NULL,
	`display_name` text NOT NULL,
	`uri` text NOT NULL,
	`status` text NOT NULL,
	`include_globs` text NOT NULL,
	`exclude_globs` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`last_indexed_at` text,
	`error` text,
	`metadata` text,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`workspace_id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_source_roots_workspace_status` ON `source_roots` (`workspace_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_source_roots_workspace_uri` ON `source_roots` (`workspace_id`,`uri`);