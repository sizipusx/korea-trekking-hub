'use client';

import { useEffect, useState } from 'react';

type KakaoLoadState = 'idle' | 'loading' | 'ready' | 'error';

export function useKakaoLoader(): KakaoLoadState {
  const [state, setState] = useState<KakaoLoadState>('ready');
  useEffect(() => { setState('ready'); }, []);
  return state;
}