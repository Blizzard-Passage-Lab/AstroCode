/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { type ColorsTheme, Theme } from './theme.js';
import { darkSemanticColors } from './semantic-tokens.js';

const stormDarkColors: ColorsTheme = {
  type: 'dark',
  Background: '#0b0e14',
  Foreground: '#bfbdb6',
  LightBlue: '#59C2FF',
  AccentBlue: '#39BAE6',
  AccentPurple: '#D2A6FF',
  AccentCyan: '#95E6CB',
  AccentGreen: '#AAD94C',
  AccentYellow: '#FFD700',
  AccentRed: '#F26D78',
  DiffAdded: '#AAD94C',
  DiffRemoved: '#F26D78',
  Comment: '#646A71',
  Gray: '#3D4149',
  GradientColors: ['#FFD700', '#da7959'],
};

export const QwenDark: Theme = new Theme(
  'Qwen Dark',
  'dark',
  {
    hljs: {
      display: 'block',
      overflowX: 'auto',
      padding: '0.5em',
      background: stormDarkColors.Background,
      color: stormDarkColors.Foreground,
    },
    'hljs-keyword': {
      color: stormDarkColors.AccentYellow,
    },
    'hljs-literal': {
      color: stormDarkColors.AccentPurple,
    },
    'hljs-symbol': {
      color: stormDarkColors.AccentCyan,
    },
    'hljs-name': {
      color: stormDarkColors.LightBlue,
    },
    'hljs-link': {
      color: stormDarkColors.AccentBlue,
    },
    'hljs-function .hljs-keyword': {
      color: stormDarkColors.AccentYellow,
    },
    'hljs-subst': {
      color: stormDarkColors.Foreground,
    },
    'hljs-string': {
      color: stormDarkColors.AccentGreen,
    },
    'hljs-title': {
      color: stormDarkColors.AccentYellow,
    },
    'hljs-type': {
      color: stormDarkColors.AccentBlue,
    },
    'hljs-attribute': {
      color: stormDarkColors.AccentYellow,
    },
    'hljs-bullet': {
      color: stormDarkColors.AccentYellow,
    },
    'hljs-addition': {
      color: stormDarkColors.AccentGreen,
    },
    'hljs-variable': {
      color: stormDarkColors.Foreground,
    },
    'hljs-template-tag': {
      color: stormDarkColors.AccentYellow,
    },
    'hljs-template-variable': {
      color: stormDarkColors.AccentYellow,
    },
    'hljs-comment': {
      color: stormDarkColors.Comment,
      fontStyle: 'italic',
    },
    'hljs-quote': {
      color: stormDarkColors.AccentCyan,
      fontStyle: 'italic',
    },
    'hljs-deletion': {
      color: stormDarkColors.AccentRed,
    },
    'hljs-meta': {
      color: stormDarkColors.AccentYellow,
    },
    'hljs-doctag': {
      fontWeight: 'bold',
    },
    'hljs-strong': {
      fontWeight: 'bold',
    },
    'hljs-emphasis': {
      fontStyle: 'italic',
    },
  },
  stormDarkColors,
  darkSemanticColors,
);
