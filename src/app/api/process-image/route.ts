import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import path from 'path';

const CANVAS_SIZE = 1080;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Get image metadata to calculate height when stretched to full width
    const metadata = await sharp(buffer).metadata();
    const aspectRatio = metadata.height! / metadata.width!;
    const stretchedHeight = Math.round(CANVAS_SIZE * aspectRatio);

    // Resize uploaded image to full width (stretched)
    const resizedImage = await sharp(buffer)
      .resize(CANVAS_SIZE, stretchedHeight, {
        fit: 'fill'
      })
      .toBuffer();

    // Create white canvas
    const canvas = sharp({
      create: {
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    });

    // Calculate vertical position to center the image
    const yPosition = Math.max(0, Math.round((CANVAS_SIZE - stretchedHeight) / 2));

    // Load logos
    const cornerLogoPath = path.join(process.cwd(), 'public', 'corner-logo.png');
    const transparentLogoPath = path.join(process.cwd(), 'public', 'transparent-waterpark.png');

    // Make corner logo same size as canvas (1080x1080)
    const cornerLogo = await sharp(cornerLogoPath)
      .resize(CANVAS_SIZE, CANVAS_SIZE, { fit: 'cover' })
      .toBuffer();

    // Apply transparent watermark at 5% opacity and make it slightly smaller (90% of canvas)
    const transparentLogoSize = Math.round(CANVAS_SIZE * 0.9);
    const transparentLogo = await sharp(transparentLogoPath)
      .resize(transparentLogoSize, transparentLogoSize, { fit: 'inside' })
      .ensureAlpha()
      .composite([{
        input: Buffer.from([255, 255, 255, Math.round(255 * 0.05)]),
        raw: {
          width: 1,
          height: 1,
          channels: 4
        },
        tile: true,
        blend: 'dest-in'
      }])
      .toBuffer();

    // Calculate center position for transparent watermark
    const transparentLogoOffset = Math.round((CANVAS_SIZE - transparentLogoSize) / 2);

    // Composite everything together
    const result = await canvas
      .composite([
        // 1. Centered uploaded image
        {
          input: resizedImage,
          top: yPosition,
          left: 0
        },
        // 2. Transparent watermark centered on canvas
        {
          input: transparentLogo,
          top: transparentLogoOffset,
          left: transparentLogoOffset,
          blend: 'over'
        },
        // 3. Corner logo overlay (full canvas size, on top of everything)
        {
          input: cornerLogo,
          top: 0,
          left: 0,
          blend: 'over'
        }
      ])
      .png()
      .toBuffer();

    // Return the processed image
    return new NextResponse(result as unknown as BodyInit, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'inline; filename="processed-quote.png"'
      }
    });

  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}
