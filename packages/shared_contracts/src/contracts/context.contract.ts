// SPDX-License-Identifier: Apache-2.0
/**
 * Code context HTTP contracts.
 *
 * Path prefix: /v1
 */

import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import {
  CodeIndexReindexResult,
  CodeIndexSnapshotDetail,
  ContextPackCreate,
  ContextPackManifest,
  SourceRoot,
  SourceRootCreate,
} from '../schemas/code-context.js';
import { SourceRootId, WorkspaceId } from '../schemas/ids.js';

import { commonErrorResponses } from './_common.js';

const c = initContract();

export const contextContract = c.router(
  {
    registerSourceRoot: {
      method: 'POST',
      path: '/workspaces/:workspaceId/source-roots',
      pathParams: z.object({ workspaceId: WorkspaceId }),
      body: SourceRootCreate,
      summary: 'Register a source root for a workspace',
      responses: {
        201: SourceRoot,
        ...commonErrorResponses,
      },
    },

    listSourceRoots: {
      method: 'GET',
      path: '/workspaces/:workspaceId/source-roots',
      pathParams: z.object({ workspaceId: WorkspaceId }),
      summary: 'List source roots for a workspace',
      responses: {
        200: z.object({ items: z.array(SourceRoot) }),
        ...commonErrorResponses,
      },
    },

    reindexSourceRoot: {
      method: 'POST',
      path: '/source-roots/:sourceRootId/reindex',
      pathParams: z.object({ sourceRootId: SourceRootId }),
      body: z.object({}).optional(),
      summary: 'Rebuild the lightweight file manifest for a source root',
      responses: {
        202: CodeIndexReindexResult,
        ...commonErrorResponses,
      },
    },

    getSourceRootIndex: {
      method: 'GET',
      path: '/source-roots/:sourceRootId/index',
      pathParams: z.object({ sourceRootId: SourceRootId }),
      summary: 'Get the latest lightweight code index snapshot for a source root',
      responses: {
        200: CodeIndexSnapshotDetail,
        ...commonErrorResponses,
      },
    },

    createContextPack: {
      method: 'POST',
      path: '/workspaces/:workspaceId/context-packs',
      pathParams: z.object({ workspaceId: WorkspaceId }),
      body: ContextPackCreate,
      summary: 'Create a context pack manifest',
      responses: {
        201: ContextPackManifest,
        ...commonErrorResponses,
      },
    },
  },
  { pathPrefix: '/v1' },
);
