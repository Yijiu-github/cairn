// SPDX-License-Identifier: Apache-2.0
import { defineConfig } from 'drizzle-kit';

/**
 * SQLite-first：与 ADR-0005 / ADR-0008 一致。
 * Postgres 方言迁移与双写策略在 `packages/storage` 落地时再扩展。
 */
export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'sqlite',
});
