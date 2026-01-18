import * as THREE from './vendor/three.module.js';

// ============================================
// ASSETS
// ============================================

const IMAGES = [
  '1.JPG',
  '2.jpg',
  '3.jpg',
  '4.jpg',
  '5.jpg',
  '6.JPG',
  '7.JPG',
  '8.JPG',
  '9.jpg',
  '10.jpg',
  '11.jpg',
  '12.jpg',
  '13.jpg',
  '14.jpg',
  '15.jpg',
  '16.jpg',
  'life_on_mars.jpg',
];

const TITLE_FONT_FAMILY = 'ANACycleTitle';

const TITLE = {
  text: 'ANACYCLE',
  enabled: true,
  position: 'center',
  sizePercent: 15,
  fillColor: '#ffffff',
  strokeColor: '#000000',
  strokeWidth: 2,
  shadowEnabled: false,
  shadowColor: '#000000',
  shadowBlur: 12,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
};

// ============================================
// REACTION-DIFFUSION PARAMS (defaults per screenshot)
// ============================================

const PRESETS = [
  { name: 'Default', f: 0.054, k: 0.062 },
  { name: 'Negative bubbles', f: 0.098, k: 0.0555 },
  { name: 'Positive bubbles', f: 0.098, k: 0.057 },
  { name: 'Precritical bubbles', f: 0.082, k: 0.059 },
  { name: 'Worms and loops', f: 0.082, k: 0.06 },
  { name: 'Stable solitons', f: 0.074, k: 0.064 },
  { name: 'The U-Skate World', f: 0.062, k: 0.0609 },
  { name: 'Worms', f: 0.058, k: 0.065 },
  { name: 'Worms join into maze', f: 0.046, k: 0.063 },
  { name: 'Negatons', f: 0.046, k: 0.0594 },
  { name: 'Turing patterns', f: 0.042, k: 0.059 },
  { name: 'Chaos', f: 0.026, k: 0.051 },
  { name: 'Waves', f: 0.014, k: 0.045 },
];

const RD = {
  f: 0.0330,
  k: 0.0655,
  dA: 0.2095,
  dB: 0.1050,
  timestep: 1.0,
  brushRadius: 100.0,
  brushFeather: 0.5,
  stepsPerFrame: 60,
  renderingStyle: 7,
  warmStartIterations: 240,
  simScale: 1.0,
  biasX: 0.0,
  biasY: 0.0,
  sourceStrength: 0.005,
  invertImage: false,
  showOriginal: false,

  // Image controls
  imageVignette: false,
  imageVignetteStrength: 0.65,
  imageAutoLevels: false,
  imageAutoLevelsStrength: 1.0,

  // Brush tuning (simulation)
  brushPower: 1.0,
  brushNoiseScale: 1.0,
  brushSpeckle: 0.25,
  brushDelta: 0.06,
};

const DEFAULTS_STORAGE_KEY = 'rd-06-defaults-v1';

const COLORS = {
  // Gradient (style 1)
  color1: '#000000', stop1: 0.0,
  color2: '#000000', stop2: 0.2,
  color3: '#ffffff', stop3: 0.4,
  color4: '#000000', stop4: 0.6,
  color5: '#000000', stop5: 0.8,

  // Duo tone (style 7)
  duoToneBlack: '#000000',
  duoToneWhite: '#ffffff',

  // HSL mapping (style 0)
  hslFromMin: 0.0,
  hslFromMax: 1.0,
  hslToMin: 0.0,
  hslToMax: 1.0,
  hslSaturation: 1.0,
  hslLuminosity: 0.5,
};

function applySavedDefaults() {
  try {
    const raw = localStorage.getItem(DEFAULTS_STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object') return;

    const applySubset = (target, source, allowedKeys) => {
      if (!source || typeof source !== 'object') return;
      allowedKeys.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      });
    };

    applySubset(RD, saved.RD, [
      'f', 'k', 'dA', 'dB', 'timestep', 'brushRadius', 'brushFeather', 'stepsPerFrame',
      'renderingStyle', 'warmStartIterations', 'simScale', 'biasX', 'biasY', 'sourceStrength',
      'invertImage',

      'imageVignette', 'imageVignetteStrength', 'imageAutoLevels', 'imageAutoLevelsStrength',
      'brushPower', 'brushNoiseScale', 'brushSpeckle', 'brushDelta',
    ]);
    applySubset(COLORS, saved.COLORS, [
      'color1', 'stop1', 'color2', 'stop2', 'color3', 'stop3', 'color4', 'stop4', 'color5', 'stop5',
      'duoToneBlack', 'duoToneWhite',
      'hslFromMin', 'hslFromMax', 'hslToMin', 'hslToMax', 'hslSaturation', 'hslLuminosity',
    ]);
    applySubset(TITLE, saved.TITLE, [
      'text', 'enabled', 'position', 'sizePercent', 'fillColor', 'strokeColor', 'strokeWidth',
      'shadowEnabled', 'shadowColor', 'shadowBlur', 'shadowOffsetX', 'shadowOffsetY',
    ]);
  } catch {
    // ignore invalid stored defaults
  }
}

applySavedDefaults();

// ============================================
// HELPER FUNCTIONS
// ============================================

function setOriginalOverlayVisible(visible) {
  document.body.classList.toggle('show-original', !!visible);
}

function getTitleCenterY(width, height, fontPx) {
  const pad = height * 0.05;
  const half = fontPx * 0.6;
  if (TITLE.position === 'top') return pad + half;
  if (TITLE.position === 'bottom') return height - pad - half;
  return height / 2;
}

function showStartupError(message, err) {
  try {
    const existing = document.getElementById('rdStartupError');
    if (existing) existing.remove();

    const panel = document.createElement('div');
    panel.id = 'rdStartupError';
    panel.style.position = 'fixed';
    panel.style.left = '10px';
    panel.style.bottom = '10px';
    panel.style.zIndex = '99999';
    panel.style.maxWidth = 'min(720px, calc(100vw - 20px))';
    panel.style.padding = '10px 12px';
    panel.style.borderRadius = '8px';
    panel.style.background = 'rgba(0,0,0,0.75)';
    panel.style.border = '1px solid rgba(255,255,255,0.25)';
    panel.style.color = '#fff';
    panel.style.fontFamily = "'Courier New', Courier, monospace";
    panel.style.fontSize = '12px';
    panel.style.whiteSpace = 'pre-wrap';

    const hint = 'If you are viewing this in a VS Code preview/webview, try opening the same URL in Chrome/Safari/Firefox.';
    const detail = err ? (err.stack || err.message || String(err)) : '';
    panel.textContent = `[RD-06] ${message}\n${hint}${detail ? `\n\n${detail}` : ''}`;
    document.body.appendChild(panel);
  } catch {
    // ignore UI error rendering failures
  }
}

// ============================================
// SHADERS
// ============================================

const simulationVert = `
uniform vec2 resolution;

varying vec2 v_uvs[9];
varying vec2 texelStep;

void main() {
  texelStep = 1.0 / resolution.xy;

  v_uvs[0] = uv;
  v_uvs[1] = uv + vec2(0.0, -texelStep.y);
  v_uvs[2] = uv + vec2(texelStep.x, 0.0);
  v_uvs[3] = uv + vec2(0.0, texelStep.y);
  v_uvs[4] = uv + vec2(-texelStep.x, 0.0);

  v_uvs[5] = uv + vec2(texelStep.x, -texelStep.y);
  v_uvs[6] = uv + vec2(texelStep.x, texelStep.y);
  v_uvs[7] = uv + vec2(-texelStep.x, texelStep.y);
  v_uvs[8] = uv + vec2(-texelStep.x, -texelStep.y);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const simulationFrag = `
uniform sampler2D previousIterationTexture;
uniform sampler2D sourceTexture;
uniform sampler2D titleMaskTexture;
uniform float sourceStrength;

uniform float f;
uniform float k;
uniform float dA;
uniform float dB;
uniform float timestep;

uniform vec2 mousePosition;
uniform float brushRadius;
uniform float brushFeather;
uniform float brushStrength;

uniform float brushPower;
uniform float brushNoiseScale;
uniform float brushSpeckle;
uniform float brushDelta;

uniform vec2 bias;
uniform vec2 resolution;

varying vec2 v_uvs[9];

