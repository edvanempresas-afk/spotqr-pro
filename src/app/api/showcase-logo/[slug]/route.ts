import { NextRequest, NextResponse } from 'next/server';
import { loadShowcaseBrandingBySlug } from '@/lib/showcase-metadata';

const DATA_IMAGE_REGEX = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/;

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { rawLogo, rawCover } = await loadShowcaseBrandingBySlug(params.slug);

    if (rawLogo) {
      const dataMatch = rawLogo.match(DATA_IMAGE_REGEX);
      if (dataMatch) {
        const mimeType = dataMatch[1].toLowerCase();
        const buffer = Buffer.from(dataMatch[2], 'base64');
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': mimeType,
            'Content-Length': String(buffer.length),
            'Cache-Control': 'public, max-age=300, s-maxage=300',
          },
        });
      }

      if (/^https?:\/\//i.test(rawLogo)) {
        return NextResponse.redirect(rawLogo, 307);
      }

      if (rawLogo.startsWith('/')) {
        return NextResponse.redirect(new URL(rawLogo, request.url), 307);
      }
    }

    const fallbackCover =
      rawCover && !rawCover.startsWith('data:')
        ? rawCover
        : '/catalogo/cover-loja.jpg';
    const fallbackTarget = /^https?:\/\//i.test(fallbackCover)
      ? fallbackCover
      : new URL(fallbackCover, request.url);

    return NextResponse.redirect(fallbackTarget, 307);
  } catch {
    return NextResponse.redirect(
      new URL('/catalogo/cover-loja.jpg', request.url),
      307
    );
  }
}
