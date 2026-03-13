'use strict';

/**
 * Patched WebGL Fluid Simulation for AWS Cloud Club
 * Fixed Shader compilation (newlines), initialization, and window listeners.
 */

// --- UTILS ---

function isMobile () { return /Mobi|Android/i.test(navigator.userAgent); }

function scaleByPixelRatio (input) {
    let pixelRatio = window.devicePixelRatio || 1;
    return Math.floor(input * pixelRatio);
}

function hashCode (s) {
    if (s.length == 0) return 0;
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
        hash = (hash << 5) - hash + s.charCodeAt(i);
        hash |= 0;
    }
    return hash;
}

function wrap (value, min, max) {
    let range = max - min;
    if (range == 0) return min;
    return (value - min) % range + min;
}

// AWS COLORS PATCH
const PALETTE = [
    { r: 0.486, g: 0.231, b: 0.929 }, // #7c3aed
    { r: 0.655, g: 0.545, b: 0.980 }, // #a78bfa
    { r: 0.404, g: 0.910, b: 0.976 }, // #67e8f9
    { r: 1.000, g: 0.600, b: 0.000 }, // #ff9900
];
let colorIndex = 0;

function generateColor () {
    let c = {...PALETTE[colorIndex % PALETTE.length]};
    colorIndex++;
    return c;
}

// --- CONFIG ---

const canvas = document.getElementById('canvas');

let config = {
    SIM_RESOLUTION: 128,
    DYE_RESOLUTION: 1024,
    DENSITY_DISSIPATION: 1.5,
    VELOCITY_DISSIPATION: 0.8,
    PRESSURE: 0.8,
    PRESSURE_ITERATIONS: 20,
    CURL: 20,
    SPLAT_RADIUS: 0.25,
    SPLAT_FORCE: 3500,
    SHADING: true,
    COLORFUL: true,
    COLOR_UPDATE_SPEED: 10,
    PAUSED: false,
    BACK_COLOR: { r: 15, g: 6, b: 32 },
    TRANSPARENT: false,
    BLOOM: false,
    SUNRAYS: false, 
}

function pointerPrototype () {
    this.id = -1;
    this.texcoordX = 0;
    this.texcoordY = 0;
    this.prevTexcoordX = 0;
    this.prevTexcoordY = 0;
    this.deltaX = 0;
    this.deltaY = 0;
    this.down = false;
    this.moved = false;
    this.color = generateColor();
}

let pointers = [new pointerPrototype()];
let splatStack = [];

// --- WEBGL INIT ---

function getWebGLContext (canvas) {
    const params = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };
    let gl = canvas.getContext('webgl2', params);
    const isWebGL2 = !!gl;
    if (!isWebGL2) gl = canvas.getContext('webgl', params) || canvas.getContext('experimental-webgl', params);

    let halfFloat, supportLinearFiltering;
    if (isWebGL2) {
        gl.getExtension('EXT_color_buffer_float');
        supportLinearFiltering = gl.getExtension('OES_texture_float_linear');
    } else {
        halfFloat = gl.getExtension('OES_texture_half_float');
        supportLinearFiltering = gl.getExtension('OES_texture_half_float_linear');
    }

    const halfFloatTexType = isWebGL2 ? gl.HALF_FLOAT : (halfFloat ? halfFloat.HALF_FLOAT_OES : gl.UNSIGNED_BYTE);
    let formatRGBA, formatRG, formatR;

    if (isWebGL2) {
        formatRGBA = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType);
        formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
        formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);
    } else {
        formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
        formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
        formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
    }

    return { gl, ext: { formatRGBA, formatRG, formatR, halfFloatTexType, supportLinearFiltering } };
}

function getSupportedFormat (gl, internalFormat, format, type) {
    if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
        switch (internalFormat) {
            case gl.R16F: return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
            case gl.RG16F: return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
            default: return null;
        }
    }
    return { internalFormat, format }
}

function supportRenderTextureFormat (gl, internalFormat, format, type) {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);
    let fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    return gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_COMPLETE;
}

const { gl, ext } = getWebGLContext(canvas);

// --- SHADERS ---

function compileShader (type, source, keywords) {
    if (keywords) {
        let ks = '';
        keywords.forEach(v => ks += '#define ' + v + '\n');
        source = ks + source;
    }
    let sh = gl.createShader(type);
    gl.shaderSource(sh, source);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error("Shader compilation error:", gl.getShaderInfoLog(sh));
    }
    return sh;
}

