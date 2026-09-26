/* site.js — page-specific behaviour only. The engine never gets edited
   per-project (scroll-craft hard rule); anything bespoke lives here. */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    ScrollCraft.mount(document);
    initPeakCanvas();
  });

  // The signature move: a field of nodes that resolves from scattered noise
  // into a straight connected line as the reader scrolls through the pinned
  // act, then relaxes back into orbit as it leaves. Progress is read from the
  // act's own --sc-p custom property (published by the engine every frame),
  // so this stays in sync with the same smoothed scroll value that drives
  // every other device on the page — no second scroll listener.
  function initPeakCanvas() {
    var act = document.querySelector('[data-sc-peak]');
    var canvas = document.querySelector('.peak__canvas');
    if (!act || !canvas) return;

    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(devicePixelRatio || 1, 2);
    var w = 0, h = 0;
    var nodes = [];
    var COUNT = matchMedia('(max-width: 860px)').matches ? 46 : 90;

    function seedNodes() {
      nodes = [];
      for (var i = 0; i < COUNT; i++) {
        nodes.push({
          sx: Math.random(), sy: Math.random(),
          ex: (i + 0.5) / COUNT, ey: 0.5,
          r: 1.1 + Math.random() * 1.6,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    function resize() {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(p, t) {
      ctx.clearRect(0, 0, w, h);
      var accent = getComputedStyle(document.documentElement).getPropertyValue('--sc-accent').trim() || '#c8ff4d';
      var pts = nodes.map(function (n) {
        var drift = reduce ? 0 : Math.sin(t / 1400 + n.phase) * (1 - p) * 14;
        return {
          x: (n.sx + (n.ex - n.sx) * p) * w,
          y: (n.sy + (n.ey - n.sy) * p) * h + drift,
          r: n.r
        };
      });

      ctx.lineWidth = 1;
      for (var i = 0; i < pts.length; i++) {
        for (var j = i + 1; j < pts.length; j++) {
          var dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          var d = Math.sqrt(dx * dx + dy * dy);
          var reach = 60 + p * 46;
          if (d < reach) {
            ctx.strokeStyle = 'rgba(200,255,77,' + ((1 - d / reach) * (0.12 + p * 0.4)) + ')';
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
          }
        }
      }
      ctx.fillStyle = accent;
      pts.forEach(function (pt) {
        ctx.globalAlpha = 0.55 + p * 0.45;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    seedNodes();
    resize();
    addEventListener('resize', resize, { passive: true });

    function frame(t) {
      var p = parseFloat(getComputedStyle(act).getPropertyValue('--sc-p')) || 0;
      draw(Math.max(0, Math.min(1, p)), t);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
})();
