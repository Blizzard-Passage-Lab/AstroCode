/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ContentGenerator } from '../core/contentGenerator.js';
import { AuthType } from '../core/contentGenerator.js';
// OAuth-related imports removed
import type { Config } from '../config/config.js';

export async function createCodeAssistContentGenerator(
  httpOptions: any,
  authType: AuthType,
  config: Config,
  sessionId?: string,
): Promise<ContentGenerator> {
  // OAuth authentication methods have been removed
  throw new Error(`OAuth authentication methods are no longer supported. AuthType: ${authType}`);
}