function createProgram (v, f) {
    let p = gl.createProgram();
    gl.attachShader(p, v);
    gl.attachShader(p, f);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        console.error("Program link error:", gl.getProgramInfoLog(p));
    }
    return p;
}

function getUniforms (p) {
    let u = [], c = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < c; i++) {
        let n = gl.getActiveUniform(p, i).name;
        u[n] = gl.getUniformLocation(p, n);
    }
    return u;
}

const baseV = compileShader(gl.VERTEX_SHADER, `
    precision highp float;
    attribute vec2 aPosition;
    varying vec2 vUv, vL, vR, vT, vB;
    uniform vec2 texelSize;
    void main() {
        vUv = aPosition * 0.5 + 0.5;
        vL = vUv - vec2(texelSize.x, 0.0);
        vR = vUv + vec2(texelSize.x, 0.0);
        vT = vUv + vec2(0.0, texelSize.y);
        vB = vUv - vec2(0.0, texelSize.y);
        gl_Position = vec4(aPosition, 0.0, 1.0);
    }
`);

const copyS = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;
    varying highp vec2 vUv;
    uniform sampler2D uTexture;
    void main() { gl_FragColor = texture2D(uTexture, vUv); }
`);

const clearS = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;
    varying highp vec2 vUv;
    uniform sampler2D uTexture;
    uniform float value;
    void main() { gl_FragColor = value * texture2D(uTexture, vUv); }
`);

const colorS = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    uniform vec4 color;
    void main() { gl_FragColor = color; }
`);

const splatS = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;
    varying vec2 vUv;
    uniform sampler2D uTarget;
    uniform float aspectRatio;
    uniform vec3 color;
    uniform vec2 point;
    uniform float radius;
    void main() {
        vec2 p = vUv - point.xy;
        p.x *= aspectRatio;
        vec3 splat = exp(-dot(p, p) / radius) * color;
        gl_FragColor = vec4(texture2D(uTarget, vUv).xyz + splat, 1.0);
    }
`);

const advectS = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;
    varying vec2 vUv;
    uniform sampler2D uVelocity, uSource;
    uniform vec2 texelSize;
    uniform float dt, dissipation;
    void main() {
        vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
        gl_FragColor = texture2D(uSource, coord) / (1.0 + dissipation * dt);
    }
`);

const divS = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;
    varying highp vec2 vUv, vL, vR, vT, vB;
    uniform sampler2D uVelocity;
    void main() {
        float L = texture2D(uVelocity, vL).x;
        float R = texture2D(uVelocity, vR).x;
        float T = texture2D(uVelocity, vT).y;
        float B = texture2D(uVelocity, vB).y;
        vec2 C = texture2D(uVelocity, vUv).xy;
        if(vL.x < 0.0) L = -C.x;
        if(vR.x > 1.0) R = -C.x;
        if(vT.y > 1.0) T = -C.y;
        if(vB.y < 0.0) B = -C.y;
        gl_FragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
    }
`);

const curlS = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;
    varying highp vec2 vL, vR, vT, vB;
    uniform sampler2D uVelocity;
    void main() {
        gl_FragColor = vec4(0.5 * (texture2D(uVelocity, vR).y - texture2D(uVelocity, vL).y - texture2D(uVelocity, vT).x + texture2D(uVelocity, vB).x), 0.0, 0.0, 1.0);
    }
`);

const vortS = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;
    varying vec2 vUv, vL, vR, vT, vB;
    uniform sampler2D uVelocity, uCurl;
    uniform float curl, dt;
    void main() {
        float L = texture2D(uCurl, vL).x;
        float R = texture2D(uCurl, vR).x;
        float T = texture2D(uCurl, vT).x;
        float B = texture2D(uCurl, vB).x;
        float C = texture2D(uCurl, vUv).x;
        vec2 f = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
        f /= length(f) + 0.0001;
        f *= curl * C;
        f.y *= -1.0;
        vec2 v = texture2D(uVelocity, vUv).xy + f * dt;
        gl_FragColor = vec4(min(max(v, -1000.0), 1000.0), 0.0, 1.0);
    }
`);

