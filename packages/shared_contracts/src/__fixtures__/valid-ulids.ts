// SPDX-License-Identifier: Apache-2.0
/**
 * 测试用合法 ULID 字符串。
 *
 * Crockford base32 字符集：0-9 ABCDEFGHJKMNPQRSTVWXYZ
 * （不含 I, L, O, U）
 *
 * 长度恒定 26 字符。
 */

export const VALID_ULIDS = {
  workspace: '01HZZZZZZZZZZZZZZZZZZZZZW0',
  conversation: '01HZZZZZZZZZZZZZZZZZZZZZC0',
  event: '01HZZZZZZZZZZZZZZZZZZZZZE0',
  message: '01HZZZZZZZZZZZZZZZZZZZZZM0',
  orchestrationRun: '01HZZZZZZZZZZZZZZZZZZZZOR0',
  task: '01HZZZZZZZZZZZZZZZZZZZZZT0',
  agentRun: '01HZZZZZZZZZZZZZZZZZZZZZA0',
  artifact: '01HZZZZZZZZZZZZZZZZZZZZZF0',
  traceEvent: '01HZZZZZZZZZZZZZZZZZZZZTE0',
  traceId: '01HZZZZZZZZZZZZZZZZZZZZZX0',
} as const;

/** 非法字符（Crockford base32 排除 I/L/O/U） */
export const INVALID_ULIDS = {
  containsI: '01HIIIIIIIIIIIIIIIIIIIIII0',
  containsL: '01HLLLLLLLLLLLLLLLLLLLLLL0',
  containsO: '01HOOOOOOOOOOOOOOOOOOOOOO0',
  containsU: '01HUUUUUUUUUUUUUUUUUUUUUU0',
  tooShort: '01HZZZZZZZZZZZZZZ',
  tooLong: '01HZZZZZZZZZZZZZZZZZZZZZW0AAA',
  lowercase: '01hzzzzzzzzzzzzzzzzzzzzzzw0',
} as const;
