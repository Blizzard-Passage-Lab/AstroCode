/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { type ColorsTheme, Theme } from './theme.js';
import { lightSemanticColors } from './semantic-tokens.js';

const stormLightColors: ColorsTheme = {
  type: 'light',
  Background: '#f8f9fa',
  Foreground: '#5c6166',
  LightBlue: '#55b4d4',
  AccentBlue: '#399ee6',
  AccentPurple: '#a37acc',
  AccentCyan: '#4cbf99',
  AccentGreen: '#86b300',
  AccentYellow: '#f2ae49',
  AccentRed: '#f07171',
  DiffAdded: '#86b300',
  DiffRemoved: '#f07171',
  Comment: '#ABADB1',
  Gray: '#CCCFD3',
  GradientColors: ['#399ee6', '#86b300'],
};

export const QwenLight: Theme = new Theme(
  'Qwen Light',
  'light',
  {
    hljs: {
      display: 'block',
      overflowX: 'auto',
      padding: '0.5em',
      background: stormLightColors.Background,
      color: stormLightColors.Foreground,
    },
    'hljs-comment': {
      color: stormLightColors.Comment,
      fontStyle: 'italic',
    },
    'hljs-quote': {
      color: stormLightColors.AccentCyan,
      fontStyle: 'italic',
    },
    'hljs-string': {
      color: stormLightColors.AccentGreen,
    },
    'hljs-constant': {
      color: stormLightColors.AccentCyan,
    },
    'hljs-number': {
      color: stormLightColors.AccentPurple,
    },
    'hljs-keyword': {
      color: stormLightColors.AccentYellow,
    },
    'hljs-selector-tag': {
      color: stormLightColors.AccentYellow,
    },
    'hljs-attribute': {
      color: stormLightColors.AccentYellow,
    },
    'hljs-variable': {
      color: stormLightColors.Foreground,
    },
    'hljs-variable.language': {
      color: stormLightColors.LightBlue,
      fontStyle: 'italic',
    },
    'hljs-title': {
      color: stormLightColors.AccentBlue,
    },
    'hljs-section': {
      color: stormLightColors.AccentGreen,
      fontWeight: 'bold',
    },
    'hljs-type': {
      color: stormLightColors.LightBlue,
    },
    'hljs-class .hljs-title': {
      color: stormLightColors.AccentBlue,
    },
    'hljs-tag': {
      color: stormLightColors.LightBlue,
    },
    'hljs-name': {
      color: stormLightColors.AccentBlue,
    },
    'hljs-builtin-name': {
      color: stormLightColors.AccentYellow,
    },
    'hljs-meta': {
      color: stormLightColors.AccentYellow,
    },
    'hljs-symbol': {
      color: stormLightColors.AccentRed,
    },
    'hljs-bullet': {
      color: stormLightColors.AccentYellow,
    },
    'hljs-regexp': {
      color: stormLightColors.AccentCyan,
    },
    'hljs-link': {
      color: stormLightColors.LightBlue,
    },
    'hljs-deletion': {
      color: stormLightColors.AccentRed,
    },
    'hljs-addition': {
      color: stormLightColors.AccentGreen,
    },
    'hljs-emphasis': {
      fontStyle: 'italic',
    },
    'hljs-strong': {
      fontWeight: 'bold',
    },
    'hljs-literal': {
      color: stormLightColors.AccentCyan,
    },
    'hljs-built_in': {
      color: stormLightColors.AccentRed,
    },
    'hljs-doctag': {
      color: stormLightColors.AccentRed,
    },
    'hljs-template-variable': {
      color: stormLightColors.AccentCyan,
    },
    'hljs-selector-id': {
      color: stormLightColors.AccentRed,
    },
  },
  stormLightColors,
  lightSemanticColors,
);
