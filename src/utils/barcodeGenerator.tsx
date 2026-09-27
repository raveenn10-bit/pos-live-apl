'use client';

/**
 * AppleVision Store Galle - Zero-Dependency Code 128 (Subset B) SVG Barcode Generator
 * 
 * Standard ISO/IEC 15417 Code 128 implementation for crisp thermal receipt printing,
 * scannable by all standard 1D hardware handheld laser and CCD POS scanners.
 */

import React from 'react';

// Code 128 107 standard patterns [0..106] (Widths of bars and spaces)
const CODE128_PATTERNS: string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112'
];

export interface BarcodeOptions {
  height?: number;
  width?: number;
  showText?: boolean;
  fontSize?: number;
  fontFamily?: string;
  lineColor?: string;
  backgroundColor?: string;
  quietZone?: boolean;
}

/**
 * Generates an SVG string containing a scannable Code 128 (Subset B) barcode.
 * 
 * @param text The string to encode (e.g. 'INV-202609-0001')
 * @param options Styling and layout options (height, width, showText, etc.)
 * @returns Clean, self-contained SVG string
 */
export function generateCode128Svg(text: string, options?: BarcodeOptions): string {
  const safeText = (text || '').trim();
  if (!safeText) return '';

  const barHeight = options?.height ?? 46;
  const showText = options?.showText ?? false;
  const fontSize = options?.fontSize ?? 11;
  const fontFamily = options?.fontFamily ?? "'Courier New', Courier, monospace";
  const lineColor = options?.lineColor ?? '#000000';
  const backgroundColor = options?.backgroundColor ?? 'transparent';
  const includeQuietZone = options?.quietZone ?? true;

  // Code 128 Subset B starts with index 104
  const START_B = 104;
  const STOP = 106;

  const codes: number[] = [START_B];
  let checkSum = START_B;

  for (let i = 0; i < safeText.length; i++) {
    const charCode = safeText.charCodeAt(i);
    // Code 128B maps ASCII 32..127 to values 0..95
    let val = charCode - 32;
    if (val < 0 || val > 95) {
      // Fallback for non-standard characters
      val = 0; // Space
    }
    codes.push(val);
    checkSum += (i + 1) * val;
  }

  // Append checksum modulo 103
  codes.push(checkSum % 103);
  // Append stop pattern
  codes.push(STOP);

  // Each module represents 1 unit of width
  const moduleWidth = 2; // base resolution unit
  const quietZoneModules = includeQuietZone ? 10 : 2;

  // Calculate total modules
  let totalModules = quietZoneModules * 2;
  for (const c of codes) {
    const pat = CODE128_PATTERNS[c];
    for (let j = 0; j < pat.length; j++) {
      totalModules += parseInt(pat[j], 10);
    }
  }

  const svgWidth = totalModules * moduleWidth;
  const textHeight = showText ? fontSize + 7 : 0;
  const svgHeight = barHeight + textHeight;

  // Generate SVG bars using path or rects
  let currentX = quietZoneModules * moduleWidth;
  const rects: string[] = [];

  for (const c of codes) {
    const pattern = CODE128_PATTERNS[c];
    for (let j = 0; j < pattern.length; j++) {
      const width = parseInt(pattern[j], 10) * moduleWidth;
      // Even indices are bars (0, 2, 4, 6), odd are spaces (1, 3, 5)
      if (j % 2 === 0) {
        rects.push(`<rect x="${currentX}" y="0" width="${width}" height="${barHeight}" fill="${lineColor}" />`);
      }
      currentX += width;
    }
  }

  const textElement = showText
    ? `<text x="${svgWidth / 2}" y="${barHeight + fontSize + 2}" font-family="${fontFamily}" font-size="${fontSize}" font-weight="bold" text-anchor="middle" fill="${lineColor}" letter-spacing="1.5">${escapeXml(safeText)}</text>`
    : '';

  const widthAttr = options?.width ? `width="${options.width}"` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" ${widthAttr} height="${svgHeight}" style="background-color: ${backgroundColor}; display: block; shape-rendering: crispEdges;">${rects.join('')}${textElement}</svg>`;
}

/**
 * Escape XML special characters for safe inclusion in SVG text elements
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Returns a scannable Code 128 Barcode as a Data URI for <img> tags
 */
export function generateCode128DataUri(text: string, options?: BarcodeOptions): string {
  const svg = generateCode128Svg(text, options);
  if (!svg) return '';
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Reusable React Component for rendering Code 128 Barcodes
 */
export interface BarcodeSvgProps extends BarcodeOptions {
  value: string;
  className?: string;
  style?: React.CSSProperties;
}

export const BarcodeSvg: React.FC<BarcodeSvgProps> = ({
  value,
  className = '',
  style,
  ...options
}) => {
  const svgMarkup = generateCode128Svg(value, options);

  if (!svgMarkup) {
    return null;
  }

  return React.createElement('div', {
    className: `inline-block select-none ${className}`,
    style,
    dangerouslySetInnerHTML: { __html: svgMarkup },
  });
};
