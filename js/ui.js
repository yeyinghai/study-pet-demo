/* 知识群岛 v0.2 —— 统一卡通 UI 组件 / 特效 / 宠物与怪物 */
(function () {
  'use strict';
  const W = 1280, H = 800;
  const FONT = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC","WenQuanYi Micro Hei",sans-serif';
  const C = {
    out: 0x4a2c17, outS: '#4a2c17', cream: 0xfff7e6, paper: 0xfffbf2,
    coral: 0xff8a5c, mint: 0x3fcf9a, sky: 0x46aef7, sun: 0xffc22e, grape: 0x9a7bff, rose: 0xff6f91, leaf: 0x7ccf4a, gray: 0xb9aea0,
    red: 0xff5a5a, green: 0x42d47f
  };
  const G = window.G = window.G || { lastUiTap: 0, test: {} };
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  const darker = (c, p) => Phaser.Display.Color.IntegerToColor(c).darken(p || 22).color;
  const lighter = (c, p) => Phaser.Display.Color.IntegerToColor(c).lighten(p || 18).color;

  function txt(scene, x, y, s, size, color, o) {
    o = o || {};
    const t = scene.add.text(x, y, s, {
      fontFamily: FONT, fontSize: (size || 28) + 'px', fontStyle: o.weight || 'bold', color: color || '#ffffff',
      stroke: o.stroke === undefined ? C.outS : o.stroke, strokeThickness: o.st === undefined ? Math.max(3, Math.round((size || 28) / 5)) : o.st,
      align: o.align || 'center', wordWrap: o.wrap ? { width: o.wrap, useAdvancedWrap: true } : undefined,
      lineSpacing: o.ls || 4, padding: { x: 4, y: 4 },
      shadow: o.shadow === false ? undefined : { offsetX: 0, offsetY: 3, color: 'rgba(74,44,23,0.35)', blur: 0, fill: true, stroke: true }
    }).setOrigin(o.ox === undefined ? 0.5 : o.ox, o.oy === undefined ? 0.5 : o.oy).setResolution(DPR);
    return t;
  }

  /* ---------- 程序生成贴图 ---------- */
  function star(g, cx, cy, r1, r2, n) {
    const pts = []; n = n || 5;
    for (let i = 0; i < n * 2; i++) { const r = i % 2 ? r2 : r1, a = -Math.PI / 2 + i * Math.PI / n; pts.push(new Phaser.Geom.Point(cx + Math.cos(a) * r, cy + Math.sin(a) * r)); }
    return pts;
  }
  function genTextures(scene) {
    const mk = (key, w, h, fn) => { if (scene.textures.exists(key)) return; const g = scene.make.graphics({ x: 0, y: 0, add: false }); fn(g); g.generateTexture(key, w, h); g.destroy(); };
    mk('dot', 16, 16, g => { g.fillStyle(0xffffff); g.fillCircle(8, 8, 8); });
    mk('soft', 64, 64, g => { for (let i = 16; i > 0; i--) { g.fillStyle(0xffffff, 0.06 + (16 - i) * 0.004); g.fillCircle(32, 32, i * 2); } });
    mk('spark', 32, 32, g => { g.fillStyle(0xffffff); g.fillPoints(star(g, 16, 16, 16, 4, 4), true); });
    mk('sq', 10, 14, g => { g.fillStyle(0xffffff); g.fillRect(0, 0, 10, 14); });
    mk('star', 56, 56, g => { g.fillStyle(C.out); g.fillPoints(star(g, 28, 29, 27, 13), true); g.fillStyle(C.sun); g.fillPoints(star(g, 28, 28, 22, 10), true); g.fillStyle(0xfff3a8); g.fillPoints(star(g, 25, 24, 9, 4), true); });
    mk('coin', 52, 52, g => { g.fillStyle(C.out); g.fillCircle(26, 26, 25); g.fillStyle(0xe8a317); g.fillCircle(26, 26, 21); g.fillStyle(0xffd43b); g.fillCircle(26, 24, 19); g.lineStyle(3, 0xe8a317); g.strokeCircle(26, 24, 12); g.fillStyle(0xfff6c4, 0.9); g.fillEllipse(19, 16, 9, 6); });
    mk('bolt', 52, 56, g => {
      const p = [[30, 2], [8, 32], [24, 32], [18, 54], [44, 22], [28, 22], [36, 2]].map(a => new Phaser.Geom.Point(a[0], a[1]));
      g.fillStyle(C.out); g.fillPoints(p.map(q => new Phaser.Geom.Point(q.x + 1, q.y + 1)), true);
      g.lineStyle(6, C.out); g.strokePoints(p, true); g.fillStyle(0x5ee08a); g.fillPoints(p, true); g.fillStyle(0xc9ffd8, 0.8); g.fillTriangle(30, 6, 16, 28, 26, 26);
    });
    mk('heart', 52, 48, g => {
      const draw = (s, c) => { g.fillStyle(c); g.fillCircle(16, 17, 13 * s); g.fillCircle(36, 17, 13 * s); g.fillTriangle(26 - 24 * s, 21, 26 + 24 * s, 21, 26, 21 + 24 * s); };
      draw(1.12, C.out); draw(0.95, C.rose); g.fillStyle(0xffffff, 0.6); g.fillEllipse(14, 13, 8, 5);
    });
    mk('grass', 70, 56, g => {
      const blade = (x, h, a, c) => { g.fillStyle(c); g.fillTriangle(x - 7, 56, x + 7, 56, x + a, 56 - h); };
      g.lineStyle(4, 0x2f6b2a);
      [[12, 34, -8], [26, 50, -2], [40, 44, 6], [56, 36, 10], [33, 30, 0]].forEach(b => { g.beginPath(); g.moveTo(b[0] - 8, 56); g.lineTo(b[0] + b[2], 56 - b[1] - 2); g.lineTo(b[0] + 8, 56); g.strokePath(); });
      [[12, 34, -8, 0x58b947], [26, 50, -2, 0x6fd157], [40, 44, 6, 0x58b947], [56, 36, 10, 0x6fd157], [33, 30, 0, 0x8ee36a]].forEach(b => blade(b[0], b[1], b[2], b[3]));
    });
    mk('bullet', 40, 40, g => { g.fillStyle(0xffffff, 0.35); g.fillCircle(20, 20, 19); g.fillStyle(C.out); g.fillPoints(star(g, 20, 21, 16, 7), true); g.fillStyle(0xfff07a); g.fillPoints(star(g, 20, 20, 13, 6), true); });
    mk('bobber', 30, 44, g => { g.fillStyle(C.out); g.fillEllipse(15, 26, 28, 30); g.fillStyle(0xffffff); g.fillEllipse(15, 28, 22, 22); g.fillStyle(C.red); g.fillRect(4, 14, 22, 12); g.fillEllipse(15, 18, 22, 18); g.fillStyle(C.out); g.fillRect(13, 0, 4, 12); g.fillStyle(0xffffff, 0.7); g.fillCircle(10, 18, 3); });
    mk('ring', 128, 128, g => { g.lineStyle(8, 0xffffff); g.strokeCircle(64, 64, 58); });
    mk('shadow', 120, 36, g => { g.fillStyle(0x000000, 0.22); g.fillEllipse(60, 18, 120, 36); });
    mk('speaker', 48, 48, g => {
      g.fillStyle(C.sky); g.fillCircle(24, 24, 23); g.lineStyle(3, C.out); g.strokeCircle(24, 24, 22);
      g.fillStyle(0xffffff); g.fillRect(11, 19, 7, 10); g.fillTriangle(16, 24, 26, 12, 26, 36);
      g.lineStyle(3, 0xffffff); g.beginPath(); g.arc(27, 24, 6, -0.9, 0.9); g.strokePath(); g.beginPath(); g.arc(27, 24, 11, -0.9, 0.9); g.strokePath();
    });
    mk('ball', 64, 64, g => {
      g.fillStyle(C.out); g.fillCircle(32, 32, 31); g.fillStyle(0xffffff); g.fillCircle(32, 32, 27);
      g.fillStyle(C.sky); g.slice(32, 32, 27, Math.PI, 0, false); g.fillPath();
      g.fillStyle(C.out); g.fillRect(4, 29, 56, 6); g.fillCircle(32, 32, 11); g.fillStyle(0xffffff); g.fillCircle(32, 32, 7);
      g.fillStyle(0xffffff, 0.6); g.fillEllipse(20, 16, 12, 7);
    });
    mk('lock', 56, 64, g => {
      g.lineStyle(8, C.out); g.beginPath(); g.arc(28, 26, 14, Math.PI, 0); g.strokePath();
      g.lineStyle(4, 0xcfd6e6); g.beginPath(); g.arc(28, 26, 14, Math.PI, 0); g.strokePath();
      g.fillStyle(C.out); g.fillRoundedRect(4, 24, 48, 38, 10); g.fillStyle(C.sun); g.fillRoundedRect(8, 28, 40, 30, 8); g.fillStyle(C.out); g.fillCircle(28, 40, 5); g.fillRect(26, 40, 4, 10);
    });
    mk('fogpuff', 160, 160, g => { for (let i = 20; i > 0; i--) { g.fillStyle(0xffffff, 0.05 + (20 - i) * 0.006); g.fillCircle(80, 80, i * 4); } });
    mk('shell', 40, 36, g => { g.fillStyle(C.out); g.fillTriangle(0, 36, 40, 36, 20, 0); g.fillStyle(0xfff3e0); g.fillTriangle(5, 32, 35, 32, 20, 7); g.fillStyle(0xffa45c); g.fillCircle(20, 24, 4); });
    mk('leafp', 20, 14, g => { g.fillStyle(0x6fd157); g.fillEllipse(10, 7, 20, 12); });
    mk('excl', 56, 70, g => { g.fillStyle(C.out); g.fillRoundedRect(0, 0, 56, 56, 16); g.fillTriangle(16, 50, 34, 50, 22, 70); g.fillStyle(C.sun); g.fillRoundedRect(4, 4, 48, 48, 13); g.fillStyle(C.out); g.fillRoundedRect(23, 10, 10, 24, 5); g.fillCircle(28, 43, 5); });
    mk('note', 44, 44, g => { g.fillStyle(C.out); g.fillCircle(14, 34, 10); g.fillRect(20, 6, 6, 28); g.fillTriangle(20, 6, 40, 12, 20, 18); g.fillStyle(C.grape); g.fillCircle(14, 34, 7); });
    mk('wallheart', 44, 40, g => { g.fillStyle(C.out); g.fillCircle(13, 14, 12); g.fillCircle(31, 14, 12); g.fillTriangle(1, 18, 43, 18, 22, 40); g.fillStyle(C.rose); g.fillCircle(13, 14, 9); g.fillCircle(31, 14, 9); g.fillTriangle(5, 17, 39, 17, 22, 35); });
    mk('reticle', 150, 150, g => { g.lineStyle(6, 0xff4d6d); g.strokeCircle(75, 75, 64); [[75, 2, 75, 26], [75, 124, 75, 148], [2, 75, 26, 75], [124, 75, 148, 75]].forEach(l => { g.beginPath(); g.moveTo(l[0], l[1]); g.lineTo(l[2], l[3]); g.strokePath(); }); });
    // 图标：图鉴、错题本、家长、守城、钓鱼
    mk('ic_dex', 56, 56, g => { g.fillStyle(C.out); g.fillRoundedRect(4, 6, 48, 46, 8); g.fillStyle(C.coral); g.fillRoundedRect(8, 10, 40, 38, 6); g.fillStyle(0xffffff); g.fillCircle(28, 29, 11); g.fillStyle(C.out); g.fillCircle(28, 29, 5); g.fillRect(8, 27, 40, 4); });
    mk('ic_book', 56, 56, g => { g.fillStyle(C.out); g.fillRoundedRect(6, 4, 44, 50, 6); g.fillStyle(C.grape); g.fillRoundedRect(10, 8, 36, 42, 5); g.fillStyle(0xffffff); g.fillRect(16, 16, 24, 4); g.fillRect(16, 25, 18, 4); g.fillStyle(C.red); g.fillTriangle(34, 34, 44, 34, 39, 46); });
    mk('ic_parent', 56, 56, g => { g.fillStyle(C.out); g.fillRoundedRect(8, 22, 40, 30, 8); g.lineStyle(7, C.out); g.beginPath(); g.arc(28, 22, 11, Math.PI, 0); g.strokePath(); g.fillStyle(C.mint); g.fillRoundedRect(12, 26, 32, 22, 6); g.fillStyle(C.out); g.fillCircle(28, 36, 4); });
    mk('ic_shoot', 56, 56, g => { g.fillStyle(C.out); g.fillRect(6, 20, 44, 32); g.fillRect(6, 10, 10, 12); g.fillRect(23, 10, 10, 12); g.fillRect(40, 10, 10, 12); g.fillStyle(0xd9b98a); g.fillRect(10, 24, 36, 24); g.fillRect(10, 14, 4, 10); g.fillRect(27, 14, 4, 10); g.fillRect(44, 14, 3, 10); g.fillStyle(C.out); g.fillRoundedRect(22, 34, 12, 14, 5); });
    mk('ic_fish', 56, 56, g => { g.fillStyle(C.out); g.fillEllipse(24, 28, 40, 28); g.fillTriangle(38, 28, 54, 14, 54, 42); g.fillStyle(0xffa54a); g.fillEllipse(24, 28, 33, 21); g.fillTriangle(42, 28, 50, 19, 50, 37); g.fillStyle(C.out); g.fillCircle(14, 25, 3); });
    mk('ic_close', 48, 48, g => { g.fillStyle(C.out); g.fillCircle(24, 24, 23); g.fillStyle(C.red); g.fillCircle(24, 22, 19); g.lineStyle(6, 0xffffff); g.beginPath(); g.moveTo(16, 14); g.lineTo(32, 30); g.moveTo(32, 14); g.lineTo(16, 30); g.strokePath(); });
    mk('ic_sword', 56, 56, g => { g.fillStyle(C.out); g.fillPoints(star(g, 28, 28, 27, 11, 4), true); g.fillStyle(0xffe066); g.fillPoints(star(g, 28, 28, 21, 8, 4), true); });
    mk('ic_leaf', 56, 56, g => { g.fillStyle(C.out); g.fillEllipse(28, 28, 46, 30); g.fillStyle(0x8ee36a); g.fillEllipse(28, 28, 38, 22); g.lineStyle(3, C.out); g.beginPath(); g.moveTo(10, 28); g.lineTo(44, 28); g.strokePath(); });
    mk('ic_drop', 56, 56, g => { g.fillStyle(C.out); g.fillCircle(28, 34, 18); g.fillTriangle(12, 30, 44, 30, 28, 2); g.fillStyle(0x7fd3ff); g.fillCircle(28, 34, 14); g.fillTriangle(16, 31, 40, 31, 28, 8); g.fillStyle(0xffffff, 0.7); g.fillEllipse(22, 32, 6, 9); });
    mk('ic_fire', 56, 56, g => { g.fillStyle(C.out); g.fillCircle(28, 36, 18); g.fillTriangle(10, 34, 46, 34, 30, 0); g.fillStyle(0xff9a3c); g.fillCircle(28, 36, 14); g.fillTriangle(15, 33, 41, 33, 30, 6); g.fillStyle(0xffe066); g.fillCircle(28, 40, 7); });
  }

  /* ---------- 圆角面板 ---------- */
  function panel(scene, x, y, w, h, o) {
    o = o || {};
    const c = scene.add.container(x, y);
    const g = scene.add.graphics(); c.add(g);
    const r = o.r || 26;
    g.fillStyle(0x000000, 0.18); g.fillRoundedRect(-w / 2 + 4, -h / 2 + 10, w, h, r);
    g.fillStyle(C.out); g.fillRoundedRect(-w / 2 - 5, -h / 2 - 5, w + 10, h + 10, r + 4);
    g.fillStyle(o.color || C.paper); g.fillRoundedRect(-w / 2, -h / 2, w, h, r);
    g.fillStyle(0xffffff, 0.55); g.fillRoundedRect(-w / 2 + 10, -h / 2 + 8, w - 20, 14, 7);
    if (o.inner) { g.lineStyle(3, o.inner, 0.5); g.strokeRoundedRect(-w / 2 + 12, -h / 2 + 12, w - 24, h - 24, r - 8); }
    if (o.title) {
      const tw = Math.max(220, o.title.length * 34 + 70);
      const rb = scene.add.graphics();
      rb.fillStyle(C.out); rb.fillRoundedRect(-tw / 2 - 5, -h / 2 - 34, tw + 10, 66, 22);
      rb.fillStyle(o.titleColor || C.coral); rb.fillRoundedRect(-tw / 2, -h / 2 - 29, tw, 56, 18);
      rb.fillStyle(0xffffff, 0.3); rb.fillRoundedRect(-tw / 2 + 10, -h / 2 - 25, tw - 20, 16, 8);
      c.add(rb); c.add(txt(scene, 0, -h / 2 - 1, o.title, 30));
    }
    c.w = w; c.h = h; return c;
  }

  /* ---------- 描边果冻按钮 ---------- */
  function button(scene, x, y, w, h, label, o) {
    o = o || {};
    const c = scene.add.container(x, y); c.setSize(w, h);
    const g = scene.add.graphics(); c.add(g);
    const inner = scene.add.container(0, 0); c.add(inner);
    const r = o.r === undefined ? Math.min(22, h / 2) : o.r;
    let color = o.color || C.mint, pressed = false, disabled = false, overrideColor = null;
    const draw = () => {
      const col = overrideColor || color, p = pressed ? 4 : 0;
      g.clear();
      g.fillStyle(0x000000, 0.2); g.fillRoundedRect(-w / 2 + 2, -h / 2 + 9, w, h, r);
      g.fillStyle(C.out); g.fillRoundedRect(-w / 2 - 4, -h / 2 - 4 + p, w + 8, h + 8 - p, r + 3);
      g.fillStyle(darker(col, 24)); g.fillRoundedRect(-w / 2, -h / 2 + p, w, h - p, r);
      g.fillStyle(col); g.fillRoundedRect(-w / 2, -h / 2 + p, w, h - 7, r);
      g.fillStyle(0xffffff, 0.32); g.fillRoundedRect(-w / 2 + 9, -h / 2 + 5 + p, w - 18, Math.max(8, (h - 7) * 0.34), Math.min(10, r));
      inner.y = p - 3;
    };
    draw();
    let icon = null, label2 = null;
    const fs = o.size || Math.min(34, Math.round(h * 0.42));
    if (o.icon) { icon = scene.add.image(o.iconOnly ? 0 : -w / 2 + h * 0.52, 0, o.icon); const s = (h * 0.62) / Math.max(icon.width, icon.height); icon.setScale(s); inner.add(icon); }
    const lbl = txt(scene, o.icon && !o.iconOnly ? h * 0.25 : 0, o.sub ? -fs * 0.32 : 0, label || '', fs, o.textColor || '#ffffff');
    if (o.iconOnly) lbl.setVisible(false);
    inner.add(lbl);
    if (o.sub) { label2 = txt(scene, lbl.x, fs * 0.55, o.sub, Math.round(fs * 0.55), '#fffbe8', { st: 4 }); inner.add(label2); }
    const zone = scene.add.zone(0, 0, w + 8, h + 8).setInteractive({ useHandCursor: true }); c.add(zone);
    c.zone = zone; c.lbl = lbl; c.icon = icon; c.sub = label2;
    const release = (fire) => {
      if (!pressed) return; pressed = false; draw();
      scene.tweens.killTweensOf(c);
      scene.tweens.add({ targets: c, scaleX: { from: 1.12, to: 1 }, scaleY: { from: 0.9, to: 1 }, duration: 320, ease: 'Back.Out' });
      if (fire && o.onClick) { FX.burst(scene, c.x + (c.parentContainer ? c.parentContainer.x : 0), c.y + (c.parentContainer ? c.parentContainer.y : 0), { tex: 'spark', count: 6, speed: 220, life: 380, scale: 0.6, tint: [0xffffff, C.sun] }); o.onClick(c); }
    };
    zone.on('pointerdown', (p, lx, ly, ev) => {
      G.lastUiTap = performance.now();
      if (ev && ev.stopPropagation) ev.stopPropagation();
      if (disabled || c.locked) { SFX.play('wrong'); scene.tweens.add({ targets: c, x: c.x + 8, duration: 50, yoyo: true, repeat: 3 }); if (o.onDisabled) o.onDisabled(); return; }
      pressed = true; draw(); SFX.play(o.sfx || 'click');
      scene.tweens.killTweensOf(c);
      scene.tweens.add({ targets: c, scaleX: 0.92, scaleY: 0.9, duration: 70, ease: 'Quad.Out' });
    });
    zone.on('pointerup', () => release(true));
    zone.on('pointerout', () => { release(false); if (!pressed && !disabled) scene.tweens.add({ targets: c, scale: 1, duration: 120 }); });
    zone.on('pointerover', () => { if (!pressed && !disabled && !c.pulsing) scene.tweens.add({ targets: c, scale: 1.04, duration: 120 }); });
    c.setEnabled = b => { disabled = !b; c.setAlpha(b ? 1 : 0.55); return c; };
    c.setColor = col => { color = col; draw(); return c; };
    c.flashColor = (col, ms) => { overrideColor = col; draw(); scene.time.delayedCall(ms || 600, () => { overrideColor = null; draw(); }); return c; };
    c.setLabel = s => { lbl.setText(s); return c; };
    c.pulse = on => {
      if (c.pulseTween) { c.pulseTween.stop(); c.pulseTween = null; c.setScale(1); }
      c.pulsing = on;
      if (on) c.pulseTween = scene.tweens.add({ targets: c, scale: 1.08, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      return c;
    };
    c.center = () => { const m = c.getWorldTransformMatrix(); return { x: m.tx, y: m.ty }; };
    return c;
  }

  /* ---------- 气泡 ---------- */
  function bubble(scene, x, y, w, h, o) {
    o = o || {};
    const c = scene.add.container(x, y);
    const g = scene.add.graphics(); c.add(g);
    const tail = o.tail || 'down', tx = o.tailX || 0, fill = o.color || 0xffffff;
    const shape = (pad, col) => {
      g.fillStyle(col); g.fillRoundedRect(-w / 2 - pad, -h / 2 - pad, w + pad * 2, h + pad * 2, 24 + pad);
      if (tail === 'down') g.fillTriangle(tx - 18 - pad, h / 2 - 2, tx + 18 + pad, h / 2 - 2, tx + (o.tailDX || 0), h / 2 + 28 + pad * 1.6);
      if (tail === 'up') g.fillTriangle(tx - 18 - pad, -h / 2 + 2, tx + 18 + pad, -h / 2 + 2, tx + (o.tailDX || 0), -h / 2 - 28 - pad * 1.6);
      if (tail === 'left') g.fillTriangle(-w / 2 + 2, -16 - pad, -w / 2 + 2, 16 + pad, -w / 2 - 28 - pad * 1.6, 8);
      if (tail === 'right') g.fillTriangle(w / 2 - 2, -18 - pad + (o.tailY || 0), w / 2 - 2, 18 + pad + (o.tailY || 0), w / 2 + 32 + pad * 1.6, (o.tailY || 0) - 14);
    };
    g.fillStyle(0x000000, 0.15); g.fillRoundedRect(-w / 2 + 3, -h / 2 + 9, w, h, 24);
    shape(5, C.out); shape(0, fill);
    g.fillStyle(0xffffff, 0.6); g.fillRoundedRect(-w / 2 + 12, -h / 2 + 7, w - 24, 10, 5);
    c.w = w; c.h = h;
    if (o.pop !== false) { c.setScale(0.2); scene.tweens.add({ targets: c, scale: 1, duration: 360, ease: 'Back.Out' }); }
    return c;
  }

  /* ---------- 特效 ---------- */
  const FX = {
    float(scene, x, y, s, o) {
      o = o || {};
      const t = txt(scene, x, y, s, o.size || 40, o.color || '#ffe14d', { st: o.st || 8 }).setDepth(o.depth || 900);
      if (o.scroll === 0) t.setScrollFactor(0);
      t.setScale(0.3);
      scene.tweens.add({ targets: t, scale: 1.15, duration: 160, ease: 'Back.Out', onComplete: () => scene.tweens.add({ targets: t, scale: 1, duration: 120 }) });
      scene.tweens.add({ targets: t, y: y - (o.dy || 80), duration: o.dur || 1000, ease: 'Cubic.Out' });
      scene.tweens.add({ targets: t, alpha: 0, delay: (o.dur || 1000) * 0.65, duration: (o.dur || 1000) * 0.35, onComplete: () => t.destroy() });
      return t;
    },
    burst(scene, x, y, o) {
      o = o || {};
      const e = scene.add.particles(x, y, o.tex || 'dot', {
        speed: { min: (o.speed || 300) * 0.4, max: o.speed || 300 }, angle: o.angle || { min: 0, max: 360 },
        lifespan: { min: (o.life || 700) * 0.6, max: o.life || 700 }, scale: { start: o.scale || 0.9, end: 0 }, alpha: { start: 1, end: 0.2 },
        gravityY: o.gravity || 0, rotate: o.rotate ? { min: 0, max: 360 } : 0, tint: o.tint || [0xffffff], emitting: false,
        blendMode: o.add ? 'ADD' : 'NORMAL'
      }).setDepth(o.depth || 800);
      if (o.scroll === 0) e.setScrollFactor(0);
      e.explode(o.count || 14);
      scene.time.delayedCall((o.life || 700) + 200, () => e.destroy());
      return e;
    },
    ring(scene, x, y, color, r, o) {
      o = o || {};
      const i = scene.add.image(x, y, 'ring').setTint(color || 0xffffff).setScale(0.1).setDepth(o.depth || 790).setAlpha(0.9);
      if (o.scroll === 0) i.setScrollFactor(0);
      if (o.flat) i.scaleY = 0.04;
      scene.tweens.add({ targets: i, scaleX: (r || 80) / 64, scaleY: o.flat ? (r || 80) / 64 * 0.35 : (r || 80) / 64, alpha: 0, duration: o.dur || 450, ease: 'Cubic.Out', onComplete: () => i.destroy() });
    },
    confetti(scene, o) {
      o = o || {};
      const e = scene.add.particles(0, -20, 'sq', {
        x: { min: 0, max: W }, speedY: { min: 200, max: 420 }, speedX: { min: -120, max: 120 }, lifespan: 2600, rotate: { start: 0, end: 720 },
        scaleX: { min: 0.6, max: 1.2 }, scaleY: { min: 0.6, max: 1.2 }, gravityY: 160, tint: [C.coral, C.sun, C.mint, C.sky, C.grape, C.rose], emitting: false
      }).setDepth(o.depth || 950);
      if (o.scroll === 0) e.setScrollFactor(0);
      e.explode(o.count || 90);
      scene.time.delayedCall(3000, () => e.destroy());
    },
    flashWhite(img, times) {
      const sc = img.scene; let n = 0; times = times || 2;
      const on = () => { img.setTintFill(0xffffff); sc.time.delayedCall(60, () => { img.clearTint(); if (++n < times) sc.time.delayedCall(50, on); }); };
      on();
    },
    flashRed(img) { const sc = img.scene; img.setTint(0xff6b6b); sc.time.delayedCall(110, () => { img.clearTint(); sc.time.delayedCall(70, () => { img.setTint(0xff8f8f); sc.time.delayedCall(110, () => img.clearTint()); }); }); },
    rays(scene, x, y, color, o) {
      o = o || {};
      const g = scene.add.graphics({ x, y }).setDepth(o.depth || 600); const n = 14, R = o.r || 260;
      g.fillStyle(color || 0xfff1a8, 0.55);
      for (let i = 0; i < n; i++) { const a = i * Math.PI * 2 / n, b = a + Math.PI / n * 0.55; g.fillTriangle(0, 0, Math.cos(a) * R, Math.sin(a) * R, Math.cos(b) * R, Math.sin(b) * R); }
      g.setScale(0); scene.tweens.add({ targets: g, scale: 1, duration: 400, ease: 'Back.Out' });
      scene.tweens.add({ targets: g, angle: 360, duration: 9000, repeat: -1 });
      return g;
    },
    banner(scene, s, o) {
      o = o || {};
      const c = scene.add.container(W / 2, o.y || 250).setDepth(o.depth || 960);
      const w = Math.max(420, s.length * (o.size || 48) * 0.95 + 120);
      const g = scene.add.graphics();
      g.fillStyle(C.out); g.fillRoundedRect(-w / 2 - 5, -50, w + 10, 100, 30);
      g.fillStyle(o.color || C.coral); g.fillRoundedRect(-w / 2, -45, w, 90, 26);
      g.fillStyle(0xffffff, 0.3); g.fillRoundedRect(-w / 2 + 12, -40, w - 24, 24, 12);
      c.add(g); c.add(txt(scene, 0, 0, s, o.size || 48));
      if (o.scroll === 0) c.setScrollFactor(0);
      c.setScale(0, 1.4);
      scene.tweens.add({ targets: c, scaleX: 1, scaleY: 1, duration: 380, ease: 'Back.Out' });
      scene.tweens.add({ targets: c, scaleX: 0, alpha: 0, delay: o.hold || 1300, duration: 250, ease: 'Back.In', onComplete: () => c.destroy() });
      return c;
    }
  };

  /* ---------- 宠物：呼吸 / 眨眼 / 欢呼 / 攻击 / 受击 ---------- */
  const EYES = {
    1: { key: 'pet-baby', eyes: [[0.27, 0.36], [0.535, 0.36]], ew: 0.125, eh: 0.15, fur: 0xfbf4ec },
    2: { key: 'pet-teen', eyes: [[0.79, 0.261], [0.911, 0.261]], ew: 0.057, eh: 0.055, fur: 0xfbf3e6 },
    3: { key: 'pet-adult', eyes: [[0.568, 0.282], [0.647, 0.282]], ew: 0.045, eh: 0.05, fur: 0xf6f3f4 }
  };
  class Pet extends Phaser.GameObjects.Container {
    constructor(scene, x, y, h, stage) {
      super(scene, x, y); scene.add.existing(this);
      this.h = h; this.stage = stage || S().petStage || 1;
      this.shadow = scene.add.image(0, 0, 'shadow'); this.add(this.shadow);
      this.body_ = scene.add.container(0, 0); this.add(this.body_);
      this.face = scene.add.container(0, 0); this.body_.add(this.face);
      this.build(); this.idle();
      scene.events.once('shutdown', () => { if (this.blinkEv) this.blinkEv.remove(); });
      this.once('destroy', () => { if (this.blinkEv) this.blinkEv.remove(); this.blinkEv = null; if (this.sayC && this.sayC.scene) this.sayC.destroy(); });
    }
    build() {
      this.face.removeAll(true);
      const key = PET.key(this.stage);
      const d = (S().species || 'fox') === 'fox' ? (EYES[this.stage] || EYES[1]) : { key, eyes: [] };
      const img = this.scene.add.image(0, 0, key).setOrigin(0.5, 1);
      const s = this.h / img.height; img.setScale(s); this.img = img; this.face.add(img);
      const dw = img.displayWidth, dh = img.displayHeight;
      this.shadow.setDisplaySize(dw * (this.stage >= 2 ? 0.55 : 0.75), Math.max(14, dh * 0.12));
      this.lids = d.eyes.map(e => {
        const g = this.scene.add.graphics(); const ew = d.ew * dw * 1.15, eh = d.eh * dh * 1.15;
        g.fillStyle(d.fur); g.fillEllipse(0, eh / 2, ew, eh);
        g.lineStyle(Math.max(2, ew * 0.08), 0x5a3a2a); g.beginPath(); g.arc(0, eh * 0.45, ew * 0.42, 0.25, Math.PI - 0.25); g.strokePath();
        g.x = (e[0] - 0.5) * dw; g.y = -(1 - e[1]) * dh - eh / 2; g.scaleY = 0; this.face.add(g); return g;
      });
    }
    setStage(st) { this.stage = st; this.build(); }
    idle() {
      if (this.breathe) this.breathe.stop();
      this.body_.setScale(1);
      this.breathe = this.scene.tweens.add({ targets: this.body_, scaleY: 1.045, scaleX: 0.975, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      const loop = () => { if (!this.scene) return; this.blinkEv = this.scene.time.delayedCall(Phaser.Math.Between(1800, 3800), () => { if (!this.scene) return; this.blink(); loop(); }); };
      if (!this.blinkEv) loop();
    }
    blink() { if (!this.lids || !this.scene) return; this.scene.tweens.add({ targets: this.lids, scaleY: 1, duration: 70, yoyo: true, hold: 60, ease: 'Quad.Out' }); }
    faceDir(d) { this.face.scaleX = d < 0 ? -1 : 1; }
    walkBob(on) {
      if (on && !this.bob) { this.bob = this.scene.tweens.add({ targets: this.face, y: -9, angle: { from: -3, to: 3 }, duration: 160, yoyo: true, repeat: -1, ease: 'Sine.Out' }); }
      if (!on && this.bob) { this.bob.stop(); this.bob = null; this.scene.tweens.add({ targets: this.face, y: 0, angle: 0, duration: 120 }); }
    }
    say(s, ms, o) {
      o = o || {};
      if (this.sayC) this.sayC.destroy();
      const w = Math.max(110, s.length * 26 + 40);
      const b = bubble(this.scene, 0, -this.h - 46, w, 58, {}); b.add(txt(this.scene, 0, 0, s, 26, '#4a2c17', { stroke: '', st: 0, shadow: false }));
      if (this.sayTop) {
        // 地图上：气泡放在最上层，跟随宠物
        b.setDepth(9000); const sc0 = this.scene; const follow = () => { if (!b.scene || !this.scene) { sc0.events.off('postupdate', follow); if (b.scene) b.destroy(); return; } b.x = this.x; b.y = this.y - this.h - 46; };
        follow(); sc0.events.on('postupdate', follow); sc0.events.once('shutdown', () => sc0.events.off('postupdate', follow));
      } else this.add(b);
      this.sayC = b;
      const sc = this.scene;
      sc.time.delayedCall(ms || 1200, () => { if (b.scene) sc.tweens.add({ targets: b, scale: 0, duration: 160, onComplete: () => b.destroy() }); });
    }
    cheer(words) {
      const sc = this.scene; SFX.play('cheer');
      sc.tweens.add({ targets: this.body_, y: -55, duration: 200, yoyo: true, ease: 'Quad.Out', onStart: () => this.body_.setScale(1.08, 0.9) });
      sc.tweens.add({ targets: this.face, angle: { from: -10, to: 10 }, duration: 100, yoyo: true, repeat: 1, onComplete: () => this.face.angle = 0 });
      this.blink();
      const m = this.getWorldTransformMatrix();
      FX.burst(sc, m.tx, m.ty - this.h * 0.8, { tex: 'heart', count: 5, speed: 200, life: 800, scale: 0.45, gravity: -150, depth: this.depth + 1 });
      FX.burst(sc, m.tx, m.ty - this.h * 0.6, { tex: 'spark', count: 10, speed: 260, life: 600, scale: 0.6, tint: [0xffffff, C.sun], add: true, depth: this.depth + 1 });
      const lines = words || ['耶！', '好棒！', 'Yeah!', '再来！', '太厉害啦！'];
      this.say(lines[Math.floor(Math.random() * lines.length)], 900);
    }
    attack(dx) {
      const sc = this.scene, x0 = this.x;
      return new Promise(res => {
        sc.tweens.add({ targets: this.body_, scaleX: 0.85, scaleY: 1.12, duration: 90, yoyo: true });
        sc.tweens.add({ targets: this, x: x0 - dx * 0.15, duration: 110, ease: 'Quad.Out', onComplete: () => {
          sc.tweens.add({ targets: this, x: x0 + dx, duration: 120, ease: 'Quad.In', onComplete: () => { res(); sc.tweens.add({ targets: this, x: x0, duration: 260, ease: 'Back.Out' }); } });
        } });
      });
    }
    hurt(dx) {
      const sc = this.scene, x0 = this.x; SFX.play('hurt');
      FX.flashRed(this.img);
      sc.tweens.add({ targets: this, x: x0 - (dx || 40), duration: 90, yoyo: true, repeat: 1, ease: 'Quad.Out', onComplete: () => this.x = x0 });
      sc.tweens.add({ targets: this.face, angle: -12, duration: 100, yoyo: true });
      this.say(['呜…', '好痛！', '哎呀！'][Math.floor(Math.random() * 3)], 800);
    }
    faint() { this.walkBob(false); if (this.breathe) this.breathe.stop(); this.scene.tweens.add({ targets: this.body_, angle: -80, y: -10, alpha: 0.7, duration: 500, ease: 'Bounce.Out' }); }
  }

  class Monster extends Phaser.GameObjects.Container {
    constructor(scene, x, y, unit, h) {
      super(scene, x, y); scene.add.existing(this);
      this.unit = unit; this.def = MONSTERS[unit]; this.h = h;
      this.shadow = scene.add.image(0, 0, 'shadow'); this.add(this.shadow);
      this.body_ = scene.add.container(0, 0); this.add(this.body_);
      this.img = scene.add.image(0, 0, this.def.key).setOrigin(0.5, 1); this.img.setScale(h / this.img.height); this.body_.add(this.img);
      this.shadow.setDisplaySize(this.img.displayWidth * 0.8, Math.max(12, h * 0.12));
      this.breathe = scene.tweens.add({ targets: this.body_, scaleY: 1.06, scaleX: 0.96, duration: 700 + Math.random() * 300, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }
    hit(power) {
      const sc = this.scene; FX.flashWhite(this.img, power > 1 ? 3 : 2);
      sc.tweens.add({ targets: this.body_, angle: { from: 14, to: 0 }, duration: 380, ease: 'Elastic.Out' });
      sc.tweens.add({ targets: this, x: this.x + 26 * (power || 1), duration: 70, yoyo: true, ease: 'Quad.Out' });
    }
    attack(dx) {
      const sc = this.scene, x0 = this.x, y0 = this.y;
      return new Promise(res => {
        sc.tweens.add({ targets: this.body_, scaleX: 1.15, scaleY: 0.85, duration: 140, yoyo: true });
        sc.tweens.add({ targets: this, y: y0 - 40, duration: 160, yoyo: true, ease: 'Quad.Out' });
        sc.tweens.add({ targets: this, x: x0 + dx, duration: 260, delay: 120, ease: 'Quad.In', onComplete: () => { res(); sc.tweens.add({ targets: this, x: x0, duration: 360, ease: 'Back.Out' }); } });
      });
    }
    faint() {
      this.breathe.stop(); const sc = this.scene;
      sc.tweens.add({ targets: this.body_, angle: 0, scaleY: 0.82, scaleX: 1.1, duration: 300, ease: 'Bounce.Out' });
      this.img.setTint(0xd9d0e8);
      // 头上转圈的小星星
      this.dizzy = [];
      for (let i = 0; i < 3; i++) { const s = sc.add.image(0, 0, 'star').setScale(0.45); this.add(s); this.dizzy.push(s); }
      let a = 0; this.dizzyEv = sc.time.addEvent({ delay: 16, loop: true, callback: () => { a += 0.08; this.dizzy.forEach((s, i) => { const t = a + i * 2.09; s.x = Math.cos(t) * 60; s.y = -this.h * 0.95 + Math.sin(t) * 16; s.setDepth(Math.sin(t)); }); } });
    }
    clearDizzy() { if (this.dizzyEv) this.dizzyEv.remove(); (this.dizzy || []).forEach(s => s.destroy()); this.dizzy = []; this.img.clearTint(); }
  }

  /* ---------- 血条名牌 ---------- */
  function hpPlate(scene, x, y, name, lvl, color, w) {
    w = w || 300;
    const c = scene.add.container(x, y);
    const g = scene.add.graphics(); c.add(g);
    g.fillStyle(0x000000, 0.18); g.fillRoundedRect(-w / 2 + 3, -38 + 8, w, 78, 20);
    g.fillStyle(C.out); g.fillRoundedRect(-w / 2 - 4, -42, w + 8, 86, 22);
    g.fillStyle(C.paper); g.fillRoundedRect(-w / 2, -38, w, 78, 18);
    g.fillStyle(color || C.coral); g.fillRoundedRect(-w / 2, -38, 14, 78, { tl: 18, bl: 18, tr: 0, br: 0 });
    c.add(txt(scene, -w / 2 + 28, -16, name, 26, '#4a2c17', { ox: 0, stroke: '', st: 0, shadow: false }));
    if (lvl) c.add(txt(scene, w / 2 - 16, -16, lvl, 20, '#a0754f', { ox: 1, stroke: '', st: 0, shadow: false }));
    const bw = w - 60, bx = -w / 2 + 34, by = 12;
    const back = scene.add.graphics(); back.fillStyle(C.out); back.fillRoundedRect(bx - 3, by - 3, bw + 6, 20, 10); back.fillStyle(0x5c4434); back.fillRoundedRect(bx, by, bw, 14, 7); c.add(back);
    const ghost = scene.add.rectangle(bx, by, bw, 14, 0xffffff).setOrigin(0, 0); c.add(ghost);
    const bar = scene.add.rectangle(bx, by, bw, 14, C.green).setOrigin(0, 0); c.add(bar);
    const shine = scene.add.rectangle(bx + 4, by + 2, bw - 8, 4, 0xffffff, 0.45).setOrigin(0, 0); c.add(shine);
    c.set = (v, max) => {
      const r = Math.max(0, v / max);
      bar.fillColor = r > 0.5 ? C.green : r > 0.25 ? C.sun : C.red;
      scene.tweens.add({ targets: bar, displayWidth: Math.max(0.01, bw * r), duration: 220, ease: 'Quad.Out' });
      scene.tweens.add({ targets: ghost, displayWidth: Math.max(0.01, bw * r), duration: 600, delay: 350, ease: 'Quad.InOut' });
      shine.displayWidth = Math.max(0.01, (bw - 8) * r);
      scene.tweens.add({ targets: c, x: c.x + 6, duration: 40, yoyo: true, repeat: 2 });
    };
    return c;
  }

  /* ================= HUD 场景（常驻顶层）================= */
  class HUD extends Phaser.Scene {
    constructor() { super({ key: 'HUD' }); }
    create() {
      G.hud = this;
      this.root = this.add.container(0, 0);
      this.disp = { stamina: S().stamina, coins: S().coins, stars: S().stars };
      this.pills = {};
      const mkPill = (key, x, w, icon, color) => {
        const c = this.add.container(x, 44); this.root.add(c);
        const g = this.add.graphics(); c.add(g);
        g.fillStyle(0x000000, 0.2); g.fillRoundedRect(0, -22 + 6, w, 46, 23);
        g.fillStyle(C.out); g.fillRoundedRect(-4, -26, w + 8, 54, 27);
        g.fillStyle(0xfff8ea); g.fillRoundedRect(0, -22, w, 46, 23);
        g.fillStyle(0xffffff, 0.7); g.fillRoundedRect(22, -18, w - 40, 9, 4);
        const ic = this.add.image(6, 0, icon).setScale(0.9); c.add(ic);
        const t = txt(this, 40, 1, '0', 26, '#4a2c17', { ox: 0, stroke: '#ffffff', st: 4, shadow: false }); c.add(t);
        this.pills[key] = { c, ic, t, color, w };
        return this.pills[key];
      };
      const st = mkPill('stamina', 40, 200, 'bolt', C.mint);
      st.barBack = this.add.graphics(); st.c.add(st.barBack);
      st.barBack.fillStyle(0x5c4434, 0.25); st.barBack.fillRoundedRect(100, -8, 88, 16, 8);
      st.bar = this.add.rectangle(100, -8, 88, 16, 0x5ee08a).setOrigin(0, 0); st.c.add(st.bar);
      st.bar.setStrokeStyle(0);
      mkPill('coins', 272, 150, 'coin', C.sun);
      const sp = mkPill('stars', 454, 214, 'star', C.sun);
      sp.evo = txt(this, 100, 1, '', 17, '#a0754f', { ox: 0, stroke: '', st: 0, shadow: false }); sp.c.add(sp.evo);
      this.render();
      this.toastY = 120;
    }
    render() {
      const s = S(), d = this.disp, p = this.pills;
      p.stamina.t.setText(Math.round(d.stamina) + '');
      p.stamina.bar.displayWidth = Math.max(0.01, 88 * Phaser.Math.Clamp(d.stamina / 30, 0, 1));
      p.stamina.bar.fillColor = d.stamina >= 10 ? 0x5ee08a : d.stamina >= 3 ? C.sun : C.red;
      p.coins.t.setText(Math.round(d.coins) + '');
      p.stars.t.setText(Math.round(d.stars) + '');
      const nn = PET.nextNeed(s.petStage || 0);
      p.stars.evo.setText(s.petStage >= 3 ? '最终形态' : (s.petStage >= 1 ? '进化 ' + Math.min(nn, Math.max(0, Math.round(d.stars) - (s.petBase || 0))) + '/' + nn : ''));
    }
    setVisibleBar(b) { this.root.setVisible(b); }
    syncNow() { this.disp = { stamina: S().stamina, coins: S().coins, stars: S().stars }; this.render(); }
    popPill(key) {
      const p = this.pills[key]; this.tweens.killTweensOf(p.ic);
      p.ic.setScale(1.35); this.tweens.add({ targets: p.ic, scale: 0.9, duration: 380, ease: 'Back.Out' });
      this.tweens.add({ targets: p.c, y: 40, duration: 70, yoyo: true });
    }
    tweenNum(key, to) { this.tweens.addCounter({ from: this.disp[key], to, duration: 350, onUpdate: tw => { this.disp[key] = tw.getValue(); this.render(); }, onComplete: () => { this.disp[key] = to; this.render(); } }); }
    // 从屏幕坐标飞向 HUD
    gain(key, amount, fx, fy) {
      const p = this.pills[key]; const tex = key === 'coins' ? 'coin' : key === 'stars' ? 'star' : 'bolt';
      const n = key === 'coins' ? Math.min(6, Math.max(3, Math.round(amount / 3))) : Math.min(5, Math.max(1, amount));
      const target = S()[key];
      const tx = p.c.x + 6, ty = p.c.y;
      for (let i = 0; i < n; i++) {
        const ic = this.add.image(fx + Phaser.Math.Between(-30, 30), fy + Phaser.Math.Between(-20, 20), tex).setScale(0.75).setDepth(50);
        const cx = (ic.x + tx) / 2 + Phaser.Math.Between(-140, 140), cy = Math.min(ic.y, ty) - Phaser.Math.Between(60, 200);
        const curve = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(ic.x, ic.y), new Phaser.Math.Vector2(cx, cy), new Phaser.Math.Vector2(tx, ty));
        const o = { t: 0 };
        ic.setScale(0); this.tweens.add({ targets: ic, scale: 0.8, duration: 160, delay: i * 70, ease: 'Back.Out' });
        this.tweens.add({ targets: o, t: 1, delay: 180 + i * 70, duration: 520, ease: 'Sine.In',
          onUpdate: () => { const pt = curve.getPoint(o.t); ic.setPosition(pt.x, pt.y); ic.angle += 12; },
          onComplete: () => {
            ic.destroy(); this.popPill(key); SFX.play(key === 'stars' ? 'star' : 'coin');
            if (i === n - 1) this.tweenNum(key, target);
            FX.burst(this, tx, ty, { tex: 'spark', count: 4, speed: 140, life: 300, scale: 0.5, tint: [0xffffff, C.sun], add: true });
          } });
      }
    }
    spend(key, amount) {
      const p = this.pills[key]; const tex = 'bolt';
      for (let i = 0; i < Math.min(3, amount); i++) {
        const ic = this.add.image(p.c.x + 6, p.c.y, tex).setScale(0.8);
        this.tweens.add({ targets: ic, x: ic.x + 40 + i * 30, y: ic.y + 90 + i * 12, alpha: 0, angle: 90, scale: 0.4, delay: i * 80, duration: 600, ease: 'Quad.Out', onComplete: () => ic.destroy() });
      }
      FX.float(this, p.c.x + 130, p.c.y + 40, '-' + amount, { size: 26, color: '#7dffb0', dy: 40, dur: 800 });
      this.popPill(key); this.tweenNum(key, S()[key]);
    }
    toast(s, color) {
      const w = Math.max(320, s.length * 26 + 80);
      const c = this.add.container(W / 2, -60).setDepth(200);
      const g = this.add.graphics(); g.fillStyle(C.out); g.fillRoundedRect(-w / 2 - 4, -30, w + 8, 60, 30); g.fillStyle(color || 0x5a6bd8); g.fillRoundedRect(-w / 2, -26, w, 52, 26);
      g.fillStyle(0xffffff, 0.25); g.fillRoundedRect(-w / 2 + 14, -22, w - 28, 14, 7);
      c.add(g); c.add(txt(this, 0, 0, s, 24)); SFX.play('pop');
      this.tweens.add({ targets: c, y: this.toastY, duration: 420, ease: 'Back.Out' });
      this.tweens.add({ targets: c, y: -60, delay: 2000, duration: 300, ease: 'Back.In', onComplete: () => c.destroy() });
    }
    /* ---- 弹窗（只盖住中间，不是全屏题卡；仅用于图鉴/错题本/家长/结算）---- */
    modal(o) {
      if (this.modalC) this.closeModal(true);
      const others = this.scene.manager.getScenes(true).filter(s => s.scene.key !== 'HUD' && s.scene.key !== 'Trans');
      others.forEach(s => { s.input.enabled = false; });
      this.modalOthers = others;
      const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x2b1d3a, 0.45).setInteractive().setDepth(100); dim.alpha = 0;
      this.tweens.add({ targets: dim, alpha: 1, duration: 200 });
      const p = panel(this, W / 2, H / 2 + 20, o.w || 760, o.h || 520, { title: o.title, titleColor: o.titleColor }).setDepth(101);
      p.setScale(0.6); p.alpha = 0; this.tweens.add({ targets: p, scale: 1, alpha: 1, duration: 380, ease: 'Back.Out' });
      SFX.play('pop');
      this.modalC = p; this.modalDim = dim;
      const close = () => this.closeModal();
      if (o.closable !== false) {
        const x = button(this, (o.w || 760) / 2 - 6, -(o.h || 520) / 2 + 6, 56, 56, '', { icon: 'ic_close', iconOnly: true, color: C.red, r: 28, onClick: close });
        p.add(x);
      }
      this.onModalClose = o.onClose;
      if (o.build) o.build(p, close);
      return close;
    }
    closeModal(silent) {
      const p = this.modalC, dim = this.modalDim; if (!p) return;
      this.modalC = null; this.modalDim = null;
      (this.modalOthers || []).forEach(s => { if (s.input) s.input.enabled = true; });
      this.tweens.add({ targets: p, scale: 0.7, alpha: 0, duration: 180, ease: 'Back.In', onComplete: () => p.destroy() });
      this.tweens.add({ targets: dim, alpha: 0, duration: 200, onComplete: () => dim.destroy() });
      const cb = this.onModalClose; this.onModalClose = null; if (cb && !silent) cb();
    }
  }

  /* ================= 转场（泡泡遮罩）================= */
  class Trans extends Phaser.Scene {
    constructor() { super({ key: 'Trans' }); }
    create() { G.trans = this; this.busy = false; }
    go(from, to, data, style) {
      if (this.busy) return; this.busy = true;
      const cols = [C.mint, C.sky, C.sun, C.coral, C.grape, 0xffffff];
      const dots = [];
      const step = 150;
      for (let y = -40; y < H + step; y += step) for (let x = -40 + ((y / step) % 2) * 75; x < W + step; x += step) {
        const d = this.add.circle(x, y, 120, cols[Math.floor(Math.random() * cols.length)]).setScale(0).setStrokeStyle(8, C.out); dots.push(d);
      }
      SFX.play('whoosh');
      const doSwitch = () => {
        const fs = typeof from === 'string' ? this.scene.get(from) : from;
        if (G.hud && G.hud.modalC) G.hud.closeModal(true);
        ['MapUI'].forEach(k => { if (this.scene.isActive(k) && to !== 'Map') this.scene.stop(k); });
        fs.scene.start(to, data || {});
        this.time.delayedCall(140, () => {
          dots.forEach((d, i) => this.tweens.add({ targets: d, scale: 0, delay: Math.random() * 260, duration: 300, ease: 'Back.In', onComplete: () => d.destroy() }));
          this.time.delayedCall(620, () => { this.busy = false; });
        });
      };
      const cover = () => {
        let left = dots.length;
        dots.forEach(d => this.tweens.add({ targets: d, scale: 1, delay: (d.x + d.y) / (W + H) * 260, duration: 260, ease: 'Back.Out', onComplete: () => { if (--left === 0) doSwitch(); } }));
      };
      if (style === 'encounter') {
        const fl = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff).setAlpha(0);
        SFX.play('alert');
        this.tweens.add({ targets: fl, alpha: 0.85, duration: 90, yoyo: true, repeat: 2, onComplete: () => { fl.destroy(); cover(); } });
        const fs = typeof from === 'string' ? this.scene.get(from) : from;
        fs.cameras.main.zoomTo(1.35, 600, 'Quad.easeIn'); fs.cameras.main.shake(500, 0.006);
      } else cover();
    }
  }

  window.UI = { W, H, FONT, C, txt, panel, button, bubble, genTextures, hpPlate, darker, lighter };
  window.FX = FX; window.Pet = Pet; window.Monster = Monster; window.HUDScene = HUD; window.TransScene = Trans;
})();
