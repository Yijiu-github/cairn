// SPDX-License-Identifier: Apache-2.0

import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type {
  ArtifactStorePort,
  ReadArtifactPayloadResult,
  WriteArtifactPayloadInput,
  WriteArtifactPayloadResult,
} from '@cairn/application';

const PAYLOAD_REF_PREFIX = 'artifact-payload://';

export interface LocalArtifactStoreOptions {
  rootDir: string;
  maxInlineBytes: number;
}

export class LocalArtifactStore implements ArtifactStorePort {
  private readonly rootDir: string;
  private readonly maxInlineBytes: number;

  constructor(options: LocalArtifactStoreOptions) {
    this.rootDir = options.rootDir;
    this.maxInlineBytes = options.maxInlineBytes;
  }

  async writeText(input: WriteArtifactPayloadInput): Promise<WriteArtifactPayloadResult> {
    const relativePath = this.toRelativePath(input);
    const absolutePath = path.join(this.rootDir, relativePath);
    const maxBytes = Math.min(input.maxBytes, this.maxInlineBytes);
    const truncatedText = truncateUtf8Text(input.text, maxBytes);
    const storedBytes = Buffer.from(truncatedText, 'utf8');
    const truncated = storedBytes.byteLength < Buffer.byteLength(input.text, 'utf8');

    const directory = path.dirname(absolutePath);
    const temporaryPath = path.join(
      directory,
      `.${path.basename(absolutePath)}.${String(Date.now())}.${Math.random().toString(36).slice(2)}.tmp`,
    );

    await mkdir(directory, { recursive: true });
    try {
      await writeFile(temporaryPath, storedBytes);
      await rename(temporaryPath, absolutePath);
    } catch (error) {
      await rm(temporaryPath, { force: true });
      throw error;
    }

    return {
      payloadRef: `${PAYLOAD_REF_PREFIX}${relativePath}`,
      byteLength: storedBytes.byteLength,
      truncated,
    };
  }

  async readText(payloadRef: string): Promise<ReadArtifactPayloadResult> {
    try {
      const relativePath = this.parsePayloadRef(payloadRef);
      const text = await readFile(path.join(this.rootDir, relativePath), 'utf8');
      const mediaType = relativePath.endsWith('.json') ? 'application/json' : 'text/plain';

      return {
        mediaType,
        text,
        truncated: Buffer.byteLength(text, 'utf8') >= this.maxInlineBytes,
      };
    } catch (error) {
      if (isKnownPayloadError(error)) {
        throw error;
      }

      throw createPayloadError(
        'ARTIFACT_PAYLOAD_STORAGE_ERROR',
        'Artifact payload could not be read.',
      );
    }
  }

  private toRelativePath(input: WriteArtifactPayloadInput): string {
    const safeFilename = sanitizeSegment(input.filename);
    return [
      sanitizeSegment(input.workspaceId),
      sanitizeSegment(input.orchestrationRunId),
      sanitizeSegment(input.artifactId),
      safeFilename,
    ].join('/');
  }

  private parsePayloadRef(payloadRef: string): string {
    if (!payloadRef.startsWith(PAYLOAD_REF_PREFIX)) {
      throw new Error('Invalid artifact payload reference.');
    }

    const relativePath = payloadRef.slice(PAYLOAD_REF_PREFIX.length);
    const segments = relativePath.split('/');

    if (segments.length !== 4 || segments.some((segment) => !isSafeSegment(segment))) {
      throw createPayloadError('ARTIFACT_PAYLOAD_NOT_FOUND', 'Invalid artifact payload reference.');
    }

    return relativePath;
  }
}

const sanitizeSegment = (segment: string): string => segment.replace(/[^A-Za-z0-9._-]/gu, '-');

const isSafeSegment = (segment: string): boolean =>
  segment.length > 0 && segment !== '.' && segment !== '..' && segment === sanitizeSegment(segment);

interface PayloadError extends Error {
  code: string;
}

const createPayloadError = (code: string, message: string): PayloadError =>
  Object.assign(new Error(message), { code });

const isKnownPayloadError = (error: unknown): error is PayloadError =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  typeof (error as { code?: unknown }).code === 'string';

const truncateUtf8Text = (text: string, maxBytes: number): string => {
  let byteLength = 0;
  let output = '';

  for (const character of text) {
    const characterByteLength = Buffer.byteLength(character, 'utf8');
    if (byteLength + characterByteLength > maxBytes) {
      break;
    }

    byteLength += characterByteLength;
    output += character;
  }

  return output;
};
