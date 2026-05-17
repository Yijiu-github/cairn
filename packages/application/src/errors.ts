// SPDX-License-Identifier: Apache-2.0

export type ApplicationErrorCode =
  | 'AGENT_RUN_TERMINAL'
  | 'INVALID_PLANNING_OUTPUT'
  | 'INVALID_RUN_STATE'
  | 'INVALID_TASK_STATE'
  | 'PLANNING_OUTPUT_ALREADY_EXISTS'
  | 'PLANNING_OUTPUT_NOT_FOUND'
  | 'PLANNING_OUTPUT_RUN_MISMATCH'
  | 'PLANNING_OUTPUT_TERMINAL'
  | 'MISSING_AGENT_RUN'
  | 'MISSING_ORCHESTRATION_RUN'
  | 'MISSING_TASK'
  | 'ORCHESTRATION_RUN_TERMINAL'
  | 'RERUN_UNSUPPORTED_GRAPH'
  | 'RUNTIME_REJECTED'
  | 'SOURCE_ROOT_NOT_FOUND'
  | 'TASK_NOT_READY'
  | 'TASK_TERMINAL';

export class ApplicationError extends Error {
  readonly code: ApplicationErrorCode;

  constructor(code: ApplicationErrorCode, message: string) {
    super(message);
    this.name = 'ApplicationError';
    this.code = code;
  }
}
