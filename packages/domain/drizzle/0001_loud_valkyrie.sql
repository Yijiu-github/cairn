CREATE TABLE `conversations` (
	`conversation_id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`channel_type` text NOT NULL,
	`title` text,
	`status` text NOT NULL,
	`summary_ref` text,
	`latest_message_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`workspace_id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_conversations_workspace_status` ON `conversations` (`workspace_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_conversations_workspace_latest` ON `conversations` (`workspace_id`,`latest_message_at`);--> statement-breakpoint
CREATE TABLE `events` (
	`event_id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`source_type` text NOT NULL,
	`conversation_id` text,
	`actor_id` text,
	`actor_role` text NOT NULL,
	`text` text,
	`attachments` text,
	`created_at` text NOT NULL,
	`metadata` text,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`workspace_id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`conversation_id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_events_workspace_created` ON `events` (`workspace_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_events_conversation_created` ON `events` (`conversation_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_events_source_created` ON `events` (`source_type`,`created_at`);--> statement-breakpoint
CREATE TABLE `messages` (
	`message_id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`conversation_id` text NOT NULL,
	`orchestration_run_id` text,
	`sender_type` text NOT NULL,
	`sender_id` text,
	`visibility` text NOT NULL,
	`content_ref` text NOT NULL,
	`created_at` text NOT NULL,
	`metadata` text,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`workspace_id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`conversation_id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`orchestration_run_id`) REFERENCES `orchestration_runs`(`orchestration_run_id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_messages_conversation_created` ON `messages` (`conversation_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_messages_workspace_created` ON `messages` (`workspace_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_messages_run` ON `messages` (`orchestration_run_id`);--> statement-breakpoint
CREATE TABLE `trace_events` (
	`trace_event_id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`orchestration_run_id` text,
	`task_id` text,
	`run_id` text,
	`event_type` text NOT NULL,
	`level` text NOT NULL,
	`payload_ref` text,
	`payload_inline` text,
	`created_at` text NOT NULL,
	`trace_id` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`workspace_id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`orchestration_run_id`) REFERENCES `orchestration_runs`(`orchestration_run_id`) ON UPDATE cascade ON DELETE set null,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`task_id`) ON UPDATE cascade ON DELETE set null,
	FOREIGN KEY (`run_id`) REFERENCES `agent_runs`(`run_id`) ON UPDATE cascade ON DELETE set null,
	FOREIGN KEY (`payload_ref`) REFERENCES `artifacts`(`artifact_id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_trace_events_trace_created` ON `trace_events` (`trace_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_trace_events_run_created` ON `trace_events` (`orchestration_run_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_trace_events_run_type` ON `trace_events` (`orchestration_run_id`,`event_type`);--> statement-breakpoint
CREATE INDEX `idx_trace_events_workspace_created` ON `trace_events` (`workspace_id`,`created_at`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_orchestration_runs` (
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
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`workspace_id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`conversation_id`) ON UPDATE cascade ON DELETE set null,
	FOREIGN KEY (`origin_event_id`) REFERENCES `events`(`event_id`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
INSERT INTO `__new_orchestration_runs`("orchestration_run_id", "workspace_id", "conversation_id", "origin_event_id", "status", "execution_mode", "planner_output_ref", "synthesis_output_ref", "final_response_ref", "has_partial_failures", "result_completeness", "completion_level", "started_at", "finished_at", "error", "trace_id", "created_at", "updated_at") SELECT "orchestration_run_id", "workspace_id", "conversation_id", "origin_event_id", "status", "execution_mode", "planner_output_ref", "synthesis_output_ref", "final_response_ref", "has_partial_failures", "result_completeness", "completion_level", "started_at", "finished_at", "error", "trace_id", "created_at", "updated_at" FROM `orchestration_runs`;--> statement-breakpoint
DROP TABLE `orchestration_runs`;--> statement-breakpoint
ALTER TABLE `__new_orchestration_runs` RENAME TO `orchestration_runs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_orchestration_runs_workspace` ON `orchestration_runs` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `idx_orchestration_runs_status` ON `orchestration_runs` (`workspace_id`,`status`);