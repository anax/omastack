import React, { useEffect, useRef } from 'react';
import { OmarchyTheme } from '../types';

// 8x8 Bayer ordered dithering matrix for crisp retro-futuristic pixel quantization
const BAYER_8X8 = [
  0, 32, 8, 40, 2, 34, 10, 42,
  48, 16, 56, 24, 50, 18, 58, 26,
  12, 44, 4, 36, 14, 46, 6, 38,
  60, 28, 52, 20, 62, 30, 54, 22,
  3, 35, 11, 43, 1, 33, 9, 41,
  51, 19, 59, 27, 49, 17, 57, 25,
  15, 47, 7, 39, 13, 45, 5, 37,
  63, 31, 55, 23, 61, 29, 53, 21,
];

// 17x17 Pixelated Isometric OmaStack Container Aperture Stamp (matches OmaStackLogo's hollow isometric diamond + 3 tiers)
const OMASTACK_ISO_STAMP_17X17 = [
  '00000001110000000',
  '00000111111100000',
  '00011110001111000',
  '01111000000011110',
  '11100001110000111',
  '11000111011100011',
  '11111100000111111',
  '00111110001111100',
  '11100111111100111',
  '11111001110011111',
  '00111110001111100',
  '11100111111100111',
  '11111001110011111',
  '01111110001111110',
  '00011111111111000',
  '00000111111100000',
  '00000001110000000',
];

// 9x9 Floating Pixel Micro-Container Sprite (3-tier isometric stack with cyan core)
// 0 = empty, 1 = bottom slab, 2 = cyan core, 3 = top aperture
const MICRO_CONTAINER_9X9 = [
  '000111000',
  '003333300',
  '033000330',
  '330020033',
  '033222330',
  '223333322',
  '112222211',
  '011111110',
  '000111000',
];

const NOISE_SIZE = 128;

function createSmoothedNoise(seed: number): Float32Array {
  let s = seed >>> 0;
  const rand = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  let buf = new Float32Array(NOISE_SIZE * NOISE_SIZE);
  for (let i = 0; i < buf.length; i++) buf[i] = rand();

  for (let pass = 0; pass < 2; pass++) {
    const next = new Float32Array(NOISE_SIZE * NOISE_SIZE);
    for (let y = 0; y < NOISE_SIZE; y++) {
      for (let x = 0; x < NOISE_SIZE; x++) {
        let sum = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = (x + dx + NOISE_SIZE) % NOISE_SIZE;
            const ny = (y + dy + NOISE_SIZE) % NOISE_SIZE;
            sum += buf[ny * NOISE_SIZE + nx];
          }
        }
        next[y * NOISE_SIZE + x] = sum / 9;
      }
    }
    buf = next;
  }

  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] < min) min = buf[i];
    if (buf[i] > max) max = buf[i];
  }
  const span = max - min || 1;
  for (let i = 0; i < buf.length; i++) {
    buf[i] = (buf[i] - min) / span;
  }
  return buf;
}

function createHashTable(seed: number): Float32Array {
  let s = seed >>> 0;
  const out = new Float32Array(4096);
  for (let i = 0; i < out.length; i++) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    out[i] = s / 4294967296;
  }
  return out;
}

function sampleNoise(field: Float32Array, x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const x0 = ((xi % NOISE_SIZE) + NOISE_SIZE) % NOISE_SIZE;
  const y0 = ((yi % NOISE_SIZE) + NOISE_SIZE) % NOISE_SIZE;
  const x1 = (x0 + 1) % NOISE_SIZE;
  const y1 = (y0 + 1) % NOISE_SIZE;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = field[y0 * NOISE_SIZE + x0];
  const b = field[y0 * NOISE_SIZE + x1];
  const c = field[y1 * NOISE_SIZE + x0];
  const d = field[y1 * NOISE_SIZE + x1];
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}

function parseHexRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16),
    ];
  }
  const num = parseInt(clean.slice(0, 6), 16);
  if (Number.isNaN(num)) return [122, 162, 247];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function mixRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, t));
  return [
    Math.round(a[0] + (b[0] - a[0]) * clamped),
    Math.round(a[1] + (b[1] - a[1]) * clamped),
    Math.round(a[2] + (b[2] - a[2]) * clamped),
  ];
}

function rgbToCss([r, g, b]: [number, number, number]): string {
  return `rgb(${r}, ${g}, ${b})`;
}

export interface FieldPalette {
  bg: string;
  dim: string;
  mid: string;
  lit: string;
  hover: string;
  crest: string;
  cyanCore: string;
  matchaTop: string;
}

export function deriveFieldPalette(theme: OmarchyTheme): FieldPalette {
  const baseBg = parseHexRgb(theme.bg);
  const primary = parseHexRgb(theme.primary);
  const accent = parseHexRgb(theme.accent);
  const white: [number, number, number] = [255, 255, 255];
  const black: [number, number, number] = [6, 7, 11];
  const logoGreen: [number, number, number] = [158, 206, 106]; // #9ece6a from OmaStackLogo
  const logoCyan: [number, number, number] = [0, 240, 255]; // #00f0ff from OmaStackLogo

  const bgRgb = mixRgb(baseBg, black, 0.32);
  const dimRgb = mixRgb(bgRgb, mixRgb(primary, logoGreen, 0.35), 0.34);
  const midRgb = mixRgb(bgRgb, mixRgb(primary, logoGreen, 0.4), 0.62);
  const litRgb = mixRgb(primary, accent, 0.25);
  const hoverRgb = mixRgb(litRgb, white, 0.38);
  const crestRgb = mixRgb(litRgb, white, 0.74);

  return {
    bg: rgbToCss(bgRgb),
    dim: rgbToCss(dimRgb),
    mid: rgbToCss(midRgb),
    lit: rgbToCss(litRgb),
    hover: rgbToCss(hoverRgb),
    crest: rgbToCss(crestRgb),
    cyanCore: rgbToCss(mixRgb(logoCyan, primary, 0.15)),
    matchaTop: '#bbdd97',
  };
}

interface HeroBackgroundAnimationProps {
  currentTheme: OmarchyTheme;
  logoRef?: React.RefObject<HTMLDivElement | null>;
  pulseTriggerCount?: number;
}

