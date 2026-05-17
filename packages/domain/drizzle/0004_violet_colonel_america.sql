CREATE TABLE `planning_outputs` (
	`planning_output_id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`orchestration_run_id` text NOT NULL,
	`status` text NOT NULL,
	`action_tree` text NOT NULL,
	`preconditions` text NOT NULL,
	`blocked_reason` text,
	`replan_reason` text,
	`context_pack_refs` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`workspace_id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`orchestration_run_id`) REFERENCES `orchestration_runs`(`orchestration_run_id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_planning_outputs_run_unique` ON `planning_outputs` (`orchestration_run_id`);--> statement-breakpoint
CREATE INDEX `idx_planning_outputs_workspace_status` ON `planning_outputs` (`workspace_id`,`status`);