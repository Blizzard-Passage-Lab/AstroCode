/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { Box, Text } from 'ink';
import { Colors } from '../colors.js';
import { type Config } from '@qwen-code/qwen-code-core';

interface TipsProps {
  config: Config;
}

export const Tips: React.FC<TipsProps> = ({ config }) => {
  return (
    <Box flexDirection="column">
      <Text color={Colors.Foreground}>Tips for getting started:</Text>
      <Text color={Colors.Foreground}>
        1. Describe the research requirements in detail.
      </Text>
      <Text color={Colors.Foreground}>
        2. Be specific for the best results.
      </Text>
      <Text color={Colors.Foreground}>
        3. Specify the tools required for implementation.
      </Text>
    </Box>
  );
};