float hash21(vec2 p) {
  // deterministic noise in [0,1)
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

vec3 weights[3];

void setWeights(int type) {
  if(type == 2) {
    weights[0] = vec3(0.0,  1.0,  0.0);
    weights[1] = vec3(1.0, -4.0,  1.0);
    weights[2] = vec3(0.0,  1.0,  0.0);
  }
}

vec2 getLaplacian(vec4 centerTexel) {
  setWeights(2);

  vec2 laplacian = centerTexel.xy * weights[1][1];
  laplacian += texture2D(previousIterationTexture, fract(v_uvs[1])).xy * (weights[0][1] + bias.y);
  laplacian += texture2D(previousIterationTexture, fract(v_uvs[2])).xy * (weights[1][2] + bias.x);
  laplacian += texture2D(previousIterationTexture, fract(v_uvs[3])).xy * (weights[2][1] - bias.y);
  laplacian += texture2D(previousIterationTexture, fract(v_uvs[4])).xy * (weights[1][0] - bias.x);

  laplacian += texture2D(previousIterationTexture, fract(v_uvs[5])).xy * weights[0][2];
  laplacian += texture2D(previousIterationTexture, fract(v_uvs[6])).xy * weights[2][2];
  laplacian += texture2D(previousIterationTexture, fract(v_uvs[7])).xy * weights[2][0];
  laplacian += texture2D(previousIterationTexture, fract(v_uvs[8])).xy * weights[0][0];

  return laplacian;
}

void main() {
  vec4 centerTexel = texture2D(previousIterationTexture, v_uvs[0]);
  float A = centerTexel[0];
  float B = centerTexel[1];

  // Drive the simulation from the source texture (background + title)
  vec3 src = texture2D(sourceTexture, v_uvs[0]).rgb;
  float srcLum = dot(src, vec3(0.299, 0.587, 0.114));
  float targetB = clamp(1.0 - srcLum, 0.0, 1.0);
  B = mix(B, targetB, sourceStrength);

  if(mousePosition.x > 0.0 && mousePosition.y > 0.0) {
    float distToMouse = distance(mousePosition * resolution, v_uvs[0] * resolution);
    if(distToMouse < brushRadius) {
      float titleMask = texture2D(titleMaskTexture, v_uvs[0]).a;
      float allowBrush = 1.0 - titleMask;

      // Invisible brush: seed instability without a solid circular stamp.
      float feather = clamp(brushFeather, 0.0, 0.999);
      float inner = brushRadius * (1.0 - feather);
      float falloff = (1.0 - smoothstep(inner, brushRadius, distToMouse)) * allowBrush * brushStrength;
      float power = max(0.0, brushPower);

      // Speckle the influence so the circle edge isn't visibly “painted”.
      // Use TWO independent hashes and multiply them to create a sparser point-cloud.
      vec2 nUV = v_uvs[0] * (resolution.xy * max(0.1, brushNoiseScale));
      float n1 = hash21(nUV);
      float n2 = hash21(nUV + vec2(19.19, 7.13));
      float t = clamp(brushSpeckle, 0.0, 0.95);
      float speckle = smoothstep(t, 0.95, n1) * smoothstep(t, 0.95, n2);
      float influence = falloff * speckle * power;

      // Perturbation: decouple delta noise from mask noise to avoid “stamped” structure.
      float nDelta = hash21(nUV + vec2(3.7, 9.2));
      float delta = (nDelta - 0.5) * brushDelta * influence;
      B = clamp(B + delta, 0.0, 1.0);
      A = clamp(A - 0.5 * delta, 0.0, 1.0);
    }
  }

  vec2 laplacian = getLaplacian(centerTexel);
  float reactionTerm = A * B * B;

  gl_FragColor = vec4(
    A + ((dA * laplacian[0] - reactionTerm + f * (1.0 - A)) * timestep),
    B + ((dB * laplacian[1] + reactionTerm - (k + f) * B) * timestep),
    0.0,
    1.0
  );
}
`;

const displayVert = `
varying vec2 v_uv;

void main() {
  v_uv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const displayFrag = `
varying vec2 v_uv;
uniform sampler2D textureToDisplay;
uniform sampler2D previousIterationTexture;
uniform float time;

uniform int titleOnly;
uniform sampler2D titleMaskTexture;

uniform int renderingStyle;
uniform float bwThreshold;
uniform vec3 duoToneBlack;
uniform vec3 duoToneWhite;

// Brush transparency mask (for display only)
uniform vec2 mousePosition;
uniform float brushRadius;
uniform vec2 resolution;

uniform vec4 colorStop1;
uniform vec4 colorStop2;
uniform vec4 colorStop3;
uniform vec4 colorStop4;
uniform vec4 colorStop5;

uniform vec2 hslFrom;
uniform vec2 hslTo;
uniform float hslSaturation;
uniform float hslLuminosity;

float when_gt(float x, float y)  { return max(sign(x - y), 0.0); }

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

vec3 hsb2rgb(in vec3 c){
  vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
    6.0)-3.0)-1.0,
    0.0,
    1.0 );
  rgb = rgb*rgb*(3.0-2.0*rgb);
  return c.z * mix(vec3(1.0), rgb, c.y);
}

vec4 rainbow(vec2 uv) {
  float PI = 3.1415926535897932384626433832795;
  float center = 0.1;
  float width = 1.0;
  float frequency = 1.5;
  float r1 = sin(frequency*uv.x + 0.0) * width + center;
  float g1 = sin(frequency*uv.x + 2.0*PI/3.0) * width + center;
  float b1 = sin(frequency*uv.x + 4.0*PI/3.0) * width + center;

  float r2 = sin(frequency*uv.y + 0.0) * width + center;
  float g2 = sin(frequency*uv.y + 2.0*PI/3.0) * width + center;
  float b2 = sin(frequency*uv.y + 4.0*PI/3.0) * width + center;

  return vec4(vec3(r1, g1, b1) * vec3(r2, g2, b2), 1.0);
}

void main() {
  vec4 previousPixel = texture2D(previousIterationTexture, v_uv);
  vec4 pixel = texture2D(textureToDisplay, v_uv);
  float A = pixel[0];
  float B = pixel[1];
  vec4 outputColor;

  if(renderingStyle == 0) {
    outputColor = vec4(hsb2rgb(vec3(
      map(B-A, hslFrom[0], hslFrom[1], hslTo[0], hslTo[1]),
      hslSaturation,
      hslLuminosity
    )), 1.);

  } else if(renderingStyle == 1) {
    vec3 color;

    if(B <= colorStop1.a) {
      color = colorStop1.rgb;
    } else if(B <= colorStop2.a) {
      color = mix(colorStop1.rgb, colorStop2.rgb, (B - colorStop1.a) / (colorStop2.a - colorStop1.a));
    } else if(B <= colorStop3.a) {
      color = mix(colorStop2.rgb, colorStop3.rgb, (B - colorStop2.a) / (colorStop3.a - colorStop2.a));
    } else if(B <= colorStop4.a) {
      color = mix(colorStop3.rgb, colorStop4.rgb, (B - colorStop3.a) / (colorStop4.a - colorStop3.a));
    } else if(B <= colorStop5.a) {
      color = mix(colorStop4.rgb, colorStop5.rgb, (B - colorStop4.a) / (colorStop5.a - colorStop4.a));
    } else {
      color = colorStop5.rgb;
    }

    outputColor = vec4(color.rgb, 1.0);

  } else if(renderingStyle == 2) {
    outputColor = vec4(
      1000.0 * abs(pixel.x - previousPixel.x) + 1.0 * pixel.x - 0.5 * previousPixel.y,
      0.9 * pixel.x - 2.0 * pixel.y,
      10000.0 * abs(pixel.y - previousPixel.y),
      1.0
    );

  } else if(renderingStyle == 3) {
    outputColor = vec4(
      10000.0 * abs(pixel.y - previousPixel.y),
      1000.0 * abs(pixel.x - previousPixel.x) + 1.0 * pixel.x - 0.5 * previousPixel.y,
      0.9 * pixel.x - 2.0 * pixel.y,
      1.0
    );

  } else if(renderingStyle == 4) {
    outputColor = vec4(
      1000.0 * abs(pixel.x - previousPixel.x) + 1.0 * pixel.x - 50000.0 * previousPixel.y,
      10000.0 * abs(pixel.y - previousPixel.y),
      0.6 * pixel.x - .1 * pixel.y,
      1.0
    );

  } else if(renderingStyle == 5) {
    float c = A - B;
    outputColor = vec4(c, c, c, 1.0);
    vec4 rbow = rainbow(v_uv.xy + time*.5);
    float gBranch = when_gt(B, 0.01);
    outputColor = mix(outputColor, outputColor - rbow, gBranch);

  } else if(renderingStyle == 6) {
    float grayValue = pixel.r - pixel.g;
    outputColor = vec4(grayValue, grayValue, grayValue, 1.0);

  } else if(renderingStyle == 7) {
    float grayValue = pixel.r - pixel.g;
    if(grayValue > bwThreshold) {
      outputColor = vec4(duoToneBlack, 1.0);
    } else {
      outputColor = vec4(duoToneWhite, 1.0);
    }

  } else if(renderingStyle == 8) {
    outputColor = pixel;
  }

  if (titleOnly == 1) {
    float maskA = texture2D(titleMaskTexture, v_uv).a;
    // Soft edge avoids harsh aliasing.
    float m = smoothstep(0.0, 0.02, maskA);

    // Black-filled background, title region shows RD color.
    vec3 rgbOut = mix(vec3(0.0), outputColor.rgb, m);
    gl_FragColor = vec4(rgbOut, 1.0);
    return;
  }

  gl_FragColor = vec4(outputColor.rgb, 1.0);
}
`;

const passthroughVert = `
varying vec2 v_uv;

void main() {
  v_uv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const passthroughFrag = `
varying vec2 v_uv;
uniform sampler2D textureToDisplay;

void main() {
  gl_FragColor = texture2D(textureToDisplay, v_uv);
}
`;

const seedBlendFrag = `
varying vec2 v_uv;
uniform sampler2D newSeedTexture;
uniform sampler2D oldSimTexture;
uniform sampler2D titleMaskTexture;

void main() {
  vec4 seed = texture2D(newSeedTexture, v_uv);
  vec4 oldS = texture2D(oldSimTexture, v_uv);
  float m = texture2D(titleMaskTexture, v_uv).a;
  float keep = smoothstep(0.0, 0.02, m);
  gl_FragColor = mix(seed, oldS, keep);
}
`;

// ============================================
// STATE
// ============================================

let currentImageIndex = 0;
let images = [];

let renderer;
let scene;
let camera;
let mesh;
let renderTargets = [];
let currentRT = 0;
let renderTargetType = THREE.UnsignedByteType;

let collapseProbeRT;

let seedCanvas;
let seedCtx;

let bgCanvas;
let bgCtx;

let simWidth = 0;
let simHeight = 0;

let titleMaskCanvas;
let titleMaskCtx;

let titleMaskTexture;
let mouseMovedThisFrame = false;
let pointerActiveOnCanvas = false;
let lastPointerMoveMs = 0;
let lastMouseX = -1;
let lastMouseY = -1;
let frameCounter = 0;

let hasSeededOnce = false;

let warmStartToken = 0;
let isWarmStarting = false;

const uniforms = {
  simulation: {
    previousIterationTexture: { value: null },
    sourceTexture: { value: null },
    titleMaskTexture: { value: null },
    sourceStrength: { value: RD.sourceStrength },
    resolution: { value: new THREE.Vector2(900, 900) },
    mousePosition: { value: new THREE.Vector2(-1, -1) },
    brushRadius: { value: RD.brushRadius },
    brushFeather: { value: RD.brushFeather },
    brushStrength: { value: 1.0 },
    brushPower: { value: RD.brushPower },
    brushNoiseScale: { value: RD.brushNoiseScale },
    brushSpeckle: { value: RD.brushSpeckle },
    brushDelta: { value: RD.brushDelta },
    f: { value: RD.f },
    k: { value: RD.k },
    dA: { value: RD.dA },
    dB: { value: RD.dB },
    timestep: { value: RD.timestep },
    bias: { value: new THREE.Vector2(RD.biasX, RD.biasY) },
  },
  display: {
    textureToDisplay: { value: null },
    previousIterationTexture: { value: null },
    time: { value: 0 },
    renderingStyle: { value: RD.renderingStyle },
    // 0 = normal full-screen display, 1 = show only title region (masked) during initial load.
    titleOnly: { value: 0 },
    titleMaskTexture: { value: null },
    bwThreshold: { value: 0.07 },
    duoToneBlack: { value: new THREE.Color(COLORS.duoToneBlack) },
    duoToneWhite: { value: new THREE.Color(COLORS.duoToneWhite) },
    mousePosition: { value: new THREE.Vector2(-1, -1) },
    brushRadius: { value: RD.brushRadius },
    resolution: { value: new THREE.Vector2(900, 900) },
    colorStop1: { value: new THREE.Vector4(0, 0, 0, COLORS.stop1) },
    colorStop2: { value: new THREE.Vector4(0, 0, 0, COLORS.stop2) },
    colorStop3: { value: new THREE.Vector4(1, 1, 1, COLORS.stop3) },
    colorStop4: { value: new THREE.Vector4(0, 0, 0, COLORS.stop4) },
    colorStop5: { value: new THREE.Vector4(0, 0, 0, COLORS.stop5) },
    hslFrom: { value: new THREE.Vector2(COLORS.hslFromMin, COLORS.hslFromMax) },
    hslTo: { value: new THREE.Vector2(COLORS.hslToMin, COLORS.hslToMax) },
    hslSaturation: { value: COLORS.hslSaturation },
    hslLuminosity: { value: COLORS.hslLuminosity },
  },
  passthrough: {
    textureToDisplay: { value: null },
  },

  seedBlend: {
    newSeedTexture: { value: null },
    oldSimTexture: { value: null },
    titleMaskTexture: { value: null },
  },

  probe: {
    textureToSample: { value: null },
  },
};

const materials = {
  simulation: null,
  display: null,
  passthrough: null,
  seedBlend: null,
  probe: null,
};

function updateImageName(index) {
  const label = document.getElementById('imageName');
  if (!label) return;
  label.textContent = images[index]?.filename ?? '';
}

function setBodyBackground(filename) {
  if (!bgCanvas || !bgCtx) return;
  const rec = images.find((r) => r?.filename === filename);
  const img = rec?.img;
  if (!img) return;
  drawCoverImageToBackground(img, bgCanvas.width, bgCanvas.height);
}

function resizeBackgroundCanvas() {
  if (!bgCanvas || !bgCtx) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  bgCanvas.width = w;
  bgCanvas.height = h;
  bgCanvas.style.width = '100%';
  bgCanvas.style.height = '100%';
}

function computeAutoLevelsTransform(imageData) {
  const data = imageData.data;
  let minL = 1;
  let maxL = 0;

  // Sample for speed.
  const step = 16;
  for (let i = 0; i < data.length; i += 4 * step) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    if (l < minL) minL = l;
    if (l > maxL) maxL = l;
  }

  // Clamp extremes to avoid blowing out noise.
  minL = Math.max(0.02, Math.min(0.6, minL));
  maxL = Math.max(minL + 0.05, Math.min(0.98, maxL));
  const scale = 1 / (maxL - minL);
  const offset = -minL * scale;
  return { scale, offset };
}

function applyAutoLevelsToCanvas(ctx, width, height, strength = 1.0) {
  const s = Math.max(0, Math.min(1, strength));
  if (s <= 0) return;

  const img = ctx.getImageData(0, 0, width, height);
  const { scale, offset } = computeAutoLevelsTransform(img);
  const d = img.data;

  for (let i = 0; i < d.length; i += 4) {
    const or = d[i] / 255;
    const og = d[i + 1] / 255;
    const ob = d[i + 2] / 255;

    const tr = Math.max(0, Math.min(1, or * scale + offset));
    const tg = Math.max(0, Math.min(1, og * scale + offset));
    const tb = Math.max(0, Math.min(1, ob * scale + offset));

    const rr = or + (tr - or) * s;
    const gg = og + (tg - og) * s;
    const bb = ob + (tb - ob) * s;

    d[i] = Math.round(rr * 255);
    d[i + 1] = Math.round(gg * 255);
    d[i + 2] = Math.round(bb * 255);
  }

  ctx.putImageData(img, 0, 0);
}

function applyVignetteToCanvas(ctx, width, height, strength = 0.65) {
  const s = Math.max(0, Math.min(1, strength));
  if (s <= 0) return;

  const img = ctx.getImageData(0, 0, width, height);
  const d = img.data;

  const cx = width / 2;
  const cy = height / 2;
  const inner = 0.55;
  // Shape power > 2 makes the vignette closer to a square (superellipse / squircle).
  // This also ensures the top/bottom center edges reach full strength (unlike diagonal-normalized distance).
  const shapePower = 4.0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];

      const dx = cx > 0 ? Math.abs((x - cx) / cx) : 0;
      const dy = cy > 0 ? Math.abs((y - cy) / cy) : 0;
      const t = Math.pow(Math.pow(dx, shapePower) + Math.pow(dy, shapePower), 1 / shapePower);
      const tt = Math.max(0, Math.min(1, t));
      const u = Math.max(0, Math.min(1, (tt - inner) / (1 - inner)));
      const smooth = u * u * (3 - 2 * u);
      const mul = 1 - s * smooth;

      d[i] = Math.round(r * mul);
      d[i + 1] = Math.round(g * mul);
      d[i + 2] = Math.round(b * mul);
    }
  }

  ctx.putImageData(img, 0, 0);
}

function drawCoverImageToBackground(imageEl, width, height) {
  if (!bgCtx || !bgCanvas) return;
  bgCtx.clearRect(0, 0, width, height);

  const imgW = imageEl.naturalWidth || imageEl.width;
  const imgH = imageEl.naturalHeight || imageEl.height;
  if (!imgW || !imgH) return;

  const scale = Math.max(width / imgW, height / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  const dx = (width - drawW) / 2;
  const dy = (height - drawH) / 2;

  bgCtx.save();
  bgCtx.filter = RD.invertImage ? 'grayscale(1) invert(1)' : 'grayscale(1)';
  bgCtx.drawImage(imageEl, dx, dy, drawW, drawH);
  bgCtx.restore();

  if (RD.imageAutoLevels) {
    applyAutoLevelsToCanvas(bgCtx, width, height, RD.imageAutoLevelsStrength);
  }

  if (RD.imageVignette) {
    applyVignetteToCanvas(bgCtx, width, height, RD.imageVignetteStrength);
  }
}

function setVignetteEnabled(enabled) {
  RD.imageVignette = !!enabled;
}

function setupTabs() {
  const buttons = Array.from(document.querySelectorAll('.panel-tab-btn'));
  const panels = Array.from(document.querySelectorAll('.tabbed-panel'));
  if (!buttons.length || !panels.length) return;

  const activate = (name) => {
    buttons.forEach((b) => b.classList.toggle('is-active', b.dataset.panel === name));
    panels.forEach((p) => p.classList.toggle('is-active', p.dataset.panel === name));
  };

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.panel;
      if (!name) return;
      activate(name);
    });
  });

  const initial = buttons.find((b) => b.classList.contains('is-active'))?.dataset.panel || buttons[0].dataset.panel;
  if (initial) activate(initial);
}

function setupBrushPanel() {
  const toggleBtn = document.getElementById('toggleBrushControls');
  const content = document.getElementById('brushControlsContent');
  if (toggleBtn && content) {
    toggleBtn.addEventListener('click', () => {
      content.classList.toggle('collapsed');
      toggleBtn.textContent = content.classList.contains('collapsed') ? '+' : '−';
    });
  }

  const prime = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.value = String(value);
  };
  prime('rdBrushPowerSlider', RD.brushPower);
  prime('rdBrushNoiseScaleSlider', RD.brushNoiseScale);
  prime('rdBrushSpeckleSlider', RD.brushSpeckle);
  prime('rdBrushDeltaSlider', RD.brushDelta);

  const bind = (id, valueId, decimals, onValue) => {
    const slider = document.getElementById(id);
    const valueEl = document.getElementById(valueId);
    if (!slider || !valueEl) return;

    const format = (v) => (decimals > 0 ? Number(v).toFixed(decimals) : String(Math.round(v)));

    slider.addEventListener('input', (ev) => {
      const value = parseFloat(ev.target.value);
      if (!Number.isFinite(value)) return;
      onValue(value);
      valueEl.textContent = format(value);
    });

    valueEl.textContent = format(parseFloat(slider.value));
  };

  bind('rdBrushPowerSlider', 'rdBrushPowerValue', 2, (v) => {
    RD.brushPower = v;
    uniforms.simulation.brushPower.value = v;
  });

  bind('rdBrushNoiseScaleSlider', 'rdBrushNoiseScaleValue', 2, (v) => {
    RD.brushNoiseScale = v;
    uniforms.simulation.brushNoiseScale.value = v;
  });

  bind('rdBrushSpeckleSlider', 'rdBrushSpeckleValue', 2, (v) => {
    RD.brushSpeckle = Math.max(0, Math.min(0.95, v));
    uniforms.simulation.brushSpeckle.value = RD.brushSpeckle;
  });

  bind('rdBrushDeltaSlider', 'rdBrushDeltaValue', 3, (v) => {
    RD.brushDelta = Math.max(0, Math.min(0.25, v));
    uniforms.simulation.brushDelta.value = RD.brushDelta;
  });
}

function setupImagePanel() {
  const toggleBtn = document.getElementById('toggleImageControls');
  const content = document.getElementById('imageControlsContent');
  if (toggleBtn && content) {
    toggleBtn.addEventListener('click', () => {
      content.classList.toggle('collapsed');
      toggleBtn.textContent = content.classList.contains('collapsed') ? '+' : '−';
    });
  }

  const vignetteToggle = document.getElementById('imageVignetteToggle');
  const vignetteStrengthSlider = document.getElementById('imageVignetteStrengthSlider');
  const vignetteStrengthValue = document.getElementById('imageVignetteStrengthValue');
  if (vignetteToggle) {
    vignetteToggle.checked = !!RD.imageVignette;
    setVignetteEnabled(RD.imageVignette);
    vignetteToggle.addEventListener('change', () => {
      setVignetteEnabled(vignetteToggle.checked);
      setBodyBackground(images[currentImageIndex]?.filename);
      if (renderer && renderTargets.length >= 2) seedSimulationFromCurrentImage();
    });
  } else {
    setVignetteEnabled(RD.imageVignette);
  }

  if (vignetteStrengthSlider && vignetteStrengthValue) {
    vignetteStrengthSlider.value = String(RD.imageVignetteStrength);
    vignetteStrengthValue.textContent = Number(RD.imageVignetteStrength).toFixed(2);
    vignetteStrengthSlider.addEventListener('input', () => {
      RD.imageVignetteStrength = Math.max(0, Math.min(1, parseFloat(vignetteStrengthSlider.value)));
      vignetteStrengthValue.textContent = Number(RD.imageVignetteStrength).toFixed(2);
      setBodyBackground(images[currentImageIndex]?.filename);
      if (renderer && renderTargets.length >= 2) seedSimulationFromCurrentImage();
    });
  }

  const autoToggle = document.getElementById('imageAutoLevelsToggle');
  const autoStrengthSlider = document.getElementById('imageAutoLevelsStrengthSlider');
  const autoStrengthValue = document.getElementById('imageAutoLevelsStrengthValue');
  if (autoToggle) {
    autoToggle.checked = !!RD.imageAutoLevels;
    autoToggle.addEventListener('change', () => {
      RD.imageAutoLevels = !!autoToggle.checked;
      setBodyBackground(images[currentImageIndex]?.filename);
      if (renderer && renderTargets.length >= 2) {
        seedSimulationFromCurrentImage();
      }
    });
  }

  if (autoStrengthSlider && autoStrengthValue) {
    autoStrengthSlider.value = String(RD.imageAutoLevelsStrength);
    autoStrengthValue.textContent = Number(RD.imageAutoLevelsStrength).toFixed(2);
    autoStrengthSlider.addEventListener('input', () => {
      RD.imageAutoLevelsStrength = Math.max(0, Math.min(1, parseFloat(autoStrengthSlider.value)));
      autoStrengthValue.textContent = Number(RD.imageAutoLevelsStrength).toFixed(2);
      setBodyBackground(images[currentImageIndex]?.filename);
      if (renderer && renderTargets.length >= 2) seedSimulationFromCurrentImage();
    });
  }
}

function ensureTitleFontLoaded() {
  if (!document.fonts || !document.fonts.load) return Promise.resolve();
  const px = Math.max(16, Math.floor((Math.min(window.innerWidth, window.innerHeight) * TITLE.sizePercent) / 100));
  return document.fonts.load(`${px}px ${TITLE_FONT_FAMILY}`, TITLE.text).catch(() => undefined);
}

function drawTitleOverlay(ctx, width, height) {
  if (!TITLE.enabled) return;

  const fontPx = (Math.min(width, height) * TITLE.sizePercent) / 100;
  const centerX = width / 2;
  const centerY = getTitleCenterY(width, height, fontPx);

  ctx.save();
  ctx.font = `${Math.round(fontPx)}px ${TITLE_FONT_FAMILY}, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (TITLE.shadowEnabled) {
    ctx.shadowColor = TITLE.shadowColor;
    ctx.shadowBlur = TITLE.shadowBlur;
    ctx.shadowOffsetX = TITLE.shadowOffsetX;
    ctx.shadowOffsetY = TITLE.shadowOffsetY;
  } else {
    ctx.shadowColor = 'rgba(0,0,0,0)';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  ctx.fillStyle = TITLE.fillColor;
  ctx.fillText(TITLE.text, centerX, centerY);

  if (TITLE.strokeWidth > 0) {
    ctx.strokeStyle = TITLE.strokeColor;
    ctx.lineWidth = TITLE.strokeWidth;
    ctx.strokeText(TITLE.text, centerX, centerY);
  }

  ctx.restore();
}

function drawCoverImageToSeed(imageEl, width, height) {
  seedCtx.clearRect(0, 0, width, height);

  const imgW = imageEl.naturalWidth || imageEl.width;
  const imgH = imageEl.naturalHeight || imageEl.height;
  if (!imgW || !imgH) return;

  const scale = Math.max(width / imgW, height / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  const dx = (width - drawW) / 2;
  const dy = (height - drawH) / 2;

  seedCtx.save();
  seedCtx.filter = RD.invertImage ? 'grayscale(1) invert(1)' : 'grayscale(1)';
  seedCtx.drawImage(imageEl, dx, dy, drawW, drawH);
  seedCtx.restore();

  if (RD.imageAutoLevels) {
    applyAutoLevelsToCanvas(seedCtx, width, height, RD.imageAutoLevelsStrength);
  }

  if (RD.imageVignette) {
    applyVignetteToCanvas(seedCtx, width, height, RD.imageVignetteStrength);
  }
}

function ensureTitleMaskCanvas(width, height) {
  if (!titleMaskCanvas) {
    titleMaskCanvas = document.createElement('canvas');
    titleMaskCtx = titleMaskCanvas.getContext('2d', { willReadFrequently: true });
  }
  titleMaskCanvas.width = width;
  titleMaskCanvas.height = height;
  titleMaskCtx.clearRect(0, 0, width, height);
}

function updateTitleMaskTexture(width, height) {
  ensureTitleMaskCanvas(width, height);
  const ctx = titleMaskCtx;
  ctx.clearRect(0, 0, width, height);

  if (TITLE.enabled) {
    const fontPx = (Math.min(width, height) * TITLE.sizePercent) / 100;
    const centerX = width / 2;
    const centerY = getTitleCenterY(width, height, fontPx);

    ctx.save();
    ctx.font = `${Math.round(fontPx)}px ${TITLE_FONT_FAMILY}, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw opaque mask where the title is.
    ctx.fillStyle = '#ffffff';
    ctx.fillText(TITLE.text, centerX, centerY);
    if (TITLE.strokeWidth > 0) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = TITLE.strokeWidth;
      ctx.strokeText(TITLE.text, centerX, centerY);
    }
    ctx.restore();
  }

  const img = ctx.getImageData(0, 0, width, height).data;
  const data = new Uint8Array(width * height * 4);
  for (let i = 0, j = 0; i < img.length; i += 4, j += 4) {
    const a = img[i + 3];
    data[j] = 0;
    data[j + 1] = 0;
    data[j + 2] = 0;
    data[j + 3] = a;
  }

  if (!titleMaskTexture) {
    titleMaskTexture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.UnsignedByteType);
    titleMaskTexture.flipY = true;
    titleMaskTexture.minFilter = THREE.NearestFilter;
    titleMaskTexture.magFilter = THREE.NearestFilter;
    titleMaskTexture.wrapS = THREE.ClampToEdgeWrapping;
    titleMaskTexture.wrapT = THREE.ClampToEdgeWrapping;
    uniforms.simulation.titleMaskTexture.value = titleMaskTexture;
    uniforms.display.titleMaskTexture.value = titleMaskTexture;
  } else {
    titleMaskTexture.image.data = data;
    titleMaskTexture.image.width = width;
    titleMaskTexture.image.height = height;
  }
  titleMaskTexture.needsUpdate = true;
}

function getTitleMaskPixels(width, height) {
  if (!TITLE.enabled) return null;
  ensureTitleMaskCanvas(width, height);

  const ctx = titleMaskCtx;
  const fontPx = (Math.min(width, height) * TITLE.sizePercent) / 100;
  const centerX = width / 2;
  const centerY = getTitleCenterY(width, height, fontPx);

  ctx.save();
  ctx.font = `${Math.round(fontPx)}px ${TITLE_FONT_FAMILY}, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#000000';
  ctx.fillText(TITLE.text, centerX, centerY);

  if (TITLE.strokeWidth > 0) {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = TITLE.strokeWidth;
    ctx.strokeText(TITLE.text, centerX, centerY);
  }

  ctx.restore();
  return titleMaskCtx.getImageData(0, 0, width, height).data;
}

function seedCanvasToDataTexture(width, height, titleMaskPixels) {
  const pixels = seedCtx.getImageData(0, 0, width, height).data;
  const data = new Uint8Array(pixels.length);

  const vignetteEnabled = !!RD.imageVignette;
  const vignetteStrength = Math.max(0, Math.min(1, RD.imageVignetteStrength ?? 0));
  const vignetteInner = 0.55;
  const vignettePower = 4.0;
  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    let bChem = Math.max(0, Math.min(255, Math.round((1 - lum) * 255)));

    // Ensure vignette produces DARKER edges in the RD output (not inverted).
    // We do this by reducing the initial chemical B near edges.
    if (vignetteEnabled && vignetteStrength > 0 && cx > 0 && cy > 0) {
      const pIndex = i / 4;
      const x = pIndex % width;
      const y = (pIndex - x) / width;

      const dx = Math.abs((x - cx) / cx);
      const dy = Math.abs((y - cy) / cy);
      const t = Math.pow(Math.pow(dx, vignettePower) + Math.pow(dy, vignettePower), 1 / vignettePower);
      const tt = Math.max(0, Math.min(1, t));
      const u = Math.max(0, Math.min(1, (tt - vignetteInner) / (1 - vignetteInner)));
      const smooth = u * u * (3 - 2 * u);
      const mul = 1 - vignetteStrength * smooth;
      bChem = Math.max(0, Math.min(255, Math.round(bChem * mul)));
    }

    if (titleMaskPixels) {
      const mr = titleMaskPixels[i];
      const mg = titleMaskPixels[i + 1];
      const mb = titleMaskPixels[i + 2];
      const mLum = (0.299 * mr + 0.587 * mg + 0.114 * mb) / 255;
      const maskB = Math.max(0, Math.min(255, Math.round((1 - mLum) * 255)));
      bChem = Math.max(bChem, maskB);
    }

    data[i] = 255;
    data[i + 1] = bChem;
    data[i + 2] = 0;
    data[i + 3] = 255;
  }

  const tex = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.needsUpdate = true;
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function warmStartSimulation(iterations) {
  if (!renderer || !materials.simulation || renderTargets.length < 2) return;
  const iters = Math.max(0, Math.floor(iterations || 0));
  if (iters === 0) return;

  mesh.material = materials.simulation;
  for (let i = 0; i < iters; i++) {
    const nextIndex = (currentRT + 1) % 2;
    uniforms.simulation.previousIterationTexture.value = renderTargets[currentRT].texture;

    renderer.setRenderTarget(renderTargets[nextIndex]);
    renderer.render(scene, camera);
    currentRT = nextIndex;
  }
  renderer.setRenderTarget(null);
}

async function warmStartSimulationAsync(iterations, token) {
  if (!renderer || !materials.simulation || renderTargets.length < 2) return;
  const iters = Math.max(0, Math.floor(iterations || 0));
  if (iters === 0) return;

  isWarmStarting = true;

  const chunkSize = 24;
  let remaining = iters;

  while (remaining > 0) {
    if (token !== warmStartToken) break;
    const run = Math.min(chunkSize, remaining);

    mesh.material = materials.simulation;
    for (let i = 0; i < run; i++) {
      const nextIndex = (currentRT + 1) % 2;
      uniforms.simulation.previousIterationTexture.value = renderTargets[currentRT].texture;

      renderer.setRenderTarget(renderTargets[nextIndex]);
      renderer.render(scene, camera);
      currentRT = nextIndex;
    }
    renderer.setRenderTarget(null);

    remaining -= run;
    // Yield so the browser can paint UI and the first effect appears sooner.
    await new Promise(requestAnimationFrame);
  }

  isWarmStarting = false;
}

function createImageRecord(filename) {
  return { filename, img: null, loaded: false, loading: false };
}

function loadImageAtIndex(index) {
  const rec = images[index];
  if (!rec) return Promise.resolve(null);
  if (rec.loaded && rec.img) return Promise.resolve(rec);
  if (rec.loading) {
    return new Promise((resolve, reject) => {
      const poll = () => {
        if (rec.loaded && rec.img) resolve(rec);
        else if (!rec.loading && !rec.loaded) reject(new Error('Image failed to load'));
        else requestAnimationFrame(poll);
      };
      poll();
    });
  }

  rec.loading = true;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      rec.img = img;
      rec.loaded = true;
      rec.loading = false;
      resolve(rec);
    };
    img.onerror = (e) => {
      rec.loading = false;
      rec.loaded = false;
      reject(e);
    };
    img.src = new URL(`../../_img/${rec.filename}`, import.meta.url).href;
  });
}

function startBackgroundImageLoading() {
  // Load the rest lazily so first paint is fast.
  (async () => {
    for (let i = 0; i < images.length; i++) {
      if (i === currentImageIndex) continue;
      if (images[i]?.loaded) continue;
      try {
        // eslint-disable-next-line no-await-in-loop
        await loadImageAtIndex(i);
      } catch {
        // ignore individual image failures
      }
    }
  })();
}

function seedSimulationFromCurrentImage() {
  if (!images.length || !renderer || renderTargets.length < 2) return;

  const width = simWidth || window.innerWidth;
  const height = simHeight || window.innerHeight;

  uniforms.simulation.resolution.value.set(width, height);

  if (!seedCanvas) {
    seedCanvas = document.createElement('canvas');
    seedCtx = seedCanvas.getContext('2d', { willReadFrequently: true });
  }
  seedCanvas.width = width;
  seedCanvas.height = height;

  const img = images[currentImageIndex]?.img;
  if (img) {
    drawCoverImageToSeed(img, width, height);
  } else {
    // Title-first: start with a neutral background so the title effect can appear immediately.
    seedCtx.save();
    seedCtx.fillStyle = '#000000';
    seedCtx.fillRect(0, 0, width, height);
    seedCtx.restore();
  }
  drawTitleOverlay(seedCtx, width, height);

  // Keep the title visually "on top" by preventing brush influence within the title mask.
  updateTitleMaskTexture(width, height);

  // Startup behavior: if the very first seed happens before any image is ready,
  // show only the title region. During later image transitions we should NEVER
  // re-enter title-only mode (that looks like the title is "reloading").
  const hasImage = !!images[currentImageIndex]?.img;
  uniforms.display.titleOnly.value = (!hasSeededOnce && !hasImage) ? 1 : 0;

  if (!uniforms.simulation.sourceTexture.value) {
    const srcTex = new THREE.CanvasTexture(seedCanvas);
    srcTex.flipY = true;
    srcTex.minFilter = THREE.LinearFilter;
    srcTex.magFilter = THREE.LinearFilter;
    srcTex.wrapS = THREE.ClampToEdgeWrapping;
    srcTex.wrapT = THREE.ClampToEdgeWrapping;
    uniforms.simulation.sourceTexture.value = srcTex;
  } else {
    uniforms.simulation.sourceTexture.value.flipY = true;
    uniforms.simulation.sourceTexture.value.needsUpdate = true;
  }

  const titleMaskPixels = getTitleMaskPixels(width, height);
  const seedTexture = seedCanvasToDataTexture(width, height, titleMaskPixels);
  seedTexture.flipY = true;
  seedTexture.needsUpdate = true;

  // Keep the title effect continuous across reseeds by preserving the previous sim state
  // within the title mask region.
  const canPreserveTitle = TITLE.enabled && hasSeededOnce && renderTargets[currentRT]?.texture && titleMaskTexture;
  if (canPreserveTitle) {
    mesh.material = materials.seedBlend;
    uniforms.seedBlend.newSeedTexture.value = seedTexture;
    uniforms.seedBlend.oldSimTexture.value = renderTargets[currentRT].texture;
    uniforms.seedBlend.titleMaskTexture.value = titleMaskTexture;
  } else {
    mesh.material = materials.passthrough;
    uniforms.passthrough.textureToDisplay.value = seedTexture;
  }

  renderer.setRenderTarget(renderTargets[0]);
  renderer.render(scene, camera);
  renderer.setRenderTarget(renderTargets[1]);
  renderer.render(scene, camera);

  renderer.setRenderTarget(null);
  currentRT = 0;

  hasSeededOnce = true;

  warmStartToken += 1;
  void warmStartSimulationAsync(RD.warmStartIterations, warmStartToken);
}

function setupThree(canvas) {
  try {
    renderer = new THREE.WebGLRenderer({ canvas, preserveDrawingBuffer: true, alpha: true });
  } catch (err) {
    // Surface a clear error for environments where WebGL is unavailable (e.g., some webviews).
    throw new Error(`WebGL initialization failed: ${err && err.message ? err.message : String(err)}`);
  }
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x000000, 0);

  const isWebGL2 = !!renderer.capabilities?.isWebGL2;
  if (isWebGL2) {
    const hasFloatRT = renderer.extensions?.has?.('EXT_color_buffer_float');
    renderTargetType = hasFloatRT ? THREE.HalfFloatType : THREE.UnsignedByteType;
  }

  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  materials.simulation = new THREE.ShaderMaterial({
    uniforms: uniforms.simulation,
    vertexShader: simulationVert,
    fragmentShader: simulationFrag,
    blending: THREE.NoBlending,
  });

  materials.display = new THREE.ShaderMaterial({
    uniforms: uniforms.display,
    vertexShader: displayVert,
    fragmentShader: displayFrag,
    transparent: true,
    blending: THREE.NormalBlending,
  });

  materials.passthrough = new THREE.ShaderMaterial({
    uniforms: uniforms.passthrough,
    vertexShader: passthroughVert,
    fragmentShader: passthroughFrag,
    blending: THREE.NoBlending,
  });

  materials.seedBlend = new THREE.ShaderMaterial({
    uniforms: uniforms.seedBlend,
    vertexShader: passthroughVert,
    fragmentShader: seedBlendFrag,
    blending: THREE.NoBlending,
  });

  materials.probe = new THREE.ShaderMaterial({
    uniforms: uniforms.probe,
    vertexShader: passthroughVert,
    fragmentShader: `
varying vec2 v_uv;
uniform sampler2D textureToSample;

void main() {
  vec4 s = texture2D(textureToSample, v_uv);
  float b = s.g;
  gl_FragColor = vec4(b, b, b, 1.0);
}
`,
    blending: THREE.NoBlending,
  });

  const geometry = new THREE.PlaneGeometry(2, 2);
  mesh = new THREE.Mesh(geometry, materials.display);
  mesh.frustumCulled = false;
  scene.add(mesh);

  // Small probe target used for collapse detection (readback is reliable even when sim RT is float).
  if (collapseProbeRT) collapseProbeRT.dispose();
  collapseProbeRT = new THREE.WebGLRenderTarget(8, 8, {
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    depthBuffer: false,
    stencilBuffer: false,
  });

  const handleResize = async () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    resizeBackgroundCanvas();
    if (images?.length) {
      setBodyBackground(images[currentImageIndex]?.filename);
    }

    renderer.setSize(width, height);
    simWidth = Math.max(2, Math.round(width * RD.simScale));
    simHeight = Math.max(2, Math.round(height * RD.simScale));
    uniforms.simulation.resolution.value.set(simWidth, simHeight);
    if (uniforms.display && uniforms.display.resolution) {
      uniforms.display.resolution.value.set(simWidth, simHeight);
    }

    renderTargets.forEach((rt) => rt.dispose());
    renderTargets = [
      new THREE.WebGLRenderTarget(simWidth, simHeight, {
        format: THREE.RGBAFormat,
        type: renderTargetType,
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        depthBuffer: false,
        stencilBuffer: false,
      }),
      new THREE.WebGLRenderTarget(simWidth, simHeight, {
        format: THREE.RGBAFormat,
        type: renderTargetType,
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        depthBuffer: false,
        stencilBuffer: false,
      }),
    ];

    await ensureTitleFontLoaded();
    seedSimulationFromCurrentImage();
  };

  window.addEventListener('resize', handleResize);
  handleResize();

  const shouldIgnorePointer = (targetEl) => {
    if (!targetEl || !targetEl.closest) return false;
    return !!targetEl.closest('.panel-stack, .controls, .ui-toggle');
  };

  const handlePointerMove = (e) => {
    if (!e.isPrimary) return;

    if (shouldIgnorePointer(e.target)) {
      pointerActiveOnCanvas = false;
      uniforms.simulation.mousePosition.value.set(-1, -1);
      if (uniforms.display && uniforms.display.mousePosition) {
        uniforms.display.mousePosition.value.set(-1, -1);
      }
      return;
    }

    const x = e.clientX / window.innerWidth;
    const y = 1.0 - (e.clientY / window.innerHeight);

    pointerActiveOnCanvas = true;
    lastPointerMoveMs = performance.now();

    // Movement deadzone to prevent stationary flicker from tiny pointer jitter.
    const dx = lastMouseX < 0 ? 1 : (x - lastMouseX);
    const dy = lastMouseY < 0 ? 1 : (y - lastMouseY);
    const distSq = dx * dx + dy * dy;
    const moved = distSq > 0.0000008; // tuned for normalized [0..1] coords

    lastMouseX = x;
    lastMouseY = y;

    uniforms.simulation.mousePosition.value.set(x, y);
    if (uniforms.display && uniforms.display.mousePosition) {
      uniforms.display.mousePosition.value.set(x, y);
    }

    // Apply brush only on real movement frames (no idle blink).
    mouseMovedThisFrame = moved;
  };

  const handlePointerLeave = () => {
    pointerActiveOnCanvas = false;
    uniforms.simulation.mousePosition.value.set(-1, -1);
    if (uniforms.display && uniforms.display.mousePosition) {
      uniforms.display.mousePosition.value.set(-1, -1);
    }
    mouseMovedThisFrame = false;
  };

  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerleave', handlePointerLeave);

  let raf = 0;
  const animate = (time) => {
    frameCounter++;

    // During warm start, let the async seeding advance the sim; only render the current RT.
    if (isWarmStarting) {
      uniforms.display.textureToDisplay.value = renderTargets[currentRT]?.texture ?? null;
      uniforms.display.previousIterationTexture.value = renderTargets[(currentRT + 1) % 2]?.texture ?? null;
      uniforms.display.time.value = time * 0.001;
      mesh.material = materials.display;
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
      return;
    }

    // If showing original, pause simulation/rendering (overlay handles visuals).
    if (RD.showOriginal) {
      uniforms.simulation.brushStrength.value = 0.0;
      raf = requestAnimationFrame(animate);
      return;
    }

    // Prevent "wiping" and flicker: apply brush only on real pointer movement frames.
    void time;
    const applyBrushThisFrame = pointerActiveOnCanvas && mouseMovedThisFrame;

    if (!pointerActiveOnCanvas || !applyBrushThisFrame) {
      uniforms.simulation.mousePosition.value.set(-1, -1);
      if (uniforms.display && uniforms.display.mousePosition) {
        uniforms.display.mousePosition.value.set(-1, -1);
      }
      uniforms.simulation.brushStrength.value = 0.0;
    } else {
      uniforms.simulation.mousePosition.value.set(lastMouseX, lastMouseY);
      if (uniforms.display && uniforms.display.mousePosition) {
        uniforms.display.mousePosition.value.set(lastMouseX, lastMouseY);
      }
      uniforms.simulation.brushStrength.value = 1.0;
    }

    mesh.material = materials.simulation;
    for (let i = 0; i < RD.stepsPerFrame; i++) {
      if (applyBrushThisFrame && i === 1) {
        uniforms.simulation.mousePosition.value.set(-1, -1);
        if (uniforms.display && uniforms.display.mousePosition) {
          uniforms.display.mousePosition.value.set(-1, -1);
        }
      }

      const nextIndex = (currentRT + 1) % 2;
      uniforms.simulation.previousIterationTexture.value = renderTargets[currentRT].texture;

      renderer.setRenderTarget(renderTargets[nextIndex]);
      renderer.render(scene, camera);
      currentRT = nextIndex;
    }

    uniforms.display.textureToDisplay.value = renderTargets[currentRT].texture;
    uniforms.display.previousIterationTexture.value = renderTargets[(currentRT + 1) % 2].texture;
    uniforms.display.time.value = time * 0.001;
    mesh.material = materials.display;

    renderer.setRenderTarget(null);
    renderer.render(scene, camera);

    // Safety guard: detect near-uniform sim state (white/black/gray screen) and auto-recover.
    // Runs infrequently to reduce readback stalls.
    if (
      collapseProbeRT &&
      materials.probe &&
      !isWarmStarting &&
      !RD.showOriginal &&
      frameCounter % 45 === 0
    ) {
      const w = 8;
      const h = 8;
      const pixels = new Uint8Array(w * h * 4);
      let previousMaterial;
      try {
        previousMaterial = mesh.material;
        mesh.material = materials.probe;
        uniforms.probe.textureToSample.value = renderTargets[currentRT]?.texture ?? null;

        renderer.setRenderTarget(collapseProbeRT);
        renderer.render(scene, camera);
        renderer.readRenderTargetPixels(collapseProbeRT, 0, 0, w, h, pixels);
      } catch {
        // If readback is not supported in this environment, silently skip the guard.
      } finally {
        renderer.setRenderTarget(null);
        if (previousMaterial) mesh.material = previousMaterial;
      }

      // Compute variance of the probed B channel.
      let sum = 0;
      let sumSq = 0;
      const n = w * h;
      for (let i = 0; i < n; i++) {
        const v = pixels[i * 4] / 255;
        sum += v;
        sumSq += v * v;
      }
      const mean = sum / n;
      const variance = sumSq / n - mean * mean;

      // Consider it “collapsed” when the sim becomes almost flat.
      const nearFlat = variance < 0.00002;
      const nearWhite = mean > 0.985;
      const nearBlack = mean < 0.015;
      const nearGray = mean > 0.45 && mean < 0.55;

      if (nearFlat && (nearWhite || nearBlack || nearGray)) {
        animate._collapseHits = (animate._collapseHits ?? 0) + 1;
      } else {
        animate._collapseHits = 0;
      }

      // Require multiple consecutive detections to avoid false positives.
      if ((animate._collapseHits ?? 0) >= 3) {
        animate._collapseHits = 0;

        // Auto-recovery: reduce the most common culprits and reseed.
        RD.sourceStrength = Math.min(RD.sourceStrength, 0.01);
        RD.timestep = Math.min(RD.timestep, 1.0);
        RD.stepsPerFrame = Math.min(RD.stepsPerFrame, 4);
        uniforms.simulation.sourceStrength.value = RD.sourceStrength;
        uniforms.simulation.timestep.value = RD.timestep;

        seedSimulationFromCurrentImage();
      }
    }

    mouseMovedThisFrame = false;

    raf = requestAnimationFrame(animate);
  };

  raf = requestAnimationFrame(animate);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerleave', handlePointerLeave);
    renderer.dispose();
    geometry.dispose();
    if (collapseProbeRT) {
      collapseProbeRT.dispose();
      collapseProbeRT = null;
    }
    if (materials.probe) {
      materials.probe.dispose();
      materials.probe = null;
    }
  };
}