const pressS = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;
    varying highp vec2 vUv, vL, vR, vT, vB;
    uniform sampler2D uPressure, uDivergence;
    void main() {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        float D = texture2D(uDivergence, vUv).x;
        gl_FragColor = vec4((L + R + B + T - D) * 0.25, 0.0, 0.0, 1.0);
    }
`);

const gradS = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;
    varying highp vec2 vUv, vL, vR, vT, vB;
    uniform sampler2D uPressure, uVelocity;
    void main() {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        vec2 v = texture2D(uVelocity, vUv).xy - vec2(R - L, T - B);
        gl_FragColor = vec4(v, 0.0, 1.0);
    }
`);

const displaySSource = `
    precision highp float;
    precision highp sampler2D;
    varying vec2 vUv, vL, vR, vT, vB;
    uniform sampler2D uTexture, uBloom, uSunrays;
    uniform vec2 texelSize;
    void main() {
        vec3 c = texture2D(uTexture, vUv).rgb;
        #ifdef SHADING
        vec3 lc = texture2D(uTexture, vL).rgb;
        vec3 rc = texture2D(uTexture, vR).rgb;
        vec3 tc = texture2D(uTexture, vT).rgb;
        vec3 bc = texture2D(uTexture, vB).rgb;
        float dx = length(rc) - length(lc);
        float dy = length(tc) - length(bc);
        vec3 n = normalize(vec3(dx, dy, length(texelSize)));
        c *= clamp(dot(n, vec3(0, 0, 1)) + 0.7, 0.7, 1.0);
        #endif
        gl_FragColor = vec4(c, max(c.r, max(c.g, c.b)));
    }
`;

// --- PROGRAM CLASS ---

class Program {
    constructor (v, f) {
        this.p = createProgram(v, f);
        this.u = getUniforms(this.p);
    }
    bind () { gl.useProgram(this.p); }
}

class Material {
    constructor (v, f) {
        this.v = v; this.f = f;
        this.p = []; this.a = null; this.u = [];
    }
    setKeywords (k) {
        let h = 0; k.forEach(v => h += hashCode(v));
        let p = this.p[h];
        if (!p) {
            let fs = compileShader(gl.FRAGMENT_SHADER, this.f, k);
            p = createProgram(this.v, fs);
            this.p[h] = p;
        }
        if (p === this.a) return;
        this.u = getUniforms(p);
        this.a = p;
    }
    bind () { gl.useProgram(this.a); }
}

const copyP = new Program(baseV, copyS);
const clearP = new Program(baseV, clearS);
const colorP = new Program(baseV, colorS);
const splatP = new Program(baseV, splatS);
const advectP = new Program(baseV, advectS);
const divP = new Program(baseV, divS);
const curlP = new Program(baseV, curlS);
const vortP = new Program(baseV, vortS);
const pressP = new Program(baseV, pressS);
const gradP = new Program(baseV, gradS);
const displayM = new Material(baseV, displaySSource);

// --- HELPERS ---

const blit = (() => {
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);
    return (target) => {
        if (!target) {
            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        } else {
            gl.viewport(0, 0, target.width, target.height);
            gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
        }
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }
})();

function createFBO (w, h, internalFormat, format, type, param) {
    gl.activeTexture(gl.TEXTURE0);
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);
    let fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    return {
        texture, fbo, width: w, height: h, texelSizeX: 1.0/w, texelSizeY: 1.0/h,
        attach(id) { gl.activeTexture(gl.TEXTURE0 + id); gl.bindTexture(gl.TEXTURE_2D, texture); return id; }
    };
}

function createDoubleFBO (w, h, internalFormat, format, type, param) {
    let f1 = createFBO(w, h, internalFormat, format, type, param);
    let f2 = createFBO(w, h, internalFormat, format, type, param);
    return {
        width: w, height: h, texelSizeX: f1.texelSizeX, texelSizeY: f1.texelSizeY,
        get read() { return f1; }, set read(v) { f1 = v; },
        get write() { return f2; }, set write(v) { f2 = v; },
        swap() { let t = f1; f1 = f2; f2 = t; }
    };
}

function getResolution (resolution) {
    let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
    if (aspectRatio < 1) aspectRatio = 1.0 / aspectRatio;
    let min = Math.round(resolution);
    let max = Math.round(resolution * aspectRatio);
    if (gl.drawingBufferWidth > gl.drawingBufferHeight) return { width: max, height: min };
    return { width: min, height: max };
}

