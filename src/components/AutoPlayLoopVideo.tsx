'use client';

import React, { useEffect, useMemo, useRef } from 'react';

interface AutoPlayLoopVideoProps {
  src: string;
  poster?: string;
  className?: string;
  onError?: () => void;
}

/**
 * Reprodutor de vídeo de fundo otimizado para Safari (iOS/macOS), Chrome e Android:
 * - Prioriza MP4 (H.264) para presets /videos/*.webm evitando falhas de loop do WebM no Safari;
 * - Força atributos HTML `muted`, `playsinline`, `webkit-playsinline` e `controls=false`;
 * - Reinicia manualmente no `onEnded` e retoma em `onPause`/`visibilitychange`/`touchstart`
 *   para manter loop infinito contínuo sem exibir botão de play nativo.
 */
export default function AutoPlayLoopVideo({
  src,
  poster,
  className = '',
  onError,
}: AutoPlayLoopVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const failedRef = useRef(false);

  const sources = useMemo<Array<{ url: string; type?: string }>>(() => {
    const clean = (src || '').trim();
    if (!clean) return [];

    // Para presets locais em /videos/*.webm, serve o .mp4 primeiro (Safari nativo) e mantém .webm de fallback
    if (/^\/videos\/[^/?#]+\.webm$/i.test(clean)) {
      const mp4Url = clean.replace(/\.webm$/i, '.mp4');
      return [
        { url: mp4Url, type: 'video/mp4' },
        { url: clean, type: 'video/webm' },
      ];
    }

    if (/^\/videos\/[^/?#]+\.mp4$/i.test(clean)) {
      const webmUrl = clean.replace(/\.mp4$/i, '.webm');
      return [
        { url: clean, type: 'video/mp4' },
        { url: webmUrl, type: 'video/webm' },
      ];
    }

    if (clean.startsWith('data:video/mp4')) {
      return [{ url: clean, type: 'video/mp4' }];
    }
    if (clean.startsWith('data:video/webm')) {
      return [{ url: clean, type: 'video/webm' }];
    }
    if (/\.mp4(\?|#|$)/i.test(clean)) {
      return [{ url: clean, type: 'video/mp4' }];
    }
    if (/\.webm(\?|#|$)/i.test(clean)) {
      return [{ url: clean, type: 'video/webm' }];
    }
    return [{ url: clean }];
  }, [src]);

  useEffect(() => {
    failedRef.current = false;
    const video = videoRef.current;
    if (!video) return;

    const tryPlay = () => {
      if (!video || failedRef.current) return;
      try {
        video.defaultMuted = true;
        video.muted = true;
        video.playsInline = true;
        video.loop = true;
        video.controls = false;
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', 'true');
        video.setAttribute('x-webkit-airplay', 'deny');
        video.removeAttribute('controls');

        if (video.paused) {
          const playPromise = video.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {
              // Ignora bloqueio temporário até haver interação ou buffer pronto
            });
          }
        }
      } catch {
        // Silencia erros transitórios de carregamento
      }
    };

    tryPlay();

    const handleVisibilityOrShow = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        tryPlay();
      }
    };

    const handleFirstInteraction = () => {
      tryPlay();
    };

    document.addEventListener('visibilitychange', handleVisibilityOrShow);
    window.addEventListener('pageshow', handleVisibilityOrShow);
    window.addEventListener('focus', handleVisibilityOrShow);
    window.addEventListener('touchstart', handleFirstInteraction, {
      passive: true,
    });
    window.addEventListener('pointerdown', handleFirstInteraction, {
      passive: true,
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrShow);
      window.removeEventListener('pageshow', handleVisibilityOrShow);
      window.removeEventListener('focus', handleVisibilityOrShow);
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('pointerdown', handleFirstInteraction);
    };
  }, [src]);

  const handleLoadedOrCanPlay = () => {
    const video = videoRef.current;
    if (!video || failedRef.current) return;
    video.muted = true;
    video.playsInline = true;
    video.play().catch(() => {});
  };

  const handleEnded = () => {
    const video = videoRef.current;
    if (!video || failedRef.current) return;
    try {
      video.currentTime = 0;
      video.muted = true;
      video.play().catch(() => {});
    } catch {
      // ignore
    }
  };

  const handlePause = () => {
    const video = videoRef.current;
    if (!video || failedRef.current) return;
    if (typeof document !== 'undefined' && document.hidden) return;
    // Safari às vezes pausa ao reiniciar ciclo de loop; retoma imediatamente
    setTimeout(() => {
      if (
        videoRef.current &&
        videoRef.current.paused &&
        !failedRef.current &&
        (typeof document === 'undefined' || !document.hidden)
      ) {
        videoRef.current.muted = true;
        videoRef.current.play().catch(() => {});
      }
    }, 90);
  };

  if (sources.length === 0) return null;

  return (
    <video
      ref={videoRef}
      key={src}
      poster={poster}
      autoPlay
      loop
      muted
      playsInline
      controls={false}
      disablePictureInPicture
      disableRemotePlayback
      preload="auto"
      onLoadedMetadata={handleLoadedOrCanPlay}
      onCanPlay={handleLoadedOrCanPlay}
      onEnded={handleEnded}
      onPause={handlePause}
      onError={() => {
        // Só aciona fallback se o elemento falhar após tentar todas as <source>
        const video = videoRef.current;
        if (video && video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
          failedRef.current = true;
          onError?.();
        }
      }}
      className={`cover-loop-video pointer-events-none select-none ${className}`}
    >
      {sources.map((s) => (
        <source key={s.url} src={s.url} type={s.type} />
      ))}
    </video>
  );
}
