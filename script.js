(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const TAU = Math.PI * 2;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':'&quot;',"'":"&apos;"}[c]));

  const THEMES = {
    crimson: { name:"Crimson / Cream", bg:"#17080b", a:"#ff3154", b:"#8f0d2d", c:"#ffe4d6", d:"#420819" },
    sunset: { name:"Sunset Punch", bg:"#361006", a:"#ff7142", b:"#f02f62", c:"#ffd669", d:"#7e230c" },
    electric: { name:"Electric Blue", bg:"#07152b", a:"#1d73ff", b:"#5f46ff", c:"#96ecff", d:"#082f62" },
    tropical: { name:"Tropical Mint", bg:"#052b26", a:"#19cda1", b:"#2e9bf4", c:"#e3ffbe", d:"#0b6557" },
    berry: { name:"Berry Violet", bg:"#270619", a:"#ea3d9c", b:"#733dff", c:"#ffb5db", d:"#4a0c42" },
    aqua: { name:"Aqua Sky", bg:"#05262d", a:"#16dbe8", b:"#4780ff", c:"#d3fff8", d:"#0b6373" },
    solar: { name:"Solar Orange", bg:"#3a1404", a:"#ff922e", b:"#ff4a35", c:"#ffe99d", d:"#913208" },
    pastel: { name:"Pastel Candy", bg:"#47302b", a:"#ff77a9", b:"#ff9b6f", c:"#ffe5a9", d:"#c45a7e" },
    lime: { name:"Lime Fusion", bg:"#142006", a:"#95df28", b:"#35c782", c:"#ecff99", d:"#396809" },
    mono: { name:"Monochrome", bg:"#101116", a:"#eeeeef", b:"#727681", c:"#ffffff", d:"#2e313a" }
  };

  const PRESETS = {
    studio: { theme:"crimson", mode:"blockWave", composition:"diagonal", density:8, shapeSize:100, spacing:24, rotation:18, roundness:48, variation:52, gradientType:"linear", gradientAngle:35, gradientStrength:76, colorMix:68, depth:"flat" },
    sunset: { theme:"sunset", mode:"gradientField", composition:"center", density:7, shapeSize:120, spacing:16, rotation:28, roundness:60, variation:42, gradientType:"radial", gradientAngle:80, gradientStrength:90, colorMix:76, depth:"offset" },
    electric: { theme:"electric", mode:"prismTiles", composition:"grid", density:12, shapeSize:95, spacing:14, rotation:42, roundness:16, variation:70, gradientType:"mixed", gradientAngle:120, gradientStrength:84, colorMix:62, depth:"flat" },
    pastel: { theme:"pastel", mode:"bubbleBloom", composition:"scatter", density:8, shapeSize:112, spacing:30, rotation:12, roundness:75, variation:48, gradientType:"radial", gradientAngle:210, gradientStrength:65, colorMix:74, depth:"flat" },
    mono: { theme:"mono", mode:"ringCluster", composition:"center", density:11, shapeSize:106, spacing:19, rotation:24, roundness:35, variation:32, gradientType:"linear", gradientAngle:25, gradientStrength:70, colorMix:34, depth:"offset" },
    lime: { theme:"lime", mode:"cornerBlocks", composition:"corners", density:7, shapeSize:125, spacing:12, rotation:32, roundness:22, variation:58, gradientType:"linear", gradientAngle:145, gradientStrength:78, colorMix:72, depth:"flat" }
  };


  const MODE_NAMES = [
    "Cyan Geometric Editorial","Pastel Editorial","Minimal Editorial","Abstract Editorial","Modern Editorial","Luxury Editorial","Bold Editorial","Fashion Editorial","Organic Editorial","Creative Editorial",
    "Abstract Geometry","Organic Geometry","Fluid Geometry","Soft Geometry","Bold Geometry","Minimal Geometry","Geometric Layers","Geometric Collage","Geometric Shapes","Geometric Waves",
    "Liquid Abstract","Fluid Abstract","Organic Abstract","Soft Abstract","Dreamy Abstract","Modern Abstract","Minimal Abstract","Bold Abstract","Contemporary Abstract","Experimental Abstract",
    "Bubble Abstract","Liquid Bubbles","Organic Bubbles","Soft Bubbles","Gradient Bubbles","Floating Bubbles","3D Bubbles","Bubble Composition","Bubble Pattern","Bubble Shapes",
    "Pastel Geometry","Pastel Abstract","Pastel Shapes","Pastel Gradient","Pastel Memphis","Pastel Collage","Pastel Organic","Pastel Wave","Pastel Blob","Pastel Minimal",
    "Retro Geometry","Retro Abstract","Retro Collage","Retro Shapes","Retro Wave","Retro Memphis","Retro Groovy","Vintage Geometry","Vintage Collage","Vintage Abstract",
    "Memphis Geometry","Memphis Shapes","Memphis Pattern","Memphis Abstract","Modern Memphis","Playful Geometry","Playful Shapes","Playful Abstract",
    "Color Block Abstract","Color Block Geometry","Gradient Geometry","Gradient Abstract","Gradient Mesh","Gradient Waves","Gradient Blobs","Iridescent Abstract","Chromatic Abstract","Prismatic Abstract","Holographic Abstract","Neon Abstract",
    "Minimal Organic","Organic Blobs","Organic Shapes","Organic Waves","Organic Lines","Organic Forms","Organic Composition","Soft Organic","Natural Abstract","Biomorphic Shapes","Marble Abstract","Liquid Marble","Stone Abstract",
    "Ink Abstract","Ink Shapes","Ink Flow","Paint Flow","Paint Splash","Brush Abstract","Fluid Splash",
    "Mandala Geometry","Sacred Geometry","Kaleidoscope Pattern","Radial Pattern","Circular Pattern","Concentric Pattern","Ornamental Geometry","Decorative Geometry","Symmetrical Pattern","Geometric Ornament",
    "Botanical Abstract","Floral Abstract","Leaf Pattern","Botanical Shapes","Tropical Abstract","Nature Abstract","Petal Composition","Floral Geometry","Organic Floral","Botanical Pattern",
    "Art Deco Geometry","Art Nouveau Pattern","Moroccan Geometry","Islamic Geometry","Decorative Pattern","Luxury Pattern","Elegant Ornament","Classic Ornament","Modern Ornament","Ornamental Pattern",
    "Y2K Abstract","Y2K Geometry","Y2K Gradient","Y2K Bubble","Vaporwave Abstract","Synthwave Geometry","Cyber Gradient","Digital Abstract","Futuristic Geometry","Tech Abstract",
    "Halftone Abstract","Dot Pattern","Polka Dot Geometry","Grid Abstract","Checkerboard Abstract","Line Pattern","Wave Pattern","Spiral Pattern","Seamless Pattern","Abstract Pattern"
  ];

  const MODE_BY_VALUE = Object.fromEntries(MODE_NAMES.map((name,i)=>[`mode${String(i).padStart(3,'0')}`,name]));
  const MODE_INDEX = Object.fromEntries(MODE_NAMES.map((name,i)=>[name,i]));

  function hashString(str){ let h=2166136261>>>0; for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
  function currentModeName(){ return MODE_BY_VALUE[state.designMode] || state.designMode || MODE_NAMES[0]; }
  function modeFlavor(name){
    const n=name.toLowerCase();
    const idx=MODE_INDEX[name] ?? 0;
    let family='geometry';
    if(/bubble/.test(n)) family='bubble';
    else if(/editorial/.test(n)) family='editorial';
    else if(/organic|botanical|floral|leaf|nature|biomorphic|petal|biomorphic/.test(n)) family='organic';
    else if(/mandala|sacred|kaleidoscope|radial|circular|concentric|ornament|pattern/.test(n)) family='radial';
    else if(/retro|vintage|memphis|playful|y2k|vaporwave|synthwave|cyber/.test(n)) family='playful';
    else if(/liquid|fluid|marble|ink|paint|splash|brush|blob/.test(n)) family='fluid';
    else if(/gradient|iridescent|chromatic|prismatic|holographic|neon/.test(n)) family='gradient';
    else if(/minimal/.test(n)) family='minimal';
    else if(/color block/.test(n)) family='blocks';
    else if(/grid|checkerboard|dot|polka|line|wave|spiral|seamless/.test(n)) family='pattern';
    else if(/luxury|art deco|art nouveau|moroccan|islamic|elegant|classic/.test(n)) family='luxury';
    const families={bubble:1,organic:2,fluid:3,radial:4,playful:5,gradient:6,minimal:7,blocks:8,pattern:9,luxury:10,editorial:11,geometry:0};
    return {index:idx,family,renderer:(families[family]??0),phase:(hashString(name)%360),scale:0.78+(hashString(name+'s')%46)/100,skew:(hashString(name+'k')%100)/100};
  }

  const state = {
    posterCount:5, designMode:"blockWave", composition:"auto", theme:"crimson",
    depth:"flat", shapeSize:100, density:8, spacing:24, rotation:18, roundness:48,
    variation:52, gradientType:"linear", gradientAngle:35, gradientStrength:76, colorMix:68,
    depthOffset:18, edgeMargin:8, backgroundGradient:true, alternatePalette:true,
    format:"portrait", quality:"large", showText:true, titleText:"COLOR / FORM", subtitleText:"GENERATIVE STUDY", textAmount:82,
    seed:260902, colorA:"#ff3154", colorB:"#8f0d2d", colorC:"#ffe4d6"
  };

  let generated = [];
  let zoom = 1;

  function dims(){
    const base = {portrait:{w:1200,h:1800},square:{w:1600,h:1600},landscape:{w:1800,h:1200}}[state.format];
    const q = {standard:1,large:1.35,xl:1.8}[state.quality];
    return {w:Math.round(base.w*q),h:Math.round(base.h*q)};
  }

  function hexToRgb(hex){
    const s = String(hex).replace("#","");
    const clean = s.length === 3 ? s.split("").map(x=>x+x).join("") : s;
    const v = parseInt(clean,16) || 0;
    return {r:(v>>16)&255,g:(v>>8)&255,b:v&255};
  }
  function rgbToHex(r,g,b){ return "#"+[r,g,b].map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,"0")).join(""); }
  function mixHex(a,b,t){
    const A=hexToRgb(a), B=hexToRgb(b);
    return rgbToHex(A.r+(B.r-A.r)*t,A.g+(B.g-A.g)*t,A.b+(B.b-A.b)*t);
  }
  function rgba(hex, alpha){ const c=hexToRgb(hex); return `rgb(${c.r} ${c.g} ${c.b} / ${clamp(alpha,0,1)})`; }
  function normalizeAngle(deg){ return ((deg%360)+360)%360; }
  function sizeFactor(){ return clamp(Number(state.shapeSize)/100,.35,1.7); }
  function gradientMix(){ return Number(state.gradientStrength)/100; }
  function rndSeed(seed){
    let a = (seed >>> 0) || 1;
    return () => {
      a += 0x6D2B79F5;
      let t=a;
      t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61);
      return ((t^t>>>14)>>>0)/4294967296;
    };
  }
  function randomInt(rnd,a,b){ return Math.floor(a+rnd()*(b-a+1)); }
  function selectedComposition(index,rnd){
    if(state.composition!=="auto") return state.composition;
    return ["center","diagonal","corners","grid","scatter"][index%5];
  }

  function palette(index){
    const theme=THEMES[state.theme] || THEMES.crimson;
    const mode=currentModeName(), flav=modeFlavor(mode);
    const rotate=state.alternatePalette ? index : 0;
    const shift=((rotate%3)*.14 + (flav.phase%37)/220);
    const a=mixHex(state.colorA,theme.a,shift);
    const b=mixHex(state.colorB,theme.b,shift*.9);
    const c=mixHex(state.colorC,theme.c,Math.min(.55,shift*.85));
    const d=theme.d;
    return { bg:theme.bg,a,b,c,d,a2:mixHex(a,c,.34+(flav.skew*.12)),b2:mixHex(b,c,.28+(flav.skew*.10)),dark:mixHex(theme.bg,b,.42) };
  }

  function gradientDef(id, kind, x1,y1,x2,y2, p){
    if(kind==="radial"){
      return `<radialGradient id="${id}" cx="50%" cy="42%" r="72%"><stop offset="0%" stop-color="${p.c}"/><stop offset="42%" stop-color="${p.a}"/><stop offset="100%" stop-color="${p.b}"/></radialGradient>`;
    }
    return `<linearGradient id="${id}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%"><stop offset="0%" stop-color="${p.b}"/><stop offset="${Math.round(35 + gradientMix()*30)}%" stop-color="${p.a}"/><stop offset="100%" stop-color="${p.c}"/></linearGradient>`;
  }
  function defs(id,p,rnd){
    const a=normalizeAngle(state.gradientAngle)*Math.PI/180;
    const dx=Math.cos(a)*50, dy=Math.sin(a)*50;
    const x1=50-dx, y1=50-dy, x2=50+dx, y2=50+dy;
    const mixed=gradientDef(`${id}_lin` ,"linear",x1,y1,x2,y2,p);
    const radial=gradientDef(`${id}_rad`,"radial",0,0,0,0,p);
    const second=gradientDef(`${id}_alt`,"linear",x2,y2,x1,y1,{...p,a:p.a2,b:p.b2,c:p.c,d:p.d});
    return `<defs>${mixed}${radial}${second}</defs>`;
  }

  function fill(id, type, p, rnd){
    if(state.gradientType==="solid") return [p.a,p.b,p.c,p.d][randomInt(rnd,0,3)];
    if(type==="radial") return `url(#${id}_rad)`;
    if(type==="alt") return `url(#${id}_alt)`;
    if(state.gradientType==="mixed" && rnd()>.48) return `url(#${id}_rad)`;
    return `url(#${id}_lin)`;
  }

  function rxFor(w, base){ return clamp(base*state.roundness/100,0,base); }

  function rect(x,y,w,h,fillValue,rx=0,rot=0,cx=x+w/2,cy=y+h/2){
    const r=rot ? ` transform="rotate(${rot.toFixed(2)} ${cx.toFixed(1)} ${cy.toFixed(1)})"` : "";
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${rx.toFixed(1)}" fill="${fillValue}"${r}/>`;
  }
  function circle(cx,cy,r,fillValue){ return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${fillValue}"/>`; }
  function ellipse(cx,cy,rx,ry,fillValue,rot=0){ return `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${fillValue}"${rot?` transform="rotate(${rot.toFixed(2)} ${cx.toFixed(1)} ${cy.toFixed(1)})"`:""}/>`; }
  function polygon(points,fillValue){ return `<polygon points="${points.map(p=>`${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")}" fill="${fillValue}"/>`; }

  function background(id,w,h,p){
    if(state.backgroundGradient && state.gradientType!=="solid") return `<rect width="${w}" height="${h}" fill="${state.gradientType==="radial"?`url(#${id}_rad)`: `url(#${id}_lin)`}"/>`;
    return `<rect width="${w}" height="${h}" fill="${p.bg}"/>`;
  }

  function shadowLayer(shapeFn){
    if(state.depth!=="offset" || Number(state.depthOffset)<=0) return "";
    return shapeFn(state.depthOffset,state.depthOffset,true);
  }

  function blockWave(id,w,h,p,rnd,index){
    let out=""; const s=sizeFactor(), d=Number(state.density), bias=selectedComposition(index,rnd);
    const count=Math.max(5,d);
    const gap=Number(state.spacing)/100;
    const baseW=w*(.14+.10*(1-gap))*s;
    const baseH=h*(.10+.035*(1-gap))*s;
    const cols=Math.max(4,Math.ceil(count/2));
    for(let i=0;i<count;i++){
      let x=w*(.10 + (i/(Math.max(1,count-1)))*.80);
      let y=h*(.18 + (i%2)*.44 + (rnd()-.5)*.10);
      if(bias==="center") { x += (w*.5-x)*.18; y += (h*.5-y)*.18; }
      if(bias==="diagonal") y += (x/w-.5)*h*.28;
      if(bias==="corners") x = i%2 ? w*.72 : w*.20;
      const ww=baseW*(.78+rnd()*(.56+state.variation/120));
      const hh=baseH*(.82+rnd()*(.42+state.variation/140));
      const rot=(rnd()-.5)*Number(state.rotation)*1.7;
      const rx=rxFor(Math.min(ww,hh), Math.min(ww,hh)*.50);
      const f=fill(id,i%2?"alt":"linear",p,rnd);
      const sh=shadowLayer((ox,oy)=>rect(x+ox-ww/2,y+oy-hh/2,ww,hh, p.d, rx, rot,x+ox,y+oy));
      out+=sh+rect(x-ww/2,y-hh/2,ww,hh,f,rx,rot,x,y);
    }
    if(bias==="grid"){
      const side=Math.min(w,h)*.36*s;
      out += rect(w*.5-side/2,h*.5-side/2,side,side,fill(id,"radial",p,rnd),side*.12,0,w*.5,h*.5);
    }
    return out;
  }

  function bubbleBloom(id,w,h,p,rnd,index){
    let out=""; const s=sizeFactor(), count=Math.max(6,Math.floor(Number(state.density)*.85)), bias=selectedComposition(index,rnd);
    for(let i=0;i<count;i++){
      let cx=w*(.10+rnd()*.80), cy=h*(.12+rnd()*.76);
      if(bias==="center"){cx=w*(.28+rnd()*.44); cy=h*(.23+rnd()*.54)}
      if(bias==="corners"){cx=i%2?w*(.70+rnd()*.18):w*(.08+rnd()*.18); cy=i%2?h*(.68+rnd()*.18):h*(.08+rnd()*.18)}
      const r=Math.min(w,h)*(.055+rnd()*.12)*s*(.82+state.variation/180);
      const f=fill(id,i%3===0?"radial":"linear",p,rnd);
      if(state.depth==="offset") out+=circle(cx+Number(state.depthOffset),cy+Number(state.depthOffset),r,p.d);
      out+=circle(cx,cy,r,f);
      if(state.roundness>65 && r>26) out+=circle(cx-r*.28,cy-r*.30,r*.18,p.c);
    }
    return out;
  }

  function orbitTiles(id,w,h,p,rnd,index){
    let out=""; const s=sizeFactor(), n=Math.max(6,Number(state.density)), cx=w*(.5+(rnd()-.5)*.06), cy=h*(.50+(rnd()-.5)*.08), radius=Math.min(w,h)*.28*s;
    for(let i=0;i<n;i++){
      const a=i*TAU/n + (rnd()-.5)*.2;
      const rr=radius*(.68+rnd()*.42);
      const x=cx+Math.cos(a)*rr, y=cy+Math.sin(a)*rr;
      const size=Math.min(w,h)*(.06+rnd()*.045)*s;
      const f=fill(id,i%2?"alt":"linear",p,rnd);
      const sh=shadowLayer((ox,oy)=>{ const pts=[[x-size+ox,y-size+oy],[x+size+ox,y-size+oy],[x+size+ox,y+size+oy],[x-size+ox,y+size+oy]]; return polygon(pts,p.d); });
      out+=sh+rect(x-size,y-size,size*2,size*2,f,size*.12,(a*180/Math.PI)+Number(state.rotation),x,y);
    }
    out+=circle(cx,cy,radius*.42,fill(id,"radial",p,rnd));
    return out;
  }

  function archStack(id,w,h,p,rnd){
    let out=""; const layers=Math.max(5,Math.floor(Number(state.density)*.7)), s=sizeFactor();
    const centerX=w*(.50+(rnd()-.5)*.08), baseY=h*.80;
    for(let i=0;i<layers;i++){
      const ww=w*(.30+i*(.10+Number(state.spacing)/1000))*s;
      const hh=h*(.16+i*.045)*s;
      const rx=ww*.50;
      const y=baseY-hh;
      const f=fill(id,i%2?"radial":"linear",p,rnd);
      if(state.depth==="offset") out+=rect(centerX-ww/2+Number(state.depthOffset),y+Number(state.depthOffset),ww,hh,p.d,rx,0,centerX+Number(state.depthOffset),y+hh/2+Number(state.depthOffset));
      out+=rect(centerX-ww/2,y,ww,hh,f,rx);
    }
    return out;
  }

  function capsuleGrid(id,w,h,p,rnd){
    let out=""; const cols=Math.max(3,Math.min(6,Math.floor(Number(state.density)/2))), rows=Math.max(3,Math.min(8,Math.floor(Number(state.density)*.65))), s=sizeFactor();
    const cellW=w/(cols+1), cellH=h/(rows+1);
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
      const x=cellW*(c+1), y=cellH*(r+1), ww=cellW*(.56+state.variation/250)*s, hh=cellH*(.45+state.variation/300)*s;
      const rot=(rnd()-.5)*Number(state.rotation);
      const f=fill(id,(r+c)%3===0?"radial":"linear",p,rnd);
      if(state.depth==="offset") out+=rect(x-ww/2+state.depthOffset,y-hh/2+state.depthOffset,ww,hh,p.d,Math.min(ww,hh)/2,rot,x+state.depthOffset,y+state.depthOffset);
      out+=rect(x-ww/2,y-hh/2,ww,hh,f,Math.min(ww,hh)/2,rot,x,y);
    }
    return out;
  }

  function prismTiles(id,w,h,p,rnd){
    let out=""; const n=Math.max(5,Math.floor(Number(state.density)*.8)), s=sizeFactor();
    for(let i=0;i<n;i++){
      const cx=w*(.12+rnd()*.76), cy=h*(.12+rnd()*.76), r=Math.min(w,h)*(.08+rnd()*.11)*s;
      const sides=3+randomInt(rnd,0,3), rot=normalizeAngle(Number(state.rotation)*2+rnd()*45);
      const pts=[];
      for(let k=0;k<sides;k++){ const a=rot*Math.PI/180 + k*TAU/sides; pts.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r]); }
      if(state.depth==="offset"){
        const sh=pts.map(q=>[q[0]+Number(state.depthOffset),q[1]+Number(state.depthOffset)]);
        out+=polygon(sh,p.d);
      }
      out+=polygon(pts,fill(id,i%2?"alt":"radial",p,rnd));
      if(i%3===0){ const pts2=pts.map(q=>[(q[0]+cx)/2,(q[1]+cy)/2]); out+=polygon(pts2,p.c); }
    }
    return out;
  }

  function radialFan(id,w,h,p,rnd){
    let out=""; const count=Math.max(8,Number(state.density)*2), cx=w*(.50+(rnd()-.5)*.04), cy=h*(.58+(rnd()-.5)*.05), outer=Math.max(w,h)*.88*sized();
    function sized(){ return sizeFactor(); }
    const inner=Math.min(w,h)*.14*sizeFactor();
    for(let i=0;i<count;i++){
      const a1=Number(state.rotation)*Math.PI/180 + (i/count)*TAU;
      const a2=Number(state.rotation)*Math.PI/180 + ((i+1.2)/count)*TAU;
      const pts=[[cx+Math.cos(a1)*inner,cy+Math.sin(a1)*inner],[cx+Math.cos(a1)*outer,cy+Math.sin(a1)*outer],[cx+Math.cos(a2)*outer,cy+Math.sin(a2)*outer],[cx+Math.cos(a2)*inner,cy+Math.sin(a2)*inner]];
      out+=polygon(pts,fill(id,i%3===0?"radial":"linear",p,rnd));
    }
    out+=circle(cx,cy,inner*.86,p.c);
    return out;
  }

  function cornerBlocks(id,w,h,p,rnd){
    let out=""; const s=sizeFactor(), count=Math.max(4,Math.floor(Number(state.density)/2));
    const corners=[[w*.16,h*.18],[w*.84,h*.20],[w*.20,h*.80],[w*.78,h*.78]];
    for(let i=0;i<count;i++){
      const [cx,cy]=corners[i%4], ww=w*(.20+rnd()*.18)*s, hh=h*(.10+rnd()*.12)*s;
      const rot=((i%2?1:-1)*(12+rnd()*Number(state.rotation)));
      const f=fill(id,i%2?"alt":"linear",p,rnd);
      if(state.depth==="offset") out+=rect(cx-ww/2+state.depthOffset,cy-hh/2+state.depthOffset,ww,hh,p.d,rxFor(Math.min(ww,hh),Math.min(ww,hh)/2),rot,cx+state.depthOffset,cy+state.depthOffset);
      out+=rect(cx-ww/2,cy-hh/2,ww,hh,f,rxFor(Math.min(ww,hh),Math.min(ww,hh)/2),rot,cx,cy);
    }
    out+=circle(w*.5,h*.5,Math.min(w,h)*.08*s,fill(id,"radial",p,rnd));
    return out;
  }

  function ringCluster(id,w,h,p,rnd){
    let out=""; const count=Math.max(6,Math.floor(Number(state.density)*.8)), s=sizeFactor(), centerX=w*(.50+(rnd()-.5)*.08), centerY=h*(.47+(rnd()-.5)*.08);
    for(let i=0;i<count;i++){
      const r=Math.min(w,h)*(.08+i*.065)*s;
      const dx=(rnd()-.5)*w*.08, dy=(rnd()-.5)*h*.08;
      const outer=ellipse(centerX+dx,centerY+dy,r,r,fill(id,i%2?"alt":"radial",p,rnd),0);
      const inner=ellipse(centerX+dx,centerY+dy,r*.54,r*.54,p.bg,0);
      if(state.depth==="offset") out+=ellipse(centerX+dx+state.depthOffset,centerY+dy+state.depthOffset,r,r,p.d,0);
      out+=outer+inner;
    }
    return out;
  }

  function mosaicSteps(id,w,h,p,rnd){
    let out=""; const steps=Math.max(7,Number(state.density)+2), s=sizeFactor();
    for(let i=0;i<steps;i++){
      const t=i/(steps-1), ww=w*(.20+t*.66)*s, hh=h*(.055+t*.03)*s, x=w*.5-ww*.5, y=h*(.18+t*.70), rot=(rnd()-.5)*Number(state.rotation);
      const f=fill(id,i%3===0?"radial":"linear",p,rnd);
      if(state.depth==="offset") out+=rect(x+state.depthOffset,y+state.depthOffset,ww,hh,p.d,hh*.5,rot,w*.5+state.depthOffset,y+hh/2+state.depthOffset);
      out+=rect(x,y,ww,hh,f,hh*.5,rot,w*.5,y+hh/2);
    }
    return out;
  }

  function gradientField(id,w,h,p,rnd){
    let out="";
    const panels=6+Math.floor(Number(state.density)/3), s=sizeFactor();
    out+=rect(w*.07,h*.08,w*.86,h*.84,fill(id,"linear",p,rnd),Math.min(w,h)*.06*s);
    for(let i=0;i<panels;i++){
      const x=w*(.08+rnd()*.72), y=h*(.10+rnd()*.66), ww=w*(.18+rnd()*.30)*s, hh=h*(.08+rnd()*.18)*s;
      const f=fill(id,i%2?"radial":"alt",p,rnd), rot=(rnd()-.5)*Number(state.rotation)*2;
      if(state.depth==="offset") out+=rect(x+state.depthOffset,y+state.depthOffset,ww,hh,p.d,hh*.32,rot,x+ww/2+state.depthOffset,y+hh/2+state.depthOffset);
      out+=rect(x,y,ww,hh,f,hh*.32,rot,x+ww/2,y+hh/2);
    }
    return out;
  }

  function pebbleScatter(id,w,h,p,rnd){
    let out=""; const count=Math.max(8,Number(state.density)+3), s=sizeFactor(), bias=selectedComposition(0,rnd);
    for(let i=0;i<count;i++){
      let x=w*(.08+rnd()*.84), y=h*(.08+rnd()*.84);
      if(bias==="center"){x=w*(.25+rnd()*.5);y=h*(.18+rnd()*.64)}
      const rx=w*(.035+rnd()*.10)*s, ry=h*(.025+rnd()*.07)*s, rot=rnd()*180;
      const f=fill(id,i%2?"radial":"linear",p,rnd);
      if(state.depth==="offset") out+=ellipse(x+state.depthOffset,y+state.depthOffset,rx,ry,p.d,rot);
      out+=ellipse(x,y,rx,ry,f,rot);
    }
    return out;
  }

  function layout(id,w,h,p,rnd,index){
    const mode=currentModeName(), flav=modeFlavor(mode);
    const legacy={blockWave,bubbleBloom,orbitTiles,archStack,capsuleGrid,prismTiles,radialFan,cornerBlocks,ringCluster,mosaicSteps,gradientField,pebbleScatter};
    // The 150 named modes use the same fully editable primitive engine, but each mode
    // gets a different renderer family and deterministic flavor from its name.
    const families=[blockWave, bubbleBloom, orbitTiles, pebbleScatter, ringCluster, prismTiles, gradientField, archStack, cornerBlocks, mosaicSteps, radialFan, capsuleGrid];
    let fn=legacy[state.designMode];
    if(!fn) fn=families[flav.renderer%families.length];
    const themedIndex=index + (flav.phase%17);
    return fn(id,w,h,p,rnd,themedIndex);
  }

  function textLayer(index,w,h,p){
    if(!state.showText || Number(state.textAmount)<=0) return "";
    const title=esc(state.titleText||"COLOR / FORM"), sub=esc(state.subtitleText||"GENERATIVE STUDY");
    const rawColor=state.theme==="mono"?"#ffffff":(index%2===0?p.c:"#ffffff");
    const textBlend=1-Number(state.textAmount)/100;
    const color=mixHex(rawColor,p.bg,textBlend*.55);
    const fs=Math.round(Math.min(w,h)*.028);
    const big=Math.round(Math.min(w,h)*.075);
    return `<g fill="${color}" font-family="Arial, Helvetica, sans-serif"><text x="${(w*.075).toFixed(1)}" y="${(h*.11).toFixed(1)}" font-size="${big}" font-weight="900" letter-spacing="2">${title}</text><text x="${(w*.078).toFixed(1)}" y="${(h*.14).toFixed(1)}" font-size="${Math.max(18,Math.round(fs*.42))}" font-weight="700" letter-spacing="4">${sub}</text><text x="${(w*.08).toFixed(1)}" y="${(h*.925).toFixed(1)}" font-size="${Math.max(16,Math.round(fs*.32))}" font-weight="800" letter-spacing="3">ALI STUDIO / ${String(index+1).padStart(2,"0")}</text></g>`;
  }

  function makeSvg(index){
    const {w,h}=dims();
    const rnd=rndSeed((Number(state.seed)||1)+index*9719+hashString(currentModeName()));
    const p=palette(index);
    const id=`ali_${Number(state.seed)||1}_${index}`;
    let out=defs(id,p,rnd);
    out+=background(id,w,h,p);
    out+=layout(id,w,h,p,rnd,index);
    out+=textLayer(index,w,h,p);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><title>ALI STUDIO — ${esc(THEMES[state.theme]?.name||state.theme)} — Design ${String(index+1).padStart(2,"0")}</title><metadata>Generated locally by ALI STUDIO. Shape fills and SVG gradients only.</metadata>${out}</svg>`;
  }

  function makeCombinedSvg(){
    const {w:pw,h:ph}=dims(); const count=Number(state.posterCount), cols=Math.min(4,Math.max(1,count)), rows=Math.ceil(count/cols), gap=40;
    const aw=pw*cols+gap*(cols+1), ah=ph*rows+gap*(rows+1);
    let out=`<svg xmlns="http://www.w3.org/2000/svg" width="${aw}" height="${ah}" viewBox="0 0 ${aw} ${ah}"><title>ALI STUDIO Collection</title><rect width="${aw}" height="${ah}" fill="#eceef2"/>`;
    for(let i=0;i<count;i++){
      const x=gap+(i%cols)*(pw+gap), y=gap+Math.floor(i/cols)*(ph+gap);
      const svg=makeSvg(i).replace(/^<svg[^>]*>/,"").replace(/<\/svg>\s*$/i,"");
      out+=`<g transform="translate(${x} ${y})">${svg}</g>`;
    }
    return out+"</svg>";
  }

  function download(filename,content,mime="image/svg+xml"){
    const blob=new Blob([content],{type:mime}), a=document.createElement("a");
    a.href=URL.createObjectURL(blob); a.download=filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }
  async function copyText(text){
    try{await navigator.clipboard.writeText(text); alert("SVG copied to clipboard.");}
    catch{const ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove();alert("SVG copied to clipboard.");}
  }

  function syncThemeColors(force=true){
    const t=THEMES[$("theme")?.value]||THEMES.crimson;
    if(force){ $("colorA").value=t.a; $("colorB").value=t.b; $("colorC").value=t.c; }
  }

  function readControls(){
    const numbers=["posterCount","shapeSize","density","spacing","rotation","roundness","variation","gradientAngle","gradientStrength","colorMix","depthOffset","edgeMargin","textAmount"];
    numbers.forEach(k=>{ if($(k)) state[k]=Number($(k).value); });
    ["designMode","composition","theme","gradientType","format","quality","titleText","subtitleText","seed","colorA","colorB","colorC"].forEach(k=>{if($(k)) state[k]=$(k).value;});
    state.seed=Number(state.seed)||1;
    ["alternatePalette","backgroundGradient","showText"].forEach(k=>{if($(k)) state[k]=$(k).checked;});
    const seg=document.querySelector(".segment.active"); if(seg) state.depth=seg.dataset.depth;
  }

  const OUTS={
    posterCount:["posterCountVal",v=>v],shapeSize:["shapeSizeVal",v=>`${v}%`],density:["densityVal",v=>v],spacing:["spacingVal",v=>`${v}%`],rotation:["rotationVal",v=>`${v}°`],roundness:["roundnessVal",v=>`${v}%`],variation:["variationVal",v=>`${v}%`],gradientAngle:["gradientAngleVal",v=>`${v}°`],gradientStrength:["gradientStrengthVal",v=>`${v}%`],colorMix:["colorMixVal",v=>`${v}%`],depthOffset:["depthOffsetVal",v=>`${v}px`],edgeMargin:["edgeMarginVal",v=>`${v}%`],textAmount:["textAmountVal",v=>`${v}%`]
  };
  function updateOutputs(){
    Object.entries(OUTS).forEach(([id,[oid,fn]])=>{if($(oid)&&$(id))$(oid).textContent=fn($(id).value)});
    if($("collectionCount"))$("collectionCount").textContent=state.posterCount;
    if($("collectionHint"))$("collectionHint").textContent=`${state.posterCount} VARIATION${state.posterCount===1?"":"S"}`;
    const opt=$("designMode")?.options[$("designMode")?.selectedIndex];
    if(opt&&$("workspaceTitle"))$("workspaceTitle").textContent=opt.text.toUpperCase();
    if($("statusMode"))$("statusMode").textContent=state.depth==="offset"?"OFFSET FILL ENGINE":"FILL + GRADIENT ENGINE";
    if($("statusText"))$("statusText").textContent=state.gradientType==="solid"?"Solid colors only · no SVG effects":"No SVG effects · clean scalable shapes";
    if($("workspaceSubtitle"))$("workspaceSubtitle").textContent=`${THEMES[state.theme]?.name||state.theme} · ${state.gradientType} gradients · ${state.depth} layering`;
    const d=dims(); if($("previewSpec"))$("previewSpec").textContent=`${d.w} × ${d.h}`;
  }

  function applyZoom(){
    const grid=$("posterGrid"); if(!grid)return;
    grid.style.transform=`scale(${zoom})`;
    if($("zoomLabel"))$("zoomLabel").textContent=`${Math.round(zoom*100)}%`;
    const diff=grid.offsetHeight*zoom-grid.offsetHeight; grid.style.marginBottom=`${Math.max(70,diff+70)}px`;
  }

  function render(){
    try{
      readControls(); updateOutputs(); generated=[]; const grid=$("posterGrid"); if(!grid)return; grid.innerHTML="";
      const tpl=$("posterTemplate"); if(!tpl)return;
      for(let i=0;i<state.posterCount;i++){
        const node=tpl.content.firstElementChild.cloneNode(true); const svg=makeSvg(i); generated.push(svg);
        node.querySelector(".poster-number").textContent=`DESIGN ${String(i+1).padStart(2,"0")}`;
        node.querySelector(".poster-mode").textContent=`${state.depth.toUpperCase()} / ${String(i+1).padStart(2,"0")}`;
        node.querySelector(".poster-frame").innerHTML=svg;
        node.querySelector(".download-one").addEventListener("click",()=>download(`ali-studio-${state.theme}-${String(i+1).padStart(2,"0")}.svg`,svg));
        node.querySelector(".copy-one").addEventListener("click",()=>copyText(svg));
        grid.appendChild(node);
      }
      grid.style.gridTemplateColumns=`repeat(${Math.min(window.innerWidth<1180?3:4,state.posterCount)},minmax(0,1fr))`;
      applyZoom();
    }catch(e){console.error("Render Error",e)}
  }

  function applyPreset(name){
    const p=PRESETS[name]; if(!p)return;
    Object.entries(p).forEach(([k,v])=>{ const target=(k==="mode"?"designMode":k); if($(target)) $(target).value=v; state[target]=v; });
    if($("theme")){$("theme").value=p.theme; syncThemeColors(true);}
    const seg=document.querySelectorAll(".segment"); seg.forEach(b=>b.classList.toggle("active",b.dataset.depth===(p.depth||"flat")));
    readControls(); updateOutputs(); render();
  }

  function randomize(){
    const themes=Object.keys(THEMES);
    $("seed").value=Math.floor(Math.random()*99999999)+1;
    $("theme").value=themes[randomInt(Math.random,0,themes.length-1)]; syncThemeColors(true);
    $("designMode").value=`mode${String(randomInt(Math.random,0,MODE_NAMES.length-1)).padStart(3,"0")}`;
    $("composition").value=["auto","center","diagonal","corners","grid","scatter"][randomInt(Math.random,0,5)];
    $("shapeSize").value=randomInt(Math.random,70,145); $("density").value=randomInt(Math.random,5,18); $("spacing").value=randomInt(Math.random,8,48);
    $("rotation").value=randomInt(Math.random,5,65); $("roundness").value=randomInt(Math.random,10,88); $("variation").value=randomInt(Math.random,15,85);
    $("gradientAngle").value=randomInt(Math.random,0,360); $("gradientStrength").value=randomInt(Math.random,45,100); $("colorMix").value=randomInt(Math.random,35,92);
    $("gradientType").value=["linear","radial","mixed"][randomInt(Math.random,0,2)];
    const randomDepth=Math.random()>.18?"flat":"offset"; document.querySelectorAll(".segment").forEach(b=>b.classList.toggle("active",b.dataset.depth===randomDepth));
    readControls();updateOutputs();render();
  }

  function resetAll(){
    location.reload();
  }

  const liveIds=["posterCount","designMode","composition","theme","shapeSize","density","spacing","rotation","roundness","variation","gradientType","gradientAngle","gradientStrength","colorMix","depthOffset","edgeMargin","format","quality","titleText","subtitleText","textAmount","seed","colorA","colorB","colorC"];
  liveIds.forEach(id=>{const el=$(id); if(!el)return; el.addEventListener("input",()=>{updateOutputs();render()}); el.addEventListener("change",()=>{if(id==="theme")syncThemeColors(true);updateOutputs();render()});});
  ["alternatePalette","backgroundGradient","showText"].forEach(id=>{$(id)?.addEventListener("change",()=>{updateOutputs();render()})});
  document.querySelectorAll(".segment").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll(".segment").forEach(b=>b.classList.remove("active"));btn.classList.add("active");updateOutputs();render()}));
  document.querySelectorAll(".preset").forEach(btn=>btn.addEventListener("click",()=>applyPreset(btn.dataset.preset)));
  $("regenerate")?.addEventListener("click",render); $("randomize")?.addEventListener("click",randomize); $("randomizeTop")?.addEventListener("click",randomize); $("resetAll")?.addEventListener("click",resetAll);
  $("downloadAll")?.addEventListener("click",()=>download(`ali-studio-${state.theme}-collection.svg`,makeCombinedSvg()));
  $("downloadJson")?.addEventListener("click",()=>download("ali-studio-settings.json",JSON.stringify(state,null,2),"application/json"));
  $("zoomIn")?.addEventListener("click",()=>{zoom=clamp(zoom+.1,.3,2);applyZoom()}); $("zoomOut")?.addEventListener("click",()=>{zoom=clamp(zoom-.1,.3,2);applyZoom()});
  window.addEventListener("resize",()=>{if($("posterGrid"))render()});

  updateOutputs(); render();
})();
