"use client"

import { useEffect, useRef } from "react"

/* Живые обои входа (как kSpot): «шёлк» фона + лента нитей поверх. Перенесено из макета 01. */

const WP_FRAG = `precision highp float;
uniform vec2 r,off;uniform float t,dpr,ww;
uniform vec3 a0,a1,a2,a3,b0,b1,b2,b3;
// Курсор (координаты документа) и до шести кругов от кликов: x, y, возраст в с.
uniform vec3 m;uniform vec3 rp[6];
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p=p*2.03+7.1;a*=.5;}return v;}
void main(){
 vec2 px=vec2(gl_FragCoord.x,r.y-gl_FragCoord.y)/dpr+off;
 // Курсор: фон под ним прогибается, как жидкость под пальцем.
 vec2 dm=px-m.xy;
 float near=exp(-dot(dm,dm)/(260.*260.))*m.z;
 px-=dm*.32*near;
 // Клик: круги расходятся по воде и затухают.
 float ring=0.;
 for(int i=0;i<6;i++){
  float age=rp[i].z;
  if(age<0.||age>3.)continue;
  vec2 dd=px-rp[i].xy;float d=length(dd)+.001;
  float front=age*380.;
  float wv=sin((d-front)*.055)*exp(-abs(d-front)*.011)*exp(-age*.95);
  px+=dd/d*wv*16.;
  ring+=wv;
 }
 vec2 p=px/ww;
 float s=t*.035;
 float k=.5-.5*cos(p.y*1.15);
 vec3 c0=mix(a0,b0,k),c1=mix(a1,b1,k),c2=mix(a2,b2,k),c3=mix(a3,b3,k);
 // «Живой шёлк»: поле течения искривляет само себя.
 vec2 q=vec2(fbm(p*1.6+vec2(0.,s)),fbm(p*1.6+vec2(5.2,-s*.8)));
 vec2 w=vec2(fbm(p*1.6+2.2*q+vec2(1.7,9.2)+s*.6),fbm(p*1.6+2.2*q+vec2(8.3,2.8)-s*.5));
 float v=fbm(p*1.6+2.4*w);
 vec3 col=mix(c0,c1,smoothstep(.15,.55,v));
 col=mix(col,c2,smoothstep(.4,.8,v+.2*(q.y-.5)));
 // Мягкие волны: светлый гребень и тень под ним, как складки ткани.
 float band=(p.y*1.1+p.x*.35+.55*q.x+.35*w.y)*3.2-s*1.4;
 float f=fract(band);
 float crest=pow(1.-abs(f-.5)*2.,6.);
 float shade=smoothstep(.0,.35,f)*(1.-smoothstep(.35,.55,f));
 col=mix(col,c3,crest*.55);
 col*=1.-.28*shade;
 col=mix(col,c3,.35*smoothstep(.62,.95,v));
 col*=.9+.25*smoothstep(.2,.9,q.y);
 col+=c3*(.22*max(ring,0.)+.16*near);
 col-=.08*max(-ring,0.);
 col+=(h(gl_FragCoord.xy+fract(t))-.5)*.035;
 gl_FragColor=vec4(col,1.);
}`

