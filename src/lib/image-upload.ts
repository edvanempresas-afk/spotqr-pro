export type ImageUploadPreset = 'product' | 'logo' | 'cover';

const PRESET_LIMITS: Record<
  ImageUploadPreset,
  { maxWidth: number; maxHeight: number; quality: number }
> = {
  product: { maxWidth: 640, maxHeight: 640, quality: 0.8 },
  logo: { maxWidth: 360, maxHeight: 360, quality: 0.85 },
  cover: { maxWidth: 1200, maxHeight: 600, quality: 0.78 },
};

/**
 * Redimensiona e comprime uma foto enviada pelo celular ou PC no navegador
 * antes de salvar, garantindo carregamento instantâneo e baixo consumo de dados.
 */
export function compressImageFileToDataUrl(
  file: File,
  preset: ImageUploadPreset
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type || !file.type.startsWith('image/')) {
      reject(new Error('Selecione um arquivo de imagem válido (JPG, PNG ou WebP).'));
      return;
    }

    const { maxWidth, maxHeight, quality } = PRESET_LIMITS[preset];
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        const scale = Math.min(1, maxWidth / img.width, maxHeight / img.height);
        const targetW = Math.max(1, Math.round(img.width * scale));
        const targetH = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível processar a imagem neste navegador.'));
          return;
        }

        // Preserve transparent backgrounds for logos (PNG/WebP/SVG), fill white for JPEG
        const keepAlpha = preset === 'logo';
        if (!keepAlpha) {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, targetW, targetH);
        }

        ctx.drawImage(img, 0, 0, targetW, targetH);

        const mime = keepAlpha ? 'image/webp' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mime, quality);
        resolve(dataUrl);
      } catch (err) {
        reject(err);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Falha ao ler a imagem selecionada. Tente outra foto.'));
    };

    img.src = objectUrl;
  });
}