export const HeroBackgroundAnimation: React.FC<HeroBackgroundAnimationProps> = ({
  currentTheme,
  logoRef,
  pulseTriggerCount = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const externalPulseRef = useRef<number>(pulseTriggerCount);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const noiseField = createSmoothedNoise(10407530);
    const hashTable = createHashTable(663316);
    const palette = deriveFieldPalette(currentTheme);

    let dpr = 1;
    let width = 0;
    let height = 0;
    let cellPx = 8;
    let numCols = 0;
    let numRows = 0;
    let logoCenterX = 0;
    let logoCenterY = 0;
    let logoRadiusPx = 64;
    let attenuationGrid = new Float32Array(0);

    // Pointer & autonomous wandering container-scanner orb
    const pointer = { x: -1e4, y: -1e4, activeStrength: 0, targetStrength: 0 };
    const scannerOrb = { x: -1e4, y: -1e4, strength: 0 };

    // Expanding isometric container shockwaves
    interface IsoShockwave {
      x: number;
      y: number;
      born: number;
      fromScale: number;
      toScale: number;
      life: number;
      isCyan: boolean;
    }
    let waves: IsoShockwave[] = [];
    let holdCharge: { x: number; y: number; start: number } | null = null;
    let nextAutoWaveAt = performance.now() + 2200;

    // Floating pixelated micro-containers in the flanks
    interface MicroContainer {
      colOffset: number; // fractional x [0..1]
      rowOffset: number; // fractional y [0..1]
      speedY: number;
      phase: number;
    }
    const microContainers: MicroContainer[] = [
      { colOffset: 0.1, rowOffset: 0.28, speedY: 0.022, phase: 0.2 },
      { colOffset: 0.88, rowOffset: 0.34, speedY: 0.018, phase: 1.7 },
      { colOffset: 0.15, rowOffset: 0.72, speedY: 0.025, phase: 3.1 },
      { colOffset: 0.84, rowOffset: 0.76, speedY: 0.02, phase: 4.5 },
    ];

    const spawnIsoWave = (x: number, y: number, charge: number, now: number, isCyan = false) => {
      const fromScale = 0.5 + 1.4 * charge;
      waves = [
        ...waves.slice(-4),
        {
          x,
          y,
          born: now,
          fromScale,
          toScale: (fromScale + 1.4 + 3.4 * charge) * (0.94 + Math.random() * 0.12),
          life: (0.75 + 0.55 * charge) * (0.94 + Math.random() * 0.12),
          isCyan,
        },
      ];
    };

    const updateLayout = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return false;

      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const nextW = Math.round(rect.width * dpr);
      const nextH = Math.round(rect.height * dpr);
      if (nextW !== width || nextH !== height) {
        width = nextW;
        height = nextH;
        canvas.width = width;
        canvas.height = height;
      }
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      cellPx = Math.max(6, Math.round((rect.width < 640 ? 7 : 8.5) * dpr));
      numCols = Math.ceil(width / cellPx) + 1;
      numRows = Math.ceil(height / cellPx) + 1;

      const logoEl = logoRef?.current ?? container.querySelector('[data-omastack-hero-logo]');
      if (logoEl) {
        const lRect = logoEl.getBoundingClientRect();
        logoCenterX = (lRect.left - rect.left + lRect.width / 2) * dpr;
        logoCenterY = (lRect.top - rect.top + lRect.height / 2) * dpr;
        logoRadiusPx = (Math.max(lRect.width, lRect.height) / 2) * dpr;
      } else {
        logoCenterX = width / 2;
        logoCenterY = height * 0.26;
        logoRadiusPx = 56 * dpr;
      }

      // Compute quiet zones around readable text & buttons ([data-hero-quiet])
      const quietNodes = Array.from(container.querySelectorAll('[data-hero-quiet]'));
      const quietRects = quietNodes
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width >= 1 && r.height >= 1)
        .map((r) => ({
          l: (r.left - rect.left) * dpr,
          t: (r.top - rect.top) * dpr,
          r: (r.right - rect.left) * dpr,
          b: (r.bottom - rect.top) * dpr,
        }));

      attenuationGrid = new Float32Array(numCols * numRows);
      const fadeRadius = 72 * dpr;

      for (let r = 0; r < numRows; r++) {
        const py = (r + 0.5) * cellPx;
        for (let c = 0; c < numCols; c++) {
          const px = (c + 0.5) * cellPx;

          // Attenuation near text/buttons so typography stays crisp
          let quietFactor = 1;
          for (const qr of quietRects) {
            const dx = Math.max(qr.l - px, 0, px - qr.r);
            const dy = Math.max(qr.t - py, 0, py - qr.b);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < fadeRadius) {
              const f = Math.pow(dist / fadeRadius, 2.4);
              if (f < quietFactor) quietFactor = f;
            }
          }

          // Isometric halo boost around the OmaStackLogo + outer vignette field
          const ldx = (px - logoCenterX) / (logoRadiusPx * 2.6);
          const ldy = (py - logoCenterY) / (logoRadiusPx * 1.6);
          const isoLogoDist = Math.abs(ldx) + Math.abs(ldy);
          const logoHalo =
            isoLogoDist > 0.42 && isoLogoDist < 2.2
              ? Math.sin(((isoLogoDist - 0.42) / 1.78) * Math.PI) * 0.85
              : 0;

          const nx = (px / width) * 2 - 1;
          const ny = (py / height) * 2 - 1;
          const edgeDist = Math.sqrt(nx * nx + ny * ny * 0.75);
          const edgeField = Math.min(1, Math.max(0.12, (edgeDist - 0.25) / 0.85));

          attenuationGrid[r * numCols + c] = Math.max(edgeField * quietFactor, logoHalo * 0.9);
        }
      }
      return true;
    };

    // Launch initial logo isometric shockwave on mount or theme switch
    if (!reducedMotion && updateLayout()) {
      spawnIsoWave(logoCenterX, logoCenterY, 0.75, performance.now(), true);
    }

    const renderFrame = (now: number) => {
      const tSec = reducedMotion ? 0 : now / 1000;

      // Check if parent triggered an explicit logo pulse
      if (pulseTriggerCount !== externalPulseRef.current) {
        externalPulseRef.current = pulseTriggerCount;
        spawnIsoWave(logoCenterX, logoCenterY, 0.95, now, true);
      }

      // Autonomous Lissajous container-scanner orb
      let targetOrbStrength = 0;
      if (!reducedMotion) {
        const rx = 0.42 * (1 + 0.1 * Math.sin(tSec * 0.13));
        const ry = 0.36 * (1 + 0.1 * Math.sin(tSec * 0.09 + 1.8));
        scannerOrb.x = width * (0.5 + rx * Math.sin(tSec * 0.58));
        scannerOrb.y = height * (0.44 + ry * Math.sin(tSec * 0.37 + 1.1));
        targetOrbStrength = 0.65;

        if (now >= nextAutoWaveAt) {
          // Alternate between a pulse from the OmaStackLogo and a pulse from the scanner orb
          const fromLogo = Math.random() < 0.55;
          spawnIsoWave(
            fromLogo ? logoCenterX : scannerOrb.x,
            fromLogo ? logoCenterY : scannerOrb.y,
            fromLogo ? 0.55 : 0.35,
            now,
            fromLogo
          );
          nextAutoWaveAt = now + 2600 + Math.random() * 1400;
        }
      }

      scannerOrb.strength += (targetOrbStrength - scannerOrb.strength) * 0.08;
      pointer.activeStrength += (pointer.targetStrength - pointer.activeStrength) * 0.28;

      ctx.clearRect(0, 0, width, height);

      const reachFor = (s: number) => 13 * cellPx * (0.45 + 0.55 * s);
      const lightSources: Array<{ x: number; y: number; strength: number; reach: number }> = [];
      if (pointer.activeStrength > 0.01) {
        lightSources.push({
          x: pointer.x,
          y: pointer.y,
          strength: pointer.activeStrength,
          reach: reachFor(pointer.activeStrength),
        });
      }
      if (scannerOrb.strength > 0.01) {
        lightSources.push({
          x: scannerOrb.x,
          y: scannerOrb.y,
          strength: scannerOrb.strength,
          reach: reachFor(scannerOrb.strength),
        });
      }

      // Active isometric container shockwaves
      const activeRipples: Array<{
        x: number;
        y: number;
        stepPx: number;
        amp: number;
        isCyan: boolean;
      }> = [];

      if (waves.length > 0) {
        waves = waves.filter((w) => (now - w.born) / 1000 < w.life);
        for (const w of waves) {
          const p = (now - w.born) / 1000 / w.life;
          const eased = 1 - Math.pow(1 - p, 3);
          activeRipples.push({
            x: w.x,
            y: w.y,
            stepPx: cellPx * (w.fromScale + (w.toScale - w.fromScale) * eased),
            amp: Math.pow(1 - p, 1.65),
            isCyan: w.isCyan,
          });
        }
      }
      if (holdCharge) {
        const chargeRatio = Math.min((now - holdCharge.start) / 1000 / 1.0, 1);
        activeRipples.push({
          x: holdCharge.x,
          y: holdCharge.y,
          stepPx: cellPx * (0.5 + 1.5 * chargeRatio),
          amp: 0.92,
          isCyan: true,
        });
      }

      const sampleIsoStamp = (px: number, py: number): { amp: number; isCyan: boolean } => {
        let bestAmp = 0;
        let bestCyan = false;
        for (const rip of activeRipples) {
          const gx = Math.floor((px - rip.x) / rip.stepPx + 17 / 2);
          const gy = Math.floor((py - rip.y) / rip.stepPx + 17 / 2);
          if (gx < 0 || gy < 0 || gx >= 17 || gy >= 17) continue;
          if (OMASTACK_ISO_STAMP_17X17[gy][gx] === '1' && rip.amp > bestAmp) {
            bestAmp = rip.amp;
            bestCyan = rip.isCyan;
          }
        }
        return { amp: bestAmp, isCyan: bestCyan };
      };

      const gap = Math.max(1, Math.round(dpr));
      const blockSize = Math.max(2, cellPx - gap);

      // 1. Render Bayer-Dithered Pixel Grid Field + Isometric Logo Rings
      for (let r = 0; r < numRows; r++) {
        const py = r * cellPx;
        const centerY = py + cellPx / 2;

        for (let c = 0; c < numCols; c++) {
          const px = c * cellPx;
          const centerX = px + cellPx / 2;

          const atten = attenuationGrid[r * numCols + c];
          let intensity = 0;
          let isIsoRingCrest = false;

          if (atten > 0.004) {
            const nx = c / 9;
            const ny = r / 9;
            const nVal =
              0.6 * sampleNoise(noiseField, nx + tSec * 0.14, ny - tSec * 0.055) +
              0.4 * sampleNoise(noiseField, nx * 0.55 - tSec * 0.08, ny * 0.55 + tSec * 0.06);
            const shimmer =
              0.5 + 0.5 * Math.sin(tSec * 1.1 + hashTable[(r * 37 + c * 11) & 4095] * 6.283);
            intensity = atten * (0.28 + 0.52 * nVal * nVal + 0.2 * shimmer) * 0.64;

            // Animated isometric diamond rings radiating from the OmaStackLogo
            const isoDx = Math.abs(centerX - logoCenterX) * 0.58;
            const isoDy = Math.abs(centerY - logoCenterY);
            const isoDist = isoDx + isoDy;
            if (isoDist > logoRadiusPx * 0.7 && isoDist < logoRadiusPx * 3.1) {
              const ringWave = Math.sin(isoDist / (cellPx * 2.2) - tSec * 2.4);
              if (ringWave > 0.72) {
                const ringFade = 1 - (isoDist - logoRadiusPx * 0.7) / (logoRadiusPx * 2.4);
                intensity += ringFade * 0.42;
                if (ringWave > 0.9) isIsoRingCrest = true;
              }
            }
          }

          let lightBoost = 0;
          for (const src of lightSources) {
            const dx = centerX - src.x;
            const dy = centerY - src.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < src.reach) {
              const falloff = 1 - dist / src.reach;
              const boost = falloff * falloff * src.strength;
              if (boost > lightBoost) lightBoost = boost;
            }
          }
          intensity += lightBoost * 0.62;

          let stampAmp = 0;
          let stampCyan = false;
          if (activeRipples.length > 0) {
            const st = sampleIsoStamp(centerX, centerY);
            stampAmp = st.amp;
            stampCyan = st.isCyan;
            intensity += stampAmp * 1.15;
          }

          const bayerThreshold =
            0.78 * ((BAYER_8X8[(r & 7) * 8 + (c & 7)] + 0.5) / 64) +
            0.22 * hashTable[((r & 63) * 64 + (c & 63)) & 4095];

          if (intensity <= bayerThreshold) continue;

          const peak = Math.max(lightBoost, stampAmp);
          if (stampAmp > 0.45 && stampCyan) {
            ctx.fillStyle = palette.cyanCore;
          } else if (isIsoRingCrest && peak > 0.15) {
            ctx.fillStyle = palette.matchaTop;
          } else if (peak > 0.46) {
            ctx.fillStyle = palette.crest;
          } else if (peak > 0.28) {
            ctx.fillStyle = palette.lit;
          } else if (peak > 0.12) {
            ctx.fillStyle = palette.mid;
          } else {
            ctx.fillStyle = palette.dim;
          }

          ctx.fillRect(px, py, blockSize, blockSize);
        }
      }

      // 2. Render Floating Pixelated 3-Tier Micro-Containers (OmaStack Logo Mini-Stacks)
      for (const mc of microContainers) {
        const baseCol = Math.round((mc.colOffset * width) / cellPx);
        const rawRow = ((mc.rowOffset - tSec * mc.speedY) % 1 + 1) % 1;
        const baseRow = Math.round((rawRow * height) / cellPx);
        const etchCycle = (Math.sin(tSec * 1.6 + mc.phase) + 1) * 0.5; // 0..1 layer assembly

        for (let sy = 0; sy < 9; sy++) {
          const rowStr = MICRO_CONTAINER_9X9[sy];
          for (let sx = 0; sx < 9; sx++) {
            const cellCode = rowStr[sx];
            if (cellCode === '0') continue;
            // Progressive tier etching: tier 1 (bottom) -> tier 2 (cyan core) -> tier 3 (top aperture)
            if (cellCode === '3' && etchCycle < 0.35) continue;
            if (cellCode === '2' && etchCycle < 0.18) continue;

            const gx = baseCol + sx - 4;
            const gy = baseRow + sy - 4;
            if (gx < 0 || gy < 0 || gx >= numCols || gy >= numRows) continue;

            ctx.fillStyle =
              cellCode === '2'
                ? palette.cyanCore
                : cellCode === '3'
                ? palette.matchaTop
                : palette.mid;
            ctx.fillRect(gx * cellPx, gy * cellPx, blockSize, blockSize);
          }
        }
      }
    };

    let rafId = 0;
    let lastFrameTime = 0;
    const loop = (now: number) => {
      rafId = requestAnimationFrame(loop);
      if (now - lastFrameTime < 24) return;
      lastFrameTime = now;
      renderFrame(now);
    };

    const getLocalPointer = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      return {
        inside,
        x: (e.clientX - rect.left) * dpr,
        y: (e.clientY - rect.top) * dpr,
      };
    };

    const isInteractiveTarget = (target: EventTarget | null) =>
      target instanceof Element &&
      target.closest('a, button, input, select, textarea, label, [role="button"]') !== null;

    const handlePointerMove = (e: PointerEvent) => {
      const { inside, x, y } = getLocalPointer(e);
      if (!holdCharge) {
        pointer.targetStrength = inside ? 0.9 : 0;
      }
      if (inside) {
        pointer.x = x;
        pointer.y = y;
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (isInteractiveTarget(e.target)) return;
      const { inside, x, y } = getLocalPointer(e);
      if (!inside || reducedMotion) return;
      pointer.x = x;
      pointer.y = y;
      pointer.targetStrength = 0;
      holdCharge = { x, y, start: performance.now() };
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!holdCharge) return;
      const { inside } = getLocalPointer(e);
      pointer.targetStrength = inside ? 0.9 : 0;
      const now = performance.now();
      const charge = Math.min((now - holdCharge.start) / 1000 / 1.0, 1);
      spawnIsoWave(holdCharge.x, holdCharge.y, charge, now, true);
      holdCharge = null;
    };

    const handlePointerCancel = () => {
      holdCharge = null;
    };

    if (updateLayout()) {
      if (reducedMotion) {
        renderFrame(0);
      } else {
        rafId = requestAnimationFrame(loop);
      }
    }

    const resizeObserver = new ResizeObserver(() => {
      if (updateLayout()) {
        renderFrame(reducedMotion ? 0 : lastFrameTime);
      }
    });
    resizeObserver.observe(container);

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    window.addEventListener('pointercancel', handlePointerCancel, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
    };
  }, [currentTheme, logoRef, pulseTriggerCount]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden select-none z-0">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full select-none" />
    </div>
  );
};
