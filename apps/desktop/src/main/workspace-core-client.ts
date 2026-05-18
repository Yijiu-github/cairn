// SPDX-License-Identifier: Apache-2.0

import { sanitizeWorkspaceCoreConnection } from '../shared/workspace-core-connection.js';
import {
  DEFAULT_WORKSPACE_ID,
  apiWorkspaceCoreArtifactListSchema,
  apiWorkspaceCoreArtifactPayloadSchema,
  apiWorkspaceCoreRunListSchema,
  apiWorkspaceCoreRunSchema,
  apiWorkspaceCoreTaskListSchema,
  apiWorkspaceCoreTraceListSchema,
  createDisconnectedWorkspaceCoreReadSnapshot,
  mapApiArtifactPayloadToPreview,
  mapApiArtifactToView,
  mapApiRunToSummary,
  mapApiTaskToView,
  mapApiTraceEventToView,
  workspaceCoreReadSnapshotSchema,
} from '../shared/workspace-core-data.js';

import type { WorkspaceCoreConnectionSnapshot } from '../shared/workspace-core-connection.js';
import type {
  ApiWorkspaceCoreArtifact,
  WorkspaceCoreArtifactPayloadPreview,
  WorkspaceCoreReadSnapshot,
} from '../shared/workspace-core-data.js';
import type { ZodType } from 'zod';

export interface WorkspaceCoreReadClientConnection extends WorkspaceCoreConnectionSnapshot {
  readonly token?: string;
}

export interface WorkspaceCoreReadClientResponse {
  readonly ok: boolean;
  readonly status: number;
  json(): Promise<unknown>;
}

export type WorkspaceCoreReadClientFetch = (
  input: string | URL,
  init?: {
    readonly method?: 'GET';
    readonly headers?: {
      readonly authorization: string;
    };
  },
) => Promise<WorkspaceCoreReadClientResponse>;

export interface WorkspaceCoreReadClientOptions {
  readonly fetch: WorkspaceCoreReadClientFetch;
  readonly getConnection: () => WorkspaceCoreReadClientConnection;
  readonly workspaceId?: string;
}

export class WorkspaceCoreReadClient {
  private readonly fetch: WorkspaceCoreReadClientFetch;
  private readonly getConnection: () => WorkspaceCoreReadClientConnection;
  private readonly workspaceId: string;

  public constructor(options: WorkspaceCoreReadClientOptions) {
    this.fetch = options.fetch;
    this.getConnection = options.getConnection;
    this.workspaceId = options.workspaceId ?? DEFAULT_WORKSPACE_ID;
  }

  public async readSnapshot(): Promise<WorkspaceCoreReadSnapshot> {
    const connection = this.getConnection();

    if (!isConnectedConnection(connection)) {
      return createDisconnectedWorkspaceCoreReadSnapshot(connection);
    }

    const runsResponse = await this.get(
      connection,
      `/v1/workspaces/${encodeURIComponent(this.workspaceId)}/runs`,
      apiWorkspaceCoreRunListSchema,
    );
    const runs = runsResponse.items.map((run) => mapApiRunToSummary(run));
    const firstRun = runs[0];

    if (firstRun === undefined) {
      return workspaceCoreReadSnapshotSchema.parse({
        connection: sanitizeWorkspaceCoreConnection(connection),
        runs,
        updatedAt: new Date().toISOString(),
      });
    }

    const runId = firstRun.runId;
    const [runDetail, tasksResponse, artifactsResponse, traceResponse] = await Promise.all([
      this.get(connection, `/v1/runs/${encodeURIComponent(runId)}`, apiWorkspaceCoreRunSchema),
      this.get(
        connection,
        `/v1/runs/${encodeURIComponent(runId)}/tasks`,
        apiWorkspaceCoreTaskListSchema,
      ),
      this.get(
        connection,
        `/v1/runs/${encodeURIComponent(runId)}/artifacts`,
        apiWorkspaceCoreArtifactListSchema,
      ),
      this.get(
        connection,
        `/v1/runs/${encodeURIComponent(runId)}/trace`,
        apiWorkspaceCoreTraceListSchema,
      ),
    ]);

    const payloadPreviews = await this.readPayloadPreviews(connection, artifactsResponse.items);
    const selectedRun = {
      ...mapApiRunToSummary(runDetail),
      tasks: tasksResponse.items.map((task) => mapApiTaskToView(task)),
      artifacts: artifactsResponse.items.map((artifact) =>
        mapApiArtifactToView(artifact, payloadPreviews.get(artifact.artifactId)),
      ),
      trace: traceResponse.items.map((event) => mapApiTraceEventToView(event)),
    };

    return workspaceCoreReadSnapshotSchema.parse({
      connection: sanitizeWorkspaceCoreConnection(connection),
      runs,
      selectedRun,
      updatedAt: new Date().toISOString(),
    });
  }

  private async readPayloadPreviews(
    connection: ConnectedWorkspaceCoreReadClientConnection,
    artifacts: readonly ApiWorkspaceCoreArtifact[],
  ): Promise<ReadonlyMap<string, WorkspaceCoreArtifactPayloadPreview>> {
    const entries = await Promise.all(
      artifacts.map(
        async (
          artifact,
        ): Promise<readonly [string, WorkspaceCoreArtifactPayloadPreview] | undefined> => {
          if (artifact.payloadRef === undefined || artifact.sensitivity !== 'none') {
            return undefined;
          }

          const payload = await this.get(
            connection,
            `/v1/artifacts/${encodeURIComponent(artifact.artifactId)}/payload`,
            apiWorkspaceCoreArtifactPayloadSchema,
          );
          return [artifact.artifactId, mapApiArtifactPayloadToPreview(payload)] as const;
        },
      ),
    );

    return new Map(entries.filter(isDefinedEntry));
  }

  private async get<T>(
    connection: ConnectedWorkspaceCoreReadClientConnection,
    path: string,
    schema: ZodType<T>,
  ): Promise<T> {
    const response = await this.fetch(new URL(path, connection.baseUrl), {
      headers: {
        authorization: `Bearer ${connection.token}`,
      },
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Workspace Core read request failed with status ${String(response.status)}.`);
    }

    return schema.parse(await response.json());
  }
}

interface ConnectedWorkspaceCoreReadClientConnection extends WorkspaceCoreReadClientConnection {
  readonly authenticated: true;
  readonly baseUrl: string;
  readonly token: string;
}

const isConnectedConnection = (
  connection: WorkspaceCoreReadClientConnection,
): connection is ConnectedWorkspaceCoreReadClientConnection =>
  connection.state === 'connected' &&
  connection.authenticated &&
  connection.baseUrl !== undefined &&
  connection.token !== undefined;

const isDefinedEntry = (
  entry: readonly [string, WorkspaceCoreArtifactPayloadPreview] | undefined,
): entry is readonly [string, WorkspaceCoreArtifactPayloadPreview] => entry !== undefined;