const RB_FRAG = `precision highp float;
uniform vec2 r,vp,off;uniform float t,prog,dpr;
float h(float n){return fract(sin(n*91.7)*43758.5453);}
float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
 vec2 px=vec2(gl_FragCoord.x,r.y-gl_FragCoord.y)/dpr+off;
 float asp=vp.x/vp.y;
 // Лента идёт сверху вниз: «вдоль» — высота экрана, «поперёк» — ширина.
 float x=px.y/vp.y;
 float y=px.x/vp.y;
 float s=t*.11;
 float pr=prog;
 float c=asp*(.5+.4*sin(x*2.4+pr*9.4+.1)+.03*sin(x*4.7-pr*5.+s*1.3));
 float pinch=.56+.36*sin(pr*8.1)+.03*sin(s*.5);
 float w=.02+.5*pow(abs(x-pinch),1.25);
 w=min(w*mix(1.,.45,smoothstep(.02,.09,pr)),mix(.3,.12,smoothstep(.02,.09,pr)));
 float tw=x*3.4+pr*16.+s*.6;
 float slope=.35+.4*abs(cos(x*2.1+pr*7.));
 float lw=1.2/vp.y;
 vec3 acc=vec3(0.);
 for(int i=0;i<24;i++){
  float fi=float(i);
  float o=fi/23.*2.-1.;
  o+=.06*(h(fi)-.5);
  float ang=tw+o*.9;
  float yy=c+w*o*cos(ang)*1.6;
  float z=sin(ang+o*1.3);
  float d=abs(y-yy)/sqrt(1.+slope*slope*.6);
  float b=.35+.65*smoothstep(-1.,1.,z);
  float core=smoothstep(lw*1.6,0.,d);
  float halo=exp(-d*d/(lw*lw*60.));
  float k=h(fi*3.1);
  vec3 glow=k<.55?vec3(.0,.82,.42):(k<.85?vec3(.35,1.,.72):vec3(.82,1.,.9));
  acc+=glow*(core*.85+halo*.11)*b;
 }
 float dc=y-c;
 float soft=exp(-dc*dc/((w+.04)*(w+.04)));
 float knot=exp(-((x-pinch)*(x-pinch)+dc*dc)/.004);
 // Частицы рядом с лентой.
 vec2 g=gl_FragCoord.xy/(9.*dpr);
 float rnd=h2(floor(g));
 float sp=step(.965,rnd)*smoothstep(.22,0.,length(fract(g)-.5))*exp(-dc*dc/((w+.06)*(w+.06)))*(.5+.5*sin(t*2.+rnd*40.));
 acc+=vec3(.0,.55,.32)*soft*.22+vec3(.6,1.,.85)*knot*.9+vec3(.6,1.,.82)*sp*.9;
 float al=clamp(max(acc.r,max(acc.g,acc.b)),0.,1.);
 gl_FragColor=vec4(min(acc,1.),al);
}`

