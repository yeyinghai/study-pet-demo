/* 知识群岛 v0.2 —— 三个玩法：对战（主玩法）/ 射击守城 / 钓鱼 */
(function () {
  'use strict';
  const { W, H, C, txt, panel, button, bubble } = UI;
  const dark = { stroke: '', st: 0, shadow: false };

  function bands(scene, c1, c2, y0, y1, n) {
    const g = scene.add.graphics(); n = n || 32;
    const a = Phaser.Display.Color.IntegerToColor(c1), b = Phaser.Display.Color.IntegerToColor(c2);
    for (let i = 0; i < n; i++) { const c = Phaser.Display.Color.Interpolate.ColorWithColor(a, b, n, i); g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b)); g.fillRect(-60, y0 + (y1 - y0) * i / n, W + 120, (y1 - y0) / n + 1); }
    return g;
  }
  function coverBg(scene, key) { const bg = scene.add.image(W / 2, H / 2, key); bg.setScale(Math.max(W / bg.width, H / bg.height) * 1.06); return bg; }
  function cloud(scene, x, y, s) {
    const g = scene.add.graphics({ x, y }); g.fillStyle(0xffffff, 0.92);
    [[0, 0, 40], [38, -14, 46], [80, 0, 38], [40, 12, 40]].forEach(c => g.fillCircle(c[0] * s, c[1] * s, c[2] * s));
    scene.tweens.add({ targets: g, x: x + 120, duration: 14000 + Math.random() * 6000, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    return g;
  }
  function wordLabel(q, i) { return q.type === 'zh2en' ? q.options[i] : Quiz.shortZh(q.options[i]); }
  function trailBullet(scene, from, to, o) {
    o = o || {};
    return new Promise(res => {
      const b = scene.add.image(from.x, from.y, 'bullet').setScale(o.scale || 1).setDepth(700);
      const tr = scene.add.particles(0, 0, 'dot', { follow: b, lifespan: 300, scale: { start: 0.8 * (o.scale || 1), end: 0 }, alpha: { start: 0.8, end: 0 }, tint: o.tint || [0xfff07a, 0xffffff], frequency: 16, blendMode: 'ADD' }).setDepth(699);
      const cx = (from.x + to.x) / 2 + (o.cx || 0), cy = Math.min(from.y, to.y) - (o.arc === undefined ? 120 : o.arc);
      const curve = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(from.x, from.y), new Phaser.Math.Vector2(cx, cy), new Phaser.Math.Vector2(to.x, to.y));
      const t = { v: 0 };
      scene.tweens.add({ targets: t, v: 1, duration: o.dur || 320, ease: 'Quad.In', onUpdate: () => { const p = curve.getPoint(t.v); b.setPosition(p.x, p.y); b.angle += 18; },
        onComplete: () => { b.destroy(); tr.stop(); scene.time.delayedCall(320, () => tr.destroy()); res(); } });
    });
  }

  const PAL = [null,
    { sky: [0x9fdcff, 0xfff0f6], ground: 0x9fe07a, rim: 0x5bb04a },
    { sky: [0xa8d8ff, 0xfff3dc], ground: 0xa6dc7e, rim: 0x62a94b },
    { sky: [0x8fd3ff, 0xe8ffe0], ground: 0x8dd36a, rim: 0x4f9e3d },
    { sky: [0xb5e8ff, 0xf3ffd8], ground: 0xb2e36c, rim: 0x6aa83c },
    { sky: [0xd7c4ff, 0xfff0e0], ground: 0xa9e08c, rim: 0x5fa858 },
    { sky: [0xffd0b0, 0xfff4d6], ground: 0x9fdc86, rim: 0x5aa552 }];

  /* ======================= 对战 ======================= */
  class Battle extends Phaser.Scene {
    constructor() { super({ key: 'Battle' }); }
    init(d) { this.unit = (d && d.unit) || S().curUnit || 1; }
    create() {
      G.test = {}; G.scene = 'Battle'; G.tapFX(this); G.hud.setVisibleBar(true);
      Quiz.resetRound();
      const pal = PAL[this.unit], def = MONSTERS[this.unit];
      bands(this, pal.sky[0], pal.sky[1], -60, 520);
      [[120, 120, 1], [560, 70, 0.8], [1100, 160, 1.1], [820, 260, 0.6]].forEach(c => cloud(this, c[0], c[1], c[2]));
      const hills = this.add.graphics();
      hills.fillStyle(UI.lighter(pal.ground, 8)); hills.fillEllipse(260, 560, 900, 260); hills.fillEllipse(1080, 540, 900, 240);
      hills.fillStyle(pal.ground); hills.fillRect(-60, 520, W + 120, 340); hills.fillEllipse(640, 540, 1600, 120);
      hills.fillStyle(0xffffff, 0.18); for (let i = 0; i < 26; i++) hills.fillEllipse(Math.random() * W, 560 + Math.random() * 240, 40, 10);
      const plat = (x, y, w, h) => { const g = this.add.graphics(); g.fillStyle(pal.rim); g.fillEllipse(x, y + 10, w + 16, h + 16); g.fillStyle(UI.lighter(pal.ground, 14)); g.fillEllipse(x, y, w, h); g.fillStyle(0xffffff, 0.25); g.fillEllipse(x - w * 0.12, y - h * 0.18, w * 0.6, h * 0.35); return g; };
      plat(940, 440, 380, 96); plat(330, 650, 440, 110);
      this.ps = PET.stats(); this.petMax = this.ps.hp; this.petHP = this.petMax; this.monHP = 60; this.monMax = 60; this.energy = 0; this.qn = 0;
      this.stats = { ok: 0, total: 0, coins: 0, stars: 0, captured: false };
      this.pet = new Pet(this, -220, 640, PET.h(210, 220)).setDepth(10);
      this.mon = new Monster(this, 940, -260, this.unit, 230).setDepth(9);
      this.tweens.add({ targets: this.pet, x: 330, duration: 700, ease: 'Back.Out', delay: 200 });
      this.tweens.add({ targets: this.mon, y: 430, duration: 600, delay: 450, ease: 'Bounce.Out', onComplete: () => {
        this.cameras.main.shake(200, 0.008); SFX.play('hit');
        FX.burst(this, 940, 430, { tex: 'dot', count: 18, speed: 260, life: 600, scale: 1.2, tint: [0xffffff, 0xf3e3c3], angle: { min: 180, max: 360 } });
      } });
      this.monPlate = UI.hpPlate(this, 1010, 96, def.name, '第' + this.unit + '单元', def.color, 330).setDepth(20);
      this.petPlate = UI.hpPlate(this, 250, 742, S().petName, PET.name(PET.stage()) + ' Lv' + this.ps.lv, C.sky, 320).setDepth(20);
      [this.monPlate, this.petPlate].forEach((p, i) => { p.setScale(0); this.tweens.add({ targets: p, scale: 1, delay: 900 + i * 120, duration: 400, ease: 'Back.Out' }); });
      // 能量条
      this.energyC = this.add.container(500, 742).setDepth(20);
      const eg = this.add.graphics(); eg.fillStyle(C.out); eg.fillRoundedRect(-80, -30, 160, 60, 20); eg.fillStyle(0x3d2b5e); eg.fillRoundedRect(-76, -26, 152, 52, 17); this.energyC.add(eg);
      this.energyC.add(txt(this, 0, -12, '大招能量', 15, '#d9c8ff', dark));
      this.pips = [0, 1, 2].map(i => { const p = this.add.image(-40 + i * 40, 12, 'bolt').setScale(0.45).setTint(0x6a5a8a); this.energyC.add(p); return p; });
      FX.banner(this, '野生的「' + def.name + '」出现了！', { y: 300, hold: 1100, color: C.coral });
      this.btns = [];
      this.time.delayedCall(1700, () => this.ask());
      G.test.battle = this;
    }
    drawEnergy(anim) {
      this.pips.forEach((p, i) => {
        const on = i < this.energy; p.clearTint(); if (!on) p.setTint(0x6a5a8a);
        if (anim && i === this.energy - 1) { p.setScale(0.9); this.tweens.add({ targets: p, scale: 0.45, duration: 380, ease: 'Back.Out' }); FX.burst(this, 500 - 40 + i * 40, 754, { tex: 'spark', count: 6, speed: 160, life: 400, scale: 0.5, tint: [0x7dffb0], add: true, depth: 30 }); }
      });
      if (this.energy >= 3) {
        if (!this.readyGlow) { this.readyGlow = this.tweens.add({ targets: this.energyC, scale: 1.1, duration: 300, yoyo: true, repeat: -1 }); this.pet.say('大招准备好啦！', 1200); SFX.play('star'); }
      } else if (this.readyGlow) { this.readyGlow.stop(); this.readyGlow = null; this.energyC.setScale(1); }
    }
    clearQ() {
      this.btns.forEach(b => this.tweens.add({ targets: b, scale: 0, duration: 160, ease: 'Back.In', onComplete: () => b.destroy() })); this.btns = [];
      if (this.qb) { const qb = this.qb; this.tweens.add({ targets: qb, scale: 0, alpha: 0, duration: 180, onComplete: () => qb.destroy() }); this.qb = null; }
      if (this.critTw) { this.critTw.stop(); this.critTw = null; }
    }
    ask(capture) {
      if (Quiz.inCooldown()) { G.openCooldown(() => this.ask(capture)); return; }
      this.qn++; this.busy = false; this.capture = !!capture;
      const q = Quiz.make(this.unit, null, capture ? 3 : 4); this.q = q;
      const listen = q.type === 'en2zh' && Speech.ok(q.word);
      const bx = capture ? 560 : 560, by = capture ? 330 : 300;
      const qb = bubble(this, bx, by, 460, 178, { tail: 'right', tailY: capture ? 60 : -20 }).setDepth(40); this.qb = qb;
      const tag = capture ? '收服挑战！答对就能收服' : (q.type === 'zh2en' ? '看中文 · 选英文' : (listen ? '听发音 · 选意思' : '看英文 · 选意思'));
      const tg = this.add.graphics(); tg.fillStyle(capture ? C.sun : (q.type === 'zh2en' ? C.coral : C.sky)); tg.fillRoundedRect(-200, -76, 400, 36, 18); qb.add(tg);
      qb.add(txt(this, 0, -58, tag, 20, '#ffffff', { st: 4 }));
      if (q.type === 'zh2en') {
        qb.add(txt(this, 0, -2, '「' + Quiz.shortZh(q.word.zh) + '」', 46, '#4a2c17', dark));
        qb.add(txt(this, 0, 40, '用英语怎么说？', 20, '#8a6a4f', dark));
      } else if (listen) {
        const sp = button(this, -120, 6, 84, 84, '', { icon: 'speaker', iconOnly: true, color: C.sky, r: 42, onClick: () => { Speech.say(q.word.en); this.tweens.add({ targets: sp, angle: { from: -8, to: 8 }, duration: 80, yoyo: true, repeat: 2 }); } });
        qb.add(sp); qb.add(txt(this, 50, 0, '点喇叭再听一次', 22, '#4a2c17', dark));
        this.time.delayedCall(350, () => Speech.say(q.word.en));
        this.tweens.add({ targets: sp, scale: 1.1, duration: 500, yoyo: true, repeat: -1 });
      } else {
        qb.add(txt(this, 0, -2, q.word.en, 50, '#3a6fd8', dark));
        qb.add(txt(this, 0, 40, '是什么意思？（本机无英语语音，改为看词）', 16, '#8a6a4f', dark));
      }
      // 快答暴击条
      if (!capture) {
        const cb = this.add.graphics(); cb.fillStyle(0xeadbc2); cb.fillRoundedRect(-150, 66, 300, 14, 7); qb.add(cb);
        const bar = this.add.rectangle(-150, 66, 300, 14, C.sun).setOrigin(0, 0); qb.add(bar);
        const lab = txt(this, -176, 73, '暴击', 16, '#ff8a00', { st: 3, stroke: '#fff', ox: 1 }); qb.add(lab);
        this.critTw = this.tweens.add({ targets: bar, displayWidth: 0.01, duration: 4000, onComplete: () => { lab.setAlpha(0.3); } });
      }
      // 答案按钮 = 技能按钮
      const icons = ['ic_fire', 'ic_drop', 'ic_leaf', 'ic_sword'], cols = [C.coral, C.sky, C.mint, C.grape];
      const n = q.options.length;
      this.btns = q.options.map((o, i) => {
        let x, y;
        x = 790 + (i % 2) * 310; y = 618 + Math.floor(i / 2) * 100;
        if (capture && i === 2) x = 945;
        const lbl = wordLabel(q, i);
        const b = button(this, x, y, 290, 84, lbl, { icon: icons[i], color: cols[i], size: lbl.length > 8 ? 24 : 30, onClick: () => this.choose(i) }).setDepth(45);
        b.setScale(0); this.tweens.add({ targets: b, scale: 1, delay: 120 + i * 70, duration: 360, ease: 'Back.Out' });
        return b;
      });
      G.test.choices = this.btns.map((b, i) => ({ b, correct: i === q.answer }));
      G.test.phase = capture ? 'capture-q' : 'question';
    }
    reveal(ok) {
      if (!this.qb) return;
      const w = this.q.word, g = this.add.graphics();
      g.fillStyle(ok ? C.green : C.red); g.fillRoundedRect(-200, 52, 400, 40, 20); this.qb.add(g);
      this.qb.add(txt(this, 0, 72, (ok ? '✔ ' : '✘ ') + w.en + '  ·  ' + Quiz.shortZh(w.zh), 22, '#ffffff', { st: 4 }));
      Speech.say(w.en);
    }
    choose(i) {
      if (this.busy) return; this.busy = true; G.test.phase = 'anim';
      const q = this.q, ms = performance.now() - q.t0, ok = i === q.answer, b = this.btns[i];
      const crit = this.critTw && this.critTw.isPlaying() && ms < 4000;
      if (this.critTw) this.critTw.pause();
      const r = Quiz.record(q.word, ok); this.stats.total++;
      const bc = b.center();
      this.btns.forEach((x, j) => { if (j !== i && j !== q.answer) this.tweens.add({ targets: x, alpha: 0.35, duration: 200 }); });
      if (ok) {
        this.stats.ok++; b.flashColor(C.green, 1200); SFX.play('correct');
        FX.burst(this, bc.x, bc.y, { tex: 'star', count: 10, speed: 380, life: 700, scale: 0.5, depth: 60 });
        FX.float(this, bc.x, bc.y - 60, '+' + r.coins, { color: '#ffe14d', size: 40, depth: 61 });
        this.stats.coins += r.coins; G.hud.gain('coins', r.coins, bc.x, bc.y);
        if (r.combo >= 2) FX.float(this, 330, 380, '连对 ×' + r.combo + (r.combo >= 3 ? '  +2' : ''), { color: '#ff8a5c', size: 34, dy: 60 });
        if (r.star) { this.stats.stars++; this.time.delayedCall(500, () => { G.hud.gain('stars', 1, 330, 420); FX.float(this, 330, 330, '掌握新词 ★+1', { color: '#ffd84d', size: 34 }); }); }
        this.reveal(true);
        let kind = crit ? 'crit' : 'normal';
        if (this.energy >= 3 && !this.capture) { kind = 'ult'; this.energy = 0; } else if (!this.capture) this.energy++;
        this.drawEnergy(true);
        this.pet.cheer();
        if (this.capture) { this.time.delayedCall(500, () => this.captureResult(true)); return; }
        this.time.delayedCall(380, () => this.attack(kind).then(() => this.time.delayedCall(800, () => this.next())));
      } else {
        b.flashColor(C.red, 1200); SFX.play('wrong');
        this.tweens.add({ targets: b, x: b.x + 10, duration: 45, yoyo: true, repeat: 4 });
        const cb = this.btns[q.answer]; cb.flashColor(C.green, 1600); this.tweens.add({ targets: cb, scale: 1.1, duration: 200, yoyo: true, repeat: 2 });
        this.reveal(false);
        this.energy = 0; this.drawEnergy(false);
        if (this.capture) { this.time.delayedCall(700, () => this.captureResult(false)); return; }
        this.time.delayedCall(600, () => this.mon.attack(-470).then(() => {
          this.pet.hurt(50); this.cameras.main.shake(260, 0.014);
          FX.burst(this, this.pet.x + 30, this.pet.y - 110, { tex: 'spark', count: 12, speed: 300, life: 500, scale: 0.8, tint: [0xff6b6b, 0xffffff], depth: 60 });
          this.petHP = Math.max(0, this.petHP - this.ps.hurt); this.petPlate.set(this.petHP, this.petMax);
          FX.float(this, this.pet.x + 40, this.pet.y - 220, '-' + this.ps.hurt, { color: '#ff5a5a', size: 46 });
          this.time.delayedCall(900, () => { if (r.cooldown) G.openCooldown(() => this.next()); else this.next(); });
        }));
      }
    }
    attack(kind) {
      const from = { x: this.pet.x + 70, y: this.pet.y - 130 }, to = { x: this.mon.x, y: this.mon.y - 110 };
      const dmg = kind === 'ult' ? this.ps.ult : kind === 'crit' ? this.ps.crit : this.ps.atk;
      if (kind === 'normal') {
        this.pet.attack(70); SFX.play('shoot');
        return Promise.all([0, 1, 2].map(i => new Promise(res => this.time.delayedCall(i * 90, () => { SFX.play('shoot'); trailBullet(this, from, to, { cx: (i - 1) * 80, arc: 100 + i * 50 }).then(() => { if (i < 2) { FX.flashWhite(this.mon.img, 1); FX.burst(this, to.x, to.y, { tex: 'spark', count: 5, speed: 200, life: 300, scale: 0.6, add: true, depth: 60 }); } res(); }); }))))
          .then(() => this.hit(dmg, 1));
      }
      if (kind === 'crit') {
        this.pet.attack(90); SFX.play('shoot');
        return trailBullet(this, from, to, { scale: 2, dur: 260, arc: 60, tint: [0xffb02e, 0xfff07a] }).then(() => {
          this.tweens.timeScale = 0.2; this.time.delayedCall(90, () => { this.tweens.timeScale = 1; });
          this.cameras.main.zoomTo(1.08, 90, 'Quad.easeOut', true); this.time.delayedCall(160, () => this.cameras.main.zoomTo(1, 200));
          FX.float(this, to.x - 20, to.y - 120, '暴击！', { color: '#ff8a00', size: 64, dy: 60, dur: 1200, depth: 63 });
          return this.hit(dmg, 2);
        });
      }
      // 大招
      return new Promise(res => {
        const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x1b1030, 0).setDepth(30); this.tweens.add({ targets: dim, fillAlpha: 0.55, duration: 250 });
        const rays = FX.rays(this, this.pet.x, this.pet.y - 110, 0xfff1a8, { depth: 31, r: 220 }); this.pet.setDepth(35);
        FX.banner(this, '大招 · 星光冲击！', { y: 220, hold: 900, color: C.grape });
        SFX.play('ult');
        const charge = this.add.particles(this.pet.x + 40, this.pet.y - 120, 'spark', { emitZone: { type: 'edge', source: new Phaser.Geom.Circle(0, 0, 160), quantity: 24 }, moveToX: 0, moveToY: 0, lifespan: 500, scale: { start: 0.8, end: 0.2 }, tint: [0xfff07a, 0xffffff], frequency: 25, blendMode: 'ADD' }).setDepth(36);
        this.time.delayedCall(700, () => {
          charge.destroy(); this.pet.attack(60);
          const beam = this.add.graphics().setDepth(36); const len = Phaser.Math.Distance.Between(from.x, from.y, to.x, to.y), ang = Phaser.Math.Angle.Between(from.x, from.y, to.x, to.y);
          beam.setPosition(from.x, from.y).setRotation(ang);
          beam.fillStyle(0xfff07a, 0.6); beam.fillRoundedRect(0, -46, len, 92, 46); beam.fillStyle(0xffffff); beam.fillRoundedRect(0, -22, len, 44, 22);
          beam.scaleX = 0; this.tweens.add({ targets: beam, scaleX: 1, duration: 160, ease: 'Quad.Out', onComplete: () => {
            this.cameras.main.flash(250, 255, 250, 200); this.cameras.main.shake(500, 0.025);
            for (let k = 0; k < 4; k++) this.time.delayedCall(k * 90, () => { FX.flashWhite(this.mon.img, 1); FX.burst(this, to.x + Phaser.Math.Between(-60, 60), to.y + Phaser.Math.Between(-60, 60), { tex: 'star', count: 8, speed: 420, life: 700, scale: 0.6, depth: 60 }); SFX.play('crit'); });
            this.tweens.add({ targets: beam, scaleY: 0, alpha: 0, delay: 380, duration: 220, onComplete: () => beam.destroy() });
            this.time.delayedCall(420, () => {
              [dim, rays].forEach(o => this.tweens.add({ targets: o, alpha: 0, duration: 300, onComplete: () => o.destroy() })); this.pet.setDepth(10);
              this.hit(dmg, 3).then(res);
            });
          } });
        });
      });
    }
    hit(dmg, power) {
      this.mon.hit(power); SFX.play(power >= 2 ? 'crit' : 'hit');
      this.cameras.main.shake(140 + power * 60, 0.005 * power + 0.004);
      FX.ring(this, this.mon.x, this.mon.y - 110, 0xffffff, 110 + power * 30, { depth: 61 });
      FX.burst(this, this.mon.x, this.mon.y - 110, { tex: 'spark', count: 10 + power * 6, speed: 380, life: 600, scale: 0.9, tint: [0xffffff, 0xfff07a, MONSTERS[this.unit].color], add: true, depth: 61 });
      FX.float(this, this.mon.x + 130, this.mon.y - 150, '-' + dmg, { color: power >= 2 ? '#ff8a00' : '#ffffff', size: 40 + power * 10, depth: 62 });
      this.monHP = Math.max(0, this.monHP - dmg); this.monPlate.set(this.monHP, this.monMax);
      return new Promise(res => this.time.delayedCall(300, res));
    }
    next() {
      this.clearQ();
      if (this.monHP <= 0) return this.defeat();
      if (this.petHP <= 0) return this.lose();
      this.time.delayedCall(250, () => this.ask());
    }
    defeat() {
      SFX.play('fanfare'); this.mon.faint();
      FX.banner(this, '打败了「' + MONSTERS[this.unit].name + '」！', { y: 300, hold: 1200, color: C.coral });
      this.time.delayedCall(1500, () => {
        const b = button(this, 950, 680, 380, 96, '扔学识球收服！', { icon: 'ball', color: C.sun, size: 32, onClick: () => { b.destroy(); this.throwBall(); } }).setDepth(45);
        b.setScale(0); this.tweens.add({ targets: b, scale: 1, duration: 400, ease: 'Back.Out', onComplete: () => b.pulse(true) });
        G.test.capture = b; G.test.phase = 'capture';
        this.pet.say('快用学识球！', 1600);
      });
    }
    throwBall() {
      G.test.phase = 'throwing';
      this.pet.attack(60); SFX.play('whoosh');
      const ball = this.add.image(this.pet.x + 60, this.pet.y - 140, 'ball').setDepth(50).setScale(0.9); this.ball = ball;
      const to = { x: this.mon.x, y: this.mon.y - 120 };
      const curve = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(ball.x, ball.y), new Phaser.Math.Vector2(640, 60), new Phaser.Math.Vector2(to.x, to.y)); const t = { v: 0 };
      this.tweens.add({ targets: t, v: 1, duration: 700, ease: 'Sine.InOut', onUpdate: () => { const p = curve.getPoint(t.v); ball.setPosition(p.x, p.y); ball.angle += 14; }, onComplete: () => {
        SFX.play('capture'); this.mon.clearDizzy(); this.mon.img.setTintFill(0xffffff);
        FX.burst(this, to.x, to.y, { tex: 'spark', count: 24, speed: 400, life: 600, scale: 0.9, tint: [0xffffff, C.sky], add: true, depth: 60 });
        this.tweens.add({ targets: this.mon, scale: 0, y: to.y + 80, duration: 400, ease: 'Back.In' });
        this.tweens.add({ targets: ball, y: this.mon.y - 30, angle: 0, duration: 500, delay: 300, ease: 'Bounce.Out', onComplete: () => { this.ask(true); } });
      } });
    }
    captureResult(ok) {
      this.clearQ(); const ball = this.ball, s = S();
      const wob = (n, done) => { let i = 0; const one = () => { SFX.play('wobble'); this.tweens.add({ targets: ball, angle: i % 2 ? 25 : -25, duration: 140, yoyo: true, ease: 'Sine.InOut', onComplete: () => { if (++i < n) this.time.delayedCall(320, one); else done(); } }); }; one(); };
      if (ok) {
        wob(3, () => {
          SFX.play('capture'); FX.burst(this, ball.x, ball.y, { tex: 'star', count: 20, speed: 420, life: 900, scale: 0.7, depth: 60 }); FX.confetti(this);
          FX.banner(this, '收服成功！图鉴 +1', { y: 300, hold: 1400, color: C.mint });
          this.stats.captured = true; const first = !s.dex[this.unit]; s.dex[this.unit] = true;
          if (this.unit === s.unlocked && s.unlocked < 6) { s.unlocked++; s.justUnlocked = s.unlocked; }
          Save.save();
          this.pet.cheer(['收服啦！', '新朋友！']);
          this.time.delayedCall(1700, () => this.finish(true, first));
        });
      } else {
        wob(1, () => {
          SFX.play('boom'); FX.burst(this, ball.x, ball.y, { tex: 'spark', count: 20, speed: 380, life: 600, scale: 0.8, add: true, depth: 60 });
          ball.destroy(); this.mon.img.clearTint(); this.mon.setScale(1); this.mon.y = 430;
          this.tweens.add({ targets: this.mon, x: 1500, y: 360, duration: 900, ease: 'Quad.In', delay: 200 });
          FX.banner(this, '哎呀，它跑掉了…', { y: 300, hold: 1200, color: C.grape });
          this.time.delayedCall(1600, () => this.finish(true, false));
        });
      }
    }
    lose() {
      this.pet.faint(); SFX.play('wrong');
      FX.banner(this, '小白累倒了…先回去休息', { y: 300, hold: 1300, color: C.grape });
      this.time.delayedCall(1500, () => this.finish(false, false));
    }
    finish(win, first) {
      G.test.phase = 'result'; S().stats.rounds++; Save.save();
      const st = this.stats;
      G.openResult({
        win, title: win ? (st.captured ? '收服成功' : '战斗胜利') : '下次加油',
        rows: [
          { icon: 'ic_sword', k: '答对题数', v: st.ok + ' / ' + st.total },
          { icon: 'coin', k: '获得金币', v: '+' + st.coins, color: '#e8a317' },
          { icon: 'star', k: '学识星', v: '+' + st.stars, color: '#e8a317' },
          { icon: 'ball', k: '收服', v: st.captured ? (first ? '新怪物！' : '成功') : '未收服', color: st.captured ? '#2fb36f' : '#8a7a9a' }
        ],
        buttons: [{ label: '回地图', color: C.mint, fn: () => G.trans.go(this, 'Map') }]
      });
    }
  }

  /* ======================= 射击守城 ======================= */
  class Shoot extends Phaser.Scene {
    constructor() { super({ key: 'Shoot' }); }
    init(d) { this.unit = (d && d.unit) || S().curUnit || 1; }
    create() {
      G.test = {}; G.scene = 'Shoot'; G.tapFX(this); G.hud.setVisibleBar(true);
      Quiz.resetRound();
      coverBg(this, 'bg-shooting');
      this.pet = new Pet(this, 640, 612, PET.h(120, 130)).setDepth(600);
      this.mons = []; this.spawned = 0; this.total = 8; this.hearts = 3; this.timeLeft = 150; this.over = false;
      this.stats = { ok: 0, total: 0, coins: 0, stars: 0, kills: 0 };
      // 顶部：城墙血量 + 计时
      const hp = panel(this, W - 140, 48, 210, 60, { r: 30 }).setDepth(900);
      this.heartImgs = [0, 1, 2].map(i => { const h = this.add.image(-60 + i * 60, 0, 'wallheart'); hp.add(h); return h; });
      const tp = panel(this, 905, 48, 210, 60, { r: 30 }).setDepth(900);
      this.timeT = txt(this, 0, 0, '', 28, '#4a2c17', dark); tp.add(this.timeT);
      this.progT = txt(this, 905, 98, '', 18, '#ffffff', { st: 5 }).setDepth(900);
      // 字母托盘
      this.tray = this.add.container(W / 2, 735).setDepth(800);
      const tg = this.add.graphics(); tg.fillStyle(0x000000, 0.2); tg.fillRoundedRect(-560, -46, 1120, 104, 34); tg.fillStyle(C.out); tg.fillRoundedRect(-565, -55, 1130, 110, 38); tg.fillStyle(0xfff3dc); tg.fillRoundedRect(-560, -50, 1120, 100, 34); this.tray.add(tg);
      this.keys = [];
      this.tray.y = H + 120; this.tweens.add({ targets: this.tray, y: 735, duration: 500, ease: 'Back.Out' });
      this.input.keyboard.on('keydown', e => { if (/^[a-zA-Z]$/.test(e.key)) { const k = this.keys.find(k => !k.used && k.letter === e.key.toLowerCase()); if (k) this.press(k); else this.press(null, e.key.toLowerCase()); } });
      FX.banner(this, '守住城墙！按顺序点字母发射', { y: 300, hold: 1400, color: C.coral });
      this.time.delayedCall(1200, () => this.spawn());
      this.spawnEv = this.time.addEvent({ delay: 7000, loop: true, callback: () => this.spawn() });
      this.clock = this.time.addEvent({ delay: 1000, loop: true, callback: () => { if (this.over) return; this.timeLeft--; this.updateTop(); if (this.timeLeft <= 0) this.end(); } });
      this.updateTop();
      G.test.shoot = this; G.test.phase = 'play';
    }
    updateTop() { const m = Math.floor(this.timeLeft / 60), s = this.timeLeft % 60; this.timeT.setText('⏱ ' + m + ':' + (s < 10 ? '0' : '') + s); this.progT.setText('怪物 ' + this.stats.kills + ' / ' + this.total); }
    spawn() {
      if (this.over || this.spawned >= this.total) return;
      if (this.mons.filter(m => m.alive).length >= 3) return;
      this.spawned++;
      const word = Quiz.pick(this.unit);
      const look = ((this.spawned + this.unit) % 6) + 1;
      let x0 = 640, tries = 0;
      do { x0 = Phaser.Math.Between(240, 1040); tries++; } while (tries < 20 && this.mons.some(o => o.alive && Math.abs(o.x - x0) < 260));
      const m = new Monster(this, x0, 300, look, 170); m.setScale(0.6);
      const cl = this.add.graphics(); cl.fillStyle(0xffffff, 0.95); [[-50, 4, 30], [-16, -6, 38], [24, -4, 34], [56, 6, 26], [0, 12, 40]].forEach(c => cl.fillCircle(c[0], c[1], c[2])); cl.fillStyle(0xdfefff); cl.fillEllipse(0, 26, 150, 22);
      m.addAt(cl, 1); m.shadow.setVisible(false);
      m.word = word; m.letters = word.en.toLowerCase().split(''); m.typed = 0; m.alive = true; m.p = 0; m.x0 = x0; m.dur = Math.max(17000, 26000 - this.spawned * 800); m.mist = 0;
      while (m.typed < m.letters.length && !/[a-z]/.test(m.letters[m.typed])) m.typed++;
      m.setAlpha(0); this.tweens.add({ targets: m, alpha: 1, duration: 400 });
      FX.burst(this, x0, 270, { tex: 'dot', count: 10, speed: 120, life: 500, tint: [0xffffff], scale: 1 });
      this.mons.push(m);
      if (!this.target || !this.target.alive) this.pickTarget();
    }
    pickTarget() {
      const alive = this.mons.filter(m => m.alive); if (this.card) { this.card.destroy(); this.card = null; } if (this.ret) { this.ret.destroy(); this.ret = null; }
      if (!alive.length) { this.target = null; this.buildTray(null); if (!this.over && this.spawned >= this.total) this.end(); return; }
      alive.sort((a, b) => b.p - a.p); const t = this.target = alive[0];
      this.ret = this.add.image(t.x, t.y, 'reticle').setDepth(590).setAlpha(0.9);
      this.tweens.add({ targets: this.ret, angle: 360, duration: 3000, repeat: -1 });
      this.buildCard(t); this.buildTray(t);
      if (Speech.ok(t.word)) Speech.say(t.word.en);
      t.q0 = performance.now();
    }
    buildCard(t) {
      const w = Math.max(260, t.letters.length * 44 + 60);
      const c = this.add.container(t.x, t.y).setDepth(700); this.card = c;
      const g = this.add.graphics(); g.fillStyle(0x000000, 0.18); g.fillRoundedRect(-w / 2 + 3, -50 + 8, w, 104, 22); g.fillStyle(C.out); g.fillRoundedRect(-w / 2 - 4, -54, w + 8, 112, 24); g.fillStyle(0xffffff); g.fillRoundedRect(-w / 2, -50, w, 104, 20);
      g.fillTriangle(-14, 52, 14, 52, 0, 72); c.add(g);
      const sp = button(this, -w / 2 + 34, -22, 44, 44, '', { icon: 'speaker', iconOnly: true, color: C.sky, r: 22, onClick: () => { if (!Speech.say(t.word.en)) G.hud.toast('本机无英语语音，看中文和首字母提示拼一拼', C.sky); } });
      c.add(sp);
      c.add(txt(this, 14, -22, Quiz.shortZh(t.word.zh) + (Speech.ok(t.word) ? '' : '  (' + t.word.ipa + ')'), 24, '#4a2c17', dark));
      t.slots = t.letters.map((ch, i) => {
        const x = -((t.letters.length - 1) * 44) / 2 + i * 44;
        const sg = this.add.graphics(); const letterish = /[a-z]/.test(ch);
        if (letterish) { sg.fillStyle(0xf3e6cf); sg.fillRoundedRect(x - 19, 4, 38, 40, 10); sg.lineStyle(3, 0xd9c4a3); sg.strokeRoundedRect(x - 19, 4, 38, 40, 10); }
        c.add(sg);
        const lt = txt(this, x, 25, letterish ? '' : ch, 28, '#3a6fd8', dark); c.add(lt);
        return lt;
      });
      if (!Speech.ok(t.word) && t.slots[0]) t.slots[0].setText(t.letters[0]).setColor('#c9b8a0');
      c.setScale(0); this.tweens.add({ targets: c, scale: 1, duration: 300, ease: 'Back.Out' });
    }
    buildTray(t) {
      this.keys.forEach(k => k.destroy()); this.keys = [];
      if (!t) return;
      const need = t.letters.filter(ch => /[a-z]/.test(ch));
      const pool = 'abcdefghijklmnopqrstuvwxyz'.split('').filter(ch => need.indexOf(ch) < 0);
      const extra = Quiz.shuffle(pool).slice(0, Math.max(3, Math.min(12, need.length + 3) - need.length));
      const letters = Quiz.shuffle(need.concat(extra)).slice(0, 13);
      const n = letters.length, step = Math.min(84, 1060 / n);
      letters.forEach((ch, i) => {
        const k = button(this, -((n - 1) * step) / 2 + i * step, -4, step - 10, 74, ch, { color: [C.coral, C.sky, C.mint, C.sun, C.grape][i % 5], size: 36, sfx: 'type', onClick: () => this.press(k) });
        k.letter = ch; this.tray.add(k); this.keys.push(k);
        k.setScale(0); this.tweens.add({ targets: k, scale: 1, delay: i * 30, duration: 300, ease: 'Back.Out' });
      });
    }
    expected() { const t = this.target; if (!t) return null; return t.letters[t.typed]; }
    press(k, typed) {
      const t = this.target; if (!t || !t.alive || this.over) return;
      const exp = this.expected(), letter = k ? k.letter : typed;
      if (letter === exp && (!k || !k.used)) {
        Quiz.tapRight();
        if (!k) k = this.keys.find(x => !x.used && x.letter === letter);
        if (k) { k.used = true; k.setEnabled(false); this.tweens.add({ targets: k, scale: 0.6, alpha: 0.25, duration: 200 }); }
        const idx = t.typed; t.typed++;
        while (t.typed < t.letters.length && !/[a-z]/.test(t.letters[t.typed])) t.typed++;
        this.fire(t, idx);
      } else {
        SFX.play('wrong'); t.mist++;
        if (k) { k.flashColor(C.red, 500); this.tweens.add({ targets: k, angle: { from: -12, to: 12 }, duration: 60, yoyo: true, repeat: 2, onComplete: () => k.angle = 0 }); }
        this.pet.say('不是这个哦', 700);
        t.p = Math.min(0.98, t.p + 0.02);
        if (Quiz.tapWrong()) { this.scene.pause(); G.openCooldown(() => this.scene.resume()); }
      }
    }
    fire(t, idx) {
      SFX.play('shoot'); this.pet.attack(0);
      this.tweens.add({ targets: this.pet.body_, scaleY: 0.86, duration: 60, yoyo: true });
      const from = { x: this.pet.x, y: this.pet.y - 110 };
      trailBullet(this, from, { x: t.x, y: t.y - 160 * t.scale * 0.6 }, { arc: 60, dur: 260, scale: 1.3 }).then(() => {
        if (!t.alive) return;
        t.hit(1); SFX.play('hit');
        FX.burst(this, t.x, t.y - 60 * t.scale, { tex: 'spark', count: 8, speed: 260, life: 380, scale: 0.6, add: true, tint: [0xffffff, 0xfff07a], depth: 650 });
        const sl = t.slots && t.slots[idx]; if (sl) { sl.setText(t.letters[idx]).setColor('#3a6fd8'); sl.setScale(1.8); this.tweens.add({ targets: sl, scale: 1, duration: 260, ease: 'Back.Out' }); }
        if (t.typed >= t.letters.length) this.kill(t);
      });
    }
    kill(t) {
      t.alive = false; this.stats.kills++; this.stats.total++;
      const ok = t.mist === 0; const r = Quiz.record(t.word, ok);
      const ms = performance.now() - (t.q0 || 0);
      if (ok) { this.stats.ok++; this.stats.coins += r.coins; G.hud.gain('coins', r.coins, t.x, t.y - 60); FX.float(this, t.x, t.y - 170 * t.scale, '+' + r.coins + (ms < 6000 ? '  神速！' : ''), { color: '#ffe14d', size: 38 }); this.pet.cheer(); }
      else FX.float(this, t.x, t.y - 170 * t.scale, '拼对啦（已记入错题本）', { color: '#ffffff', size: 24 });
      if (r.star) { this.stats.stars++; G.hud.gain('stars', 1, t.x, t.y); }
      SFX.play('boom'); FX.flashWhite(t.img, 2); this.cameras.main.shake(180, 0.008);
      FX.ring(this, t.x, t.y - 60, MONSTERS[((this.spawned) % 6) + 1].color, 140, { depth: 650 });
      FX.burst(this, t.x, t.y - 60 * t.scale, { tex: 'star', count: 14, speed: 420, life: 800, scale: 0.6, depth: 650 });
      FX.burst(this, t.x, t.y - 60 * t.scale, { tex: 'dot', count: 20, speed: 340, life: 700, scale: 1.1, tint: [0xffffff, 0xffd1e8, 0xc9f0ff], depth: 649 });
      Speech.say(t.word.en);
      this.tweens.add({ targets: t, scale: t.scale * 1.3, alpha: 0, angle: 30, duration: 260, onComplete: () => t.destroy() });
      this.updateTop();
      this.time.delayedCall(250, () => { this.pickTarget(); if (this.mons.filter(m => m.alive).length === 0) this.spawn(); });
    }
    wallHit(t) {
      t.alive = false; this.hearts--; this.stats.total++;
      if (t === this.target) Quiz.record(t.word, false);
      SFX.play('hurt'); this.cameras.main.shake(350, 0.02); this.cameras.main.flash(150, 255, 120, 120);
      const h = this.heartImgs[this.hearts]; if (h) this.tweens.add({ targets: h, scale: 1.8, alpha: 0, y: h.y - 40, duration: 400, ease: 'Back.In' });
      FX.float(this, t.x, t.y - 120, t.word.en + ' = ' + Quiz.shortZh(t.word.zh), { color: '#ffffff', size: 30, dur: 1600 });
      FX.burst(this, t.x, t.y, { tex: 'dot', count: 16, speed: 300, life: 600, tint: [0xd9b98a, 0xffffff], scale: 1.2, depth: 650 });
      this.pet.hurt(20);
      this.tweens.add({ targets: t, alpha: 0, scale: 0, duration: 300, onComplete: () => t.destroy() });
      if (this.hearts <= 0) return this.end();
      this.time.delayedCall(200, () => { if (t === this.target) this.pickTarget(); });
    }
    update(time, delta) {
      if (this.over) return;
      this.mons.forEach(m => {
        if (!m.alive) return;
        m.p += delta / m.dur;
        const e = m.p;
        m.y = 300 + (585 - 300) * e;
        m.x = m.x0 + Math.sin(time / 700 + m.x0) * 30 * (1 - e) + (640 - m.x0) * e * 0.25;
        m.setScale(0.6 + 0.45 * e); m.setDepth(100 + m.y);
        if (m.p >= 1) this.wallHit(m);
      });
      const t = this.target;
      if (t && t.alive) {
        if (this.card) { this.card.x = Phaser.Math.Clamp(t.x, 200, W - 200); this.card.y = t.y - 160 * t.scale - 70; }
        if (this.ret) { this.ret.setPosition(t.x, t.y - 75 * t.scale); this.ret.setScale(t.scale * 1.1); }
      }
      this.mons = this.mons.filter(m => m.alive || m.scene);
    }
    end() {
      if (this.over) return; this.over = true; this.spawnEv.remove(); G.test.phase = 'result';
      this.keys.forEach(k => k.setEnabled(false)); if (this.card) this.card.destroy(); if (this.ret) this.ret.destroy();
      const win = this.hearts > 0;
      this.mons.forEach(m => { if (m.alive) { m.alive = false; this.tweens.add({ targets: m, alpha: 0, y: m.y - 80, duration: 500 }); } });
      FX.banner(this, win ? '城墙守住啦！' : '城墙被突破了…', { y: 300, hold: 1200, color: win ? C.mint : C.grape });
      if (win) this.pet.cheer(['守住啦！']);
      S().stats.rounds++; Save.save();
      const st = this.stats;
      this.time.delayedCall(1400, () => G.openResult({
        win, title: win ? '守城成功' : '下次加油',
        rows: [
          { icon: 'ic_shoot', k: '击退怪物', v: st.kills + ' / ' + this.total },
          { icon: 'ic_sword', k: '一次拼对', v: st.ok + ' 个词' },
          { icon: 'coin', k: '获得金币', v: '+' + st.coins, color: '#e8a317' },
          { icon: 'star', k: '学识星', v: '+' + st.stars, color: '#e8a317' }
        ],
        buttons: [{ label: '回地图', color: C.mint, fn: () => G.trans.go(this, 'Map') }]
      }));
    }
  }

  /* ======================= 钓鱼 ======================= */
  class Fish extends Phaser.Scene {
    constructor() { super({ key: 'Fish' }); }
    init(d) { this.unit = (d && d.unit) || S().curUnit || 1; }
    create() {
      G.test = {}; G.scene = 'Fish'; G.tapFX(this); G.hud.setVisibleBar(true);
      Quiz.resetRound();
      coverBg(this, 'bg-fishing');
      // 水面闪光
      this.add.particles(0, 0, 'spark', { x: { min: 0, max: W }, y: { min: 380, max: 780 }, lifespan: 1200, scale: { start: 0, end: 0.4, ease: 'Sine.InOut' }, alpha: { start: 0.8, end: 0 }, frequency: 140, blendMode: 'ADD' });
      this.pet = new Pet(this, 470, 600, PET.h(140, 150)).setDepth(50);
      this.rod = this.add.graphics().setDepth(55);
      this.bob = this.add.image(0, 0, 'bobber').setDepth(40).setVisible(false);
      this.state = 'idle'; this.casts = 0; this.maxCasts = 6; this.timeLeft = 150;
      this.stats = { ok: 0, total: 0, coins: 0, stars: 0, best: null };
      this.rodAng = -1.0; this.bend = 0;
      const tp = panel(this, 950, 48, 280, 60, { r: 30 }).setDepth(900);
      this.topT = txt(this, 0, 0, '', 24, '#4a2c17', dark); tp.add(this.topT);
      this.btn = button(this, W - 170, H - 90, 260, 100, '抛竿', { color: C.sky, size: 40, icon: 'ic_fish', onClick: () => this.action() }).setDepth(900);
      this.btn.pulse(true);
      this.input.on('pointerdown', p => { if (performance.now() - G.lastUiTap < 60) return; if ((this.state === 'idle' || this.state === 'bite') && p.y > 380 && p.x > 600) this.action(p); });
      this.clock = this.time.addEvent({ delay: 1000, loop: true, callback: () => { if (this.state === 'done') return; this.timeLeft--; this.updateTop(); if (this.timeLeft <= 0) this.end(); } });
      this.updateTop();
      FX.banner(this, '抛竿钓鱼，上钩了就快收线！', { y: 300, hold: 1300, color: C.sky });
      G.test.fish = this; G.test.phase = 'idle'; G.test.action = this.btn;
    }
    updateTop() { const m = Math.floor(this.timeLeft / 60), s = this.timeLeft % 60; this.topT.setText('第 ' + Math.min(this.casts + (this.state === 'idle' ? 1 : 0), this.maxCasts) + '/' + this.maxCasts + ' 竿  ⏱ ' + m + ':' + (s < 10 ? '0' : '') + s); }
    tip() { return { x: this.pet.x + 40 + Math.cos(this.rodAng) * 170, y: this.pet.y - 70 + Math.sin(this.rodAng) * 170 }; }
    update(time) {
      const g = this.rod; g.clear();
      const bx = this.pet.x + 40, by = this.pet.y - 70, tp = this.tip();
      // 鱼竿
      const mx = (bx + tp.x) / 2 + this.bend * 20, my = (by + tp.y) / 2 + this.bend * 30;
      const rc = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(bx, by), new Phaser.Math.Vector2(mx, my), new Phaser.Math.Vector2(tp.x, tp.y));
      g.lineStyle(10, UI.C.out); rc.draw(g, 16); g.lineStyle(5, 0xc98a4b); rc.draw(g, 16);
      g.fillStyle(UI.C.out); g.fillCircle(bx + 18, by + 10, 9); g.fillStyle(0xffc22e); g.fillCircle(bx + 18, by + 10, 6);
      if (this.bob.visible && !this.snapped) {
        if (this.state === 'wait') this.bob.y = this.bobY + Math.sin(time / 300) * 3;
        const sag = this.state === 'question' || this.state === 'reel' ? 10 : 70;
        const lc = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(tp.x, tp.y), new Phaser.Math.Vector2((tp.x + this.bob.x) / 2, Math.max(tp.y, this.bob.y) + sag), new Phaser.Math.Vector2(this.bob.x, this.bob.y - 18));
        g.lineStyle(3, this.state === 'question' ? 0xff6b6b : 0xffffff, 0.95); lc.draw(g, 20);
      }
    }
    action(p) {
      if (this.state === 'idle') this.cast(p);
      else if (this.state === 'bite') this.reel();
    }
    cast(p) {
      if (this.casts >= this.maxCasts) return;
      this.casts++; this.updateTop(); this.state = 'flying'; G.test.phase = 'flying'; this.snapped = false;
      this.btn.pulse(false); this.btn.setLabel('等待中…').setColor(C.gray);
      const tx = p ? Phaser.Math.Clamp(p.x, 760, 1180) : Phaser.Math.Between(780, 1120), ty = p ? Phaser.Math.Clamp(p.y, 470, 650) : Phaser.Math.Between(480, 620);
      SFX.play('whoosh');
      this.tweens.add({ targets: this, rodAng: -2.2, duration: 180, ease: 'Quad.Out', onComplete: () => this.tweens.add({ targets: this, rodAng: -0.55, duration: 160, ease: 'Back.Out' }) });
      this.time.delayedCall(260, () => {
        const t0 = this.tip(); this.bob.setVisible(true).setPosition(t0.x, t0.y).setScale(1);
        const curve = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(t0.x, t0.y), new Phaser.Math.Vector2((t0.x + tx) / 2, 220), new Phaser.Math.Vector2(tx, ty)); const o = { v: 0 };
        this.tweens.add({ targets: o, v: 1, duration: 650, ease: 'Sine.In', onUpdate: () => { const q = curve.getPoint(o.v); this.bob.setPosition(q.x, q.y); this.bob.angle += 10; }, onComplete: () => {
          this.bob.angle = 0; this.bobY = ty; SFX.play('splash');
          FX.ring(this, tx, ty + 8, 0xffffff, 90, { flat: true, depth: 39 }); this.time.delayedCall(150, () => FX.ring(this, tx, ty + 8, 0xffffff, 60, { flat: true, depth: 39 }));
          FX.burst(this, tx, ty, { tex: 'dot', count: 14, speed: 260, life: 600, scale: 0.7, gravity: 700, angle: { min: 220, max: 320 }, tint: [0xffffff, 0xbfeaff] });
          this.state = 'wait'; G.test.phase = 'wait';
          this.ripple = this.time.addEvent({ delay: 900, loop: true, callback: () => FX.ring(this, this.bob.x, this.bob.y + 8, 0xffffff, 50, { flat: true, depth: 39, dur: 800 }) });
          this.time.delayedCall(Phaser.Math.Between(1300, 2800), () => this.bite());
        } });
      });
    }
    bite() {
      if (this.state !== 'wait') return;
      this.state = 'bite'; G.test.phase = 'bite'; SFX.play('bite');
      this.biteTw = this.tweens.add({ targets: this.bob, y: this.bobY + 12, duration: 90, yoyo: true, repeat: -1 });
      this.excl = this.add.image(this.bob.x, this.bob.y - 70, 'excl').setDepth(60).setScale(0);
      this.tweens.add({ targets: this.excl, scale: 1, duration: 240, ease: 'Back.Out' });
      this.biteB = bubble(this, Phaser.Math.Clamp(this.bob.x, 300, W - 300), this.bob.y - 170, 300, 70, { tail: 'down' }).setDepth(61);
      this.biteB.add(txt(this, 0, 0, '上钩了！快收线！', 30, '#ff5a5a', dark));
      this.btn.setLabel('收线！').setColor(C.red).pulse(true);
      this.cameras.main.shake(200, 0.003);
      this.biteTimer = this.time.delayedCall(2800, () => { if (this.state === 'bite') this.escape('太慢啦，鱼溜走了'); });
    }
    clearBite() { if (this.biteTw) this.biteTw.stop(); if (this.excl) this.excl.destroy(); if (this.biteB) this.biteB.destroy(); if (this.biteTimer) this.biteTimer.remove(); this.excl = this.biteB = null; }
    reel() {
      if (Quiz.inCooldown()) { G.openCooldown(); return; }
      this.clearBite(); this.state = 'question'; SFX.play('reel');
      this.btn.pulse(false); this.btn.setLabel('收线中…').setColor(C.gray);
      this.tweens.add({ targets: this, bend: 1, rodAng: -0.75, duration: 200 });
      this.pullTw = this.tweens.add({ targets: this.bob, x: this.bob.x + 10, duration: 120, yoyo: true, repeat: -1 });
      const q = Quiz.make(this.unit, null, 3); this.q = q;
      const listen = q.type === 'en2zh' && Speech.ok(q.word);
      const qx = Phaser.Math.Clamp(this.bob.x - 60, 330, W - 330), qy = 250;
      const qb = bubble(this, qx, qy, 500, 170, { tail: 'down', tailX: Phaser.Math.Clamp(this.bob.x - qx, -200, 200) }).setDepth(70); this.qb = qb;
      const tg = this.add.graphics(); tg.fillStyle(q.wasWrong ? C.grape : C.sky); tg.fillRoundedRect(-170, -72, 340, 34, 17); qb.add(tg);
      qb.add(txt(this, 0, -55, q.wasWrong ? '错题词 · 可能是稀有鱼！' : (q.type === 'zh2en' ? '看中文 · 选英文' : (listen ? '听发音 · 选意思' : '看英文 · 选意思')), 19, '#ffffff', { st: 4 }));
      if (q.type === 'zh2en') qb.add(txt(this, 0, -2, '「' + Quiz.shortZh(q.word.zh) + '」', 44, '#4a2c17', dark));
      else if (listen) { const sp = button(this, 0, -2, 76, 76, '', { icon: 'speaker', iconOnly: true, color: C.sky, r: 38, onClick: () => Speech.say(q.word.en) }); qb.add(sp); this.time.delayedCall(300, () => Speech.say(q.word.en)); }
      else qb.add(txt(this, 0, -2, q.word.en, 48, '#3a6fd8', dark));
      // 鱼的力气条（不暂停，10 秒内要答）
      const bg = this.add.graphics(); bg.fillStyle(0xeadbc2); bg.fillRoundedRect(-180, 48, 360, 16, 8); qb.add(bg);
      const bar = this.add.rectangle(-180, 48, 360, 16, C.coral).setOrigin(0, 0); qb.add(bar);
      qb.add(txt(this, 0, 32, '鱼在挣扎…', 15, '#a0754f', dark));
      this.tweens.add({ targets: this.btn, alpha: 0, scale: 0.6, duration: 200 });
      this.struggle = this.time.addEvent({ delay: 380, loop: true, callback: () => { FX.burst(this, this.bob.x + Phaser.Math.Between(-30, 30), this.bob.y + 6, { tex: 'dot', count: 5, speed: 160, life: 420, scale: 0.5, gravity: 500, angle: { min: 220, max: 320 }, tint: [0xffffff, 0xbfeaff], depth: 41 }); FX.ring(this, this.bob.x, this.bob.y + 8, 0xffffff, 44, { flat: true, depth: 39, dur: 400 }); } });
      this.pull = this.tweens.add({ targets: bar, displayWidth: 0.01, duration: 10000, onComplete: () => { if (this.state === 'question') this.answer(-1); } });
      // 选项：漂在水面上的泡泡
      this.opts = q.options.map((o, i) => {
        const x = 665 + i * 248, y = Math.min(this.bob.y + 90, 700);
        const lbl = wordLabel(q, i);
        const b = button(this, x, y, 224, 76, lbl, { color: [C.coral, C.mint, C.grape][i], size: lbl.length > 8 ? 22 : 30, r: 38, onClick: () => this.answer(i) }).setDepth(72);
        b.setScale(0); this.tweens.add({ targets: b, scale: 1, delay: 100 + i * 80, duration: 360, ease: 'Back.Out', onComplete: () => this.tweens.add({ targets: b, y: y - 8, duration: 800 + i * 120, yoyo: true, repeat: -1, ease: 'Sine.InOut' }) });
        return b;
      });
      G.test.choices = this.opts.map((b, i) => ({ b, correct: i === q.answer })); G.test.phase = 'question';
    }
    answer(i) {
      if (this.state !== 'question') return; this.state = 'reel'; G.test.phase = 'reel';
      const q = this.q, ms = performance.now() - q.t0, ok = i === q.answer;
      if (this.pull) this.pull.stop(); if (this.pullTw) this.pullTw.stop(); if (this.struggle) this.struggle.remove();
      this.tweens.add({ targets: this.btn, alpha: 1, scale: 1, duration: 250, delay: 600, ease: 'Back.Out' });
      const r = Quiz.record(q.word, ok); this.stats.total++;
      const b = this.opts[i];
      this.opts.forEach((x, j) => { this.tweens.killTweensOf(x); if (j !== i && j !== q.answer) this.tweens.add({ targets: x, alpha: 0.3, duration: 150 }); });
      if (ok) {
        b.flashColor(C.green, 900); SFX.play('correct'); const bc = b.center();
        FX.burst(this, bc.x, bc.y, { tex: 'star', count: 10, speed: 360, life: 700, scale: 0.5, depth: 80 });
        this.stats.ok++; this.stats.coins += r.coins; G.hud.gain('coins', r.coins, bc.x, bc.y);
        FX.float(this, bc.x, bc.y - 50, '+' + r.coins, { color: '#ffe14d' });
        if (r.star) { this.stats.stars++; G.hud.gain('stars', 1, bc.x, bc.y); FX.float(this, bc.x, bc.y - 100, '掌握新词 ★+1', { color: '#ffd84d', size: 30 }); }
        Speech.say(q.word.en);
        this.time.delayedCall(450, () => this.landFish(q, ms));
      } else {
        if (b) { b.flashColor(C.red, 900); this.tweens.add({ targets: b, x: b.x + 10, duration: 45, yoyo: true, repeat: 4 }); }
        this.opts[q.answer].flashColor(C.green, 1500);
        SFX.play('wrong');
        FX.float(this, this.bob.x, this.bob.y - 120, q.word.en + ' = ' + Quiz.shortZh(q.word.zh), { color: '#ffffff', size: 30, dur: 1800 });
        Speech.say(q.word.en);
        this.time.delayedCall(500, () => {
          SFX.play('snap'); this.snapped = true; this.cameras.main.shake(150, 0.006);
          FX.burst(this, this.bob.x, this.bob.y, { tex: 'dot', count: 12, speed: 240, life: 500, scale: 0.6, gravity: 500, tint: [0xffffff, 0xbfeaff] });
          const sh = this.add.ellipse(this.bob.x, this.bob.y + 20, 110, 34, 0x1b3d5c, 0.45).setDepth(39);
          this.tweens.add({ targets: sh, x: sh.x + 400, alpha: 0, duration: 1200, ease: 'Quad.In', onComplete: () => sh.destroy() });
          this.bob.setVisible(false); this.pet.hurt(10); this.pet.say('下次一定！', 1000);
          this.time.delayedCall(1300, () => { if (r.cooldown) G.openCooldown(() => this.resetCast()); else this.resetCast(); });
        });
      }
      this.time.delayedCall(700, () => { this.opts.forEach(o => this.tweens.add({ targets: o, scale: 0, duration: 200, ease: 'Back.In', onComplete: () => o.destroy() })); if (this.qb) { const qb = this.qb; this.tweens.add({ targets: qb, scale: 0, duration: 200, onComplete: () => qb.destroy() }); this.qb = null; } });
    }
    rollRarity(wasWrong) {
      const x = Math.random();
      if (wasWrong) return x < 0.3 ? 'legend' : 'rare';
      return x < 0.03 ? 'legend' : x < 0.13 ? 'rare' : x < 0.38 ? 'blue' : 'common';
    }
    landFish(q, ms) {
      const rar = this.rollRarity(q.wasWrong), F = FISH[rar];
      const speed = Phaser.Math.Clamp((7000 - ms) / 7000, 0, 1);
      const kg = +(Phaser.Math.FloatBetween(F.w[0], F.w[1]) * (1 + 0.6 * speed)).toFixed(1);
      S().fish[rar]++; Save.save();
      this.bob.setVisible(false); SFX.play('splash'); SFX.play('reel');
      this.tweens.add({ targets: this, bend: 0, rodAng: -1.6, duration: 300, ease: 'Back.Out' });
      FX.burst(this, this.bob.x, this.bob.y, { tex: 'dot', count: 22, speed: 380, life: 800, scale: 0.9, gravity: 800, angle: { min: 200, max: 340 }, tint: [0xffffff, 0xbfeaff] });
      FX.ring(this, this.bob.x, this.bob.y + 8, 0xffffff, 120, { flat: true, depth: 39 });
      const fish = this.add.image(this.bob.x, this.bob.y, F.key).setDepth(90).setScale(0.5);
      const cx = 760, cy = 340;
      const curve = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(fish.x, fish.y), new Phaser.Math.Vector2((fish.x + cx) / 2, 120), new Phaser.Math.Vector2(cx, cy)); const o = { v: 0 };
      this.tweens.add({ targets: o, v: 1, duration: 700, ease: 'Sine.Out', onUpdate: () => { const p = curve.getPoint(o.v); fish.setPosition(p.x, p.y); fish.angle = -360 * o.v; fish.setScale(0.5 + o.v * 0.9); }, onComplete: () => {
        fish.angle = 0;
        const rays = FX.rays(this, cx, cy, F.color, { depth: 85, r: rar === 'legend' ? 340 : 240 });
        const card = this.add.container(cx, cy + 150).setDepth(95);
        const w = 380, g = this.add.graphics(); g.fillStyle(C.out); g.fillRoundedRect(-w / 2 - 4, -40, w + 8, 84, 26); g.fillStyle(F.color); g.fillRoundedRect(-w / 2, -36, w, 76, 22); g.fillStyle(0xffffff, 0.3); g.fillRoundedRect(-w / 2 + 12, -32, w - 24, 16, 8); card.add(g);
        card.add(txt(this, 0, -12, F.tag + '！' + F.name, 30)); card.add(txt(this, 0, 22, kg + ' kg' + (speed > 0.5 ? '  答得快，鱼更重！' : ''), 20));
        card.setScale(0); this.tweens.add({ targets: card, scale: 1, duration: 360, ease: 'Back.Out' });
        this.tweens.add({ targets: fish, y: cy - 14, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
        SFX.play(rar === 'legend' || rar === 'rare' ? 'fanfare' : 'capture');
        if (rar === 'legend' || rar === 'rare') { FX.confetti(this); this.cameras.main.flash(250, 255, 240, 180); }
        FX.burst(this, cx, cy, { tex: 'star', count: 16, speed: 420, life: 900, scale: 0.6, depth: 96 });
        this.pet.cheer(rar === 'legend' ? ['传说中的鱼！！'] : ['钓到啦！', '好大一条！']);
        if (!this.stats.best || kg > this.stats.best.kg) this.stats.best = { name: F.name, kg };
        G.test.phase = 'caught';
        this.time.delayedCall(2000, () => {
          this.tweens.killTweensOf(fish);
          this.tweens.add({ targets: [fish, card], x: this.pet.x, y: this.pet.y - 60, scale: 0, duration: 450, ease: 'Back.In', onComplete: () => { fish.destroy(); card.destroy(); SFX.play('pop'); } });
          this.tweens.add({ targets: rays, alpha: 0, duration: 300, onComplete: () => rays.destroy() });
          this.time.delayedCall(600, () => this.resetCast());
        });
      } });
    }
    escape(msg) {
      this.clearBite(); this.state = 'reel'; SFX.play('splash');
      this.bob.setVisible(false); FX.float(this, this.bob.x, this.bob.y - 60, msg, { color: '#ffffff', size: 28 });
      this.time.delayedCall(900, () => this.resetCast());
    }
    resetCast() {
      if (this.ripple) this.ripple.remove();
      this.bob.setVisible(false); this.snapped = false; this.bend = 0; this.rodAng = -1.0;
      if (this.casts >= this.maxCasts || this.timeLeft <= 0) return this.end();
      this.state = 'idle'; G.test.phase = 'idle'; this.updateTop();
      this.btn.setLabel('抛竿').setColor(C.sky).pulse(true);
    }
    end() {
      if (this.state === 'done') return; this.state = 'done'; G.test.phase = 'result';
      this.btn.pulse(false); this.btn.setEnabled(false); this.tweens.add({ targets: this.btn, alpha: 0, scale: 0.5, duration: 250 }); this.clearBite();
      S().stats.rounds++; Save.save();
      const st = this.stats, win = st.ok > 0;
      FX.banner(this, '收竿啦！', { y: 300, hold: 1000, color: C.sky });
      this.time.delayedCall(1200, () => G.openResult({
        win, title: '钓鱼结束',
        rows: [
          { icon: 'ic_fish', k: '钓到鱼', v: st.ok + ' 条' },
          { icon: 'ic_dex', k: '最大的鱼', v: st.best ? st.best.name + ' ' + st.best.kg + 'kg' : '—' },
          { icon: 'coin', k: '获得金币', v: '+' + st.coins, color: '#e8a317' },
          { icon: 'star', k: '学识星', v: '+' + st.stars, color: '#e8a317' }
        ],
        buttons: [{ label: '回地图', color: C.mint, fn: () => G.trans.go(this, 'Map') }]
      }));
    }
  }

  window.GameScenes = { Battle, Shoot, Fish };
})();
