// SPDX-License-Identifier: Apache-2.0
/**
 * Code context HTTP contracts.
 *
 * Path prefix: /v1
 */

import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import {
  ContextPackCreate,
  ContextPackManifest,
  SourceRoot,
  SourceRootCreate,
} from '../schemas/code-context.js';
import { WorkspaceId } from '../schemas/ids.js';

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