async function loadImages() {
  // Keep a stable list; load lazily for faster first paint.
  images = IMAGES.map((filename) => createImageRecord(filename));
  await loadImageAtIndex(currentImageIndex);
  startBackgroundImageLoading();
  return images;
}

function setupEffectsPanel() {
  // Prime UI inputs from saved defaults BEFORE binding, otherwise bindSlider()
  // will overwrite RD/COLORS with the hardcoded HTML defaults.
  const prime = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.value = String(value);
  };
  prime('rdFSlider', RD.f);
  prime('rdKSlider', RD.k);
  prime('rdDASlider', RD.dA);
  prime('rdDBSlider', RD.dB);
  prime('rdTimestepSlider', RD.timestep);
  prime('rdStepsSlider', RD.stepsPerFrame);
  prime('rdBrushRadiusSlider', RD.brushRadius);
  prime('rdBrushFeatherSlider', RD.brushFeather);
  prime('rdStyleSlider', RD.renderingStyle);
  prime('rdBiasXSlider', RD.biasX);
  prime('rdBiasYSlider', RD.biasY);
  prime('rdWarmStartSlider', RD.warmStartIterations);
  prime('rdSourceStrengthSlider', RD.sourceStrength);
  prime('rdSourceStrengthNumber', RD.sourceStrength);
  prime('rdSimScaleSlider', RD.simScale);

  const toggleBtn = document.getElementById('toggleControls');
  const controlsContent = document.getElementById('controlsContent');
  if (toggleBtn && controlsContent) {
    toggleBtn.addEventListener('click', () => {
      controlsContent.classList.toggle('collapsed');
      toggleBtn.textContent = controlsContent.classList.contains('collapsed') ? '+' : '−';
    });
  }

  const toggleTitleBtn = document.getElementById('toggleTitleControls');
  const titleControlsContent = document.getElementById('titleControlsContent');
  if (toggleTitleBtn && titleControlsContent) {
    toggleTitleBtn.addEventListener('click', () => {
      titleControlsContent.classList.toggle('collapsed');
      toggleTitleBtn.textContent = titleControlsContent.classList.contains('collapsed') ? '+' : '−';
    });
  }

  const presetSelect = document.getElementById('rdPresetSelect');
  if (presetSelect) {
    PRESETS.forEach((p, idx) => {
      const opt = document.createElement('option');
      opt.value = String(idx);
      opt.textContent = p.name;
      presetSelect.appendChild(opt);
    });

    presetSelect.addEventListener('change', (e) => {
      const idx = parseInt(e.target.value, 10);
      const preset = PRESETS[idx];
      if (!preset) return;

      RD.f = preset.f;
      RD.k = preset.k;
      uniforms.simulation.f.value = RD.f;
      uniforms.simulation.k.value = RD.k;

      setSlider('rdFSlider', 'rdFValue', RD.f, 4);
      setSlider('rdKSlider', 'rdKValue', RD.k, 4);
    });
  }

  function bindSlider(id, valueId, decimals, onValue) {
    const slider = document.getElementById(id);
    const valueEl = document.getElementById(valueId);
    if (!slider || !valueEl) return;

    const format = (v) => (decimals > 0 ? v.toFixed(decimals) : String(Math.round(v)));

    slider.addEventListener('input', (ev) => {
      const value = parseFloat(ev.target.value);
      valueEl.textContent = format(value);
      onValue(value);
    });

    valueEl.textContent = format(parseFloat(slider.value));
  }

  function setSlider(id, valueId, value, decimals) {
    const slider = document.getElementById(id);
    const valueEl = document.getElementById(valueId);
    if (!slider || !valueEl) return;
    slider.value = String(value);
    valueEl.textContent = decimals > 0 ? Number(value).toFixed(decimals) : String(Math.round(value));
  }

  function bindSliderWithNumber(id, numberId, valueId, decimals, onValue) {
    const slider = document.getElementById(id);
    const numberEl = document.getElementById(numberId);
    const valueEl = document.getElementById(valueId);
    if (!slider || !valueEl || !numberEl) {
      bindSlider(id, valueId, decimals, (v) => {
        const effective = onValue(v);
        return effective;
      });
      return;
    }

    const format = (v) => (decimals > 0 ? Number(v).toFixed(decimals) : String(Math.round(v)));

    const sync = (v) => {
      const formatted = format(v);
      slider.value = String(v);
      numberEl.value = formatted;
      valueEl.textContent = formatted;
    };

    const apply = (raw) => {
      const value = parseFloat(raw);
      if (!Number.isFinite(value)) return;
      const effective = onValue(value);
      sync(typeof effective === 'number' ? effective : value);
    };

    slider.addEventListener('input', (ev) => apply(ev.target.value));
    slider.addEventListener('change', (ev) => apply(ev.target.value));
    numberEl.addEventListener('input', (ev) => apply(ev.target.value));
    numberEl.addEventListener('change', (ev) => apply(ev.target.value));

    sync(parseFloat(slider.value));
  }

  function setSliderWithNumber(id, numberId, valueId, value, decimals) {
    setSlider(id, valueId, value, decimals);
    const numberEl = document.getElementById(numberId);
    if (numberEl) numberEl.value = decimals > 0 ? Number(value).toFixed(decimals) : String(Math.round(value));
  }

  bindSlider('rdFSlider', 'rdFValue', 4, (v) => {
    RD.f = v;
    uniforms.simulation.f.value = v;
  });

  bindSlider('rdKSlider', 'rdKValue', 4, (v) => {
    RD.k = v;
    uniforms.simulation.k.value = v;
  });

  bindSlider('rdDASlider', 'rdDAValue', 4, (v) => {
    RD.dA = v;
    uniforms.simulation.dA.value = v;
  });

  bindSlider('rdDBSlider', 'rdDBValue', 4, (v) => {
    RD.dB = v;
    uniforms.simulation.dB.value = v;
  });

  bindSlider('rdTimestepSlider', 'rdTimestepValue', 2, (v) => {
    RD.timestep = v;
    uniforms.simulation.timestep.value = v;
  });

  bindSlider('rdStepsSlider', 'rdStepsValue', 0, (v) => {
    RD.stepsPerFrame = Math.max(1, Math.round(v));
  });

  bindSlider('rdBiasXSlider', 'rdBiasXValue', 3, (v) => {
    RD.biasX = v;
    uniforms.simulation.bias.value.set(RD.biasX, RD.biasY);
  });

  bindSlider('rdBiasYSlider', 'rdBiasYValue', 3, (v) => {
    RD.biasY = v;
    uniforms.simulation.bias.value.set(RD.biasX, RD.biasY);
  });

  bindSlider('rdWarmStartSlider', 'rdWarmStartValue', 0, (v) => {
    RD.warmStartIterations = Math.max(0, Math.round(v));
  });

  bindSliderWithNumber('rdSourceStrengthSlider', 'rdSourceStrengthNumber', 'rdSourceStrengthValue', 3, (v) => {
    RD.sourceStrength = Math.max(0, Math.min(0.5, v));
    uniforms.simulation.sourceStrength.value = RD.sourceStrength;
    return RD.sourceStrength;
  });

  bindSlider('rdSimScaleSlider', 'rdSimScaleValue', 2, (v) => {
    RD.simScale = Math.max(0.25, Math.min(1, v));
    window.dispatchEvent(new Event('resize'));
  });

  bindSlider('rdBrushRadiusSlider', 'rdBrushRadiusValue', 0, (v) => {
    RD.brushRadius = v;
    uniforms.simulation.brushRadius.value = v;
    if (uniforms.display && uniforms.display.brushRadius) {
      uniforms.display.brushRadius.value = v;
    }
  });

  bindSlider('rdBrushFeatherSlider', 'rdBrushFeatherValue', 2, (v) => {
    RD.brushFeather = Math.max(0.0, Math.min(1.0, v));
    uniforms.simulation.brushFeather.value = RD.brushFeather;
  });

  bindSlider('rdStyleSlider', 'rdStyleValue', 0, (v) => {
    RD.renderingStyle = Math.round(v);
    uniforms.display.renderingStyle.value = RD.renderingStyle;
    updateRenderingControlsVisibility();
    updateStyleName();
  });

  const styleNameEl = document.getElementById('rdStyleName');
  const hslControls = document.getElementById('rdHslControls');
  const gradientControls = document.getElementById('rdGradientControls');
  const thresholdControls = document.getElementById('rdThresholdControls');

  const STYLE_NAMES = {
    0: 'HSL Mapping',
    1: 'Gradient',
    2: 'Purple/Yellow',
    3: 'Turquoise/Fire',
    4: 'Radioactive',
    5: 'Rainbow',
    6: 'Black & White Soft',
    7: 'Duo Tone Sharp',
    8: 'Red/Green Raw',
  };

  function updateStyleName() {
    if (!styleNameEl) return;
    styleNameEl.textContent = STYLE_NAMES[RD.renderingStyle] ?? String(RD.renderingStyle);
  }

  function updateRenderingControlsVisibility() {
    if (hslControls) {
      hslControls.classList.toggle('is-hidden', RD.renderingStyle !== 0);
    }
    if (gradientControls) {
      gradientControls.classList.toggle('is-hidden', RD.renderingStyle !== 1);
    }
    if (thresholdControls) {
      thresholdControls.classList.toggle('is-hidden', RD.renderingStyle !== 7);
    }
  }

  function hexToRgb01(hex) {
    const h = String(hex || '').replace('#', '').trim();
    if (h.length !== 6) return { r: 0, g: 0, b: 0 };
    const n = parseInt(h, 16);
    return {
      r: ((n >> 16) & 255) / 255,
      g: ((n >> 8) & 255) / 255,
      b: (n & 255) / 255,
    };
  }

  function setColorStopUniform(which, hex, stop) {
    const rgb = hexToRgb01(hex);
    const v = uniforms.display[which]?.value;
    if (!v) return;
    v.set(rgb.r, rgb.g, rgb.b, stop);
  }

  // Gradient controls (style 1)
  const grad = {
    c1: document.getElementById('rdColor1'), s1: document.getElementById('rdStop1Slider'), v1: document.getElementById('rdStop1Value'),
    c2: document.getElementById('rdColor2'), s2: document.getElementById('rdStop2Slider'), v2: document.getElementById('rdStop2Value'),
    c3: document.getElementById('rdColor3'), s3: document.getElementById('rdStop3Slider'), v3: document.getElementById('rdStop3Value'),
    c4: document.getElementById('rdColor4'), s4: document.getElementById('rdStop4Slider'), v4: document.getElementById('rdStop4Value'),
    c5: document.getElementById('rdColor5'), s5: document.getElementById('rdStop5Slider'), v5: document.getElementById('rdStop5Value'),
  };

  function bindStop(colorEl, stopEl, valueEl, which, defaultHex, defaultStop) {
    if (colorEl) colorEl.value = defaultHex;
    if (stopEl) stopEl.value = String(defaultStop);
    if (valueEl) valueEl.textContent = Number(defaultStop).toFixed(2);

    setColorStopUniform(which, colorEl?.value ?? defaultHex, parseFloat(stopEl?.value ?? defaultStop));

    if (colorEl) {
      colorEl.addEventListener('input', () => {
        const s = parseFloat(stopEl?.value ?? defaultStop);
        setColorStopUniform(which, colorEl.value, s);
      });
    }

    if (stopEl) {
      stopEl.addEventListener('input', () => {
        const s = parseFloat(stopEl.value);
        if (valueEl) valueEl.textContent = Number(s).toFixed(2);
        setColorStopUniform(which, colorEl?.value ?? defaultHex, s);
      });
    }
  }

  bindStop(grad.c1, grad.s1, grad.v1, 'colorStop1', COLORS.color1, COLORS.stop1);
  bindStop(grad.c2, grad.s2, grad.v2, 'colorStop2', COLORS.color2, COLORS.stop2);
  bindStop(grad.c3, grad.s3, grad.v3, 'colorStop3', COLORS.color3, COLORS.stop3);
  bindStop(grad.c4, grad.s4, grad.v4, 'colorStop4', COLORS.color4, COLORS.stop4);
  bindStop(grad.c5, grad.s5, grad.v5, 'colorStop5', COLORS.color5, COLORS.stop5);

  // HSL controls (style 0)
  bindSlider('rdHslFromMinSlider', 'rdHslFromMinValue', 2, (v) => {
    uniforms.display.hslFrom.value.set(v, uniforms.display.hslFrom.value.y);
  });
  bindSlider('rdHslFromMaxSlider', 'rdHslFromMaxValue', 2, (v) => {
    uniforms.display.hslFrom.value.set(uniforms.display.hslFrom.value.x, v);
  });
  bindSlider('rdHslToMinSlider', 'rdHslToMinValue', 2, (v) => {
    uniforms.display.hslTo.value.set(v, uniforms.display.hslTo.value.y);
  });
  bindSlider('rdHslToMaxSlider', 'rdHslToMaxValue', 2, (v) => {
    uniforms.display.hslTo.value.set(uniforms.display.hslTo.value.x, v);
  });
  bindSlider('rdHslSatSlider', 'rdHslSatValue', 2, (v) => {
    uniforms.display.hslSaturation.value = v;
  });
  bindSlider('rdHslLumSlider', 'rdHslLumValue', 2, (v) => {
    uniforms.display.hslLuminosity.value = v;
  });

  // Initialize conditional visibility + label
  updateRenderingControlsVisibility();
  updateStyleName();

  // Threshold slider (for B/W Sharp)
  bindSlider('rdThresholdSlider', 'rdThresholdValue', 2, (v) => {
    uniforms.display.bwThreshold.value = Math.max(0.0, Math.min(1.0, v));
  });

  // Duo tone colors (style 7)
  const duoToneBlackInput = document.getElementById('rdDuoToneBlack');
  const duoToneWhiteInput = document.getElementById('rdDuoToneWhite');
  const duoToneBlackValue = document.getElementById('rdDuoToneBlackValue');
  const duoToneWhiteValue = document.getElementById('rdDuoToneWhiteValue');

  function setDuoToneColor(which, hex) {
    if (which === 'black') {
      COLORS.duoToneBlack = hex;
      if (uniforms.display.duoToneBlack?.value) uniforms.display.duoToneBlack.value.set(hex);
      if (duoToneBlackValue) duoToneBlackValue.textContent = hex;
    }
    if (which === 'white') {
      COLORS.duoToneWhite = hex;
      if (uniforms.display.duoToneWhite?.value) uniforms.display.duoToneWhite.value.set(hex);
      if (duoToneWhiteValue) duoToneWhiteValue.textContent = hex;
    }
  }

  if (duoToneBlackInput) {
    duoToneBlackInput.value = COLORS.duoToneBlack;
    setDuoToneColor('black', duoToneBlackInput.value);
    duoToneBlackInput.addEventListener('input', () => setDuoToneColor('black', duoToneBlackInput.value));
  }
  if (duoToneWhiteInput) {
    duoToneWhiteInput.value = COLORS.duoToneWhite;
    setDuoToneColor('white', duoToneWhiteInput.value);
    duoToneWhiteInput.addEventListener('input', () => setDuoToneColor('white', duoToneWhiteInput.value));
  }

  // Invert duo-tone colors button
  const invertDuoToneBtn = document.getElementById('invertDuoToneBtn');
  if (invertDuoToneBtn) {
    invertDuoToneBtn.addEventListener('click', () => {
      const prevBlack = COLORS.duoToneBlack;
      const prevWhite = COLORS.duoToneWhite;
      setDuoToneColor('black', prevWhite);
      setDuoToneColor('white', prevBlack);
      if (duoToneBlackInput) duoToneBlackInput.value = COLORS.duoToneBlack;
      if (duoToneWhiteInput) duoToneWhiteInput.value = COLORS.duoToneWhite;
    });
  }

  const reseedBtn = document.getElementById('rdReseedBtn');
  if (reseedBtn) {
    reseedBtn.addEventListener('click', () => {
      seedSimulationFromCurrentImage();
    });
  }

  const saveJsonBtn = document.getElementById('rdSaveJsonBtn');
  const loadJsonBtn = document.getElementById('rdLoadJsonBtn');
  const loadJsonFile = document.getElementById('rdLoadJsonFile');

  const collectSettings = () => ({
    version: 1,
    RD: { ...RD },
    COLORS: { ...COLORS },
    TITLE: { ...TITLE },
  });

  const pushColorsToUniforms = () => {
    const rgb = (hex) => {
      const h = String(hex || '').replace('#', '').trim();
      if (h.length !== 6) return { r: 0, g: 0, b: 0 };
      const n = parseInt(h, 16);
      return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
    };

    const c1 = rgb(COLORS.color1); uniforms.display.colorStop1.value.set(c1.r, c1.g, c1.b, COLORS.stop1);
    const c2 = rgb(COLORS.color2); uniforms.display.colorStop2.value.set(c2.r, c2.g, c2.b, COLORS.stop2);
    const c3 = rgb(COLORS.color3); uniforms.display.colorStop3.value.set(c3.r, c3.g, c3.b, COLORS.stop3);
    const c4 = rgb(COLORS.color4); uniforms.display.colorStop4.value.set(c4.r, c4.g, c4.b, COLORS.stop4);
    const c5 = rgb(COLORS.color5); uniforms.display.colorStop5.value.set(c5.r, c5.g, c5.b, COLORS.stop5);

    uniforms.display.hslFrom.value.set(COLORS.hslFromMin, COLORS.hslFromMax);
    uniforms.display.hslTo.value.set(COLORS.hslToMin, COLORS.hslToMax);
    uniforms.display.hslSaturation.value = COLORS.hslSaturation;
    uniforms.display.hslLuminosity.value = COLORS.hslLuminosity;

    if (uniforms.display.duoToneBlack?.value) uniforms.display.duoToneBlack.value.set(COLORS.duoToneBlack);
    if (uniforms.display.duoToneWhite?.value) uniforms.display.duoToneWhite.value.set(COLORS.duoToneWhite);
  };

  const applySettings = async (settings) => {
    if (!settings || typeof settings !== 'object') return;

    const sRD = settings.RD || {};
    Object.keys(RD).forEach((k) => {
      if (typeof sRD[k] !== 'undefined') RD[k] = sRD[k];
    });

    // View-only state: never persist/restore "Show Original" from settings.
    RD.showOriginal = false;
    setOriginalOverlayVisible(false);
    const toggleOriginalBtn = document.getElementById('toggleOriginalBtn');
    if (toggleOriginalBtn) toggleOriginalBtn.textContent = 'Show Original';

    const sColors = settings.COLORS || {};
    Object.keys(COLORS).forEach((k) => {
      if (typeof sColors[k] !== 'undefined') COLORS[k] = sColors[k];
    });

    const sTitle = settings.TITLE || {};
    Object.keys(TITLE).forEach((k) => {
      if (typeof sTitle[k] !== 'undefined') TITLE[k] = sTitle[k];
    });

    uniforms.simulation.f.value = RD.f;
    uniforms.simulation.k.value = RD.k;
    uniforms.simulation.dA.value = RD.dA;
    uniforms.simulation.dB.value = RD.dB;
    uniforms.simulation.timestep.value = RD.timestep;
    uniforms.simulation.brushRadius.value = RD.brushRadius;
    uniforms.simulation.bias.value.set(RD.biasX, RD.biasY);
    uniforms.simulation.sourceStrength.value = RD.sourceStrength;

    uniforms.display.renderingStyle.value = RD.renderingStyle;
    if (uniforms.display.imageVignetteEnabled) {
      uniforms.display.imageVignetteEnabled.value = RD.imageVignette ? 1.0 : 0.0;
    }
    if (uniforms.display.imageVignetteStrength) {
      uniforms.display.imageVignetteStrength.value = RD.imageVignetteStrength;
    }
    pushColorsToUniforms();

    setSlider('rdFSlider', 'rdFValue', RD.f, 4);
    setSlider('rdKSlider', 'rdKValue', RD.k, 4);
    setSlider('rdDASlider', 'rdDAValue', RD.dA, 4);
    setSlider('rdDBSlider', 'rdDBValue', RD.dB, 4);
    setSlider('rdTimestepSlider', 'rdTimestepValue', RD.timestep, 2);
    setSlider('rdStepsSlider', 'rdStepsValue', RD.stepsPerFrame, 0);
    setSlider('rdBrushRadiusSlider', 'rdBrushRadiusValue', RD.brushRadius, 0);
    setSlider('rdStyleSlider', 'rdStyleValue', RD.renderingStyle, 0);
    setSlider('rdBiasXSlider', 'rdBiasXValue', RD.biasX, 3);
    setSlider('rdBiasYSlider', 'rdBiasYValue', RD.biasY, 3);
    setSlider('rdWarmStartSlider', 'rdWarmStartValue', RD.warmStartIterations, 0);
    setSliderWithNumber('rdSourceStrengthSlider', 'rdSourceStrengthNumber', 'rdSourceStrengthValue', RD.sourceStrength, 3);
    setSlider('rdSimScaleSlider', 'rdSimScaleValue', RD.simScale, 2);

    // Duo tone UI sync (style 7)
    if (duoToneBlackInput) duoToneBlackInput.value = COLORS.duoToneBlack;
    if (duoToneWhiteInput) duoToneWhiteInput.value = COLORS.duoToneWhite;
    if (duoToneBlackValue) duoToneBlackValue.textContent = COLORS.duoToneBlack;
    if (duoToneWhiteValue) duoToneWhiteValue.textContent = COLORS.duoToneWhite;

    // Colors UI sync omitted for brevity

    // Title UI sync
    if (titleTextInput) titleTextInput.value = TITLE.text;
    if (titleShowToggle) titleShowToggle.checked = !!TITLE.enabled;
    if (titlePositionSelect) titlePositionSelect.value = TITLE.position || 'center';
    if (titleSizeSlider) titleSizeSlider.value = String(TITLE.sizePercent);
    if (titleSizeValue) titleSizeValue.textContent = String(TITLE.sizePercent);
    if (titleFillColor) titleFillColor.value = TITLE.fillColor;
    if (titleStrokeColor) titleStrokeColor.value = TITLE.strokeColor;
    if (titleStrokeWidthSlider) titleStrokeWidthSlider.value = String(TITLE.strokeWidth);
    if (titleStrokeWidthValue) titleStrokeWidthValue.textContent = String(TITLE.strokeWidth);
    if (titleShadowToggle) titleShadowToggle.checked = !!TITLE.shadowEnabled;
    if (titleShadowColor) titleShadowColor.value = TITLE.shadowColor;
    if (titleShadowBlurSlider) titleShadowBlurSlider.value = String(TITLE.shadowBlur);
    if (titleShadowBlurValue) titleShadowBlurValue.textContent = String(TITLE.shadowBlur);
    if (titleShadowOffsetXSlider) titleShadowOffsetXSlider.value = String(TITLE.shadowOffsetX);
    if (titleShadowOffsetXValue) titleShadowOffsetXValue.textContent = String(TITLE.shadowOffsetX);
    if (titleShadowOffsetYSlider) titleShadowOffsetYSlider.value = String(TITLE.shadowOffsetY);
    if (titleShadowOffsetYValue) titleShadowOffsetYValue.textContent = String(TITLE.shadowOffsetY);

    updateRenderingControlsVisibility();
    updateStyleName();

    await ensureTitleFontLoaded();
    window.dispatchEvent(new Event('resize'));
    seedSimulationFromCurrentImage();
  };

  const downloadText = (filename, text) => {
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const downloadBlob = (filename, blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const pad3 = (n) => String(Math.max(0, Math.floor(n))).padStart(3, '0');
  const formatDateYYYYMMDD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
  };

  const getCanvasPngBlob = async () => {
    const canvas = renderer?.domElement || document.getElementById('canvas');
    if (!canvas || typeof canvas.toBlob !== 'function') {
      throw new Error('Canvas not available for screenshot');
    }
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Failed to create PNG blob');
    return blob;
  };

  const settingsToMarkdown = (settings, meta) => {
    const lines = [];
    lines.push(`# RD-06 Settings`);
    lines.push('');
    lines.push(`- Saved: ${meta.iso}`);
    lines.push(`- Base name: ${meta.base}`);
    lines.push(`- Files: ${meta.jsonName}, ${meta.pngName}, ${meta.mdName}`);
    lines.push('');
    lines.push('## Settings JSON');
    lines.push('');
    lines.push('```json');
    lines.push(JSON.stringify(settings, null, 2));
    lines.push('```');
    lines.push('');
    return lines.join('\n');
  };

  const getNextSequenceNumber = async (dirHandle, datePrefix) => {
    // Determine next ### by scanning existing files like YYYYMMDD_###.json
    const re = new RegExp(`^${datePrefix}_(\\d{3})\\.json$`);
    let max = 0;
    // eslint-disable-next-line no-restricted-syntax
    for await (const [name] of dirHandle.entries()) {
      const m = name.match(re);
      if (!m) continue;
      const n = parseInt(m[1], 10);
      if (Number.isFinite(n)) max = Math.max(max, n);
    }
    return max + 1;
  };

  const writeFileToDir = async (dirHandle, filename, data) => {
    const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(data);
    await writable.close();
  };

  const saveSettingsBundle = async () => {
    const settings = collectSettings();
    const now = new Date();
    const date = formatDateYYYYMMDD(now);
    const iso = now.toISOString();

    // Prefer File System Access API when available (Chrome/Edge).
    if (window.showDirectoryPicker) {
      const root = await window.showDirectoryPicker({ mode: 'readwrite' });
      // If the user picked the JSON Settings folder itself, avoid creating a nested JSON Settings/JSON Settings.
      const settingsDir = (root && root.name === 'JSON Settings')
        ? root
        : await root.getDirectoryHandle('JSON Settings', { create: true });
      const seq = await getNextSequenceNumber(settingsDir, date);
      const base = `${date}_${pad3(seq)}`;
      const jsonName = `${base}.json`;
      const pngName = `${base}.png`;
      const mdName = `${base}.md`;

      const pngBlob = await getCanvasPngBlob();
      const mdText = settingsToMarkdown(settings, { iso, base, jsonName, pngName, mdName });

      await writeFileToDir(settingsDir, jsonName, new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' }));
      await writeFileToDir(settingsDir, pngName, pngBlob);
      await writeFileToDir(settingsDir, mdName, new Blob([mdText], { type: 'text/markdown' }));

      alert(`Saved to JSON Settings/\n${jsonName}\n${pngName}\n${mdName}`);
      return;
    }

    // Fallback: download 3 files (cannot write to a local folder without permission APIs).
    const base = `${date}_001`;
    const jsonName = `${base}.json`;
    const pngName = `${base}.png`;
    const mdName = `${base}.md`;
    const pngBlob = await getCanvasPngBlob();
    const mdText = settingsToMarkdown(settings, { iso, base, jsonName, pngName, mdName });
    downloadText(jsonName, JSON.stringify(settings, null, 2));
    downloadBlob(pngName, pngBlob);
    downloadBlob(mdName, new Blob([mdText], { type: 'text/markdown' }));
    alert('Your browser does not support folder write access; downloaded 3 files instead.');
  };

  if (saveJsonBtn) {
    saveJsonBtn.addEventListener('click', () => {
      saveSettingsBundle().catch((err) => {
        alert(`Save failed: ${err && err.message ? err.message : String(err)}`);
      });
    });
  }

  if (loadJsonBtn && loadJsonFile) {
    loadJsonBtn.addEventListener('click', () => loadJsonFile.click());
    loadJsonFile.addEventListener('change', async () => {
      const file = loadJsonFile.files?.[0];
      if (!file) return;
      const text = await file.text();
      const settings = JSON.parse(text);
      await applySettings(settings);
      loadJsonFile.value = '';
    });
  }

  const titleTextInput = document.getElementById('titleTextInput');
  const titleShowToggle = document.getElementById('titleShowToggle');
  const titlePositionSelect = document.getElementById('titlePositionSelect');

  const titleSizeSlider = document.getElementById('titleSizeSlider');
  const titleSizeValue = document.getElementById('titleSizeValue');

  const titleFillColor = document.getElementById('titleFillColor');
  const titleStrokeColor = document.getElementById('titleStrokeColor');

  const titleStrokeWidthSlider = document.getElementById('titleStrokeWidthSlider');
  const titleStrokeWidthValue = document.getElementById('titleStrokeWidthValue');

  const titleShadowToggle = document.getElementById('titleShadowToggle');
  const titleShadowColor = document.getElementById('titleShadowColor');

  const titleShadowBlurSlider = document.getElementById('titleShadowBlurSlider');
  const titleShadowBlurValue = document.getElementById('titleShadowBlurValue');

  const titleShadowOffsetXSlider = document.getElementById('titleShadowOffsetXSlider');
  const titleShadowOffsetXValue = document.getElementById('titleShadowOffsetXValue');

  const titleShadowOffsetYSlider = document.getElementById('titleShadowOffsetYSlider');
  const titleShadowOffsetYValue = document.getElementById('titleShadowOffsetYValue');

  if (titleTextInput) titleTextInput.value = TITLE.text;
  if (titleShowToggle) titleShowToggle.checked = TITLE.enabled;
  if (titlePositionSelect) titlePositionSelect.value = TITLE.position || 'center';

  if (titleSizeSlider && titleSizeValue) {
    titleSizeSlider.value = String(TITLE.sizePercent);
    titleSizeValue.textContent = Number(TITLE.sizePercent).toFixed(1);
  }

  if (titleFillColor) titleFillColor.value = TITLE.fillColor;
  if (titleStrokeColor) titleStrokeColor.value = TITLE.strokeColor;

  if (titleStrokeWidthSlider && titleStrokeWidthValue) {
    titleStrokeWidthSlider.value = String(TITLE.strokeWidth);
    titleStrokeWidthValue.textContent = Number(TITLE.strokeWidth).toFixed(1);
  }

  if (titleShadowToggle) titleShadowToggle.checked = TITLE.shadowEnabled;
  if (titleShadowColor) titleShadowColor.value = TITLE.shadowColor;

  if (titleShadowBlurSlider && titleShadowBlurValue) {
    titleShadowBlurSlider.value = String(TITLE.shadowBlur);
    titleShadowBlurValue.textContent = String(Math.round(TITLE.shadowBlur));
  }

  if (titleShadowOffsetXSlider && titleShadowOffsetXValue) {
    titleShadowOffsetXSlider.value = String(TITLE.shadowOffsetX);
    titleShadowOffsetXValue.textContent = String(Math.round(TITLE.shadowOffsetX));
  }

  if (titleShadowOffsetYSlider && titleShadowOffsetYValue) {
    titleShadowOffsetYSlider.value = String(TITLE.shadowOffsetY);
    titleShadowOffsetYValue.textContent = String(Math.round(TITLE.shadowOffsetY));
  }

  const resetFromTitle = async () => {
    await ensureTitleFontLoaded();
    seedSimulationFromCurrentImage();
  };

  if (titleTextInput) {
    titleTextInput.addEventListener('input', async (e) => {
      TITLE.text = e.target.value;
      await resetFromTitle();
    });
  }

  if (titleShowToggle) {
    titleShowToggle.addEventListener('change', async (e) => {
      TITLE.enabled = e.target.checked;
      await resetFromTitle();
    });
  }

  if (titlePositionSelect) {
    titlePositionSelect.addEventListener('change', async (e) => {
      const v = String(e.target.value || 'center');
      TITLE.position = (v === 'top' || v === 'bottom' || v === 'center') ? v : 'center';
      await resetFromTitle();
    });
  }

  if (titleSizeSlider && titleSizeValue) {
    titleSizeSlider.addEventListener('input', async (e) => {
      const value = parseFloat(e.target.value);
      if (Number.isNaN(value)) return;
      TITLE.sizePercent = value;
      titleSizeValue.textContent = value.toFixed(1);
      await resetFromTitle();
    });
  }

  if (titleFillColor) {
    titleFillColor.addEventListener('input', async (e) => {
      TITLE.fillColor = e.target.value;
      await resetFromTitle();
    });
  }

  if (titleStrokeColor) {
    titleStrokeColor.addEventListener('input', async (e) => {
      TITLE.strokeColor = e.target.value;
      await resetFromTitle();
    });
  }

  if (titleStrokeWidthSlider && titleStrokeWidthValue) {
    titleStrokeWidthSlider.addEventListener('input', async (e) => {
      const value = parseFloat(e.target.value);
      if (Number.isNaN(value)) return;
      TITLE.strokeWidth = value;
      titleStrokeWidthValue.textContent = value.toFixed(1);
      await resetFromTitle();
    });
  }

  if (titleShadowToggle) {
    titleShadowToggle.addEventListener('change', async (e) => {
      TITLE.shadowEnabled = e.target.checked;
      await resetFromTitle();
    });
  }

  if (titleShadowColor) {
    titleShadowColor.addEventListener('input', async (e) => {
      TITLE.shadowColor = e.target.value;
      await resetFromTitle();
    });
  }

  if (titleShadowBlurSlider && titleShadowBlurValue) {
    titleShadowBlurSlider.addEventListener('input', async (e) => {
      const value = parseFloat(e.target.value);
      if (Number.isNaN(value)) return;
      TITLE.shadowBlur = value;
      titleShadowBlurValue.textContent = String(Math.round(value));
      await resetFromTitle();
    });
  }

  if (titleShadowOffsetXSlider && titleShadowOffsetXValue) {
    titleShadowOffsetXSlider.addEventListener('input', async (e) => {
      const value = parseFloat(e.target.value);
      if (Number.isNaN(value)) return;
      TITLE.shadowOffsetX = value;
      titleShadowOffsetXValue.textContent = String(Math.round(value));
      await resetFromTitle();
    });
  }

  if (titleShadowOffsetYSlider && titleShadowOffsetYValue) {
    titleShadowOffsetYSlider.addEventListener('input', async (e) => {
      const value = parseFloat(e.target.value);
      if (Number.isNaN(value)) return;
      TITLE.shadowOffsetY = value;
      titleShadowOffsetYValue.textContent = String(Math.round(value));
      await resetFromTitle();
    });
  }
}

function setupImageRolling() {
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  // Guard against overlapping async transitions (rapid clicks). Stale transitions
  // can reseed with no image and force title-only mode, which reads as "reloading".
  let imageChangeToken = 0;

  const changeImage = async (dir) => {
    const myToken = ++imageChangeToken;
    currentImageIndex = (currentImageIndex + dir + images.length) % images.length;

    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;

    let loaded = false;
    try {
      await loadImageAtIndex(currentImageIndex);
      loaded = true;
    } catch {
      // If load fails, keep the current simulation (avoid title-only fallback).
      loaded = false;
    }

    // If another transition started while we were awaiting, abort this one.
    if (myToken !== imageChangeToken) return;

    updateImageName(currentImageIndex);
    await ensureTitleFontLoaded();

    if (loaded) {
      setBodyBackground(images[currentImageIndex].filename);
      seedSimulationFromCurrentImage();
    }

    if (prevBtn) prevBtn.disabled = false;
    if (nextBtn) nextBtn.disabled = false;
  };

  if (prevBtn) prevBtn.addEventListener('click', () => changeImage(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => changeImage(1));

  // Toggle original image view
  const toggleOriginalBtn = document.getElementById('toggleOriginalBtn');
  if (toggleOriginalBtn) {
    // Ensure DOM reflects current state (prevents "effect disappeared" when body class gets out of sync).
    toggleOriginalBtn.textContent = RD.showOriginal ? 'Show Effect' : 'Show Original';
    setOriginalOverlayVisible(RD.showOriginal);

    toggleOriginalBtn.addEventListener('click', () => {
      RD.showOriginal = !RD.showOriginal;
      toggleOriginalBtn.textContent = RD.showOriginal ? 'Show Effect' : 'Show Original';
      setOriginalOverlayVisible(RD.showOriginal);
    });
  }

  // Invert image button
  const invertImageBtn = document.getElementById('invertImageBtn');
  if (invertImageBtn) {
    invertImageBtn.textContent = RD.invertImage ? 'Revert Image' : 'Invert Image';
    invertImageBtn.addEventListener('click', () => {
      RD.invertImage = !RD.invertImage;
      invertImageBtn.textContent = RD.invertImage ? 'Revert Image' : 'Invert Image';
      setBodyBackground(images[currentImageIndex]?.filename);
      seedSimulationFromCurrentImage();
    });
  }

  // Save default button
  const saveDefaultBtn = document.getElementById('saveDefaultBtn');
  if (saveDefaultBtn) {
    saveDefaultBtn.addEventListener('click', () => {
      const defaultsPayload = {
        RD: {
          f: RD.f,
          k: RD.k,
          dA: RD.dA,
          dB: RD.dB,
          timestep: RD.timestep,
          brushRadius: RD.brushRadius,
          brushFeather: RD.brushFeather,
          brushPower: RD.brushPower,
          brushNoiseScale: RD.brushNoiseScale,
          brushSpeckle: RD.brushSpeckle,
          brushDelta: RD.brushDelta,
          stepsPerFrame: RD.stepsPerFrame,
          renderingStyle: RD.renderingStyle,
          warmStartIterations: RD.warmStartIterations,
          simScale: RD.simScale,
          biasX: RD.biasX,
          biasY: RD.biasY,
          sourceStrength: RD.sourceStrength,
          invertImage: RD.invertImage,
          imageVignette: RD.imageVignette,
          imageVignetteStrength: RD.imageVignetteStrength,
          imageAutoLevels: RD.imageAutoLevels,
          imageAutoLevelsStrength: RD.imageAutoLevelsStrength,
          showOriginal: false,
        },
        COLORS: {
          color1: COLORS.color1, stop1: COLORS.stop1,
          color2: COLORS.color2, stop2: COLORS.stop2,
          color3: COLORS.color3, stop3: COLORS.stop3,
          color4: COLORS.color4, stop4: COLORS.stop4,
          color5: COLORS.color5, stop5: COLORS.stop5,
          duoToneBlack: COLORS.duoToneBlack,
          duoToneWhite: COLORS.duoToneWhite,
          hslFromMin: COLORS.hslFromMin,
          hslFromMax: COLORS.hslFromMax,
          hslToMin: COLORS.hslToMin,
          hslToMax: COLORS.hslToMax,
          hslSaturation: COLORS.hslSaturation,
          hslLuminosity: COLORS.hslLuminosity,
        },
        TITLE: {
          text: TITLE.text,
          enabled: TITLE.enabled,
          position: TITLE.position,
          sizePercent: TITLE.sizePercent,
          fillColor: TITLE.fillColor,
          strokeColor: TITLE.strokeColor,
          strokeWidth: TITLE.strokeWidth,
          shadowEnabled: TITLE.shadowEnabled,
          shadowColor: TITLE.shadowColor,
          shadowBlur: TITLE.shadowBlur,
          shadowOffsetX: TITLE.shadowOffsetX,
          shadowOffsetY: TITLE.shadowOffsetY,
        },
      };

      try {
        localStorage.setItem(DEFAULTS_STORAGE_KEY, JSON.stringify(defaultsPayload));
      } catch {
        alert('Failed to save defaults (storage unavailable).');
        return;
      }

      const configCode = `// RD-06 defaults (saved in localStorage: ${DEFAULTS_STORAGE_KEY})\n${JSON.stringify(defaultsPayload, null, 2)}`;

      navigator.clipboard.writeText(configCode).then(() => {
        const originalText = saveDefaultBtn.textContent;
        saveDefaultBtn.textContent = '✓ Default Saved';
        setTimeout(() => {
          saveDefaultBtn.textContent = originalText;
        }, 2000);
      }).catch(() => {
        const originalText = saveDefaultBtn.textContent;
        saveDefaultBtn.textContent = '✓ Default Saved';
        setTimeout(() => {
          saveDefaultBtn.textContent = originalText;
        }, 2000);
      });
    });
  }

  document.addEventListener('keydown', (e) => {
    if (!images.length) return;
    if (e.key === 'ArrowLeft') changeImage(-1);
    else if (e.key === 'ArrowRight') changeImage(1);
  });
}

async function main() {
  const canvas = document.getElementById('canvas');
  if (!canvas) throw new Error('Missing #canvas');

  bgCanvas = document.getElementById('bgCanvas');
  if (bgCanvas) {
    bgCtx = bgCanvas.getContext('2d', { willReadFrequently: true });
    resizeBackgroundCanvas();
  }

  // Setup UI early so the first paint is fast.
  setupTabs();
  setupEffectsPanel();
  setupBrushPanel();
  setupImagePanel();
  setupImageRolling();


  // ...existing code...

  await ensureTitleFontLoaded();

  // Start WebGL ASAP: seed will fall back to title-only until the first image decodes.
  setupThree(canvas);

  // Initialize image list and begin loading AFTER WebGL has started.
  images = IMAGES.map((filename) => createImageRecord(filename));
  updateImageName(currentImageIndex);

  try {
    await loadImageAtIndex(currentImageIndex);
  } catch {
    // If the first image fails to load, keep title-only.
  }

  if (images[currentImageIndex]?.img) {
    setBodyBackground(images[currentImageIndex].filename);
    uniforms.display.titleOnly.value = 0;
    seedSimulationFromCurrentImage();
    startBackgroundImageLoading();
  }
}

window.addEventListener('load', () => {
  main().catch((err) => {
    console.error('[RD-06] Failed to start:', err);
    showStartupError('Failed to start (see details below).', err);
  });
});
