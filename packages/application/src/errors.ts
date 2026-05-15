// SPDX-License-Identifier: Apache-2.0

export type ApplicationErrorCode =
  | 'AGENT_RUN_TERMINAL'
  | 'MISSING_AGENT_RUN'
  | 'MISSING_ORCHESTRATION_RUN'
  | 'MISSING_TASK'
  | 'ORCHESTRATION_RUN_TERMINAL'
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
