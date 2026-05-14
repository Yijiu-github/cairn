PRAGMA foreign_keys = OFF;
CREATE TABLE `agent_runs` (
	`run_id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`task_id` text NOT NULL,
	`orchestration_run_id` text NOT NULL,
	`runtime_type` text NOT NULL,
	`runtime_model` text,
	`status` text NOT NULL,
	`attempt` integer NOT NULL,
	`provider_run_id` text,
	`submitted_at` text,
	`queued_at` text,
	`started_at` text,
	`finished_at` text,
	`timeout_at` text,
	`retryable` integer NOT NULL,
	`cancelable` integer NOT NULL,
	`input_ref` text,
	`output_ref` text,
	`error` text,
	`heartbeat_at` text,
	`lease_owner` text,
	`lease_expires_at` text,
	`trace_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`workspace_id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`task_id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`orchestration_run_id`) REFERENCES `orchestration_runs`(`orchestration_run_id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_agent_runs_task` ON `agent_runs` (`task_id`);--> statement-breakpoint
CREATE INDEX `idx_agent_runs_workspace_run` ON `agent_runs` (`workspace_id`,`orchestration_run_id`);--> statement-breakpoint
CREATE TABLE `artifacts` (
	`artifact_id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`orchestration_run_id` text,
	`task_id` text,
	`run_id` text,
	`artifact_role` text NOT NULL,
	`kind` text NOT NULL,
	`format_version` text NOT NULL,
	`uri_or_path` text NOT NULL,
	`content_type` text,
	`size_bytes` integer,
	`producer_type` text NOT NULL,
	`producer_id` text,
	`visibility` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`workspace_id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`orchestration_run_id`) REFERENCES `orchestration_runs`(`orchestration_run_id`) ON UPDATE cascade ON DELETE set null,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`task_id`) ON UPDATE cascade ON DELETE set null,
	FOREIGN KEY (`run_id`) REFERENCES `agent_runs`(`run_id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_artifacts_workspace` ON `artifacts` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `idx_artifacts_run` ON `artifacts` (`orchestration_run_id`);--> statement-breakpoint
CREATE TABLE `orchestration_runs` (
	`orchestration_run_id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`conversation_id` text,
	`origin_event_id` text NOT NULL,
	`status` text NOT NULL,
	`execution_mode` text NOT NULL,
	`planner_output_ref` text,
	`synthesis_output_ref` text,
	`final_response_ref` text,
	`has_partial_failures` integer NOT NULL,
	`result_completeness` text NOT NULL,
	`completion_level` text NOT NULL,
	`started_at` text,
	`finished_at` text,
	`error` text,
	`trace_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`workspace_id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_orchestration_runs_workspace` ON `orchestration_runs` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `idx_orchestration_runs_status` ON `orchestration_runs` (`workspace_id`,`status`);--> statement-breakpoint
CREATE TABLE `tasks` (
	`task_id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`parent_task_id` text,
	`orchestration_run_id` text NOT NULL,
	`task_kind` text NOT NULL,
	`title` text NOT NULL,
	`brief` text NOT NULL,
	`execution_profile` text,
	`status` text NOT NULL,
	`priority` integer DEFAULT 50 NOT NULL,
	`attempt` integer NOT NULL,
	`idempotency_key` text NOT NULL,
	`depends_on_task_ids` text NOT NULL,
	`context_refs` text NOT NULL,
	`artifact_refs` text NOT NULL,
	`budget_hint` text,
	`failure_reason` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`workspace_id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`parent_task_id`) REFERENCES `tasks`(`task_id`) ON UPDATE cascade ON DELETE set null,
	FOREIGN KEY (`orchestration_run_id`) REFERENCES `orchestration_runs`(`orchestration_run_id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_tasks_run_status` ON `tasks` (`orchestration_run_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_tasks_workspace_kind` ON `tasks` (`workspace_id`,`task_kind`);--> statement-breakpoint
CREATE TABLE `workspaces` (
	`workspace_id` text PRIMARY KEY NOT NULL,
	`workspace_type` text NOT NULL,
	`deployment_mode` text NOT NULL,
	`display_name` text NOT NULL,
	`status` text NOT NULL,
	`default_runtime_profile` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`metadata` text
);
--> statement-breakpoint
CREATE INDEX `idx_workspaces_type_status` ON `workspaces` (`workspace_type`,`status`);
PRAGMA foreign_keys = ON;