let dye, velocity, divergence, curl, pressure;

function initFramebuffers () {
    let sRes = getResolution(config.SIM_RESOLUTION), dRes = getResolution(config.DYE_RESOLUTION);
    const t = ext.halfFloatTexType, rgba = ext.formatRGBA, rg = ext.formatRG, r = ext.formatR, f = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;
    dye = createDoubleFBO(dRes.width, dRes.height, rgba.internalFormat, rgba.format, t, f);
    velocity = createDoubleFBO(sRes.width, sRes.height, rg.internalFormat, rg.format, t, f);
    divergence = createFBO(sRes.width, sRes.height, r.internalFormat, r.format, t, gl.NEAREST);
    curl = createFBO(sRes.width, sRes.height, r.internalFormat, r.format, t, gl.NEAREST);
    pressure = createDoubleFBO(sRes.width, sRes.height, r.internalFormat, r.format, t, gl.NEAREST);
}

// --- LOGIC ---

function splat (x, y, dx, dy, color) {
    splatP.bind();
    gl.uniform1i(splatP.u.uTarget, velocity.read.attach(0));
    gl.uniform1f(splatP.u.aspectRatio, canvas.width / canvas.height);
    gl.uniform2f(splatP.u.point, x, y);
    gl.uniform3f(splatP.u.color, dx, dy, 0.0);
    gl.uniform1f(splatP.u.radius, (config.SPLAT_RADIUS / 100.0) * (canvas.width > canvas.height ? canvas.width/canvas.height : 1));
    blit(velocity.write); velocity.swap();
    gl.uniform1i(splatP.u.uTarget, dye.read.attach(0));
    gl.uniform3f(splatP.u.color, color.r, color.g, color.b);
    blit(dye.write); dye.swap();
}

function multipleSplats (amount) {
    for (let i = 0; i < amount; i++) {
        const c = generateColor(); c.r *= 10; c.g *= 10; c.b *= 10;
        splat(Math.random(), Math.random(), 1000 * (Math.random() - 0.5), 1000 * (Math.random() - 0.5), c);
    }
}

function step (dt) {
    gl.disable(gl.BLEND);
    curlP.bind(); gl.uniform2f(curlP.u.texelSize, velocity.texelSizeX, velocity.texelSizeY); gl.uniform1i(curlP.u.uVelocity, velocity.read.attach(0)); blit(curl);
    vortP.bind(); gl.uniform2f(vortP.u.texelSize, velocity.texelSizeX, velocity.texelSizeY); gl.uniform1i(vortP.u.uVelocity, velocity.read.attach(0)); gl.uniform1i(vortP.u.uCurl, curl.attach(1)); gl.uniform1f(vortP.u.curl, config.CURL); gl.uniform1f(vortP.u.dt, dt); blit(velocity.write); velocity.swap();
    divP.bind(); gl.uniform2f(divP.u.texelSize, velocity.texelSizeX, velocity.texelSizeY); gl.uniform1i(divP.u.uVelocity, velocity.read.attach(0)); blit(divergence);
    clearP.bind(); gl.uniform1i(clearP.u.uTexture, pressure.read.attach(0)); gl.uniform1f(clearP.u.value, config.PRESSURE); blit(pressure.write); pressure.swap();
    pressP.bind(); gl.uniform2f(pressP.u.texelSize, velocity.texelSizeX, velocity.texelSizeY); gl.uniform1i(pressP.u.uDivergence, divergence.attach(0));
    for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) { gl.uniform1i(pressP.u.uPressure, pressure.read.attach(1)); blit(pressure.write); pressure.swap(); }
    gradP.bind(); gl.uniform2f(gradP.u.texelSize, velocity.texelSizeX, velocity.texelSizeY); gl.uniform1i(gradP.u.uPressure, pressure.read.attach(0)); gl.uniform1i(gradP.u.uVelocity, velocity.read.attach(1)); blit(velocity.write); velocity.swap();
    advectP.bind(); gl.uniform2f(advectP.u.texelSize, velocity.texelSizeX, velocity.texelSizeY); let vId = velocity.read.attach(0); gl.uniform1i(advectP.u.uVelocity, vId); gl.uniform1i(advectP.u.uSource, vId); gl.uniform1f(advectP.u.dt, dt); gl.uniform1f(advectP.u.dissipation, config.VELOCITY_DISSIPATION); blit(velocity.write); velocity.swap();
    gl.uniform1i(advectP.u.uVelocity, velocity.read.attach(0)); gl.uniform1i(advectP.u.uSource, dye.read.attach(1)); gl.uniform1f(advectP.u.dissipation, config.DENSITY_DISSIPATION); blit(dye.write); dye.swap();
}

