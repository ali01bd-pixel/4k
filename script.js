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
    studio: { theme:"crimson", mode:"chromaticEditorial", composition:"diagonal", density:8, shapeSize:100, spacing:24, rotation:18, roundness:48, variation:52, gradientType:"linear", gradientAngle:35, gradientStrength:76, colorMix:68, depth:"flat" },
    sunset: { theme:"sunset", mode:"chromaticEditorial", composition:"center", density:7, shapeSize:120, spacing:16, rotation:28, roundness:60, variation:42, gradientType:"radial", gradientAngle:80, gradientStrength:90, colorMix:76, depth:"offset" },
    electric: { theme:"electric", mode:"chromaticEditorial", composition:"grid", density:12, shapeSize:95, spacing:14, rotation:42, roundness:16, variation:70, gradientType:"mixed", gradientAngle:120, gradientStrength:84, colorMix:62, depth:"flat" },
    pastel: { theme:"pastel", mode:"chromaticEditorial", composition:"scatter", density:8, shapeSize:112, spacing:30, rotation:12, roundness:75, variation:48, gradientType:"radial", gradientAngle:210, gradientStrength:65, colorMix:74, depth:"flat" },
    mono: { theme:"mono", mode:"chromaticEditorial", composition:"center", density:11, shapeSize:106, spacing:19, rotation:24, roundness:35, variation:32, gradientType:"linear", gradientAngle:25, gradientStrength:70, colorMix:34, depth:"offset" },
    lime: { theme:"lime", mode:"chromaticEditorial", composition:"corners", density:7, shapeSize:125, spacing:12, rotation:32, roundness:22, variation:58, gradientType:"linear", gradientAngle:145, gradientStrength:78, colorMix:72, depth:"flat" }
  };

  const state = {
    posterCount:5, designMode:"chromaticEditorial", composition:"auto", theme:"crimson",
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
    const rotate=state.alternatePalette ? index : 0;
    const shift=(rotate%3)*.14;
    const userMix=Number(state.colorMix)/100;
    const a=mixHex(state.colorA,theme.a,clamp(shift*(1-userMix)+0.12*userMix,0,1));
    const b=mixHex(state.colorB,theme.b,clamp(shift*(1-userMix)+0.10*userMix,0,1));
    const c=mixHex(state.colorC,theme.c,clamp(shift*(1-userMix)+0.08*userMix,0,1));
    const d=theme.d;
    return {
      bg:theme.bg,
      a,b,c,d,
      a2:mixHex(a,c,.34),
      b2:mixHex(b,c,.28),
      dark:mixHex(theme.bg,b,.42)
    };
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

  function chromaticEditorial(id,w,h,p,rnd,index){
    const s=sizeFactor();
    const d=Math.max(3,Number(state.density));
    const gap=Number(state.spacing)/100;
    const rot=Number(state.rotation);
    const round=Number(state.roundness)/100;
    const v=Number(state.variation)/100;
    const margin=w*(Number(state.edgeMargin)/100);
    const innerW=w-margin*2, innerH=h-margin*2;
    const bias=selectedComposition(index,rnd);
    const pick=(i=0)=>fill(id,(i%3===0?"radial":i%2?"alt":"linear"),p,rnd);
    let out="";
    const dark=p.bg;
    const light=p.c;
    const f1=pick(0), f2=pick(1), f3=pick(2);
    const accent=p.a, accent2=p.b;

    // Every variation below uses only filled rectangles, circles, ellipses and polygons.
    // The eight compositions echo the supplied editorial reference while remaining deterministic and editable.
    if(index%8===0){
      out+=`<rect width="${w}" height="${h}" fill="${dark}"/>`;
      const cx=w*(bias==="corners"?.68:.50), cy=h*(bias==="diagonal"?.54:.50);
      const rings=Math.max(10,Math.floor(d*1.5));
      for(let i=0;i<rings;i++){
        const t=i/(rings-1), rx=innerW*(.06+t*.34)*s*(1+v*.12), ry=innerH*(.012+t*.045)*s;
        const x=cx + (rnd()-.5)*innerW*.10*(1+v), y=cy + Math.sin(i*.65)*innerH*.05;
        const f=i%3===0?f2:(i%2?f1:accent2);
        out+=ellipse(x,y,rx,ry,f,(rot-28+t*55)+(rnd()-.5)*rot*.25);
      }
      for(let i=0;i<Math.max(5,Math.floor(d/2));i++){
        out+=ellipse(w*(.13+rnd()*.74),h*(.10+rnd()*.82),w*(.018+rnd()*.045)*s,h*(.010+rnd()*.028)*s,p.c,rnd()*180);
      }
      out+=circle(cx,cy,Math.min(w,h)*.05*s,light);
      return out;
    }

    if(index%8===1){
      out+=`<rect width="${w}" height="${h}" fill="${light}"/>`;
      const steps=Math.max(5,Math.floor(d*.65));
      const span=innerW*.78;
      const rw=innerW*(.17+.04*v)*s;
      const rh=innerH*(.12+.025*(1-gap))*s;
      const baseX=w*.50, baseY=h*(.18 + (bias==="center"?.04:0));
      for(let i=0;i<steps;i++){
        const t=i/(steps-1);
        const x=baseX-span*.38+t*span*.76;
        const y=baseY+innerH*(.14+t*.68);
        const angle=(i%2?1:-1)*(28+rot*.35)+Math.sin(i*.9)*rot*.25;
        const f=i%3===0?f2:(i%2?f1:f3);
        const rx=Math.min(rw,rh)*(.30+.55*round);
        if(state.depth==="offset") out+=rect(x-rw/2+state.depthOffset,y-rh/2+state.depthOffset,rw,rh,p.d,rx,angle,x+state.depthOffset,y+state.depthOffset);
        out+=rect(x-rw/2,y-rh/2,rw,rh,f,rx,angle,x,y);
      }
      out+=polygon([[w*.50,h*.08],[w*.68,h*.19],[w*.56,h*.31],[w*.34,h*.23]],accent2);
      return out;
    }

    if(index%8===2){
      out+=`<rect width="${w}" height="${h}" fill="${dark}"/>`;
      const bars=Math.max(6,Math.floor(d*.95));
      for(let i=0;i<bars;i++){
        const x=w*(.08+i*(.78/Math.max(1,bars-1)));
        const ww=w*(.11+.06*rnd())*s;
        const hh=h*(.23+.25*rnd())*s;
        const y=h*(.18+rnd()*.58);
        const angle=(rnd()-.5)*rot*1.2;
        const fillV=i%3===0?f1:(i%2?accent: f2);
        const rx=Math.min(ww,hh)*(.24+.55*round);
        if(state.depth==="offset") out+=rect(x-ww/2+state.depthOffset,y-hh/2+state.depthOffset,ww,hh,p.d,rx,angle,x+state.depthOffset,y+state.depthOffset);
        out+=rect(x-ww/2,y-hh/2,ww,hh,fillV,rx,angle,x,y);
      }
      for(let i=0;i<Math.max(5,Math.floor(d));i++) out+=ellipse(w*(.12+rnd()*.76),h*(.10+rnd()*.80),w*(.02+rnd()*.05)*s,h*(.009+rnd()*.028)*s,i%2?f3:light,rnd()*180);
      return out;
    }

    if(index%8===3){
      out+=`<rect width="${w}" height="${h}" fill="${f3}"/>`;
      const pieces=Math.max(7,Math.floor(d*.9));
      for(let i=0;i<pieces;i++){
        const cx=w*(.18+rnd()*.64), cy=h*(.18+rnd()*.65), ww=w*(.10+rnd()*.18)*s, hh=h*(.05+rnd()*.14)*s;
        const a=(rnd()-.5)*rot*2;
        const sh=i%4;
        let fillV=[accent,accent2,p.c,f1][sh];
        if(i%3===0){
          const pts=[[cx,cy-hh/2],[cx+ww*.45,cy],[cx,cy+hh/2],[cx-ww*.45,cy]];
          if(state.depth==="offset") out+=polygon(pts.map(q=>[q[0]+state.depthOffset,q[1]+state.depthOffset]),p.d);
          out+=polygon(pts,fillV);
        }else{
          const rx=Math.min(ww,hh)*(.18+.68*round);
          if(state.depth==="offset") out+=rect(cx-ww/2+state.depthOffset,cy-hh/2+state.depthOffset,ww,hh,p.d,rx,a,cx+state.depthOffset,cy+state.depthOffset);
          out+=rect(cx-ww/2,cy-hh/2,ww,hh,fillV,rx,a,cx,cy);
        }
      }
      return out;
    }

    if(index%8===4){
      out+=`<rect width="${w}" height="${h}" fill="${light}"/>`;
      const c1=[w*.30,h*.33], c2=[w*.67,h*.58];
      const r1=Math.min(w,h)*(.19+.08*v)*s, r2=Math.min(w,h)*(.14+.06*rnd())*s;
      out+=circle(c1[0],c1[1],r1,f1); out+=circle(c2[0],c2[1],r2,f2);
      out+=ellipse(w*.52,h*.28,w*.28*s,h*.045*s,accent2,rot*.4);
      out+=ellipse(w*.56,h*.78,w*.34*s,h*.055*s,accent,rot*-0.5);
      const small=Math.max(4,Math.floor(d/2));
      for(let i=0;i<small;i++) out+=circle(w*(.10+rnd()*.80),h*(.12+rnd()*.76),Math.min(w,h)*(.012+rnd()*.035)*s,i%2?f3:accent);
      return out;
    }

    if(index%8===5){
      out+=`<rect width="${w}" height="${h}" fill="${dark}"/>`;
      const cols=Math.max(5,Math.min(8,Math.floor(d*.7))), rows=Math.max(6,Math.min(10,Math.floor(d*.78)));
      const cw=innerW/cols, ch=innerH/rows;
      for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
        const x=margin+c*cw, y=margin+r*ch;
        const ww=cw*(.82+.12*rnd())*(1-gap*.25), hh=ch*(.82+.12*rnd())*(1-gap*.25);
        const palette=[accent,accent2,p.c,p.b,f1,f2][(r+c+index)%6];
        const rx=Math.min(ww,hh)*(.08+.38*round);
        out+=rect(x+(cw-ww)/2,y+(ch-hh)/2,ww,hh,palette,rx,(rnd()-.5)*rot*.45,x+cw/2,y+ch/2);
      }
      out+=rect(w*.28,h*.39,w*.44,h*.20,p.c,Math.min(w,h)*.02,0,w*.5,h*.49);
      return out;
    }

    if(index%8===6){
      out+=`<rect width="${w}" height="${h}" fill="${accent}"/>`;
      out+=rect(w*.54,h*.52,w*.46,h*.48,accent2,0,0,w*.77,h*.76);
      out+=rect(0,h*.60,w*.38,h*.40,f3,0,0,w*.19,h*.80);
      const cx=w*.58, cy=h*.47;
      const r=Math.min(w,h)*(.20+.06*v)*s;
      out+=circle(cx,cy,r,f2);
      const rays=Math.max(6,Math.floor(d*.8));
      for(let i=0;i<rays;i++){
        const a=normalizeAngle(rot+i*360/rays)*Math.PI/180, len=Math.min(w,h)*(.12+.05*rnd())*s, wi=Math.min(w,h)*(.025+.018*rnd())*s;
        const p1=[cx+Math.cos(a)*r*.9,cy+Math.sin(a)*r*.9], p2=[cx+Math.cos(a)*len+r*Math.cos(a),cy+Math.sin(a)*len+r*Math.sin(a)];
        const p3=[p2[0]+Math.cos(a+Math.PI/2)*wi,p2[1]+Math.sin(a+Math.PI/2)*wi], p4=[p1[0]+Math.cos(a+Math.PI/2)*wi,p1[1]+Math.sin(a+Math.PI/2)*wi];
        out+=polygon([p1,p2,p3,p4],i%2?f1:f3);
      }
      return out;
    }

    // Variation 7 — vertical chromatic type/grid reference.
    out+=`<rect width="${w}" height="${h}" fill="${dark}"/>`;
    const bars=Math.max(7,Math.floor(d*.95));
    const palette=[accent,accent2,p.c,f1,f2,light];
    for(let i=0;i<bars;i++){
      const x=(i/bars)*w, bw=w/bars+.5;
      const slices=Math.max(3,Math.floor(2+v*5));
      for(let j=0;j<slices;j++){
        const yy=h*(j/slices), hh=h/slices;
        out+=rect(x,yy,bw,hh,palette[(i+j+index)%palette.length],Math.min(bw,hh)*.04,0,x+bw/2,yy+hh/2);
      }
    }
    const titleSize=Math.round(Math.min(w,h)*.12);
    out+=`<text x="${w*.06}" y="${h*.62}" font-size="${titleSize}" font-weight="900" font-family="Georgia, serif" fill="${p.c}">DESIGN</text>`;
    out+=`<text x="${w*.06}" y="${h*.68}" font-size="${Math.round(titleSize*.24)}" font-weight="700" font-family="Arial, sans-serif" fill="${p.c}">VISUAL SYSTEM / CREATIVE STUDY</text>`;
    return out;
  }

  function layout(id,w,h,p,rnd,index){
    return chromaticEditorial(id,w,h,p,rnd,index);
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
    const rnd=rndSeed((Number(state.seed)||1)+index*9719);
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
    const themes=Object.keys(THEMES), modes=["chromaticEditorial"];
    $("seed").value=Math.floor(Math.random()*99999999)+1;
    $("theme").value=themes[randomInt(Math.random,0,themes.length-1)]; syncThemeColors(true);
    $("designMode").value=modes[randomInt(Math.random,0,modes.length-1)];
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
