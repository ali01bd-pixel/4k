(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const TAU = Math.PI * 2;
  const clamp = (n,a,b) => Math.max(a, Math.min(b,n));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]));

  const THEMES = {
    cyan:   { name:"Cyan Editorial", bg:"#070b13", a:"#21d4ff", b:"#5861ff", c:"#ff5b6e", d:"#161327" },
    magenta:{ name:"Magenta Editorial", bg:"#10070f", a:"#ff3cac", b:"#7b4dff", c:"#ff8f70", d:"#240d24" },
    sunset: { name:"Sunset Editorial", bg:"#160a0b", a:"#ff6a3d", b:"#ff2f75", c:"#ffcf69", d:"#351117" },
    aqua:   { name:"Aqua Editorial", bg:"#061316", a:"#20e6e8", b:"#398bff", c:"#7dfff0", d:"#0e2736" },
    violet: { name:"Violet Editorial", bg:"#0d081a", a:"#8e5bff", b:"#ef4cff", c:"#ff91c8", d:"#221338" },
    pastel: { name:"Pastel Editorial", bg:"#151216", a:"#ff8cb8", b:"#8d8bff", c:"#ffcf9d", d:"#30202d" },
    lime:   { name:"Lime Editorial", bg:"#081305", a:"#b5f34a", b:"#38d5a0", c:"#d7ff8a", d:"#18310e" },
    mono:   { name:"Monochrome Editorial", bg:"#090a0d", a:"#dcdfe8", b:"#7d8291", c:"#ffffff", d:"#24262e" }
  };

  const state = {
    posterCount:5, designMode:"gradientEditorial", composition:"auto", theme:"cyan",
    shapeSize:105, density:8, spacing:22, rotation:18, roundness:62, variation:58,
    gradientType:"mixed", gradientAngle:35, gradientStrength:90, colorMix:72,
    depth:"flat", depthOffset:18, edgeMargin:7, backgroundGradient:false, alternatePalette:true,
    format:"portrait", quality:"large", showText:true,
    titleText:"GRADIENT", subtitleText:"EDITORIAL DESIGN", textAmount:82,
    seed:260903, colorA:"#21d4ff", colorB:"#5861ff", colorC:"#ff5b6e"
  };

  let generated = [], zoom = 1;

  function dims(){
    const base={portrait:{w:1200,h:1800},square:{w:1600,h:1600},landscape:{w:1800,h:1200}}[state.format];
    const q={standard:1,large:1.35,xl:1.8}[state.quality];
    return {w:Math.round(base.w*q),h:Math.round(base.h*q)};
  }
  function hexToRgb(hex){
    const s=String(hex||"").replace("#",""); const clean=s.length===3?s.split("").map(x=>x+x).join(""):s; const v=parseInt(clean,16)||0;
    return {r:(v>>16)&255,g:(v>>8)&255,b:v&255};
  }
  function rgbToHex(r,g,b){return "#"+[r,g,b].map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,"0")).join("");}
  function mixHex(a,b,t){const A=hexToRgb(a),B=hexToRgb(b);return rgbToHex(A.r+(B.r-A.r)*t,A.g+(B.g-A.g)*t,A.b+(B.b-A.b)*t);}
  function hashString(str){let h=2166136261>>>0;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
  function rng(seed){let a=(seed>>>0)||1;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
  function sizeFactor(){return clamp(Number(state.shapeSize)/100,.35,1.75);}
  function norm(deg){return ((deg%360)+360)%360;}

  function palette(index,rnd){
    const t=THEMES[state.theme]||THEMES.cyan;
    const drift=state.alternatePalette?((index%5)*.11):0;
    const mix=Number(state.colorMix)/100;
    const a=mixHex(state.colorA||t.a,t.a,drift*.55+(.15*(1-mix)));
    const b=mixHex(state.colorB||t.b,t.b,drift*.42+(.12*(1-mix)));
    const c=mixHex(state.colorC||t.c,t.c,drift*.35);
    const phase=rnd();
    return {bg:t.bg,a,b,c,d:t.d,hi:mixHex(c,"#ffffff",.18+phase*.12),dark:mixHex(t.bg,b,.35)};
  }

  function addGradient(defs,id,kind,p,angle=state.gradientAngle,shift=0){
    const strength=Number(state.gradientStrength)/100;
    if(kind==="radial"){
      const outer=mixHex(p.b,p.dark,Math.max(0,.35-strength*.35));
      defs.push(`<radialGradient id="${id}" cx="35%" cy="32%" r="78%"><stop offset="0%" stop-color="${p.hi}"/><stop offset="${Math.round(20+strength*35)}%" stop-color="${p.a}"/><stop offset="72%" stop-color="${p.b}"/><stop offset="100%" stop-color="${outer}"/></radialGradient>`);
      return `url(#${id})`;
    }
    const rad=norm(Number(angle)+shift)*Math.PI/180, dx=Math.cos(rad)*50, dy=Math.sin(rad)*50;
    defs.push(`<linearGradient id="${id}" x1="${(50-dx).toFixed(2)}%" y1="${(50-dy).toFixed(2)}%" x2="${(50+dx).toFixed(2)}%" y2="${(50+dy).toFixed(2)}%"><stop offset="0%" stop-color="${p.b}"/><stop offset="${Math.round(30+strength*28)}%" stop-color="${p.a}"/><stop offset="${Math.round(68+strength*22)}%" stop-color="${p.c}"/><stop offset="100%" stop-color="${p.hi}"/></linearGradient>`);
    return `url(#${id})`;
  }
  function makeDefs(id,p,rnd){
    const defs=[];
    const primary=addGradient(defs,id+"_g1",state.gradientType==="radial"?"radial":"linear",p,state.gradientAngle,0);
    const secondary=addGradient(defs,id+"_g2",state.gradientType==="linear"?"linear":"radial",p,state.gradientAngle+90,35);
    const third=addGradient(defs,id+"_g3","linear",{...p,a:p.b,b:p.c,c:p.a,hi:p.hi,d:p.d},state.gradientAngle+180,-25);
    return {defs:defs.join(""),primary,secondary,third};
  }

  const rect=(x,y,w,h,fill,rx=0,rot=0,cx=x+w/2,cy=y+h/2)=>`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${rx.toFixed(1)}" fill="${fill}"${rot?` transform="rotate(${rot.toFixed(2)} ${cx.toFixed(1)} ${cy.toFixed(1)})"`:""}/>`;
  const circle=(cx,cy,r,fill)=>`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}"/>`;
  const ellipse=(cx,cy,rx,ry,fill,rot=0)=>`<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${fill}"${rot?` transform="rotate(${rot.toFixed(2)} ${cx.toFixed(1)} ${cy.toFixed(1)})"`:""}/>`;
  const polygon=(pts,fill)=>`<polygon points="${pts.map(p=>`${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")}" fill="${fill}"/>`;

  function fillFor(g,rnd,kind="primary"){
    if(state.gradientType==="solid") return [state.colorA,state.colorB,state.colorC][Math.floor(rnd()*3)];
    if(kind==="secondary") return g.secondary;
    if(kind==="third") return g.third;
    if(kind==="radial") return g.secondary;
    if(state.gradientType==="mixed" && rnd()>.55) return g.secondary;
    return g.primary;
  }

  function offsetShape(html, dx, dy){
    if(state.depth!=="offset" || Number(state.depthOffset)<=0) return html;
    return html.replace(/^<([a-z]+)(\s+)/, (_,tag,space)=>`<${tag}${space}transform="translate(${dx.toFixed(1)} ${dy.toFixed(1)})" `).replace(/\/>$/,`/>`);
  }

  function variantName(index){ return ["ORBITAL BLOOM","DIAGONAL RIBBON","SOFT OVERLAP","EDITORIAL ORBIT","MODULAR GRADIENT"][index%5]; }
  function compositionFor(index,rnd){
    if(state.composition!=="auto") return state.composition;
    return ["center","diagonal","scatter","corners","grid"][index%5];
  }

  function renderOrbital(w,h,p,g,rnd,index){
    let out=""; const s=sizeFactor(), m=Number(state.edgeMargin)/100, base=Math.min(w,h);
    const cx=w*(.34+rnd()*.10), cy=h*(.28+rnd()*.13); const rx=base*(.24+.06*rnd())*s, ry=base*(.17+.05*rnd())*s;
    const rot=-12-rnd()*Number(state.rotation)*.6;
    out+=ellipse(cx+state.depthOffset,cy+state.depthOffset,rx,ry,p.dark,rot).replace(state.depth==="offset"?"":p.dark,p.dark);
    if(state.depth!=="offset") out=out.replace(`<ellipse cx="${(cx+state.depthOffset).toFixed(1)}" cy="${(cy+state.depthOffset).toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${p.dark}" transform="rotate(${rot.toFixed(2)} ${(cx+state.depthOffset).toFixed(1)} ${(cy+state.depthOffset).toFixed(1)})"/>`,"");
    out+=ellipse(cx,cy,rx,ry,fillFor(g,rnd,"primary"),rot);
    const cx2=w*(.70+rnd()*.12), cy2=h*(.77+rnd()*.08), rx2=base*(.16+.05*rnd())*s, ry2=base*(.12+.04*rnd())*s;
    if(state.depth==="offset") out+=ellipse(cx2+state.depthOffset,cy2+state.depthOffset,rx2,ry2,p.dark,rot+8);
    out+=ellipse(cx2,cy2,rx2,ry2,fillFor(g,rnd,"secondary"),rot+8);
    const cx3=w*(.14+rnd()*.12), cy3=h*(.56+rnd()*.10), r3=base*(.07+.035*rnd())*s;
    if(state.depth==="offset") out+=circle(cx3+state.depthOffset,cy3+state.depthOffset,r3,p.dark);
    out+=circle(cx3,cy3,r3,fillFor(g,rnd,"third"));
    if(state.roundness>55) out+=ellipse(cx,cy-h*.015,rx*.30,ry*.16,g.third,rot-10);
    return out;
  }

  function renderDiagonal(w,h,p,g,rnd,index){
    let out=""; const s=sizeFactor(), count=5+Math.floor(Number(state.density)/2); const m=Number(state.edgeMargin)/100;
    const barW=w*(.10+.07*s), startX=-w*.24, gap=Number(state.spacing)/100*w*.045;
    for(let i=0;i<count;i++){
      const x=startX+i*(barW+gap), y=h*(.18+i*.045)+rnd()*h*.06;
      const ww=barW*(.62+rnd()*.75), hh=h*(.88+rnd()*.24)*s, rot=-22-rnd()*Number(state.rotation)*.5;
      const f=fillFor(g,rnd,i%3===0?"secondary":"primary");
      if(state.depth==="offset") out+=rect(x+state.depthOffset,y+state.depthOffset,ww,hh,p.dark,Math.min(ww,hh)*state.roundness/160,rot,x+ww/2+state.depthOffset,y+hh/2+state.depthOffset);
      out+=rect(x,y,ww,hh,f,Math.min(ww,hh)*state.roundness/160,rot,x+ww/2,y+hh/2);
    }
    const labelW=w*.42, labelH=h*.10, lx=w*.54, ly=h*.14;
    out+=rect(lx,ly,labelW,labelH,p.dark,labelH*.16,0,lx+labelW/2,ly+labelH/2);
    out+=rect(lx+labelW*.08,ly+labelH*.16,labelW*.84,labelH*.68,fillFor(g,rnd,"third"),labelH*.12);
    return out;
  }

  function renderSoftOverlap(w,h,p,g,rnd,index){
    let out=""; const s=sizeFactor(), base=Math.min(w,h), centerX=w*(.50+(rnd()-.5)*.06), centerY=h*(.52+(rnd()-.5)*.06);
    const pieces=5+Math.floor(Number(state.density)/3);
    for(let i=0;i<pieces;i++){
      const a=i*TAU/pieces+(rnd()-.5)*.3, r=base*(.16+.04*rnd())*s;
      const x=centerX+Math.cos(a)*base*.22, y=centerY+Math.sin(a)*base*.27;
      const rx=r*(.75+rnd()*.55), ry=r*(.42+rnd()*.45), rot=norm(a*180/Math.PI-20+Number(state.rotation)*(rnd()-.5));
      const f=fillFor(g,rnd,i%2?"secondary":"primary");
      if(state.depth==="offset") out+=ellipse(x+state.depthOffset,y+state.depthOffset,rx,ry,p.dark,rot);
      out+=ellipse(x,y,rx,ry,f,rot);
    }
    out+=circle(centerX,centerY,base*.11*s,p.c);
    return out;
  }

  function renderOrbit(w,h,p,g,rnd,index){
    let out=""; const s=sizeFactor(), base=Math.min(w,h), cx=w*(.53+rnd()*.06), cy=h*(.47+rnd()*.06);
    const big=base*.24*s;
    if(state.depth==="offset") out+=circle(cx+state.depthOffset,cy+state.depthOffset,big*.72,p.dark);
    out+=circle(cx,cy,big*.72,fillFor(g,rnd,"primary"));
    const count=5+Math.floor(Number(state.density)/2);
    for(let i=0;i<count;i++){
      const a=i*TAU/count+state.rotation*Math.PI/180, rr=big*(1.08+rnd()*.35), x=cx+Math.cos(a)*rr, y=cy+Math.sin(a)*rr;
      const ew=base*(.07+.04*rnd())*s, eh=base*(.11+.05*rnd())*s;
      if(state.depth==="offset") out+=ellipse(x+state.depthOffset,y+state.depthOffset,ew,eh,p.dark,a*180/Math.PI+25);
      out+=ellipse(x,y,ew,eh,fillFor(g,rnd,i%3?"secondary":"third"),a*180/Math.PI+25);
    }
    out+=ellipse(cx-big*.28,cy-big*.28,big*.22,big*.10,g.third,-22);
    return out;
  }

  function renderModular(w,h,p,g,rnd,index){
    let out=""; const cols=4, rows=7, gap=Number(state.spacing)/100, s=sizeFactor();
    const cellW=w/(cols+1), cellH=h/(rows+1);
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
      if(rnd() < clamp(.18-gap*.35,0,.25)) continue;
      const x=cellW*(c+1), y=cellH*(r+1), ww=cellW*(.56+rnd()*.50)*s, hh=cellH*(.34+rnd()*.62)*s;
      const rot=(rnd()-.5)*Number(state.rotation)*1.2, rx=Math.min(ww,hh)*Number(state.roundness)/180;
      const f=fillFor(g,rnd,(r+c)%4===0?"third":"primary");
      if(state.depth==="offset") out+=rect(x-ww/2+state.depthOffset,y-hh/2+state.depthOffset,ww,hh,p.dark,rx,rot,x+state.depthOffset,y+state.depthOffset);
      out+=rect(x-ww/2,y-hh/2,ww,hh,f,rx,rot,x,y);
    }
    const bandY=h*.74, bandH=h*.10;
    out+=rect(w*.12,bandY,w*.76,bandH,p.dark,bandH*.16);
    out+=rect(w*.18,bandY+bandH*.19,w*.64,bandH*.62,g.third,bandH*.10);
    return out;
  }

  function renderVariant(w,h,p,g,rnd,index){
    const variants=[renderOrbital,renderDiagonal,renderSoftOverlap,renderOrbit,renderModular];
    return variants[index%variants.length](w,h,p,g,rnd,index);
  }

  function background(w,h,p,g){
    if(state.backgroundGradient && state.gradientType!=="solid") return `<rect width="${w}" height="${h}" fill="${g.primary}"/>`;
    return `<rect width="${w}" height="${h}" fill="${p.bg}"/>`;
  }

  function textLayer(w,h,p,index){
    if(!state.showText || Number(state.textAmount)<=0) return "";
    const alpha=.25+.75*(Number(state.textAmount)/100); const title=esc(state.titleText||"GRADIENT"), sub=esc(state.subtitleText||"EDITORIAL DESIGN");
    const fs=Math.max(18,Math.round(Math.min(w,h)*.024)), big=Math.round(Math.min(w,h)*.062);
    const c=index%2===0?"#ffffff":p.c;
    return `<g fill="${c}" opacity="${alpha.toFixed(2)}" font-family="Arial, Helvetica, sans-serif"><text x="${(w*.075).toFixed(1)}" y="${(h*.10).toFixed(1)}" font-size="${big}" font-weight="900" letter-spacing="3">${title}</text><text x="${(w*.078).toFixed(1)}" y="${(h*.132).toFixed(1)}" font-size="${Math.round(fs*.5)}" font-weight="700" letter-spacing="3">${sub}</text><text x="${(w*.08).toFixed(1)}" y="${(h*.93).toFixed(1)}" font-size="${Math.max(15,Math.round(fs*.36))}" font-weight="800" letter-spacing="3">ALI STUDIO / ${String(index+1).padStart(2,"0")}</text><text x="${(w*.08).toFixed(1)}" y="${(h*.952).toFixed(1)}" font-size="${Math.max(12,Math.round(fs*.27))}" font-weight="600" letter-spacing="2">${variantName(index)}</text></g>`;
  }

  function makeSvg(index){
    const {w,h}=dims(); const rnd=rng((Number(state.seed)||1)+index*104729); const p=palette(index,rnd); const id=`ali_${Number(state.seed)||1}_${index}`; const g=makeDefs(id,p,rnd);
    let out=g.defs+background(w,h,p,g)+renderVariant(w,h,p,g,rnd,index)+textLayer(w,h,p,index);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><title>ALI STUDIO — Gradient Editorial — ${variantName(index)}</title><metadata>Fill and gradient primitives only. No filters, masks, strokes, paths or pattern effects.</metadata>${out}</svg>`;
  }

  function makeCombinedSvg(){
    const {w:pw,h:ph}=dims(); const count=Number(state.posterCount); const cols=Math.min(4,Math.max(1,count)); const rows=Math.ceil(count/cols); const gap=40; const aw=pw*cols+gap*(cols+1), ah=ph*rows+gap*(rows+1);
    let out=`<svg xmlns="http://www.w3.org/2000/svg" width="${aw}" height="${ah}" viewBox="0 0 ${aw} ${ah}"><title>ALI STUDIO — Gradient Editorial Collection</title><rect width="${aw}" height="${ah}" fill="#eceef1"/>`;
    for(let i=0;i<count;i++){const x=gap+(i%cols)*(pw+gap), y=gap+Math.floor(i/cols)*(ph+gap); const inner=makeSvg(i).replace(/^<svg[^>]*>/i,"").replace(/<\/svg>\s*$/i,""); out+=`<g transform="translate(${x} ${y})">${inner}</g>`;} return out+"</svg>";
  }

  function download(filename,content,mime="image/svg+xml"){const blob=new Blob([content],{type:mime}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
  async function copyText(text){try{await navigator.clipboard.writeText(text);alert("SVG copied to clipboard.");}catch{const ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove();alert("SVG copied to clipboard.");}}
  function syncThemeColors(force=true){if(!force)return;const t=THEMES[$("theme")?.value]||THEMES.cyan;$("colorA").value=t.a;$("colorB").value=t.b;$("colorC").value=t.c;}

  function readControls(){
    ["posterCount","shapeSize","density","spacing","rotation","roundness","variation","gradientAngle","gradientStrength","colorMix","depthOffset","edgeMargin","textAmount"].forEach(k=>{if($(k))state[k]=Number($(k).value)});
    ["designMode","composition","theme","gradientType","format","quality","titleText","subtitleText","seed","colorA","colorB","colorC"].forEach(k=>{if($(k))state[k]=$(k).value});
    state.seed=Number(state.seed)||1;
    ["alternatePalette","backgroundGradient","showText"].forEach(k=>{if($(k))state[k]=$(k).checked});
    const seg=document.querySelector(".segment.active"); if(seg)state.depth=seg.dataset.depth;
  }
  const OUTS={posterCount:["posterCountVal",v=>v],shapeSize:["shapeSizeVal",v=>`${v}%`],density:["densityVal",v=>v],spacing:["spacingVal",v=>`${v}%`],rotation:["rotationVal",v=>`${v}°`],roundness:["roundnessVal",v=>`${v}%`],variation:["variationVal",v=>`${v}%`],gradientAngle:["gradientAngleVal",v=>`${v}°`],gradientStrength:["gradientStrengthVal",v=>`${v}%`],colorMix:["colorMixVal",v=>`${v}%`],depthOffset:["depthOffsetVal",v=>`${v}px`],edgeMargin:["edgeMarginVal",v=>`${v}%`],textAmount:["textAmountVal",v=>`${v}%`]};
  function updateOutputs(){
    Object.entries(OUTS).forEach(([id,[oid,fn]])=>{if($(oid)&&$(id))$(oid).textContent=fn($(id).value)});
    if($("collectionCount"))$("collectionCount").textContent=state.posterCount;
    if($("collectionHint"))$("collectionHint").textContent=`${state.posterCount} UNIQUE VARIATION${state.posterCount===1?"":"S"}`;
    if($("workspaceTitle"))$("workspaceTitle").textContent="GRADIENT EDITORIAL";
    if($("statusMode"))$("statusMode").textContent="GRADIENT EDITORIAL ENGINE";
    if($("statusText"))$("statusText").textContent=state.gradientType==="solid"?"Solid fills only · no SVG effects":"Smooth gradient fills · no SVG effects";
    if($("workspaceSubtitle"))$("workspaceSubtitle").textContent=`${variantName(0)} · ${THEMES[state.theme]?.name||state.theme} · fill + gradient primitives`;
    const d=dims(); if($("previewSpec"))$("previewSpec").textContent=`${d.w} × ${d.h}`;
  }
  function applyZoom(){const grid=$("posterGrid");if(!grid)return;grid.style.transform=`scale(${zoom})`;if($("zoomLabel"))$("zoomLabel").textContent=`${Math.round(zoom*100)}%`;const diff=grid.offsetHeight*zoom-grid.offsetHeight;grid.style.marginBottom=`${Math.max(70,diff+70)}px`;}
  function render(){try{readControls();updateOutputs();generated=[];const grid=$("posterGrid");if(!grid)return;grid.innerHTML="";const tpl=$("posterTemplate");if(!tpl)return;for(let i=0;i<state.posterCount;i++){const node=tpl.content.firstElementChild.cloneNode(true);const svg=makeSvg(i);generated.push(svg);node.querySelector(".poster-number").textContent=`DESIGN ${String(i+1).padStart(2,"0")}`;node.querySelector(".poster-mode").textContent=`${variantName(i)}`;node.querySelector(".poster-frame").innerHTML=svg;node.querySelector(".download-one").addEventListener("click",()=>download(`ali-studio-gradient-editorial-${String(i+1).padStart(2,"0")}.svg`,svg));node.querySelector(".copy-one").addEventListener("click",()=>copyText(svg));grid.appendChild(node);}grid.style.gridTemplateColumns=`repeat(${Math.min(window.innerWidth<1180?3:4,state.posterCount)},minmax(0,1fr))`;applyZoom();}catch(e){console.error("Render Error",e)}}
  function randomize(){
    const themes=Object.keys(THEMES); $("seed").value=Math.floor(Math.random()*99999999)+1; $("theme").value=themes[Math.floor(Math.random()*themes.length)]; syncThemeColors(true);
    $("composition").value=["auto","center","diagonal","corners","grid","scatter"][Math.floor(Math.random()*6)];
    $("shapeSize").value=80+Math.floor(Math.random()*61);$("density").value=5+Math.floor(Math.random()*11);$("spacing").value=10+Math.floor(Math.random()*41);$("rotation").value=5+Math.floor(Math.random()*51);$("roundness").value=25+Math.floor(Math.random()*70);$("variation").value=20+Math.floor(Math.random()*81);$("gradientAngle").value=Math.floor(Math.random()*361);$("gradientStrength").value=65+Math.floor(Math.random()*36);$("colorMix").value=45+Math.floor(Math.random()*51);$("gradientType").value=["linear","radial","mixed"][Math.floor(Math.random()*3)];
    readControls();updateOutputs();render();
  }
  const liveIds=["posterCount","designMode","composition","theme","shapeSize","density","spacing","rotation","roundness","variation","gradientType","gradientAngle","gradientStrength","colorMix","depthOffset","edgeMargin","format","quality","titleText","subtitleText","textAmount","seed","colorA","colorB","colorC"];
  liveIds.forEach(id=>{const el=$(id);if(!el)return;el.addEventListener("input",()=>{updateOutputs();render()});el.addEventListener("change",()=>{if(id==="theme")syncThemeColors(true);updateOutputs();render()})});
  ["alternatePalette","backgroundGradient","showText"].forEach(id=>$(id)?.addEventListener("change",()=>{updateOutputs();render()}));
  document.querySelectorAll(".segment").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll(".segment").forEach(b=>b.classList.remove("active"));btn.classList.add("active");updateOutputs();render()}));
  $("regenerate")?.addEventListener("click",render);$("randomize")?.addEventListener("click",randomize);$("randomizeTop")?.addEventListener("click",randomize);$("resetAll")?.addEventListener("click",()=>location.reload());
  $("downloadAll")?.addEventListener("click",()=>download(`ali-studio-gradient-editorial-collection.svg`,makeCombinedSvg()));$("downloadJson")?.addEventListener("click",()=>download("ali-studio-settings.json",JSON.stringify(state,null,2),"application/json"));
  $("zoomIn")?.addEventListener("click",()=>{zoom=clamp(zoom+.1,.3,2);applyZoom()});$("zoomOut")?.addEventListener("click",()=>{zoom=clamp(zoom-.1,.3,2);applyZoom()});window.addEventListener("resize",()=>{if($("posterGrid"))render()});
  syncThemeColors(true); updateOutputs(); render();
})();
