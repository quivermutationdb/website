/* ============================================================
   QMD — Quiver drawing
   Renders a quiver (directed multigraph) from a skew-symmetric
   exchange matrix B as an inline SVG element.

   Convention: for i < j, B[i][j] > 0 means |B[i][j]| arrows i -> j;
   B[i][j] < 0 means |B[i][j]| arrows j -> i.  Multiplicity (weight)
   is shown as a numeric label rather than parallel arrows, so it
   scales to the larger edge weights planned for the database.

   Usage:  container.appendChild(renderQuiver(matrix));
           el.innerHTML = renderQuiver(matrix, {mini:true}).outerHTML;
   ============================================================ */
(function (global) {
  const SVGNS = 'http://www.w3.org/2000/svg';
  let _uid = 0;

  function el(name, attrs) {
    const e = document.createElementNS(SVGNS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function renderQuiver(matrix, opts) {
    opts = opts || {};
    const n = matrix.length;
    const mini = !!opts.mini;
    const size = opts.size || (mini ? 132 : 300);
    const r    = opts.nodeRadius || (mini ? 9 : 18);
    const pad  = r + (mini ? 9 : 24);          // room for arrowheads + weight labels
    const cx = size / 2, cy = size / 2;
    const R  = Math.max(0, size / 2 - pad);

    const svg = el('svg', {
      viewBox: `0 0 ${size} ${size}`,
      class: 'quiver-svg' + (mini ? ' quiver-mini' : ''),
      width: size, height: size, role: 'img',
      'aria-label': `Quiver on ${n} vertices`,
    });

    // unique arrowhead marker for this svg
    const mid = 'qa-' + (_uid++);
    const ah  = mini ? 6 : 9;
    const defs = el('defs', {});
    const marker = el('marker', {
      id: mid, markerWidth: ah, markerHeight: ah,
      refX: ah - 1, refY: ah / 2, orient: 'auto', markerUnits: 'userSpaceOnUse',
    });
    marker.appendChild(el('path', { d: `M0,0 L${ah},${ah / 2} L0,${ah} z`, class: 'quiver-arrowhead' }));
    defs.appendChild(marker);
    svg.appendChild(defs);

    // vertex positions (single vertex centered; otherwise evenly on a circle, first at top)
    const pos = [];
    for (let i = 0; i < n; i++) {
      if (n === 1) { pos.push([cx, cy]); continue; }
      const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
      pos.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]);
    }

    // edges (at most one directed edge per pair, skew-symmetric => no 2-cycles)
    const eg = svg.appendChild(el('g', {}));
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const w = matrix[i][j];
        if (!w) continue;
        const [s, t] = w > 0 ? [i, j] : [j, i];
        drawEdge(eg, pos[s], pos[t], r, Math.abs(w), mid, mini);
      }
    }

    // vertices
    const ng = svg.appendChild(el('g', {}));
    for (let i = 0; i < n; i++) {
      const [x, y] = pos[i];
      ng.appendChild(el('circle', { cx: x, cy: y, r: r, class: 'quiver-node' }));
      const label = el('text', {
        x: x, y: y, class: 'quiver-node-label',
        'font-size': mini ? 9 : 14,
        'text-anchor': 'middle', 'dominant-baseline': 'central',
      });
      label.textContent = i + 1;
      ng.appendChild(label);
    }
    return svg;
  }

  function drawEdge(parent, P, Q, r, weight, markerId, mini) {
    const dx = Q[0] - P[0], dy = Q[1] - P[1];
    const L = Math.hypot(dx, dy) || 1;
    const ux = dx / L, uy = dy / L;
    const gap = mini ? 2 : 3;
    const x1 = P[0] + ux * r, y1 = P[1] + uy * r;
    const x2 = Q[0] - ux * (r + gap), y2 = Q[1] - uy * (r + gap);
    parent.appendChild(el('line', {
      x1, y1, x2, y2, class: 'quiver-edge', 'marker-end': `url(#${markerId})`,
    }));
    if (weight > 1) {
      const off = mini ? 7 : 11;
      const lx = (x1 + x2) / 2 - uy * off, ly = (y1 + y2) / 2 + ux * off;
      const t = el('text', {
        x: lx, y: ly, class: 'quiver-weight',
        'font-size': mini ? 8 : 12,
        'text-anchor': 'middle', 'dominant-baseline': 'central',
      });
      t.textContent = weight;
      parent.appendChild(t);
    }
  }

  global.renderQuiver = renderQuiver;
})(window);