const VERT = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`

/** Палитры по времени суток: фон плавно переходит от текущей фазы к следующей. */
const PALETTES = {
  dawn: ["#000E5C", "#001A9F", "#5B6CFF", "#F3B7D8"],
  day: ["#001070", "#0A2BC0", "#1E6BFF", "#B8D4FF"],
  sunset: ["#0A0A45", "#001A9F", "#6A3DF0", "#FF9DB8"],
  night: ["#020A3D", "#0A1E9A", "#2D5BFF", "#8DB4FF"],
} as const
type Phase = keyof typeof PALETTES
const NEXT_PHASE: Record<Phase, Phase> = { dawn: "day", day: "dawn", sunset: "day", night: "day" }

function phaseNow(): Phase {
  const h = new Date().getHours()
  if (h >= 5 && h < 9) return "dawn"
  if (h >= 9 && h < 17) return "day"
  if (h >= 17 && h < 21) return "sunset"
  return "night"
}

const hex = (c: string): [number, number, number] => {
  const n = parseInt(c.slice(1), 16)
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

type Scene = {
  canvas: HTMLCanvasElement
  gl: WebGLRenderingContext
  u: (name: string) => WebGLUniformLocation | null
}

function createScene(box: HTMLElement, frag: string, premultipliedAlpha: boolean): Scene | null {
  const canvas = document.createElement("canvas")
  canvas.className = "absolute inset-0 size-full"
  const gl = canvas.getContext("webgl", { premultipliedAlpha, alpha: true, antialias: false })
  if (!gl) return null
  box.appendChild(canvas)
  const shader = (type: number, src: string) => {
    const s = gl.createShader(type)!
    gl.shaderSource(s, src)
    gl.compileShader(s)
    return s
  }
  const program = gl.createProgram()!
  gl.attachShader(program, shader(gl.VERTEX_SHADER, VERT))
  gl.attachShader(program, shader(gl.FRAGMENT_SHADER, frag))
  gl.linkProgram(program)
  gl.useProgram(program)
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const a = gl.getAttribLocation(program, "a")
  gl.enableVertexAttribArray(a)
  gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0)
  const cache: Record<string, WebGLUniformLocation | null> = {}
  return { canvas, gl, u: (n) => (n in cache ? cache[n] : (cache[n] = gl.getUniformLocation(program, n))) }
}

function fit({ canvas, gl }: Scene, dpr: number) {
  const w = Math.max(1, Math.round(canvas.clientWidth * dpr))
  const h = Math.max(1, Math.round(canvas.clientHeight * dpr))
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w
    canvas.height = h
    gl.viewport(0, 0, w, h)
  }
  return [w, h] as const
}

export function LoginWallpaper() {
  const wpRef = useRef<HTMLDivElement>(null)
  const rbRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wpBox = wpRef.current
    const rbBox = rbRef.current
    if (!wpBox || !rbBox) return
    const W = createScene(wpBox, WP_FRAG, true)
    // Лента — только на широких экранах: на телефоне она почти не видна, а стоит как весь фон.
    const R = matchMedia("(min-width: 768px)").matches ? createScene(rbBox, RB_FRAG, false) : null
    if (!W && !R) return

    const ph = phaseNow()
    const cols = [...PALETTES[ph], ...PALETTES[NEXT_PHASE[ph]]].map(hex)
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches
    const t0 = performance.now()
    let mx = -9999, my = -9999, sx = -9999, sy = -9999, on = 0, son = 0
    const ripples: { x: number; y: number; t: number }[] = []

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return
      mx = e.clientX + scrollX
      my = e.clientY + scrollY
      on = 1
    }
    const onLeave = () => (on = 0)
    const onDown = (e: PointerEvent) => {
      ripples.push({ x: e.clientX + scrollX, y: e.clientY + scrollY, t: performance.now() })
      if (ripples.length > 6) ripples.shift()
    }
    addEventListener("pointermove", onMove, { passive: true })
    addEventListener("pointerdown", onDown, { passive: true })
    document.documentElement.addEventListener("pointerleave", onLeave)

    // Фон мягкий — хватает 30 к/с и пониженного разрешения (растягивается без потерь).
    let raf = 0, last = 0
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (document.hidden || now - last < 33) return
      last = now
      if (W) {
        const d = 0.4
        const [w, h] = fit(W, d)
        const { gl, u } = W
        const r = W.canvas.getBoundingClientRect()
        if (sx < -9000) { sx = mx; sy = my }
        sx += (mx - sx) * 0.12
        sy += (my - sy) * 0.12
        son += ((still ? 0 : on) - son) * 0.08
        gl.uniform2f(u("r"), w, h)
        gl.uniform2f(u("off"), r.left + scrollX, r.top + scrollY)
        gl.uniform1f(u("dpr"), d)
        gl.uniform1f(u("ww"), Math.max(innerWidth, 900))
        gl.uniform3f(u("m"), sx, sy, son)
        const rp = new Float32Array(18).fill(-1)
        if (!still) ripples.forEach((q, i) => { rp[i * 3] = q.x; rp[i * 3 + 1] = q.y; rp[i * 3 + 2] = (now - q.t) / 1000 })
        gl.uniform3fv(u("rp"), rp)
        gl.uniform1f(u("t"), still ? 20 : (now - t0) / 1000 + 20)
        ;["a0", "a1", "a2", "a3", "b0", "b1", "b2", "b3"].forEach((n, i) => gl.uniform3f(u(n), ...cols[i]))
        gl.drawArrays(gl.TRIANGLES, 0, 3)
      }
      if (R) {
        const d = Math.min(devicePixelRatio || 1, 0.75)
        const [w, h] = fit(R, d)
        const { gl, u } = R
        const r = R.canvas.getBoundingClientRect()
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.uniform2f(u("r"), w, h)
        gl.uniform2f(u("vp"), innerWidth, innerHeight)
        gl.uniform2f(u("off"), r.left, r.top)
        gl.uniform1f(u("t"), still ? 10 : (now - t0) / 1000 + 10)
        gl.uniform1f(u("prog"), 0.15)
        gl.uniform1f(u("dpr"), d)
        gl.drawArrays(gl.TRIANGLES, 0, 3)
      }
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      removeEventListener("pointermove", onMove)
      removeEventListener("pointerdown", onDown)
      document.documentElement.removeEventListener("pointerleave", onLeave)
      for (const s of [W, R]) {
        s?.gl.getExtension("WEBGL_lose_context")?.loseContext()
        s?.canvas.remove()
      }
    }
  }, [])

  return (
    <>
      <div ref={wpRef} aria-hidden className="pointer-events-none absolute inset-0 -z-10" />
      <div ref={rbRef} aria-hidden className="pointer-events-none absolute inset-0 -z-[4]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-[5] bg-[radial-gradient(45%_55%_at_50%_50%,oklch(0.15_0.03_280/0.45),transparent_75%)]"
      />
    </>
  )
}
