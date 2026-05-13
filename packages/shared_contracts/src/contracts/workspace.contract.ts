// SPDX-License-Identifier: Apache-2.0
/**
 * Workspace 相关 HTTP 契约。
 *
 * 路径前缀：/v1/workspaces
 */

import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { PaginationQuery, Paginated } from '../schemas/common.js';
import { WorkspaceId } from '../schemas/ids.js';
import { Workspace, WorkspaceCreate, WorkspaceUpdate } from '../schemas/workspace.js';

import { commonErrorResponses } from './_common.js';

const c = initContract();

export const workspaceContract = c.router(
  {
    list: {
      method: 'GET',
      path: '/workspaces',
      query: PaginationQuery,
      summary: 'List workspaces',
      responses: {
        200: Paginated(Workspace),
        ...commonErrorResponses,
      },
    },

    get: {
      method: 'GET',
      path: '/workspaces/:workspaceId',
      pathParams: z.object({ workspaceId: WorkspaceId }),
      summary: 'Get a workspace by id',
      responses: {
        200: Workspace,
        ...commonErrorResponses,
      },
    },

    create: {
      method: 'POST',
      path: '/workspaces',
      body: WorkspaceCreate,
      summary: 'Create a workspace',
      responses: {
        201: Workspace,
        ...commonErrorResponses,
      },
    },

    update: {
      method: 'PATCH',
      path: '/workspaces/:workspaceId',
      pathParams: z.object({ workspaceId: WorkspaceId }),
      body: WorkspaceUpdate,
      summary: 'Update workspace metadata or status',
      responses: {
        200: Workspace,
        ...commonErrorResponses,
      },
    },

    archive: {
      method: 'POST',
      path: '/workspaces/:workspaceId/archive',
      pathParams: z.object({ workspaceId: WorkspaceId }),
      body: z.object({ reason: z.string().optional() }),
      summary: 'Archive a workspace (soft delete)',
      responses: {
        200: Workspace,
        ...commonErrorResponses,
      },
    },
  },
  { pathPrefix: '/v1' },
);
