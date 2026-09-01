(() => {
  'use strict';

  let savedTheme = 'dark';
  try { savedTheme = localStorage.getItem('svg-eps-theme') || 'dark'; } catch (_) {}
  const state = { files: new Map(), theme: savedTheme };

  const $ = (id) => document.getElementById(id);
  const els = {
    fileInput: $('fileInput'), dropzone: $('dropzone'), browseBtn: $('browseBtn'), clearBtn: $('clearBtn'),
    queue: $('queue'), emptyQueue: $('emptyQueue'), convertAllBtn: $('convertAllBtn'),
    fileCount: $('fileCount'), readyCount: $('readyCount'), errorCount: $('errorCount'),
    themeBtn: $('themeBtn'), pageMode: $('pageMode'), scale: $('scale'), dpi: $('dpi'),
    embedFonts: $('embedFonts'), convertImages: $('convertImages'), strict: $('strict')
  };

  document.body.classList.toggle('light', state.theme === 'light');
  els.themeBtn.textContent = state.theme === 'light' ? '☾' : '☼';

  els.themeBtn.addEventListener('click', () => {
    state.theme = document.body.classList.toggle('light') ? 'light' : 'dark';
    try { localStorage.setItem('svg-eps-theme', state.theme); } catch (_) {}
    els.themeBtn.textContent = state.theme === 'light' ? '☾' : '☼';
  });

  els.browseBtn.addEventListener('click', (e) => { e.stopPropagation(); els.fileInput.click(); });
  els.dropzone.addEventListener('click', (e) => { if (e.target !== els.browseBtn) els.fileInput.click(); });
  els.dropzone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') els.fileInput.click(); });
  ['dragenter','dragover'].forEach(evt => els.dropzone.addEventListener(evt, e => { e.preventDefault(); els.dropzone.classList.add('dragover'); }));
  ['dragleave','drop'].forEach(evt => els.dropzone.addEventListener(evt, e => { e.preventDefault(); els.dropzone.classList.remove('dragover'); }));
  els.dropzone.addEventListener('drop', e => addFiles([...e.dataTransfer.files]));
  els.fileInput.addEventListener('change', e => { addFiles([...e.target.files]); e.target.value = ''; });
  els.clearBtn.addEventListener('click', () => { state.files.clear(); render(); });
  els.convertAllBtn.addEventListener('click', async () => {
    for (const item of state.files.values()) {
      if (item.status === 'ready' || item.status === 'error') await convertItem(item.id);
    }
  });

  function addFiles(files) {
    const svgFiles = files.filter(f => /\.svg$/i.test(f.name) || f.type === 'image/svg+xml');
    svgFiles.forEach(file => {
      const id = `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`;
      state.files.set(id, { id, file, status: 'ready', message: '', eps: null, preview: '' });
    });
    render();
  }

  function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const units = ['B','KB','MB','GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / 1024 ** i).toFixed(i ? 1 : 0)} ${units[i]}`;
  }

  function render() {
    const items = [...state.files.values()];
    els.fileCount.textContent = items.length;
    els.readyCount.textContent = items.filter(x => x.status === 'ready').length;
    els.errorCount.textContent = items.filter(x => x.status === 'error').length;
    els.convertAllBtn.disabled = !items.length;
    els.emptyQueue.style.display = items.length ? 'none' : 'grid';
    els.queue.innerHTML = '';
    for (const item of items) {
      const row = document.createElement('div');
      row.className = 'queue-item';
      row.innerHTML = `
        <div class="file-icon">SVG</div>
        <div>
          <div class="file-name" title="${escapeHtml(item.file.name)}">${escapeHtml(item.file.name)}</div>
          <div class="file-meta"><span>${formatBytes(item.file.size)}</span><span>${item.eps ? `${formatBytes(item.eps.size)} EPS` : 'waiting'}</span></div>
        </div>
        <div class="queue-actions">
          <span class="status ${item.status}">${item.status === 'processing' ? 'Converting…' : item.status === 'done' ? 'Ready to download' : item.status === 'error' ? 'Needs attention' : 'Ready'}</span>
          ${item.status === 'done' ? '<button class="small-btn download-btn">Download EPS</button>' : ''}
          <button class="small-btn remove-btn">Remove</button>
        </div>
        ${item.status === 'processing' ? '<div class="progress"><i></i></div>' : ''}
        ${item.message ? `<div class="error-text">${escapeHtml(item.message)}</div>` : ''}
      `;
      row.querySelector('.remove-btn').addEventListener('click', () => { state.files.delete(item.id); render(); });
      const dl = row.querySelector('.download-btn');
      if (dl) dl.addEventListener('click', () => downloadEps(item));
      els.queue.appendChild(row);
    }
  }

  async function convertItem(id) {
    const item = state.files.get(id);
    if (!item) return;
    item.status = 'processing'; item.message = ''; item.eps = null; render();
    await new Promise(r => requestAnimationFrame(r));
    try {
      const svgText = await item.file.text();
      const result = svgToEps(svgText, {
        pageMode: els.pageMode.value,
        scale: Math.max(0.01, Number(els.scale.value) || 1),
        dpi: Math.max(1, Number(els.dpi.value) || 96),
        preserveText: els.embedFonts.checked,
        embedImages: els.convertImages.checked,
        strict: els.strict.checked
      });
      const blob = new Blob([result.eps], { type: 'application/postscript' });
      item.eps = { blob, size: blob.size, filename: item.file.name.replace(/\.svg$/i, '') + '.eps' };
      item.status = 'done';
      item.message = result.warnings.length ? `Converted with notes: ${result.warnings.slice(0, 4).join(' • ')}` : '';
    } catch (err) {
      item.status = 'error';
      item.message = err instanceof Error ? err.message : String(err);
    }
    render();
  }

  function downloadEps(item) {
    if (!item.eps) return;
    const a = document.createElement('a');
    const url = URL.createObjectURL(item.eps.blob);
    a.href = url; a.download = item.eps.filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  }

  // ------------------------- EPS ENGINE -------------------------

  function svgToEps(svgText, options) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');
    const parserError = doc.querySelector('parsererror');
    if (parserError) throw new Error('The SVG could not be parsed. Please verify that it is valid XML.');
    const root = doc.documentElement;
    if (!root || root.nodeName.toLowerCase() !== 'svg') throw new Error('The file is not an SVG document.');

    const warnings = [];
    const defs = collectDefs(root);
    const dims = resolveCanvas(root, options);
    const ctx = { defs, warnings, options, root, dimensions: dims, clipCounter: 0, useCounter: 0, referencedIds: new Set(), warnedTextFont: false };
    const body = [];
    body.push(`${fmt(dims.width)} 0 translate origin`); // harmless marker consumed by our own parser? removed below
    body.pop();
    body.push('gsave');
    // Use one matrix for the SVG top-left -> EPS bottom-left conversion. Keeping
    // the scale inside this matrix avoids an Illustrator/Ghostscript font edge case
    // caused by an identity `scale` followed by a reflected CTM.
    body.push(`[${fmt(options.scale)} 0 0 ${fmt(-options.scale)} 0 ${fmt(dims.height)}] concat`);
    if (dims.vb) body.push(`[1 0 0 1 ${fmt(-dims.vb.x)} ${fmt(-dims.vb.y)}] concat`);

    const styleCache = new Map();
    walkChildren(root, body, ctx, identity(), inheritedStyle(null), styleCache);
    body.push('grestore');

    const bbox = computeBBox(dims);
    const title = sanitizeDsc(root.getAttribute('id') || 'SVG artwork');
    const date = new Date().toISOString().replace('T',' ').replace(/\.\d{3}Z$/,' UTC');
    const header = [
      '%!PS-Adobe-3.0 EPSF-3.0',
      `%%Title: ${title}`,
      '%%Creator: SVG to EPS Converter (GitHub Pages)',
      `%%CreationDate: ${date}`,
      '%%LanguageLevel: 2',
      `%%BoundingBox: ${bbox.join(' ')}`,
      `%%HiResBoundingBox: ${bbox.map(n => Number(n).toFixed(4)).join(' ')}`,
      '%%Pages: 1',
      '%%DocumentNeededResources: font Helvetica',
      '%%EndComments',
      '%%BeginProlog',
      '/EPSsave save def',
      '%%EndProlog',
      '%%BeginSetup',
      '%%EndSetup',
      body.join('\n'),
      'EPSsave restore',
      '%%Trailer',
      '%%EOF',
      ''
    ].join('\n');

    return { eps: header, warnings };
  }

  function resolveCanvas(svg, options) {
    const vb = parseViewBox(svg.getAttribute('viewBox'));
    let width = numberFromLength(svg.getAttribute('width'));
    let height = numberFromLength(svg.getAttribute('height'));
    if (!width || !height) {
      width = vb ? vb.width : 800;
      height = vb ? vb.height : 600;
    }
    if (options.pageMode === 'a4' || options.pageMode === 'a4landscape') {
      width = options.pageMode === 'a4' ? 595.2756 : 841.8898;
      height = options.pageMode === 'a4' ? 841.8898 : 595.2756;
    } else if (options.pageMode === 'letter' || options.pageMode === 'letterlandscape') {
      width = options.pageMode === 'letter' ? 612 : 792;
      height = options.pageMode === 'letter' ? 792 : 612;
    }
    const origin = vb ? { x: vb.x, y: vb.y } : { x: 0, y: 0 };
    return { width, height, vb, origin };
  }

  function collectDefs(root) {
    const defs = new Map();
    root.querySelectorAll('[id]').forEach(el => defs.set(el.getAttribute('id'), el));
    return defs;
  }

  function walkChildren(parent, out, ctx, matrix, inherited, styleCache) {
    for (const node of parent.children) {
      if (['defs','metadata','title','desc','style','script'].includes(node.localName)) continue;
      emitElement(node, out, ctx, matrix, inherited, styleCache);
    }
  }

  function emitElement(el, out, ctx, parentMatrix, parentStyle, styleCache) {
    const tag = el.localName;
    const transform = parseTransform(el.getAttribute('transform'));
    const matrix = multiply(parentMatrix, transform);
    const style = computeStyle(el, parentStyle, styleCache);

    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return;

    switch (tag) {
      case 'g':
      case 'svg':
      case 'a':
      case 'symbol':
        ctx.options.strict && tag === 'a' && ctx.warnings.push('Link semantics are flattened to artwork.');
        out.push('gsave');
        applyOpacity(out, style.opacity);
        walkChildren(el, out, ctx, matrix, style, styleCache);
        out.push('grestore');
        break;
      case 'path':
        if (el.getAttribute('d')) drawPath(el.getAttribute('d'), out, style, matrix, ctx);
        break;
      case 'rect': drawRect(el, out, style, matrix, ctx); break;
      case 'circle': drawEllipse(el.getAttribute('cx'), el.getAttribute('cy'), el.getAttribute('r'), el.getAttribute('r'), el, out, style, matrix, ctx); break;
      case 'ellipse': drawEllipse(el.getAttribute('cx'), el.getAttribute('cy'), el.getAttribute('rx'), el.getAttribute('ry'), el, out, style, matrix, ctx); break;
      case 'line': drawLine(el, out, style, matrix, ctx); break;
      case 'polyline':
      case 'polygon': drawPoly(el, out, style, matrix, ctx, tag === 'polygon'); break;
      case 'text': drawText(el, out, style, matrix, ctx); break;
      case 'use': drawUse(el, out, style, matrix, ctx); break;
      case 'clipPath': break;
      case 'image': drawImage(el, out, style, matrix, ctx); break;
      case 'defs': break;
      case 'filter': ctx.warnings.push('<filter> effects are not reproduced in EPS.'); break;
      default:
        ctx.warnings.push(`Unsupported SVG element <${tag}> was skipped.`);
    }
  }

  function drawUse(el, out, style, matrix, ctx) {
    const ref = (el.getAttribute('href') || el.getAttribute('xlink:href') || '').replace(/^#/, '');
    const target = ctx.defs.get(ref);
    if (!target) { ctx.warnings.push(`Could not resolve <use href="#${ref}">.`); return; }
    if (ctx.referencedIds.has(ref)) { ctx.warnings.push(`Circular <use> reference #${ref} skipped.`); return; }
    ctx.referencedIds.add(ref);
    const x = numberFromLength(el.getAttribute('x')) || 0;
    const y = numberFromLength(el.getAttribute('y')) || 0;
    const m = multiply(matrix, [1,0,0,1,x,y]);
    out.push('gsave');
    emitElement(target, out, ctx, m, style, new Map());
    out.push('grestore');
    ctx.referencedIds.delete(ref);
  }

  function drawPath(d, out, style, matrix, ctx) {
    const commands = parsePath(d, ctx);
    if (!commands.length) return;
    out.push('newpath');
    let current = [0,0], start = [0,0];
    let lastCubic = null, lastQuad = null, lastCmd = '';
    for (const c of commands) {
      switch (c.cmd) {
        case 'M': { const p = transformPoint(matrix, c.x,c.y); out.push(`${fmt(p[0])} ${fmt(p[1])} moveto`); current=[c.x,c.y]; start=current.slice(); lastCubic=null; lastQuad=null; break; }
        case 'L': { const p=transformPoint(matrix,c.x,c.y); out.push(`${fmt(p[0])} ${fmt(p[1])} lineto`); current=[c.x,c.y]; lastCubic=null; lastQuad=null; break; }
        case 'C': { const p1=transformPoint(matrix,c.x1,c.y1), p2=transformPoint(matrix,c.x2,c.y2), p=transformPoint(matrix,c.x,c.y); out.push(`${fmt(p1[0])} ${fmt(p1[1])} ${fmt(p2[0])} ${fmt(p2[1])} ${fmt(p[0])} ${fmt(p[1])} curveto`); current=[c.x,c.y]; lastCubic=[c.x2,c.y2]; lastQuad=null; break; }
        case 'Q': {
          const c1 = [current[0] + (2/3)*(c.x1-current[0]), current[1] + (2/3)*(c.y1-current[1])];
          const c2 = [c.x + (2/3)*(c.x1-c.x), c.y + (2/3)*(c.y1-c.y)];
          const p1=transformPoint(matrix,...c1), p2=transformPoint(matrix,...c2), p=transformPoint(matrix,c.x,c.y);
          out.push(`${fmt(p1[0])} ${fmt(p1[1])} ${fmt(p2[0])} ${fmt(p2[1])} ${fmt(p[0])} ${fmt(p[1])} curveto`);
          current=[c.x,c.y]; lastQuad=[c.x1,c.y1]; lastCubic=null; break;
        }
        case 'Z': out.push('closepath'); current=start.slice(); lastCubic=null; lastQuad=null; break;
      }
      lastCmd = c.cmd;
    }
    paint(out, style, matrix);
  }

  function drawRect(el, out, style, matrix, ctx) {
    const x=numberFromLength(el.getAttribute('x'))||0, y=numberFromLength(el.getAttribute('y'))||0;
    const w=numberFromLength(el.getAttribute('width'))||0, h=numberFromLength(el.getAttribute('height'))||0;
    if (w<=0 || h<=0) return;
    const rx=Math.min(numberFromLength(el.getAttribute('rx'))||0,w/2), ry=Math.min(numberFromLength(el.getAttribute('ry'))||rx,h/2);
    if (!rx && !ry) {
      const pts=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(p=>transformPoint(matrix,p[0],p[1]));
      out.push('newpath', `${fmt(pts[0][0])} ${fmt(pts[0][1])} moveto`, `${fmt(pts[1][0])} ${fmt(pts[1][1])} lineto`, `${fmt(pts[2][0])} ${fmt(pts[2][1])} lineto`, `${fmt(pts[3][0])} ${fmt(pts[3][1])} lineto closepath`);
      paint(out,style,matrix); return;
    }
    const rxs = rx || ry, rys = ry || rx;
    out.push('newpath');
    roundedRectPath(out,x,y,w,h,rxs,rys,matrix);
    paint(out,style,matrix);
  }

  function roundedRectPath(out,x,y,w,h,rx,ry,m) {
    const k=0.5522847498;
    let p=transformPoint(m,x+rx,y); out.push(`${fmt(p[0])} ${fmt(p[1])} moveto`);
    p=transformPoint(m,x+w-rx,y); out.push(`${fmt(p[0])} ${fmt(p[1])} lineto`);
    addCubic(out,m,[x+w-rx+k*rx,y],[x+w,y+ry-k*ry],[x+w,y+ry]);
    p=transformPoint(m,x+w,y+h-ry); out.push(`${fmt(p[0])} ${fmt(p[1])} lineto`);
    addCubic(out,m,[x+w,y+h-ry+k*ry],[x+w-rx+k*rx,y+h],[x+w-rx,y+h]);
    p=transformPoint(m,x+rx,y+h); out.push(`${fmt(p[0])} ${fmt(p[1])} lineto`);
    addCubic(out,m,[x+rx-k*rx,y+h],[x,y+h-ry+k*ry],[x,y+h-ry]);
    p=transformPoint(m,x,y+ry); out.push(`${fmt(p[0])} ${fmt(p[1])} lineto`);
    addCubic(out,m,[x,y+ry-k*ry],[x+rx-k*rx,y],[x+rx,y]);
    out.push('closepath');
  }

  function addCubic(out,m,p1,p2,p3) { const a=transformPoint(m,...p1),b=transformPoint(m,...p2),c=transformPoint(m,...p3); out.push(`${fmt(a[0])} ${fmt(a[1])} ${fmt(b[0])} ${fmt(b[1])} ${fmt(c[0])} ${fmt(c[1])} curveto`); }

  function drawEllipse(cxAttr, cyAttr, rxAttr, ryAttr, el, out, style, matrix) {
    const cx=numberFromLength(cxAttr)||0, cy=numberFromLength(cyAttr)||0, rx=numberFromLength(rxAttr)||0, ry=numberFromLength(ryAttr)||0;
    if(rx<=0||ry<=0)return;
    // Use 4 cubic segments, which remain vector curves under transforms.
    const k=0.5522847498;
    const p0=transformPoint(matrix,cx+rx,cy); out.push('newpath',`${fmt(p0[0])} ${fmt(p0[1])} moveto`);
    addCubic(out,matrix,[cx+rx,cy+k*ry],[cx+k*rx,cy+ry],[cx,cy+ry]);
    addCubic(out,matrix,[cx-k*rx,cy+ry],[cx-rx,cy+k*ry],[cx-rx,cy]);
    addCubic(out,matrix,[cx-rx,cy-k*ry],[cx-k*rx,cy-ry],[cx,cy-ry]);
    addCubic(out,matrix,[cx+k*rx,cy-ry],[cx+rx,cy-k*ry],[cx+rx,cy]);
    out.push('closepath'); paint(out,style,matrix);
  }

  function drawLine(el,out,style,matrix) {
    const x1=numberFromLength(el.getAttribute('x1'))||0,y1=numberFromLength(el.getAttribute('y1'))||0,x2=numberFromLength(el.getAttribute('x2'))||0,y2=numberFromLength(el.getAttribute('y2'))||0;
    const a=transformPoint(matrix,x1,y1),b=transformPoint(matrix,x2,y2);
    out.push('newpath',`${fmt(a[0])} ${fmt(a[1])} moveto`,`${fmt(b[0])} ${fmt(b[1])} lineto`); paintStroke(out,style,matrix);
  }

  function drawPoly(el,out,style,matrix,closed) {
    const nums=(el.getAttribute('points')||'').trim().replace(/,/g,' ').split(/\s+/).map(Number).filter(Number.isFinite);
    if(nums.length<4) return;
    out.push('newpath');
    let p=transformPoint(matrix,nums[0],nums[1]); out.push(`${fmt(p[0])} ${fmt(p[1])} moveto`);
    for(let i=2;i<nums.length;i+=2){ p=transformPoint(matrix,nums[i],nums[i+1]); out.push(`${fmt(p[0])} ${fmt(p[1])} lineto`); }
    if(closed) out.push('closepath');
    paint(out,style,matrix);
  }

  function drawText(el,out,style,matrix,ctx) {
    const text=(el.textContent||'').replace(/\s+/g,' ').trim();
    if(!text) return;
    const x=numberFromLength(el.getAttribute('x'))||0, y=numberFromLength(el.getAttribute('y'))||0;
    const p=transformPoint(matrix,x,y);
    const h=ctx.dimensions.height;
    const vb=ctx.dimensions.vb;
    // Render text with the default positive CTM. This makes the EPS safe for
    // Illustrator/PostScript font engines while preserving the document's SVG
    // coordinate mapping explicitly.
    out.push('gsave');
    out.push('initmatrix');
    const scale=ctx.options.scale;
    const epsTextX=(p[0] - (vb ? vb.x : 0)) * scale;
    const epsTextY=h - (p[1] - (vb ? vb.y : 0)) * scale;
    const family=psFontName(style.fontFamily || 'Helvetica');
    const size=Math.max(0.01, Number(style.fontSize)||16);
    const bold = style.fontWeight === 'bold' || Number(style.fontWeight)>=600;
    const italic = style.fontStyle === 'italic' || style.fontStyle === 'oblique';
    let font = family;
    if (family === 'Times-Roman') font = italic ? 'Times-Italic' : (bold ? 'Times-Bold' : 'Times-Roman');
    else if (family === 'Courier') font = italic ? 'Courier-Oblique' : (bold ? 'Courier-Bold' : 'Courier');
    else font = italic ? 'Helvetica-Oblique' : (bold ? 'Helvetica-Bold' : 'Helvetica');
    out.push(`/${font} findfont ${fmt(size)} scalefont setfont`);
    applyColor(out, style.fill || '#000000');
    out.push(`${fmt(epsTextX)} ${fmt(epsTextY)} moveto (${escapePs(text)}) show`);
    out.push('grestore');
    if (!ctx.warnedTextFont) {
      const requested=String(style.fontFamily || 'Helvetica').replace(/[\"']/g,'').split(',')[0].trim();
      if (!/^(Helvetica|Arial|sans-serif|Times|Times New Roman|serif|Courier|Courier New|monospace)$/i.test(requested)) {
        ctx.warnings.push(`Text uses the PostScript fallback font Helvetica; original font “${requested}” is not embedded.`);
      }
      ctx.warnedTextFont=true;
    }
  }

  function psFontName(family) {
    const f=String(family).replace(/["']/g,'').split(',')[0].trim().toLowerCase();
    if(/times|serif/.test(f)) return 'Times-Roman';
    if(/courier|mono/.test(f)) return 'Courier';
    if(/helvetica|arial|sans/.test(f)) return 'Helvetica';
    return 'Helvetica';
  }

  function drawImage(el,out,style,matrix,ctx) {
    const href=el.getAttribute('href') || el.getAttribute('xlink:href') || '';
    const x=numberFromLength(el.getAttribute('x'))||0,y=numberFromLength(el.getAttribute('y'))||0,w=numberFromLength(el.getAttribute('width'))||0,h=numberFromLength(el.getAttribute('height'))||0;
    if(!href || !w || !h) return;
    if(!ctx.options.embedImages){ ctx.warnings.push('External image omitted because image embedding is disabled.'); return; }
    if(!/^data:image\/(png|jpeg|jpg);base64,/i.test(href)) { ctx.warnings.push('Only embedded PNG/JPEG images can be embedded in EPS by this build.'); return; }
    // PNG/JPEG decoding into raw PostScript image data is intentionally conservative.
    // We preserve a safe warning rather than emitting a broken EPS stream.
    ctx.warnings.push('Embedded image detected but skipped: robust EPS raster decoding requires a dedicated image decoder.');
  }

  function paint(out,style,matrix) {
    if(style.opacity < 1 || style.fillOpacity < 1 || style.strokeOpacity < 1) { /* handled as a compatibility approximation */ }
    if(style.fill && style.fill !== 'none') { out.push('gsave'); applyColor(out,style.fill); applyOpacity(out,style.opacity); if(style.fillRule==='evenodd') out.push('eofill'); else out.push('fill'); out.push('grestore'); }
    if(style.stroke && style.stroke !== 'none' && Number(style.strokeWidth)>0) { out.push('gsave'); paintStrokeOnly(out,style,matrix); out.push('grestore'); }
  }
  function paintStroke(out,style,matrix){ if(style.stroke && style.stroke !== 'none' && Number(style.strokeWidth)>0) paintStrokeOnly(out,style,matrix); else if(style.fill && style.fill!=='none') { out.push('gsave'); applyColor(out,style.fill); out.push('fill grestore'); } }
  function paintStrokeOnly(out,style,matrix){ applyColor(out,style.stroke || '#000'); applyOpacity(out,style.opacity); out.push(`${fmt(Math.max(0.01,Number(style.strokeWidth)||1))} setlinewidth`); if(style.linecap) out.push(`${capCode(style.linecap)} setlinecap`); if(style.linejoin) out.push(`${joinCode(style.linejoin)} setlinejoin`); if(style.dasharray && style.dasharray !== 'none') { const arr=style.dasharray.split(/[ ,]+/).map(Number).filter(Number.isFinite); if(arr.length) out.push(`[${arr.map(fmt).join(' ')}] ${fmt(Number(style.dashoffset)||0)} setdash`); } out.push('stroke'); }

  function capCode(v){ return v==='round'?1:v==='square'?2:0; }
  function joinCode(v){ return v==='round'?1:v==='bevel'?2:0; }
  function applyColor(out,color){
    const c=parseColor(color);
    if(!c) return;
    if(c.space==='cmyk') out.push(`${fmt(c.c)} ${fmt(c.m)} ${fmt(c.y)} ${fmt(c.k)} setcmykcolor`); else out.push(`${fmt(c.r)} ${fmt(c.g)} ${fmt(c.b)} setrgbcolor`);
  }
  function applyOpacity(out,opacity){ const a=Math.min(1,Math.max(0,Number(opacity)||1)); if(a<1) { /* PostScript transparency is not portable; approximate by no-op and warn upstream. */ } }

  function computeStyle(el,parent,cache){
    const s={...(parent||{}), fill:'#000000', fillOpacity:1, stroke:'none', strokeOpacity:1, strokeWidth:1, opacity:1, display:'inline', visibility:'visible', fillRule:'nonzero', linecap:'butt', linejoin:'miter', fontFamily:'Helvetica', fontSize:16, fontWeight:'normal', fontStyle:'normal'};
    if(parent) Object.assign(s,parent);
    const inline=el.getAttribute('style') || '';
    inline.split(';').forEach(part=>{ const i=part.indexOf(':'); if(i>0) s[toCamel(part.slice(0,i).trim())]=part.slice(i+1).trim(); });
    for(const attr of ['fill','fill-opacity','stroke','stroke-opacity','stroke-width','stroke-linecap','stroke-linejoin','stroke-dasharray','stroke-dashoffset','opacity','display','visibility','fill-rule','font-family','font-size','font-weight','font-style']){
      if(el.hasAttribute(attr)) s[toCamel(attr)]=el.getAttribute(attr);
    }
    const cls=el.getAttribute('class');
    if(cls) {
      const rules=getCssRules(el.ownerDocument);
      cls.split(/\s+/).filter(Boolean).forEach(c=>Object.assign(s,rules.get('.'+c)||{}));
    }
    s.opacity=Number(s.opacity)||1;
    s.fillOpacity=Number(s.fillOpacity ?? 1)||1;
    s.strokeOpacity=Number(s.strokeOpacity ?? 1)||1;
    s.strokeWidth=numberFromLength(s.strokeWidth) || 1;
    if(s.fill && /^url\(/i.test(s.fill)) { s.fill = resolvePaintReference(s.fill,el.ownerDocument); }
    if(s.stroke && /^url\(/i.test(s.stroke)) { s.stroke = resolvePaintReference(s.stroke,el.ownerDocument); }
    return s;
  }

  function resolvePaintReference(value,doc){
    const m=String(value).match(/url\(#([^\)]+)\)/i); if(!m) return value;
    const node=doc.getElementById(m[1]);
    // Flat fallback for simple linear gradients: sample first stop.
    if(node?.localName==='linearGradient' || node?.localName==='radialGradient') {
      const stop=node.querySelector('stop');
      if(stop) return stop.getAttribute('stop-color') || '#000000';
    }
    return '#000000';
  }

  function getCssRules(doc){
    const map=new Map();
    doc.querySelectorAll('style').forEach(style=>{
      const text=style.textContent||'';
      for(const block of text.split('}')){ const i=block.indexOf('{'); if(i<0) continue; const sel=block.slice(0,i).trim(); const declarations=block.slice(i+1); if(!/^\./.test(sel)) continue; const out={}; declarations.split(';').forEach(d=>{ const j=d.indexOf(':'); if(j>0) out[toCamel(d.slice(0,j).trim())]=d.slice(j+1).trim(); }); sel.split(',').forEach(s=>map.set(s.trim(),out)); }
    });
    return map;
  }

  function inheritedStyle(){ return {fill:'#000000',stroke:'none',strokeWidth:1,opacity:1,fillRule:'nonzero',fontFamily:'Helvetica',fontSize:16,fontWeight:'normal',fontStyle:'normal',display:'inline',visibility:'visible'}; }
  function toCamel(s){ return s.replace(/-([a-z])/g,(_,c)=>c.toUpperCase()); }

  // SVG path parser with absolute normalization and arc -> cubic approximation.
  function parsePath(d,ctx){
    const tokens=d.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g)||[];
    let i=0,cmd='',x=0,y=0,sx=0,sy=0,lastC=null,lastQ=null,out=[];
    const num=()=>Number(tokens[i++]);
    while(i<tokens.length){
      if(/[a-zA-Z]/.test(tokens[i])) cmd=tokens[i++];
      const rel=cmd===cmd.toLowerCase(); const C=cmd.toUpperCase();
      try{
        if(C==='M'||C==='L'||C==='T'){
          let first=true;
          while(i<tokens.length && !/[a-zA-Z]/.test(tokens[i])){
            const nx=num(),ny=num(); const X=rel?x+nx:nx,Y=rel?y+ny:ny;
            if(C==='M' && first){ out.push({cmd:'M',x:X,y:Y}); sx=X;sy=Y; } else if(C==='M'){ out.push({cmd:'L',x:X,y:Y}); } else if(C==='L'){ out.push({cmd:'L',x:X,y:Y}); } else { const q=lastQ? [2*x-lastQ[0],2*y-lastQ[1]]:[x,y]; out.push({cmd:'Q',x1:q[0],y1:q[1],x:X,y:Y}); lastQ=[q[0],q[1]]; }
            x=X;y=Y; first=false; lastC=null;
          }
          if(C==='M') cmd=rel?'l':'L';
        } else if(C==='H'||C==='V'){
          while(i<tokens.length&&!/[a-zA-Z]/.test(tokens[i])){ const n=num(); if(C==='H') x=rel?x+n:n; else y=rel?y+n:n; out.push({cmd:'L',x,y}); lastC=null; lastQ=null; }
        } else if(C==='C'){
          while(i<tokens.length&&!/[a-zA-Z]/.test(tokens[i])){ const x1=rel?x+num():num(),y1=rel?y+num():num(),x2=rel?x+num():num(),y2=rel?y+num():num(),X=rel?x+num():num(),Y=rel?y+num():num(); out.push({cmd:'C',x1,y1,x2,y2,x:X,y:Y}); x=X;y=Y;lastC=[x2,y2];lastQ=null; }
        } else if(C==='S'){
          while(i<tokens.length&&!/[a-zA-Z]/.test(tokens[i])){ const p=lastC?[2*x-lastC[0],2*y-lastC[1]]:[x,y]; const x2=rel?x+num():num(),y2=rel?y+num():num(),X=rel?x+num():num(),Y=rel?y+num():num(); out.push({cmd:'C',x1:p[0],y1:p[1],x2,y2,x:X,y:Y}); x=X;y=Y;lastC=[x2,y2];lastQ=null; }
        } else if(C==='Q'){
          while(i<tokens.length&&!/[a-zA-Z]/.test(tokens[i])){ const x1=rel?x+num():num(),y1=rel?y+num():num(),X=rel?x+num():num(),Y=rel?y+num():num(); out.push({cmd:'Q',x1,y1,x:X,y:Y});x=X;y=Y;lastQ=[x1,y1];lastC=null; }
        } else if(C==='A'){
          while(i<tokens.length&&!/[a-zA-Z]/.test(tokens[i])){ const rx=num(),ry=num(),rot=num(),large=num(),sweep=num(),nx=rel?x+num():num(),ny=rel?y+num():num();
            const cubics=arcToCubics(x,y,rx,ry,rot,!!large,!!sweep,nx,ny);
            cubics.forEach(c=>out.push({cmd:'C',...c})); x=nx;y=ny;lastC=cubics.length? [cubics[cubics.length-1].x2,cubics[cubics.length-1].y2]:null;lastQ=null;
          }
        } else if(C==='Z'){
          out.push({cmd:'Z'}); x=sx;y=sy;lastC=null;lastQ=null; cmd='';
        } else { ctx.warnings.push(`Unsupported path command ${C}.`); i=tokens.length; }
      }catch(e){ ctx.warnings.push('A malformed SVG path segment was skipped.'); }
    }
    return out;
  }

  function arcToCubics(x1,y1,rx,ry,phiDeg,largeArc,sweep,x2,y2){
    rx=Math.abs(rx);ry=Math.abs(ry); if(rx===0||ry===0) return [{x1,y1,x2:x2,y2:y2,x:x2,y:y2}];
    const phi=phiDeg*Math.PI/180, cosphi=Math.cos(phi),sinphi=Math.sin(phi);
    const dx=(x1-x2)/2,dy=(y1-y2)/2;
    const x1p=cosphi*dx+sinphi*dy, y1p=-sinphi*dx+cosphi*dy;
    let lam=(x1p*x1p)/(rx*rx)+(y1p*y1p)/(ry*ry); if(lam>1){const s=Math.sqrt(lam);rx*=s;ry*=s;}
    const sign=(largeArc===sweep)?-1:1;
    const sq=((rx*rx*ry*ry)-(rx*rx*y1p*y1p)-(ry*ry*x1p*x1p))/((rx*rx*y1p*y1p)+(ry*ry*x1p*x1p));
    const coef=sign*Math.sqrt(Math.max(0,sq));
    const cxp=coef*(rx*y1p/ry),cyp=coef*(-ry*x1p/rx);
    const cx=cosphi*cxp-sinphi*cyp+(x1+x2)/2,cy=sinphi*cxp+cosphi*cyp+(y1+y2)/2;
    const vector=(ux,uy,vx,vy)=>{ const dot=ux*vx+uy*vy,len=Math.sqrt((ux*ux+uy*uy)*(vx*vx+vy*vy)); const a=Math.acos(Math.min(1,Math.max(-1,dot/Math.max(len,1e-12)))); return (ux*vy-uy*vx<0)?-a:a; };
    const theta1=vector(1,0,(x1p-cxp)/rx,(y1p-cyp)/ry);
    let delta=vector((x1p-cxp)/rx,(y1p-cyp)/ry,(-x1p-cxp)/rx,(-y1p-cyp)/ry);
    if(!sweep&&delta>0)delta-=2*Math.PI; if(sweep&&delta<0)delta+=2*Math.PI;
    const n=Math.max(1,Math.ceil(Math.abs(delta)/(Math.PI/2))); const step=delta/n; const out=[];
    for(let k=0;k<n;k++){
      const a1=theta1+k*step,a2=a1+step,t=(4/3)*Math.tan((a2-a1)/4);
      const p1=ellipsePoint(cx,cy,rx,ry,phi,a1),p2=ellipsePoint(cx,cy,rx,ry,phi,a2);
      const d1=ellipseDerivative(rx,ry,phi,a1),d2=ellipseDerivative(rx,ry,phi,a2);
      out.push({x1:p1[0]+t*d1[0],y1:p1[1]+t*d1[1],x2:p2[0]-t*d2[0],y2:p2[1]-t*d2[1],x:p2[0],y:p2[1]});
    }
    return out;
  }
  function ellipsePoint(cx,cy,rx,ry,phi,a){ const ca=Math.cos(a),sa=Math.sin(a),cp=Math.cos(phi),sp=Math.sin(phi); return [cx+rx*ca*cp-ry*sa*sp,cy+rx*ca*sp+ry*sa*cp]; }
  function ellipseDerivative(rx,ry,phi,a){ const ca=Math.cos(a),sa=Math.sin(a),cp=Math.cos(phi),sp=Math.sin(phi); return [-rx*sa*cp-ry*ca*sp,-rx*sa*sp+ry*ca*cp]; }

  function parseTransform(value){
    if(!value) return identity(); let m=identity();
    const re=/([a-zA-Z]+)\s*\(([^)]*)\)/g; let hit;
    while((hit=re.exec(value))){ const name=hit[1],a=hit[2].replace(/,/g,' ').trim().split(/\s+/).map(Number).filter(Number.isFinite); let t=identity();
      if(name==='matrix'&&a.length>=6)t=a.slice(0,6);
      else if(name==='translate')t=[1,0,0,1,a[0]||0,a[1]||0];
      else if(name==='scale')t=[a[0]||1,0,0,a[1]===undefined?(a[0]||1):a[1],0,0];
      else if(name==='rotate'){ const ang=(a[0]||0)*Math.PI/180,ca=Math.cos(ang),sa=Math.sin(ang); t=[ca,sa,-sa,ca,0,0]; if(a.length>=3){ const [cx,cy]=a.slice(1); t=multiply([1,0,0,1,cx,cy],multiply(t,[1,0,0,1,-cx,-cy])); } }
      else if(name==='skewX'){ const q=Math.tan((a[0]||0)*Math.PI/180);t=[1,0,q,1,0,0]; }
      else if(name==='skewY'){ const q=Math.tan((a[0]||0)*Math.PI/180);t=[1,q,0,1,0,0]; }
      m=multiply(m,t);
    }
    return m;
  }
  function identity(){ return [1,0,0,1,0,0]; }
  function multiply(a,b){ return [a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]]; }
  function transformPoint(m,x,y){ return [m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]]; }

  function parseViewBox(v){ if(!v)return null; const a=v.replace(/,/g,' ').trim().split(/\s+/).map(Number); return a.length>=4&&a.every(Number.isFinite)?{x:a[0],y:a[1],width:a[2],height:a[3]}:null; }
  function numberFromLength(v){ if(v===null||v===undefined||v==='')return 0; const m=String(v).trim().match(/^[-+]?(?:\d*\.\d+|\d+\.?)(?:e[-+]?\d+)?/i); return m?Number(m[0]):0; }
  function fmt(n){ const x=Math.abs(n)<1e-8?0:n; return Number(x.toFixed(5)).toString(); }
  function escapePs(s){
    return Array.from(String(s)).map(ch=>{
      const code=ch.codePointAt(0);
      if (ch==='\\') return '\\\\';
      if (ch==='(') return '\\(';
      if (ch===')') return '\\)';
      if (ch==='\r' || ch==='\n') return ' ';
      if (code>=32 && code<=126) return ch;
      if (code<=255) return '\\'+code.toString(8).padStart(3,'0');
      return '?';
    }).join('');
  }
  function sanitizeDsc(s){ return String(s).replace(/[\r\n]/g,' ').replace(/[^\x20-\x7E]/g,'?').slice(0,180); }
  function parseColor(value){
    if(!value || value==='none') return null; let v=String(value).trim().toLowerCase();
    if(v==='transparent') return {space:'rgb',r:1,g:1,b:1};
    const names={black:'#000000',white:'#ffffff',red:'#ff0000',green:'#008000',blue:'#0000ff',yellow:'#ffff00',cyan:'#00ffff',magenta:'#ff00ff',gray:'#808080',grey:'#808080'};
    v=names[v]||v;
    if(/^#/.test(v)){ let h=v.slice(1); if(h.length===3)h=h.split('').map(c=>c+c).join(''); if(h.length===6){return {space:'rgb',r:parseInt(h.slice(0,2),16)/255,g:parseInt(h.slice(2,4),16)/255,b:parseInt(h.slice(4,6),16)/255};} }
    const m=v.match(/^rgba?\(([^)]+)\)/); if(m){ const a=m[1].replace(/\//g,' ').split(/[ ,]+/).map(Number); return {space:'rgb',r:(a[0]||0)/255,g:(a[1]||0)/255,b:(a[2]||0)/255}; }
    return null;
  }
  function computeBBox(dim){ return [0,0,Math.max(0,Math.ceil(dim.width)),Math.max(0,Math.ceil(dim.height))]; }

  render();
})();
