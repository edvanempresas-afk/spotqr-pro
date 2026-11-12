/**
 * Valida e otimiza um vídeo curto no navegador para o Banner Animado (PRO)
 * mantendo o payload compatível com Vercel/Redis sem perder fluidez.
 */

const DIRECT_VIDEO_MAX_BYTES = 2.3 * 1024 * 1024; // ~2.3 MB
const HARD_VIDEO_MAX_BYTES = 2.8 * 1024 * 1024; // ~2.8 MB post-compression
const MAX_CLIP_SECONDS = 12;

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () =>
      reject(new Error('Não foi possível ler o arquivo de vídeo selecionado.'));
    reader.readAsDataURL(blob);
  });
}

function getVideoMetadata(
  objectUrl: string
): Promise<{ width: number; height: number; duration: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.onloadedmetadata = () => {
      resolve({
        width: video.videoWidth || 1280,
        height: video.videoHeight || 720,
        duration: Number.isFinite(video.duration) ? video.duration : 0,
      });
    };
    video.onerror = () =>
      reject(new Error('Formato de vídeo não suportado neste navegador.'));
    video.src = objectUrl;
  });
}

function transcodeShortClipToWebm(
  objectUrl: string,
  meta: { width: number; height: number; duration: number }
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (typeof MediaRecorder === 'undefined') {
      reject(
        new Error(
          'Seu navegador não suporta compressão automática de vídeo. Envie um clipe menor (até 2 MB) ou cole um link MP4.'
        )
      );
      return;
    }

    const mimeCandidates = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
    ];
    const supportedMime = mimeCandidates.find((m) =>
      MediaRecorder.isTypeSupported(m)
    );
    if (!supportedMime) {
      reject(
        new Error(
          'Compactação WebM indisponível neste navegador. Envie um vídeo MP4 curto de até 2 MB ou cole uma URL.'
        )
      );
      return;
    }

    const maxW = 854;
    const maxH = 480;
    const scale = Math.min(1, maxW / meta.width, maxH / meta.height);
    const targetW = Math.max(2, Math.round((meta.width * scale) / 2) * 2);
    const targetH = Math.max(2, Math.round((meta.height * scale) / 2) * 2);

    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.src = objectUrl;

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Falha ao inicializar processador de vídeo.'));
      return;
    }

    const stream = canvas.captureStream(24);
    const recorder = new MediaRecorder(stream, {
      mimeType: supportedMime,
      videoBitsPerSecond: 850_000,
    });
    const chunks: BlobPart[] = [];
    let rafId = 0;
    let stopTimeout: ReturnType<typeof setTimeout> | null = null;
    let finished = false;

    const cleanup = () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (stopTimeout) clearTimeout(stopTimeout);
      try {
        video.pause();
      } catch {
        // ignore
      }
    };

    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunks.push(ev.data);
    };

    recorder.onstop = () => {
      cleanup();
      if (finished) return;
      finished = true;
      resolve(new Blob(chunks, { type: 'video/webm' }));
    };

    recorder.onerror = () => {
      cleanup();
      if (finished) return;
      finished = true;
      reject(new Error('Erro ao otimizar o vídeo. Tente um clipe menor.'));
    };

    const drawFrame = () => {
      if (finished) return;
      ctx.drawImage(video, 0, 0, targetW, targetH);
      if (!video.paused && !video.ended) {
        rafId = requestAnimationFrame(drawFrame);
      }
    };

    video.onended = () => {
      if (recorder.state === 'recording') recorder.stop();
    };

    video.oncanplay = async () => {
      if (recorder.state !== 'inactive') return;
      try {
        recorder.start(250);
        await video.play();
        drawFrame();
        const clipMs =
          Math.min(MAX_CLIP_SECONDS, Math.max(1, meta.duration || MAX_CLIP_SECONDS)) *
          1000;
        stopTimeout = setTimeout(() => {
          if (recorder.state === 'recording') recorder.stop();
        }, clipMs);
      } catch {
        cleanup();
        reject(
          new Error(
            'Não foi possível reproduzir o vídeo para compressão. Envie um MP4 de até 2 MB ou cole um link direto.'
          )
        );
      }
    };
  });
}

export async function processCoverVideoFile(file: File): Promise<string> {
  if (!file.type || !file.type.startsWith('video/')) {
    throw new Error(
      'Selecione um arquivo de vídeo válido (MP4, WebM ou MOV).'
    );
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const meta = await getVideoMetadata(objectUrl);

    // Fast path for already compact short clips (<= 2.3 MB and <= 20s)
    if (file.size <= DIRECT_VIDEO_MAX_BYTES && meta.duration <= 20) {
      return await readBlobAsDataUrl(file);
    }

    const compressedBlob = await transcodeShortClipToWebm(objectUrl, meta);
    if (compressedBlob.size > HARD_VIDEO_MAX_BYTES) {
      throw new Error(
        'Esse vídeo ainda ficou muito pesado após otimização (máx. ~2,5 MB / 12s). Envie um clipe mais curto ou cole o link MP4/WebM.'
      );
    }

    return await readBlobAsDataUrl(compressedBlob);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

