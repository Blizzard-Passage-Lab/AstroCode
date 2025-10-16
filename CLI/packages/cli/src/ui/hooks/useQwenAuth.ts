/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect } from 'react';
import type { LoadedSettings } from '../../config/settings.js';
// Qwen OAuth imports removed

export interface DeviceAuthorizationInfo {
  verification_uri: string;
  verification_uri_complete: string;
  user_code: string;
  expires_in: number;
}

interface QwenAuthState {
  isQwenAuthenticating: boolean;
  deviceAuth: DeviceAuthorizationInfo | null;
  authStatus:
    | 'idle'
    | 'polling'
    | 'success'
    | 'error'
    | 'timeout'
    | 'rate_limit';
  authMessage: string | null;
}

export const useQwenAuth = (
  settings: LoadedSettings,
  isAuthenticating: boolean,
) => {
  const [qwenAuthState, setQwenAuthState] = useState<QwenAuthState>({
    isQwenAuthenticating: false,
    deviceAuth: null,
    authStatus: 'idle',
    authMessage: null,
  });

  // Qwen OAuth has been removed
  const isQwenAuth = false;

  // Set up event listeners when authentication starts
  useEffect(() => {
    if (!isQwenAuth || !isAuthenticating) {
      // Reset state when not authenticating or not Qwen auth
      setQwenAuthState({
        isQwenAuthenticating: false,
        deviceAuth: null,
        authStatus: 'idle',
        authMessage: null,
      });
      return;
    }

    setQwenAuthState((prev) => ({
      ...prev,
      isQwenAuthenticating: true,
      authStatus: 'idle',
    }));

    // OAuth event handlers removed

    // Qwen OAuth event listeners removed
    return () => {
      // Cleanup removed
    };
  }, [isQwenAuth, isAuthenticating]);

  const cancelQwenAuth = useCallback(() => {
    // Qwen OAuth cancel removed

    setQwenAuthState({
      isQwenAuthenticating: false,
      deviceAuth: null,
      authStatus: 'idle',
      authMessage: null,
    });
  }, []);

  return {
    ...qwenAuthState,
    isQwenAuth,
    cancelQwenAuth,
  };
};