function render () {
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.enable(gl.BLEND);
    colorP.bind(); gl.uniform4f(colorP.u.color, config.BACK_COLOR.r / 255, config.BACK_COLOR.g / 255, config.BACK_COLOR.b / 255, 1.0); blit(null);
    displayM.bind(); gl.uniform2f(displayM.u.texelSize, 1.0 / gl.drawingBufferWidth, 1.0 / gl.drawingBufferHeight); gl.uniform1i(displayM.u.uTexture, dye.read.attach(0)); blit(null);
}

let lastUpdateTime = Date.now();
function update () {
    const w = scaleByPixelRatio(canvas.clientWidth), h = scaleByPixelRatio(canvas.clientHeight);
    if (canvas.width != w || canvas.height != h) { canvas.width = w; canvas.height = h; initFramebuffers(); }
    let now = Date.now(), dt = Math.min((now - lastUpdateTime) / 1000, 0.016666); lastUpdateTime = now;
    if (splatStack.length > 0) multipleSplats(splatStack.pop());
    pointers.forEach(p => { if (p.down && p.moved) { p.moved = false; splat(p.texcoordX, p.texcoordY, p.deltaX * config.SPLAT_FORCE, p.deltaY * config.SPLAT_FORCE, p.color); } });
    step(dt); render(); requestAnimationFrame(update);
}

// --- INPUTS ---

window.addEventListener('mousedown', e => {
    let p = pointers[0]; p.down = true; p.moved = false;
    p.texcoordX = e.clientX / window.innerWidth;
    p.texcoordY = 1.0 - e.clientY / window.innerHeight;
    p.prevTexcoordX = p.texcoordX; p.prevTexcoordY = p.texcoordY;
    p.deltaX = 0; p.deltaY = 0; p.color = generateColor();
});

window.addEventListener('mousemove', e => {
    let p = pointers[0]; if (!p.down) return;
    p.prevTexcoordX = p.texcoordX; p.prevTexcoordY = p.texcoordY;
    p.texcoordX = e.clientX / window.innerWidth;
    p.texcoordY = 1.0 - e.clientY / window.innerHeight;
    p.deltaX = p.texcoordX - p.prevTexcoordX; p.deltaY = p.texcoordY - p.prevTexcoordY;
    let ar = window.innerWidth / window.innerHeight; if (ar < 1) p.deltaX *= ar; else p.deltaY /= ar;
    p.moved = true;
});

window.addEventListener('mouseup', () => { pointers[0].down = false; });

window.addEventListener('touchstart', e => {
    const t = e.targetTouches[0]; let p = pointers[0]; p.down = true; p.moved = false;
    p.texcoordX = t.clientX / window.innerWidth;
    p.texcoordY = 1.0 - t.clientY / window.innerHeight;
    p.prevTexcoordX = p.texcoordX; p.prevTexcoordY = p.texcoordY;
    p.deltaX = 0; p.deltaY = 0; p.color = generateColor();
}, { passive: false });

window.addEventListener('touchmove', e => {
    const t = e.targetTouches[0]; let p = pointers[0]; if (!p.down) return;
    p.prevTexcoordX = p.texcoordX; p.prevTexcoordY = p.texcoordY;
    p.texcoordX = t.clientX / window.innerWidth;
    p.texcoordY = 1.0 - t.clientY / window.innerHeight;
    p.deltaX = p.texcoordX - p.prevTexcoordX; p.deltaY = p.texcoordY - p.prevTexcoordY;
    let ar = window.innerWidth / window.innerHeight; if (ar < 1) p.deltaX *= ar; else p.deltaY /= ar;
    p.moved = true;
}, { passive: false });

window.addEventListener('touchend', () => { pointers[0].down = false; });

// --- START ---

initFramebuffers();
displayM.setKeywords(['SHADING']);
multipleSplats(10);
update();
