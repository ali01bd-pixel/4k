(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const TAU = Math.PI * 2;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]));

  // Single active design family: clean ocean-wave editorial / watercolor-inspired geometry.
  const DESIGN_MODE = "oceanWavesWatercolor";

  const THEMES = {
    ocean:   { name:"Ocean Mist", bg:"#083f57", a:"#42bfe1", b:"#156d91", c:"#eafaff", d:"#0b3044" },
    lagoon:  { name:"Lagoon Blue", bg:"#0b5568", a:"#67d7ea", b:"#2a8ba6", c:"#effcff", d:"#0c4051" },
    arctic:  { name:"Arctic Sky", bg:"#123f54", a:"#7fd9ee", b:"#327ea5", c:"#f3fbff", d:"#0b2f42" },
    deepsea: { name:"Deep Sea", bg:"#061c2b", a:"#1d8db3", b:"#0b4f72", c:"#d8f5ff", d:"#03111d" },
    marine:  { name:"Marine Haze", bg:"#0a4b63", a:"#5acbe1", b:"#237a95", c:"#f6fdff", d:"#093244" }
  };

  const state = {
    posterCount: 5,
    designMode: DESIGN_MODE,
    composition: "auto",
    theme: "ocean",
    depth: "flat",
    shapeSize: 100,
    density: 8,
    spacing: 24,
    rotation: 18,
    roundness: 68,
    variation: 58,
    gradientType: "mixed",
    gradientAngle: 150,
    gradientStrength: 82,
    colorMix: 72,
    depthOffset: 16,
    edgeMargin: 8,
    backgroundGradient: true,
    alternatePalette: true,
    format: "portrait",
    quality: "large",
    showText: true,
    titleText: "SEA WAVE",
    subtitleText: "ABSTRACT WATERCOLOR",
    textAmount: 82,
    seed: 260905,
    colorA: "#42bfe1",
    colorB: "#156d91",
    colorC: "#eafaff"
  };

  let zoom = 1;

  function dims(){
    const base={portrait:{w:1200,h:1800},square:{w:1600,h:1600},landscape:{w:1800,h:1200}}[state.format];
    const q={standard:1,large:1.35,xl:1.8}[state.quality];
    return {w:Math.round(base.w*q),h:Math.round(base.h*q)};
  }

  function hexToRgb(hex){
    const s=String(hex).replace("#","");
    const clean=s.length===3?s.split("").map(x=>x+x).join(""):s;
    const v=parseInt(clean,16)||0;
    return {r:(v>>16)&255,g:(v>>8)&255,b:v&255};
  }
  function rgbToHex(r,g,b){return "#"+[r,g,b].map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,"0")).join("");}
  function mixHex(a,b,t){
    const A=hexToRgb(a),B=hexToRgb(b);
    return rgbToHex(A.r+(B.r-A.r)*t,A.g+(B.g-A.g)*t,A.b+(B.b-A.b)*t);
  }
  function anglePoints(angle){
    const a=((Number(angle)%360)+360)%360*Math.PI/180;
    const dx=Math.cos(a)*50,dy=Math.sin(a)*50;
    return {x1:50-dx,y1:50-dy,x2:50+dx,y2:50+dy};
  }
  function rndSeed(seed){
    let a=(seed>>>0)||1;
    return()=>{
      a+=0x6D2B79F5;
      let t=a;
      t=Math.imul(t^t>>>15,t|1);
      t^=t+Math.imul(t^t>>>7,t|61);
      return ((t^t>>>14)>>>0)/4294967296;
    };
  }
  function randomInt(rnd,a,b){return Math.floor(a+rnd()*(b-a+1));}
  function sizeFactor(){return clamp(Number(state.shapeSize)/100,.4,1.7);}
  function opacityMix(v){return clamp(Number(v)/100,.05,1);}

  function palette(index){
    const keys=Object.keys(THEMES);
    const base=THEMES[state.theme]||THEMES.ocean;
    const alt=THEMES[keys[(index*2+Math.floor(Number(state.seed)/11))%keys.length]];
    const mix=clamp(Number(state.colorMix)/100,0,1);
    const drift=state.alternatePalette ? ((index%3)*.09) : 0;
    const a=mixHex(mixHex(state.colorA,base.a,mix*.35),alt.a,drift);
    const b=mixHex(mixHex(state.colorB,base.b,mix*.35),alt.b,drift);
    const c=mixHex(mixHex(state.colorC,base.c,mix*.20),alt.c,drift*.6);
    return {bg:base.bg,a,b,c,d:base.d,a2:mixHex(a,c,.38),b2:mixHex(b,c,.30)};
  }

  function gradientDefs(id,p){
    const ap=anglePoints(state.gradientAngle);
    const strength=clamp(Number(state.gradientStrength)/100,0,1);
    const mid=Math.round(34+strength*36);
    const lin=`<linearGradient id="${id}_lin" x1="${ap.x1}%" y1="${ap.y1}%" x2="${ap.x2}%" y2="${ap.y2}%"><stop offset="0%" stop-color="${p.b}"/><stop offset="${mid}%" stop-color="${p.a}"/><stop offset="100%" stop-color="${p.c}"/></linearGradient>`;
    const rad=`<radialGradient id="${id}_rad" cx="34%" cy="28%" r="78%"><stop offset="0%" stop-color="${p.c}"/><stop offset="32%" stop-color="${p.a2}"/><stop offset="70%" stop-color="${p.a}"/><stop offset="100%" stop-color="${p.b}"/></radialGradient>`;
    const soft=`<radialGradient id="${id}_soft" cx="50%" cy="44%" r="72%"><stop offset="0%" stop-color="${p.c}"/><stop offset="55%" stop-color="${p.a}"/><stop offset="100%" stop-color="${p.b}"/></radialGradient>`;
    const alt=`<linearGradient id="${id}_alt" x1="${ap.x2}%" y1="${ap.y2}%" x2="${ap.x1}%" y2="${ap.y1}%"><stop offset="0%" stop-color="${p.c}"/><stop offset="48%" stop-color="${p.a2}"/><stop offset="100%" stop-color="${p.b2}"/></linearGradient>`;
    return `<defs>${lin}${rad}${soft}${alt}</defs>`;
  }

  function pickFill(id,p,rnd,preferred="auto"){
    if(state.gradientType==="solid") return [p.a,p.b,p.c,p.d][randomInt(rnd,0,3)];
    if(preferred==="radial") return `url(#${id}_rad)`;
    if(preferred==="soft") return `url(#${id}_soft)`;
    if(preferred==="alt") return `url(#${id}_alt)`;
    if(state.gradientType==="radial") return `url(#${id}_rad)`;
    if(state.gradientType==="mixed"){
      const r=rnd();
      return r<.42?`url(#${id}_rad)`:r<.66?`url(#${id}_soft)`:r<.82?`url(#${id}_alt)`: `url(#${id}_lin)`;
    }
    return `url(#${id}_lin)`;
  }

  function rect(x,y,w,h,fill,rx=0,rot=0,cx=x+w/2,cy=y+h/2){
    const transform=rot?` transform="rotate(${rot.toFixed(2)} ${cx.toFixed(1)} ${cy.toFixed(1)})"`:"";
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${rx.toFixed(1)}" fill="${fill}"${transform}/>`;
  }
  function circle(cx,cy,r,fill){return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}"/>`;}
  function ellipse(cx,cy,rx,ry,fill,rot=0){
    const transform=rot?` transform="rotate(${rot.toFixed(2)} ${cx.toFixed(1)} ${cy.toFixed(1)})"`:"";
    return `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${fill}"${transform}/>`;
  }
  function polygon(points,fill){return `<polygon points="${points.map(p=>`${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")}" fill="${fill}"/>`;}

  function baseBackground(id,w,h,p){
    if(state.backgroundGradient && state.gradientType!=="solid") return `<rect width="${w}" height="${h}" fill="${state.gradientType==="radial"?`url(#${id}_soft)`: `url(#${id}_lin)`}"/>`;
    return `<rect width="${w}" height="${h}" fill="${p.bg}"/>`;
  }

  function offsetSolid(shape){
    if(state.depth!=="offset" || Number(state.depthOffset)<=0) return "";
    return shape(Number(state.depthOffset),Number(state.depthOffset),paleDepthColor());
  }

  let activePalette=null;
  function paleDepthColor(){ return activePalette ? activePalette.d : "#083042"; }

  function composition(index){
    if(state.composition!=="auto") return state.composition;
    return ["cover","layers","waves","deepSea","horizon"][index%5];
  }

  function cover(id,w,h,p,rnd,index){
    let out=""; const s=sizeFactor();
    out+=rect(w*.07,h*.05,w*.86,h*.90,p.c,Math.min(w,h)*.015);
    const baseY=h*(.73+(rnd()-.5)*.035), spread=w*.55*s;
    const count=Math.max(4,Math.floor(Number(state.density)*.55));
    for(let i=0;i<count;i++){
      const t=i/Math.max(1,count-1);
      const cx=w*(.18+t*.66)+(rnd()-.5)*w*.05;
      const cy=baseY-i*h*(.040+Number(state.spacing)/2600);
      const rx=spread*(.32+t*.10)*(0.90+rnd()*(.22+Number(state.variation)/420));
      const ry=h*(.07+i*.012)*s*(.82+rnd()*.28);
      const rot=(rnd()-.5)*Number(state.rotation)*.55;
      const fill=pickFill(id,p,rnd,i%2?"alt":"soft");
      out+=ellipse(cx,cy,rx,ry,fill,rot);
    }
    out+=ellipse(w*.31,h*.25,w*.25*s,h*.15*s,pickFill(id,p,rnd,"soft"),-14+Number(state.rotation)*.08);
    out+=ellipse(w*.08,h*.71,w*.16*s,h*.14*s,pickFill(id,p,rnd,"radial"),18);
    return out;
  }

  function layeredWashes(id,w,h,p,rnd){
    let out=""; const s=sizeFactor();
    out+=rect(w*.06,h*.04,w*.88,h*.92,p.c,Math.min(w,h)*.012);
    const rows=Math.max(4,Math.floor(Number(state.density)/1.8));
    for(let i=0;i<rows;i++){
      const yy=h*(.18+i*(.62/Math.max(1,rows-1)));
      const ww=w*(.52+rnd()*.34)*s;
      const hh=h*(.11+rnd()*.10)*(1+Number(state.variation)/350);
      const x=w*(.06+rnd()*.43);
      const rot=(-12+rnd()*24)+(Number(state.rotation)-18)*.25;
      const f=pickFill(id,p,rnd,i%3===0?"radial":"soft");
      out+=ellipse(x+ww*.36,yy,ww*.52,hh,f,rot);
    }
    const horizon=rect(w*.08,h*.56,w*.84,h*.27,pickFill(id,p,rnd,"lin"),Math.min(w,h)*.045);
    out+=horizon;
    for(let i=0;i<3;i++){
      const yy=h*(.64+i*.065);
      out+=ellipse(w*.52,yy,w*(.28+i*.06)*s,h*(.055+i*.008),pickFill(id,p,rnd,i%2?"alt":"soft"),-4+i*2);
    }
    return out;
  }

  function oceanBands(id,w,h,p,rnd){
    let out=""; const s=sizeFactor();
    out+=rect(0,0,w,h,pickFill(id,p,rnd,"lin"),0);
    const bands=Math.max(6,Number(state.density)+2);
    for(let i=0;i<bands;i++){
      const y=h*(.15+i*(.72/Math.max(1,bands-1)));
      const ww=w*(.72+rnd()*.52)*s;
      const hh=h*(.045+rnd()*.065)*(1+Number(state.variation)/360);
      const x=w*.50+(rnd()-.5)*w*.10;
      const rot=(rnd()-.5)*Number(state.rotation)*.65;
      out+=ellipse(x,y,ww*.50,hh,pickFill(id,p,rnd,i%2?"soft":"alt"),rot);
    }
    for(let i=0;i<3;i++){
      out+=ellipse(w*(.21+i*.27),h*(.22+i*.20),w*(.12+i*.03)*s,h*(.18+i*.025)*s,pickFill(id,p,rnd,"radial"),-18+i*17);
    }
    return out;
  }

  function deepSea(id,w,h,p,rnd){
    let out="";
    out+=rect(0,0,w,h,p.d,0);
    const count=Math.max(5,Math.floor(Number(state.density)*.78));
    for(let i=0;i<count;i++){
      const t=i/Math.max(1,count-1);
      const cx=w*(.24+t*.58), cy=h*(.68-t*.54)+(rnd()-.5)*h*.035;
      const rx=w*(.10+t*.075)*sizeFactor(), ry=h*(.055+t*.018)*sizeFactor();
      const fill=pickFill(id,p,rnd,i%3===0?"soft":"radial");
      out+=ellipse(cx,cy,rx,ry,fill,(rnd()-.5)*Number(state.rotation)*.75);
    }
    out+=circle(w*.52,h*.60,Math.min(w,h)*.12*sizeFactor(),pickFill(id,p,rnd,"soft"));
    out+=circle(w*.52,h*.60,Math.min(w,h)*.07*sizeFactor(),p.d);
    return out;
  }

  function horizon(id,w,h,p,rnd){
    let out="";
    out+=rect(w*.07,h*.05,w*.86,h*.90,p.c,Math.min(w,h)*.012);
    const rows=Math.max(4,Math.floor(Number(state.density)/2));
    for(let i=0;i<rows;i++){
      const y=h*(.48+i*.075);
      const ww=w*(.42+i*.10)*sizeFactor();
      const hh=h*(.065+i*.006);
      out+=ellipse(w*.51+(rnd()-.5)*w*.05,y,ww*.50,hh,pickFill(id,p,rnd,i%2?"soft":"radial"),(rnd()-.5)*Number(state.rotation));
    }
    out+=ellipse(w*.28,h*.22,w*.24*sizeFactor(),h*.13*sizeFactor(),pickFill(id,p,rnd,"soft"),-12);
    out+=ellipse(w*.76,h*.28,w*.18*sizeFactor(),h*.10*sizeFactor(),pickFill(id,p,rnd,"radial"),18);
    return out;
  }

  function layout(id,w,h,p,rnd,index){
    const c=composition(index);
    if(c==="cover") return cover(id,w,h,p,rnd,index);
    if(c==="layers") return layeredWashes(id,w,h,p,rnd);
    if(c==="waves") return oceanBands(id,w,h,p,rnd);
    if(c==="deepSea") return deepSea(id,w,h,p,rnd);
    return horizon(id,w,h,p,rnd);
  }

  function textLayer(index,w,h,p){
    if(!state.showText || Number(state.textAmount)<=0) return "";
    const amount=clamp(Number(state.textAmount)/100,0,1);
    const title=esc(state.titleText||"SEA WAVE");
    const sub=esc(state.subtitleText||"ABSTRACT WATERCOLOR");
    const dark=state.theme==="deepsea"?"#ffffff":p.b;
    const big=Math.round(Math.min(w,h)*.055);
    const small=Math.max(14,Math.round(big*.20));
    const footer=Math.max(12,Math.round(big*.16));
    const opacity=(.45+amount*.55).toFixed(2);
    return `<g fill="${dark}" opacity="${opacity}" font-family="Georgia, Times New Roman, serif"><text x="${(w*.50).toFixed(1)}" y="${(h*.79).toFixed(1)}" text-anchor="middle" font-size="${big}" font-weight="700" letter-spacing="2">${title}</text><text x="${(w*.50).toFixed(1)}" y="${(h*.815).toFixed(1)}" text-anchor="middle" font-size="${small}" font-weight="600" letter-spacing="3">${sub}</text><text x="${(w*.50).toFixed(1)}" y="${(h*.925).toFixed(1)}" text-anchor="middle" font-size="${footer}" font-weight="700" letter-spacing="2">OCEAN / ${String(index+1).padStart(2,"0")}</text></g>`;
  }

  function makeSvg(index){
    const {w,h}=dims();
    const rnd=rndSeed((Number(state.seed)||1)+index*104729);
    const p=palette(index); activePalette=p;
    const id=`ocean_${Number(state.seed)||1}_${index}`;
    let out=gradientDefs(id,p);
    out+=baseBackground(id,w,h,p);
    out+=layout(id,w,h,p,rnd,index);
    if(state.depth==="offset" && Number(state.depthOffset)>0){
      // A subtle solid offset block keeps the requested depth option editable without SVG effects.
      out+=rect(w*.075+Number(state.depthOffset),h*.055+Number(state.depthOffset),w*.85,h*.89,p.d,Math.min(w,h)*.012);
    }
    // Re-render the actual composition above the optional depth block so the depth remains a simple solid-color layer.
    if(state.depth==="offset" && Number(state.depthOffset)>0){
      out=gradientDefs(id,p)+baseBackground(id,w,h,p)+layout(id,w,h,p,rnd,index)+textLayer(index,w,h,p);
    } else {
      out+=textLayer(index,w,h,p);
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><title>ALI STUDIO — Ocean Waves Watercolor — Design ${String(index+1).padStart(2,"0")}</title><metadata>Generated locally by ALI STUDIO. Solid fills and gradients only.</metadata>${out}</svg>`;
  }

  function makeCombinedSvg(){
    const {w:pw,h:ph}=dims();
    const count=Number(state.posterCount),cols=Math.min(4,Math.max(1,count)),rows=Math.ceil(count/cols),gap=40;
    const aw=pw*cols+gap*(cols+1),ah=ph*rows+gap*(rows+1);
    let out=`<svg xmlns="http://www.w3.org/2000/svg" width="${aw}" height="${ah}" viewBox="0 0 ${aw} ${ah}"><title>ALI STUDIO — Ocean Waves Watercolor Collection</title><rect width="${aw}" height="${ah}" fill="#0a4b63"/>`;
    for(let i=0;i<count;i++){
      const x=gap+(i%cols)*(pw+gap),y=gap+Math.floor(i/cols)*(ph+gap);
      const svg=makeSvg(i).replace(/^<svg[^>]*>/,"").replace(/<\/svg>\s*$/i,"");
      out+=`<g transform="translate(${x} ${y})">${svg}</g>`;
    }
    return out+"</svg>";
  }

  function download(filename,content,mime="image/svg+xml"){
    const blob=new Blob([content],{type:mime}),a=document.createElement("a");
    a.href=URL.createObjectURL(blob);a.download=filename;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }
  async function copyText(text){
    try{await navigator.clipboard.writeText(text);alert("SVG copied to clipboard.");}
    catch{const ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove();alert("SVG copied to clipboard.");}
  }
  function syncThemeColors(force=true){
    const t=THEMES[$("theme")?.value]||THEMES.ocean;
    if(force){if($("colorA"))$("colorA").value=t.a;if($("colorB"))$("colorB").value=t.b;if($("colorC"))$("colorC").value=t.c;}
  }
  function readControls(){
    ["posterCount","shapeSize","density","spacing","rotation","roundness","variation","gradientAngle","gradientStrength","colorMix","depthOffset","edgeMargin","textAmount"].forEach(k=>{if($(k))state[k]=Number($(k).value)});
    ["designMode","composition","theme","gradientType","format","quality","titleText","subtitleText","seed","colorA","colorB","colorC"].forEach(k=>{if($(k))state[k]=$(k).value});
    ["alternatePalette","backgroundGradient","showText"].forEach(k=>{if($(k))state[k]=$(k).checked});
    state.designMode=DESIGN_MODE;
    state.seed=Number(state.seed)||1;
    const seg=document.querySelector(".segment.active");if(seg)state.depth=seg.dataset.depth;
  }
  const OUTS={
    posterCount:["posterCountVal",v=>v],shapeSize:["shapeSizeVal",v=>`${v}%`],density:["densityVal",v=>v],spacing:["spacingVal",v=>`${v}%`],rotation:["rotationVal",v=>`${v}°`],roundness:["roundnessVal",v=>`${v}%`],variation:["variationVal",v=>`${v}%`],gradientAngle:["gradientAngleVal",v=>`${v}°`],gradientStrength:["gradientStrengthVal",v=>`${v}%`],colorMix:["colorMixVal",v=>`${v}%`],depthOffset:["depthOffsetVal",v=>`${v}px`],edgeMargin:["edgeMarginVal",v=>`${v}%`],textAmount:["textAmountVal",v=>`${v}%`]
  };
  function updateOutputs(){
    Object.entries(OUTS).forEach(([id,[oid,fn]])=>{if($(oid)&&$(id))$(oid).textContent=fn($(id).value)});
    if($("collectionCount"))$("collectionCount").textContent=state.posterCount;
    if($("designMode"))$("designMode").value=DESIGN_MODE;
    if($("workspaceTitle"))$("workspaceTitle").textContent="OCEAN WAVES WATERCOLOUR";
    if($("statusMode"))$("statusMode").textContent=state.depth==="offset"?"SOLID OFFSET LAYERS":"GRADIENT + SOLID ENGINE";
    if($("statusText"))$("statusText").textContent=state.gradientType==="solid"?"Solid colors only · no SVG effects":"Ocean gradients · no SVG effects";
    if($("workspaceSubtitle"))$("workspaceSubtitle").textContent="Reference-inspired ocean editorial compositions using gradients and solid filled geometry only.";
    const d=dims();if($("previewSpec"))$("previewSpec").textContent=`${d.w} × ${d.h}`;
  }
  function applyZoom(){
    const grid=$("posterGrid");if(!grid)return;
    grid.style.transform=`scale(${zoom})`;
    if($("zoomLabel"))$("zoomLabel").textContent=`${Math.round(zoom*100)}%`;
    const diff=grid.offsetHeight*zoom-grid.offsetHeight;grid.style.marginBottom=`${Math.max(70,diff+70)}px`;
  }
  function render(){
    try{
      readControls();updateOutputs();
      const grid=$("posterGrid");if(!grid)return;grid.innerHTML="";
      const tpl=$("posterTemplate");if(!tpl)return;
      for(let i=0;i<state.posterCount;i++){
        const node=tpl.content.firstElementChild.cloneNode(true);const svg=makeSvg(i);
        node.querySelector(".poster-number").textContent=`DESIGN ${String(i+1).padStart(2,"0")}`;
        node.querySelector(".poster-mode").textContent=`OCEAN / ${String(i+1).padStart(2,"0")}`;
        node.querySelector(".poster-frame").innerHTML=svg;
        node.querySelector(".download-one").addEventListener("click",()=>download(`ali-studio-ocean-waves-${String(i+1).padStart(2,"0")}.svg`,svg));
        node.querySelector(".copy-one").addEventListener("click",()=>copyText(svg));
        grid.appendChild(node);
      }
      grid.style.gridTemplateColumns=`repeat(${Math.min(window.innerWidth<1180?3:4,state.posterCount)},minmax(0,1fr))`;
      applyZoom();
    }catch(e){console.error("Render Error",e)}
  }
  function randomize(){
    const themes=Object.keys(THEMES);
    $("seed").value=Math.floor(Math.random()*99999999)+1;
    $("theme").value=themes[randomInt(Math.random,0,themes.length-1)];syncThemeColors(true);
    $("composition").value=["auto","center","diagonal","corners","grid","scatter"][randomInt(Math.random,0,5)];
    $("shapeSize").value=randomInt(Math.random,78,145);$("density").value=randomInt(Math.random,5,16);$("spacing").value=randomInt(Math.random,10,46);
    $("rotation").value=randomInt(Math.random,4,55);$("roundness").value=randomInt(Math.random,35,95);$("variation").value=randomInt(Math.random,20,88);
    $("gradientAngle").value=randomInt(Math.random,0,360);$("gradientStrength").value=randomInt(Math.random,55,100);$("colorMix").value=randomInt(Math.random,45,96);
    $("gradientType").value=["linear","radial","mixed"][randomInt(Math.random,0,2)];
    const depth=Math.random()>.82?"offset":"flat";document.querySelectorAll(".segment").forEach(b=>b.classList.toggle("active",b.dataset.depth===depth));
    readControls();updateOutputs();render();
  }
  function resetAll(){location.reload();}

  const liveIds=["posterCount","designMode","composition","theme","shapeSize","density","spacing","rotation","roundness","variation","gradientType","gradientAngle","gradientStrength","colorMix","depthOffset","edgeMargin","format","quality","titleText","subtitleText","textAmount","seed","colorA","colorB","colorC"];
  liveIds.forEach(id=>{const el=$(id);if(!el)return;el.addEventListener("input",()=>{updateOutputs();render()});el.addEventListener("change",()=>{if(id==="theme")syncThemeColors(true);updateOutputs();render()})});
  ["alternatePalette","backgroundGradient","showText"].forEach(id=>$(id)?.addEventListener("change",()=>{updateOutputs();render()}));
  document.querySelectorAll(".segment").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll(".segment").forEach(b=>b.classList.remove("active"));btn.classList.add("active");updateOutputs();render()}));
  $("regenerate")?.addEventListener("click",render);$("randomize")?.addEventListener("click",randomize);$("randomizeTop")?.addEventListener("click",randomize);$("resetAll")?.addEventListener("click",resetAll);
  $("downloadAll")?.addEventListener("click",()=>download("ali-studio-ocean-waves-collection.svg",makeCombinedSvg()));
  $("downloadJson")?.addEventListener("click",()=>download("ali-studio-settings.json",JSON.stringify(state,null,2),"application/json"));
  $("zoomIn")?.addEventListener("click",()=>{zoom=clamp(zoom+.1,.3,2);applyZoom()});
  $("zoomOut")?.addEventListener("click",()=>{zoom=clamp(zoom-.1,.3,2);applyZoom()});
  window.addEventListener("resize",()=>{if($("posterGrid"))render()});

  if($("designMode")){
    $("designMode").innerHTML="<option value=\"oceanWavesWatercolor\">Ocean Waves — Watercolor Editorial</option>";
    $("designMode").value=DESIGN_MODE;
  }
  if($("theme")) syncThemeColors(true);
  updateOutputs();render();
})();
