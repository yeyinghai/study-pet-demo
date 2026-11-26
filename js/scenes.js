/* 知识群岛 v0.2 —— 启动 / 标题 / 孵蛋 / 地图 / 通用弹窗 */
(function () {
  'use strict';
  const { W, H, C, txt, panel, button, bubble } = UI;
  const SC = 1.6; // 岛图放大倍率
  const ZONES = [null,
    { x: 265, y: 495, r: 100, patch: [360, 455] },
    { x: 548, y: 468, r: 92, patch: [470, 540] },
    { x: 525, y: 268, r: 92, patch: [450, 300] },
    { x: 850, y: 425, r: 105, patch: [770, 475] },
    { x: 790, y: 180, r: 100, patch: [720, 250] },
    { x: 1058, y: 200, r: 100, patch: [990, 265] }];
  const START = { x: 330 * SC, y: 420 * SC };

  // 每个场景：任意点击都有涟漪+轻音
  function tapFX(scene) {
    scene.input.on('pointerdown', p => {
      SFX.init();
      if (performance.now() - G.lastUiTap > 40) SFX.play('tap');
      FX.ring(scene, p.worldX, p.worldY, 0xffffff, 34, { dur: 320, depth: 2000 });
    });
  }
  G.tapFX = tapFX;

  /* ---------------- 通用：开局检查（冷却 / 体力）---------------- */
  G.canPlay = function (scene, cost) {
    cost = cost || 3;
    if (Quiz.inCooldown()) { G.openCooldown(); return false; }
    if (S().stamina < cost) { G.hud.toast('体力用完啦，明天再来吧（家长可恢复）', C.red); return false; }
    S().stamina -= cost; Save.save(); G.hud.spend('stamina', cost); return true;
  };

  G.openCooldown = function (onDone) {
    G.hud.modal({
      title: '休息一下', titleColor: C.grape, w: 560, h: 360, closable: false,
      build: (p, close) => {
        const hud = G.hud;
        p.add(txt(hud, 0, -90, '连续点错太快啦～', 30, '#4a2c17', { stroke: '', st: 0, shadow: false }));
        p.add(txt(hud, 0, -46, '想一想再答，小白陪你休息一会儿', 22, '#8a6a4f', { stroke: '', st: 0, shadow: false }));
        const pet = new Pet(hud, -150, 120, 120); p.add(pet);
        const t = txt(hud, 60, 50, '', 64, '#9a7bff', { st: 10, stroke: '#ffffff' }); p.add(t);
        const tick = () => { const l = Quiz.cooldownLeft(); t.setText(l + ' 秒'); if (l <= 0) { ev.remove(); close(); G.hud.toast('休息好啦，继续加油！', C.mint); if (onDone) onDone(); } };
        const ev = hud.time.addEvent({ delay: 250, loop: true, callback: tick }); tick();
        hud.tweens.add({ targets: t, scale: 1.08, duration: 500, yoyo: true, repeat: -1 });
      }
    });
  };

  G.openResult = function (o) {
    SFX.play(o.win ? 'fanfare' : 'pop');
    G.hud.modal({
      title: o.title, titleColor: o.win ? C.coral : C.grape, w: 640, h: 440, closable: false,
      build: (p, close) => {
        const hud = G.hud;
        if (o.win) { FX.confetti(hud, { depth: 150 }); }
        const rows = o.rows || [];
        rows.forEach((r, i) => {
          const y = -120 + i * 62;
          const g = hud.add.graphics(); g.fillStyle(0xf3e6cf); g.fillRoundedRect(-250, y - 25, 500, 50, 16); p.add(g);
          if (r.icon) p.add(hud.add.image(-215, y, r.icon).setScale(0.7));
          p.add(txt(hud, -180, y, r.k, 24, '#6b4a33', { ox: 0, stroke: '', st: 0, shadow: false }));
          const v = txt(hud, 230, y, r.v, 28, r.color || '#4a2c17', { ox: 1, stroke: '#ffffff', st: 4, shadow: false }); p.add(v);
          v.setScale(0); hud.tweens.add({ targets: v, scale: 1, delay: 250 + i * 160, duration: 300, ease: 'Back.Out', onStart: () => SFX.play('pop') });
        });
        const btns = o.buttons || [{ label: '回地图', color: C.mint, go: 'Map' }];
        G.test.modalBtns = {};
        btns.forEach((b, i) => {
          const x = (i - (btns.length - 1) / 2) * 250;
          const bt = button(hud, x, 160, 220, 76, b.label, { color: b.color, onClick: () => { close(); if (b.fn) b.fn(); } });
          p.add(bt); G.test.modalBtns[b.label] = bt;
        });
      }
    });
  };

  G.openDex = function () {
    const s = S();
    G.hud.modal({
      title: '怪物图鉴', titleColor: C.sun, w: 900, h: 560,
      build: (p) => {
        const hud = G.hud;
        for (let u = 1; u <= 6; u++) {
          const col = (u - 1) % 3, row = Math.floor((u - 1) / 3);
          const x = -280 + col * 280, y = -125 + row * 230;
          const got = !!s.dex[u];
          const g = hud.add.graphics();
          g.fillStyle(UI.C.out); g.fillRoundedRect(x - 124, y - 104, 248, 208, 22);
          g.fillStyle(got ? 0xfff1d6 : 0xe5dcef); g.fillRoundedRect(x - 120, y - 100, 240, 200, 20);
          if (got) { g.fillStyle(MONSTERS[u].color, 0.35); g.fillCircle(x, y - 10, 70); }
          p.add(g);
          const im = hud.add.image(x, y - 10, MONSTERS[u].key); im.setScale(130 / im.height); p.add(im);
          if (!got) im.setTintFill(0x5b4a6e);
          else hud.tweens.add({ targets: im, scaleY: im.scaleY * 1.05, duration: 700 + u * 50, yoyo: true, repeat: -1 });
          p.add(txt(hud, x, y + 72, got ? MONSTERS[u].name : '？？？', 22, got ? '#4a2c17' : '#8a7a9a', { stroke: '', st: 0, shadow: false }));
          p.add(txt(hud, x, y - 84, '第' + u + '单元', 16, '#a0754f', { stroke: '', st: 0, shadow: false }));
        }
        const f = s.fish;
        p.add(txt(hud, 0, 248, '钓到的鱼：普通 ' + f.common + ' · 少见 ' + f.blue + ' · 稀有 ' + f.rare + ' · 传说 ' + f.legend, 20, '#6b4a33', { stroke: '', st: 0, shadow: false }));
      }
    });
  };

  G.openWrong = function () {
    const s = S();
    const list = Object.keys(s.wrong).map(id => ({ w: WORDS.find(x => x.id === id), n: s.wrong[id].n, ok: s.wrong[id].ok })).filter(x => x.w).sort((a, b) => b.n - a.n).slice(0, 12);
    G.hud.modal({
      title: '错题本', titleColor: C.grape, w: 860, h: 560,
      build: (p) => {
        const hud = G.hud;
        if (!list.length) { p.add(txt(hud, 0, -20, '还没有错题，太棒啦！', 32, '#4a2c17', { stroke: '', st: 0, shadow: false })); const pet = new Pet(hud, 0, 180, 130); p.add(pet); pet.cheer(); return; }
        p.add(txt(hud, 0, -228, '错词会优先出现；连续答对 2 次就会从这里消失', 18, '#8a6a4f', { stroke: '', st: 0, shadow: false }));
        list.forEach((x, i) => {
          const col = i % 2, row = Math.floor(i / 2);
          const cx = -200 + col * 400, cy = -170 + row * 66;
          const g = hud.add.graphics(); g.fillStyle(0xf3e6cf); g.fillRoundedRect(cx - 185, cy - 27, 370, 54, 16); p.add(g);
          p.add(txt(hud, cx - 165, cy, x.w.en, 26, '#4a2c17', { ox: 0, stroke: '', st: 0, shadow: false }));
          p.add(txt(hud, cx + 10, cy, Quiz.shortZh(x.w.zh), 20, '#7a5a40', { ox: 0, stroke: '', st: 0, shadow: false }));
          p.add(txt(hud, cx + 150, cy, '×' + x.n, 18, '#ff5a5a', { stroke: '', st: 0, shadow: false }));
          const sp = button(hud, cx + 115, cy, 40, 40, '', { icon: 'speaker', iconOnly: true, color: C.sky, r: 20, onClick: () => { if (!Speech.say(x.w.en)) G.hud.toast('这台设备没有英语语音：' + x.w.en + ' ' + x.w.ipa, C.sky); } });
          p.add(sp);
        });
      }
    });
  };

  G.openParent = function () {
    let pin = '';
    G.hud.modal({
      title: '家长中心', titleColor: C.mint, w: 560, h: 560,
      build: (p, close) => {
        const hud = G.hud;
        p.add(txt(hud, 0, -200, '请输入家长密码', 26, '#4a2c17', { stroke: '', st: 0, shadow: false }));
        const dots = [];
        for (let i = 0; i < 4; i++) { const d = hud.add.circle(-90 + i * 60, -145, 16, 0xe5d6bd).setStrokeStyle(4, UI.C.out); p.add(d); dots.push(d); }
        const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '清', '0', '←'];
        G.test.pin = {};
        keys.forEach((k, i) => {
          const x = -130 + (i % 3) * 130, y = -60 + Math.floor(i / 3) * 82;
          const b = button(hud, x, y, 110, 68, k, { color: k === '清' || k === '←' ? C.gray : C.sky, size: 30, onClick: () => {
            if (k === '清') pin = ''; else if (k === '←') pin = pin.slice(0, -1); else if (pin.length < 4) pin += k;
            dots.forEach((d, j) => { d.fillColor = j < pin.length ? C.mint : 0xe5d6bd; });
            const last = dots[pin.length - 1]; if (last && k !== '清' && k !== '←') hud.tweens.add({ targets: last, scale: 1.3, duration: 90, yoyo: true });
            if (pin.length === 4) {
              if (pin === '0000') { hud.time.delayedCall(200, () => { close(); G.openParentPanel(); }); }
              else { SFX.play('wrong'); hud.tweens.add({ targets: dots, x: '+=10', duration: 50, yoyo: true, repeat: 3 }); pin = ''; hud.time.delayedCall(300, () => dots.forEach(d => d.fillColor = 0xe5d6bd)); }
            }
          } });
          p.add(b); G.test.pin[k] = b;
        });
      }
    });
  };

  G.openParentPanel = function () {
    const s = S();
    const mastered = Object.values(s.words).filter(r => r.m).length;
    G.hud.modal({
      title: '家长中心', titleColor: C.mint, w: 820, h: 540,
      build: (p, close) => {
        const hud = G.hud;
        const acc = s.stats.answered ? Math.round(s.stats.correct / s.stats.answered * 100) : 0;
        const lines = [
          ['今日体力', s.stamina + ' / 30'], ['累计作答', s.stats.answered + ' 题'], ['正确率', acc + '%'],
          ['已掌握单词', mastered + ' / ' + WORDS.length], ['错题本', Object.keys(s.wrong).length + ' 个词'], ['已解锁单元', s.unlocked + ' / 6'],
          ['金币 / 学识星', s.coins + ' / ' + s.stars], ['冷却', Quiz.inCooldown() ? '剩 ' + Quiz.cooldownLeft() + ' 秒' : '无']
        ];
        lines.forEach((l, i) => {
          const x = i % 2 ? 40 : -360, y = -190 + Math.floor(i / 2) * 56;
          p.add(txt(hud, x, y, l[0], 22, '#8a6a4f', { ox: 0, stroke: '', st: 0, shadow: false }));
          p.add(txt(hud, x + 300, y, l[1], 24, '#4a2c17', { ox: 1, stroke: '', st: 0, shadow: false }));
        });
        // 各单元掌握条
        for (let u = 1; u <= 6; u++) {
          const tot = WORDS.filter(w => w.unit === u).length, m = WORDS.filter(w => w.unit === u && s.words[w.id] && s.words[w.id].m).length;
          const x = -330 + (u - 1) * 132, y = 60;
          const g = hud.add.graphics(); g.fillStyle(0xeadbc2); g.fillRoundedRect(x - 50, y - 40, 100, 80, 14);
          g.fillStyle(C.mint); g.fillRoundedRect(x - 50, y + 40 - 80 * m / tot, 100, 80 * m / tot, 14); p.add(g);
          p.add(txt(hud, x, y - 10, 'U' + u, 22, '#4a2c17', { stroke: '#ffffff', st: 4, shadow: false }));
          p.add(txt(hud, x, y + 18, m + '/' + tot, 16, '#4a2c17', { stroke: '#ffffff', st: 3, shadow: false }));
        }
        const acts = [
          ['恢复体力', C.mint, () => { s.stamina = 30; Save.save(); G.hud.syncNow(); G.hud.toast('体力已恢复', C.mint); }],
          ['解除冷却', C.sky, () => { s.cooldownUntil = 0; Quiz.wrongTimes = []; Save.save(); G.hud.toast('冷却已解除', C.sky); }],
          ['解锁全部', C.sun, () => { s.unlocked = 6; Save.save(); G.hud.toast('6 个单元已全部解锁', C.coral); const m = G.game.scene.getScene('Map'); if (m && m.scene.isActive()) m.scene.restart(); }],
          ['重置存档', C.red, () => { Save.reset(); Quiz.resetRound(); G.hud.syncNow(); close(); G.trans.go(G.game.scene.getScenes(true).find(x => x.scene.key !== 'HUD' && x.scene.key !== 'Trans' && x.scene.key !== 'MapUI'), 'Title'); }]
        ];
        acts.forEach((a, i) => p.add(button(hud, -270 + i * 180, 190, 160, 64, a[0], { color: a[1], size: 24, onClick: a[2] })));
      }
    });
  };


  /* ---------------- 起名：网页输入框（iPad 能弹出中文键盘）---------------- */
  G.askName = function (cur, sp, done) {
    const old = document.getElementById('nameBox'); if (old) old.remove();
    const box = document.createElement('div'); box.id = 'nameBox';
    box.style.cssText = 'position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;background:rgba(43,29,58,.45);font-family:' + UI.FONT;
    const ideas = [sp.def, '豆豆', '团子', '闪闪', '布丁', '阿星'].filter((v, i, a) => a.indexOf(v) === i).slice(0, 5);
    box.innerHTML = '<div style="background:#fff8ea;border:5px solid #4a2c17;border-radius:28px;padding:26px 30px;width:min(460px,86vw);text-align:center;box-shadow:0 10px 0 rgba(0,0,0,.2)">' +
      '<div style="font-size:28px;color:#4a2c17;font-weight:bold;margin-bottom:6px">给' + sp.name + '起个名字</div>' +
      '<div style="font-size:16px;color:#a0754f;margin-bottom:14px">最多 6 个字，以后在宠物面板里还能改</div>' +
      '<input id="nameIn" maxlength="6" style="width:100%;box-sizing:border-box;font-size:30px;padding:10px 16px;border:4px solid #4a2c17;border-radius:18px;text-align:center;outline:none;color:#4a2c17;font-family:inherit">' +
      '<div id="nameIdeas" style="margin:14px 0;display:flex;gap:8px;justify-content:center;flex-wrap:wrap"></div>' +
      '<button id="nameOk" style="font-size:26px;font-weight:bold;color:#fff;background:#3ec58a;border:4px solid #4a2c17;border-radius:20px;padding:10px 46px;cursor:pointer;font-family:inherit">就叫它</button></div>';
    document.body.appendChild(box);
    const inp = box.querySelector('#nameIn'); inp.value = cur || sp.def;
    ideas.forEach(n => { const b = document.createElement('button'); b.textContent = n; b.style.cssText = 'font-size:18px;padding:6px 14px;border:3px solid #4a2c17;border-radius:14px;background:#ffe9b8;color:#4a2c17;cursor:pointer;font-family:inherit'; b.onclick = () => { inp.value = n; SFX.play('tap'); }; box.querySelector('#nameIdeas').appendChild(b); });
    const ok = () => { const v = inp.value.replace(/\s+/g, '').slice(0, 6) || sp.def; box.remove(); SFX.play('cheer'); done(v); };
    box.querySelector('#nameOk').onclick = ok;
    inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') ok(); });
    setTimeout(() => { inp.focus(); inp.select(); }, 50);
    G.test.nameBox = { set: v => { inp.value = v; }, ok };
  };

  /* ---------------- 宠物面板：成长路线 + 属性 ---------------- */
  G.openPet = function () {
    const s = S(), ps = PET.stats(s), st = ps.stage;
    G.hud.modal({
      title: '我的宠物', titleColor: C.coral, w: 1000, h: 620,
      build: (p) => {
        const hud = G.hud, dark = { stroke: '', st: 0, shadow: false };
        // 左：宠物形象
        const lg = hud.add.graphics(); lg.fillStyle(0xf3e6cf); lg.fillRoundedRect(-470, -250, 330, 316, 26);
        lg.fillStyle(0xffffff, 0.6); lg.fillCircle(-305, -100, 110); p.add(lg);
        const pet = new Pet(hud, -305, -18, PET.h(180, 190, st), st); p.add(pet);
        hud.time.delayedCall(400, () => { if (pet.scene) pet.cheer(['一起学习吧！', '我会变强的！']); });
        p.add(txt(hud, -305, 14, s.petName, 28, '#4a2c17', dark));
        const rn = UI.button(hud, -305 + Math.max(70, s.petName.length * 15 + 56), 14, 72, 38, '改名', { color: C.sky, size: 18, r: 19, onClick: () => G.askName(s.petName, PET.sp(s), n => { s.petName = n; Save.save(); G.hud.closeModal(true); G.openPet(); }) });
        p.add(rn); G.test.rename = rn;
        p.add(txt(hud, -305, 46, PET.name(st) + ' · ' + PET.sp(s).line + ' · Lv ' + ps.lv, 20, '#a0754f', dark));
        // 右：属性
        p.add(txt(hud, -100, -232, '宠物属性', 26, '#4a2c17', { ox: 0, stroke: '', st: 0, shadow: false }));
        p.add(txt(hud, 450, -232, '学识星越多越强，对战里真的有用', 16, '#a0754f', { ox: 1, stroke: '', st: 0, shadow: false }));
        const rows = [
          ['生命', ps.hp, 260, 0x5ee08a, '对战血量'],
          ['攻击', ps.atk, 30, C.coral, '答对一次的伤害'],
          ['暴击', ps.crit, 50, 0xff9f1a, '4 秒内答对'],
          ['大招', ps.ult, 80, C.grape, '连对攒满能量'],
          ['防御', ps.def, 15, C.sky, '答错只掉 ' + ps.hurt + ' 血']
        ];
        G.test.petStats = ps;
        rows.forEach((r, i) => {
          const y = -178 + i * 54, bx = 0, bw = 280;
          p.add(txt(hud, -100, y, r[0], 22, '#6b4a33', { ox: 0, stroke: '', st: 0, shadow: false }));
          const g = hud.add.graphics(); g.fillStyle(UI.C.out); g.fillRoundedRect(bx - 3, y - 12, bw + 6, 24, 12); g.fillStyle(0xe8d9bf); g.fillRoundedRect(bx, y - 9, bw, 18, 9); p.add(g);
          const bar = hud.add.rectangle(bx, y - 9, 0.01, 18, r[3]).setOrigin(0, 0); p.add(bar);
          hud.tweens.add({ targets: bar, displayWidth: Math.max(8, bw * Math.min(1, r[1] / r[2])), duration: 600, delay: 150 + i * 90, ease: 'Cubic.Out' });
          p.add(txt(hud, bx + bw + 16, y, r[1] + '', 24, '#4a2c17', { ox: 0, stroke: '#ffffff', st: 4, shadow: false }));
          p.add(txt(hud, 450, y, r[4], 15, '#a0754f', { ox: 1, stroke: '', st: 0, shadow: false }));
        });
        p.add(txt(hud, -100, 84, '已掌握单词 ' + ps.mastered + ' / ' + WORDS.length + '　·　收服怪物 ' + ps.captured + ' / 6', 19, '#6b4a33', { ox: 0, stroke: '', st: 0, shadow: false }));
        // 下：成长路线
        const tg = hud.add.graphics(); tg.fillStyle(0xf3e6cf); tg.fillRoundedRect(-470, 136, 940, 164, 24); p.add(tg);
        const xs = [-360, -120, 120, 360];
        const line = hud.add.graphics(); line.lineStyle(8, 0xd9c29c); line.lineBetween(xs[0], 200, xs[3], 200);
        line.lineStyle(8, C.mint); line.lineBetween(xs[0], 200, xs[Math.min(3, st)], 200); p.add(line);
        PET.stages.forEach((d, i) => {
          const got = i <= st, cur = i === st;
          const c = hud.add.graphics(); c.fillStyle(UI.C.out); c.fillCircle(xs[i], 200, cur ? 48 : 42);
          c.fillStyle(cur ? 0xfff1a8 : got ? 0xffffff : 0xe2d8ea); c.fillCircle(xs[i], 200, cur ? 44 : 38); p.add(c);
          const im = hud.add.image(xs[i], 200, d.key); im.setScale((cur ? 78 : 64) / Math.max(im.width, im.height)); p.add(im);
          if (!got) im.setTintFill(0x8f80a3);
          if (cur) hud.tweens.add({ targets: im, scaleX: im.scaleX * 1.08, scaleY: im.scaleY * 1.08, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
          p.add(txt(hud, xs[i], 262, got || i === st + 1 ? d.name : '？？？', 18, got ? '#4a2c17' : '#8a7a9a', dark));
          if (i >= 2) p.add(txt(hud, xs[i], 286, d.need + ' 颗学识星', 14, got ? '#3aa86b' : '#a0754f', dark));
        });
        // 进度条到下一阶段
        const nn = PET.nextNeed(st);
        const msg = st >= 3 ? '已经是最终形态「' + PET.name(3) + '」啦！' : '再拿 ' + Math.max(0, nn - s.stars) + ' 颗学识星，进化成「' + PET.name(st + 1) + '」（' + s.stars + '/' + nn + '）';
        p.add(txt(hud, 0, 116, msg, 19, '#ffffff', { stroke: '#a0754f', st: 5 }));
      }
    });
  };

  /* ================= Boot ================= */
  class Boot extends Phaser.Scene {
    constructor() { super({ key: 'Boot' }); }
    preload() {
      const g = this.add.graphics();
      this.load.on('progress', v => { g.clear(); g.fillStyle(C.out); g.fillRoundedRect(W / 2 - 204, H / 2 - 24, 408, 48, 24); g.fillStyle(0xfff7e6); g.fillRoundedRect(W / 2 - 200, H / 2 - 20, 400, 40, 20); g.fillStyle(C.mint); g.fillRoundedRect(W / 2 - 196, H / 2 - 16, Math.max(32, 392 * v), 32, 16); });
      // 图片以 data URI 内嵌（js/assets.js），file:// 双击也能用 WebGL 渲染
      Object.keys(window.ASSETS || {}).forEach(k => this.load.image(k, ASSETS[k]));
    }
    create() {
      UI.genTextures(this);
      this.scene.launch('HUD'); this.scene.launch('Trans');
      this.time.delayedCall(30, () => { G.hud.setVisibleBar(false); this.scene.start('Title'); });
    }
  }

  /* ================= 标题 ================= */
  class Title extends Phaser.Scene {
    constructor() { super({ key: 'Title' }); }
    create() {
      G.test = {}; G.scene = 'Title'; tapFX(this);
      if (G.hud) G.hud.setVisibleBar(false);
      const bg = this.add.image(W / 2, H / 2, 'bg-island'); bg.setScale(Math.max(W / bg.width, H / bg.height) * 1.08);
      this.tweens.add({ targets: bg, scale: bg.scale * 1.06, duration: 12000, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      this.add.rectangle(W / 2, H / 2, W, H, 0x1d3b5c, 0.28);
      // 漂浮的光点
      this.add.particles(0, 0, 'spark', { x: { min: 0, max: W }, y: { min: 0, max: H }, lifespan: 2400, scale: { start: 0, end: 0.6, ease: 'Sine.InOut' }, alpha: { start: 1, end: 0 }, frequency: 120, tint: [0xffffff, 0xfff1a8], blendMode: 'ADD' });
      const logo = this.add.container(W / 2, 200);
      const pn = panel(this, 0, 0, 640, 170, { color: 0xfff7e6, r: 40 }); logo.add(pn);
      const t1 = txt(this, 0, -18, '知识群岛', 92, '#ff8a5c', { st: 14, stroke: '#4a2c17' }); logo.add(t1);
      logo.add(txt(this, 0, 58, '字母岛 · 三年级上册英语', 28, '#3fa8e0', { st: 6, stroke: '#ffffff', shadow: false }));
      logo.setScale(0); this.tweens.add({ targets: logo, scale: 1, duration: 700, ease: 'Back.Out', delay: 150 });
      this.tweens.add({ targets: logo, y: 210, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.InOut', delay: 900 });
      const s = S();
      if (s.hatched) { const pet = new Pet(this, W / 2, 600, 200); pet.setDepth(5); this.time.delayedCall(800, () => pet.cheer(['欢迎回来！', '一起去冒险吧！'])); }
      else { const egg = this.add.image(W / 2, 590, 'egg').setScale(0.6).setOrigin(0.5, 1); this.tweens.add({ targets: egg, angle: { from: -5, to: 5 }, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.InOut' }); }
      const b = button(this, W / 2, 700, 300, 84, s.hatched ? '继续冒险' : '开始冒险', { color: C.coral, size: 36, onClick: () => { SFX.init(); G.trans.go(this, s.hatched ? 'Map' : 'Hatch'); } });
      b.setScale(0); this.tweens.add({ targets: b, scale: 1, delay: 600, duration: 450, ease: 'Back.Out', onComplete: () => b.pulse(true) });
      G.test.start = b;
      this.add.text(W - 16, H - 12, 'Demo v0.4 · 人教PEP(2024) 三上英语 123 词', { fontFamily: UI.FONT, fontSize: '16px', color: '#ffffff' }).setOrigin(1, 1).setAlpha(0.8);
    }
  }

  /* ================= 孵蛋 ================= */
  class Hatch extends Phaser.Scene {
    constructor() { super({ key: 'Hatch' }); }
    create() {
      G.test = {}; G.scene = 'Hatch'; tapFX(this);
      G.hud.setVisibleBar(false);
      const g = this.add.graphics();
      for (let i = 0; i < 40; i++) { const c = Phaser.Display.Color.Interpolate.ColorWithColor({ r: 255, g: 233, b: 196 }, { r: 255, g: 184, b: 160 }, 40, i); g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b)); g.fillRect(0, i * H / 40, W, H / 40 + 1); }
      const glow = this.add.image(W / 2, 470, 'soft').setScale(8).setTint(0xfff3b0).setAlpha(0.8);
      this.tweens.add({ targets: glow, scale: 9, alpha: 0.5, duration: 1400, yoyo: true, repeat: -1 });
      this.add.particles(0, 0, 'spark', { x: { min: 0, max: W }, y: { min: 0, max: H }, lifespan: 2200, scale: { start: 0, end: 0.5 }, alpha: { start: 0.9, end: 0 }, frequency: 160, tint: [0xffffff, 0xffd68a] });
      // 窝
      const nest = this.add.graphics({ x: W / 2, y: 610 });
      nest.fillStyle(UI.C.out); nest.fillEllipse(0, 0, 330, 110); nest.fillStyle(0xb5793f); nest.fillEllipse(0, -4, 316, 96); nest.fillStyle(0x8c5a2b); nest.fillEllipse(0, -18, 250, 50);
      nest.lineStyle(4, 0xd9a066); for (let i = 0; i < 9; i++) { nest.beginPath(); nest.arc(-120 + i * 30, 6, 26, 3.6, 5.8); nest.strokePath(); }
      this.eggC = this.add.container(W / 2, 600);
      const egg = this.add.image(0, 0, 'egg').setOrigin(0.5, 1).setScale(0.95); this.eggC.add(egg); this.egg = egg;
      this.cracks = this.add.graphics(); this.eggC.add(this.cracks);
      this.eggIdle = this.tweens.add({ targets: this.eggC, angle: { from: -3, to: 3 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      const tip = this.tip = bubble(this, W / 2, 150, 560, 96, { tail: 'down' });
      tip.add(txt(this, 0, -12, '轻点蛋蛋，帮它破壳！', 34, '#4a2c17', { stroke: '', st: 0, shadow: false }));
      this.pips = []; for (let i = 0; i < 5; i++) { const d = this.add.circle(-80 + i * 40, 26, 10, 0xe9d8c0).setStrokeStyle(3, UI.C.out); tip.add(d); this.pips.push(d); }
      this.taps = 0;
      const zone = this.add.zone(W / 2, 470, 260, 300).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => this.tapEgg());
      G.test.egg = { center: () => ({ x: W / 2, y: 470 }) };
      const CR = [[[-10, -150], [5, -130], [-8, -112], [10, -95]], [[-60, -110], [-40, -100], [-50, -84], [-28, -76]], [[50, -120], [36, -100], [54, -86], [40, -70]], [[-70, -60], [-30, -64], [0, -50], [40, -62], [74, -56]]];
      this.CR = CR;
    }
    tapEgg() {
      if (this.taps >= 5) return;
      this.taps++; SFX.init(); SFX.play('crack', this.taps);
      this.pips[this.taps - 1].fillColor = C.coral; this.tweens.add({ targets: this.pips[this.taps - 1], scale: 1.5, duration: 120, yoyo: true });
      this.tweens.add({ targets: this.egg, scaleX: 1.08, scaleY: 0.86, duration: 80, yoyo: true, ease: 'Quad.Out' });
      this.tweens.add({ targets: this.eggC, x: W / 2 + 14, duration: 40, yoyo: true, repeat: 3 });
      this.cameras.main.shake(140, 0.004 * this.taps);
      FX.burst(this, W / 2 + Phaser.Math.Between(-60, 60), 440, { tex: 'spark', count: 8 + this.taps * 3, speed: 320, life: 600, scale: 0.7, tint: [0xffffff, 0xffe08a, 0x9fd8ff], add: true });
      FX.float(this, W / 2 + 140, 380, ['咔！', '咔嚓！', '动了！', '快出来了！', ''][this.taps - 1], { size: 34, color: '#ff8a5c' });
      if (this.taps <= 4) {
        const pts = this.CR[this.taps - 1]; const s = this.egg.scale;
        this.cracks.lineStyle(6, UI.C.out); this.cracks.beginPath(); this.cracks.moveTo(pts[0][0] * s, pts[0][1] * s); pts.slice(1).forEach(p => this.cracks.lineTo(p[0] * s, p[1] * s)); this.cracks.strokePath();
      }
      if (this.taps === 5) this.time.delayedCall(250, () => this.hatch());
    }
    hatch() {
      this.eggIdle.stop();
      this.tweens.add({ targets: this.eggC, angle: { from: -12, to: 12 }, duration: 60, yoyo: true, repeat: 6, onComplete: () => {
        this.cameras.main.flash(400, 255, 255, 255); SFX.play('boom'); this.cameras.main.shake(300, 0.01);
        this.eggC.setVisible(false); this.tweens.add({ targets: this.tip, scale: 0, duration: 200, ease: 'Back.In' });
        FX.burst(this, W / 2, 470, { tex: 'shell', count: 14, speed: 600, life: 1100, scale: 1.2, gravity: 900, rotate: true, depth: 50 });
        FX.burst(this, W / 2, 470, { tex: 'spark', count: 30, speed: 520, life: 900, scale: 1, tint: [0xffffff, 0xffd84d, 0x9fd8ff], add: true });
        FX.rays(this, W / 2, 470, 0xfff1a8, { depth: 1, r: 420 });
        const s = S(); s.species = PET.randomSpecies(); s.petName = PET.sp(s).def; s.hatched = true; s.petStage = 1; s.pos = null; Save.save();
        const pet = new Pet(this, W / 2, 610, 260, 1); pet.setDepth(10); pet.setScale(0);
        this.tweens.add({ targets: pet, scale: 1, duration: 600, ease: 'Back.Out', onComplete: () => pet.cheer(['你好呀！', 'Hello!']) });
        SFX.play('fanfare'); FX.confetti(this);
        const sp = PET.sp(s);
        const ban = FX.banner(this, '是' + sp.name + '宝宝！快给它起个名字吧', { y: 140, hold: 99999, color: C.coral });
        this.time.delayedCall(1300, () => G.askName(s.petName, sp, name => {
          s.petName = name; Save.save(); pet.cheer(['我叫' + name + '！', '谢谢你！']);
          if (ban && ban.destroy) ban.destroy();
          FX.banner(this, sp.name + '宝宝「' + name + '」出生啦！', { y: 140, hold: 99999, color: C.coral });
          const b = button(this, W / 2, 725, 320, 80, '带它去冒险', { color: C.mint, size: 34, onClick: () => G.trans.go(this, 'Map') });
          b.setScale(0); this.tweens.add({ targets: b, scale: 1, duration: 400, ease: 'Back.Out', onComplete: () => b.pulse(true) });
          G.test.go = b;
        }));
      } });
    }
  }

  /* ================= 地图 ================= */
  class MapScene extends Phaser.Scene {
    constructor() { super({ key: 'Map' }); }
    walkable(x, y) {
      const m = WALKMASK, gx = Math.floor(x / SC / m.cell), gy = Math.floor(y / SC / m.cell);
      const row = m.rows[gy]; if (!row || row[gx] !== '1') return false;
      const s = S();
      for (let u = s.unlocked + 1; u <= 6; u++) { const z = ZONES[u]; if (Phaser.Math.Distance.Between(x, y, z.x * SC, z.y * SC) < z.r * SC * 0.78) return false; }
      return true;
    }
    create() {
      G.test = {}; G.scene = 'Map'; tapFX(this);
      G.hud.setVisibleBar(true); G.hud.syncNow();
      Quiz.resetRound();
      const s = S();
      const bg = this.add.image(0, 0, 'bg-island').setOrigin(0).setScale(SC);
      const WW = bg.displayWidth, WH = bg.displayHeight; this.WW = WW; this.WH = WH;
      this.cameras.main.setBounds(0, 0, WW, WH);
      // 海面闪光
      this.time.addEvent({ delay: 180, loop: true, callback: () => {
        const x = Math.random() * WW, y = Math.random() * WH; if (this.walkable(x, y)) return;
        const sp = this.add.image(x, y, 'spark').setScale(0).setAlpha(0.9).setBlendMode('ADD').setDepth(1);
        this.tweens.add({ targets: sp, scale: 0.5, duration: 500, yoyo: true, onComplete: () => sp.destroy() });
      } });
      // 云影
      for (let i = 0; i < 3; i++) { const c = this.add.image(Math.random() * WW, 200 + i * 350, 'soft').setScale(9, 5).setTint(0x1a3550).setAlpha(0.12).setDepth(3000); this.tweens.add({ targets: c, x: c.x + 700, duration: 30000 + i * 6000, yoyo: true, repeat: -1 }); }
      // 区域：草丛 / 迷雾 / 牌子
      this.patches = []; this.fogs = {};
      for (let u = 1; u <= 6; u++) {
        const z = ZONES[u], zx = z.x * SC, zy = z.y * SC;
        if (u <= s.unlocked) this.makePatch(u); else this.makeFog(u);
        this.makeSign(u, zx, zy - z.r * SC * 0.72, u <= s.unlocked);
      }
      // 宠物
      const p0 = s.pos && this.walkable(s.pos.x, s.pos.y) ? s.pos : START;
      this.pet = new Pet(this, p0.x, p0.y, PET.h(112, 125)); this.pet.setDepth(p0.y + 1); this.pet.sayTop = true;
      this.cameras.main.startFollow(this.pet, true, 0.1, 0.1);
      this.cameras.main.setZoom(1);
      this.keys = this.input.keyboard.addKeys('UP,DOWN,LEFT,RIGHT,W,A,S,D');
      this.target = null; this.grassT = 0; this.stepT = 0; this.locked = false; this.graceUntil = this.time.now + 1500;
      this.marker = this.add.image(0, 0, 'ring').setTint(C.sun).setScale(0.35, 0.14).setVisible(false).setDepth(2);
      this.input.on('pointerdown', p => {
        if (performance.now() - G.lastUiTap < 60 || this.locked) return;
        if (Phaser.Math.Distance.Between(p.worldX, p.worldY - 50, this.pet.x, this.pet.y) < 60) { this.pet.cheer(['嘿嘿～', '摸摸头！']); this.time.delayedCall(500, () => G.openPet()); return; }
        this.target = { x: p.worldX, y: p.worldY };
        this.marker.setPosition(p.worldX, p.worldY).setVisible(true).setAlpha(1);
        this.tweens.add({ targets: this.marker, scaleX: { from: 0.6, to: 0.35 }, scaleY: { from: 0.24, to: 0.14 }, duration: 300, ease: 'Back.Out' });
      });
      this.dust = this.add.particles(0, 0, 'dot', { lifespan: 420, speed: { min: 10, max: 40 }, angle: { min: 200, max: 340 }, scale: { start: 0.7, end: 0 }, alpha: { start: 0.6, end: 0 }, tint: 0xe7cfa1, emitting: false }).setDepth(5);
      this.scene.launch('MapUI'); this.scene.bringToTop('MapUI'); this.scene.bringToTop('HUD'); this.scene.bringToTop('Trans');
      this.updateZone(true);
      G.test.map = this;
      this.cameras.main.fadeIn(250);
      // 进化 / 新区域解锁
      this.time.delayedCall(700, () => {
        if (s.justUnlocked) { const u = s.justUnlocked; s.justUnlocked = 0; Save.save(); this.revealZone(u); }
        else if (PET.evolveTo(s)) this.evolve(PET.evolveTo(s));
        else if (!s.tipsSeen.map) { s.tipsSeen.map = 1; Save.save(); this.pet.say('走进草丛会遇到单词怪哦！', 2600); }
      });
    }
    makePatch(u) {
      const z = ZONES[u], cx = z.patch[0] * SC, cy = z.patch[1] * SC;
      const tufts = [];
      const gnd = this.add.graphics().setDepth(cy - 60);
      gnd.fillStyle(0x2f6b2a, 0.35); gnd.fillEllipse(cx, cy + 6, 230, 128); gnd.fillStyle(0x58b947, 0.55); gnd.fillEllipse(cx, cy, 214, 114);
      for (let i = 0; i < 22; i++) {
        const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random());
        const x = cx + Math.cos(a) * r * 92, y = cy + Math.sin(a) * r * 50;
        const t = this.add.image(x, y, 'grass').setOrigin(0.5, 1).setScale(0.6 + Math.random() * 0.3).setDepth(y);
        t.setFlipX(Math.random() < 0.5);
        this.tweens.add({ targets: t, angle: { from: -4, to: 4 }, duration: 900 + Math.random() * 600, yoyo: true, repeat: -1, ease: 'Sine.InOut', delay: Math.random() * 800 });
        tufts.push(t);
      }
      this.patches.push({ u, x: cx, y: cy, rx: 95, ry: 60, tufts });
    }
    makeFog(u) {
      const z = ZONES[u], zx = z.x * SC, zy = z.y * SC, R = z.r * SC;
      const puffs = [];
      for (let i = 0; i < 11; i++) {
        const a = i / 11 * Math.PI * 2, rr = i === 0 ? 0 : R * 0.55;
        const f = this.add.image(zx + Math.cos(a) * rr, zy + Math.sin(a) * rr * 0.75, 'fogpuff').setTint(0xcdc3e2).setAlpha(0.97).setScale(R / 62 * (0.75 + Math.random() * 0.3)).setDepth(2500);
        this.tweens.add({ targets: f, x: f.x + Phaser.Math.Between(-24, 24), y: f.y + Phaser.Math.Between(-14, 14), scale: f.scale * 1.06, duration: 2600 + Math.random() * 1500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
        puffs.push(f);
      }
      const lock = this.add.image(zx, zy - 10, 'lock').setDepth(2600).setScale(1.1);
      this.tweens.add({ targets: lock, y: zy - 22, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      const lbl = txt(this, zx, zy + 52, '迷雾 · 收服第' + (u - 1) + '单元怪物解锁', 22, '#ffffff', { st: 6 }).setDepth(2600);
      this.fogs[u] = { puffs, lock, lbl };
    }
    makeSign(u, x, y, open) {
      const c = this.add.container(x, y).setDepth(2700);
      const label = u + ' ' + UNITS[u - 1].zh;
      const w = label.length * 22 + 40;
      const g = this.add.graphics();
      g.fillStyle(UI.C.out); g.fillRect(-5, 0, 10, 46);
      g.fillStyle(UI.C.out); g.fillRoundedRect(-w / 2 - 4, -24, w + 8, 46, 14);
      g.fillStyle(open ? 0xf6c879 : 0xb8b0c8); g.fillRoundedRect(-w / 2, -20, w, 38, 11);
      g.fillStyle(0xffffff, 0.35); g.fillRoundedRect(-w / 2 + 8, -17, w - 16, 9, 4);
      c.add(g); c.add(txt(this, 0, -1, label, 20, '#4a2c17', { stroke: '#fff3d6', st: 3, shadow: false }));
      c.sign = true; if (!open) c.setAlpha(0.9);
      this.signs = this.signs || {}; this.signs[u] = c;
      this.tweens.add({ targets: c, angle: { from: -2, to: 2 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }
    updateZone(silent) {
      const s = S(); let cur = 0;
      for (let u = 1; u <= s.unlocked; u++) { const z = ZONES[u]; if (Phaser.Math.Distance.Between(this.pet.x, this.pet.y, z.x * SC, z.y * SC) < z.r * SC * 1.05) cur = u; }
      if (cur && cur !== s.curUnit) { s.curUnit = cur; Save.save(); if (!silent) { SFX.play('pop'); const ui = this.scene.get('MapUI'); if (ui && ui.setUnit) ui.setUnit(cur, true); } }
      else if (silent) { const ui = this.scene.get('MapUI'); if (ui && ui.setUnit) ui.setUnit(s.curUnit, false); }
    }
    update(time, delta) {
      if (!this.pet || this.locked) return;
      const k = this.keys; let vx = 0, vy = 0;
      if (k.LEFT.isDown || k.A.isDown) vx -= 1; if (k.RIGHT.isDown || k.D.isDown) vx += 1;
      if (k.UP.isDown || k.W.isDown) vy -= 1; if (k.DOWN.isDown || k.S.isDown) vy += 1;
      if (vx || vy) this.target = null;
      else if (this.target) {
        const dx = this.target.x - this.pet.x, dy = this.target.y - this.pet.y, d = Math.hypot(dx, dy);
        if (d < 8) { this.target = null; this.marker.setVisible(false); } else { vx = dx / d; vy = dy / d; }
      }
      const moving = !!(vx || vy);
      if (moving) {
        const len = Math.hypot(vx, vy); vx /= len; vy /= len;
        const sp = 300 * delta / 1000;
        let nx = this.pet.x + vx * sp, ny = this.pet.y + vy * sp;
        if (this.walkable(nx, ny)) { this.pet.x = nx; this.pet.y = ny; }
        else if (this.walkable(nx, this.pet.y)) this.pet.x = nx;
        else if (this.walkable(this.pet.x, ny)) this.pet.y = ny;
        else { this.target = null; this.marker.setVisible(false); }
        if (Math.abs(vx) > 0.2) this.pet.faceDir(vx);
        this.pet.setDepth(this.pet.y + 1);
        this.stepT += delta;
        if (this.stepT > 200) { this.stepT = 0; this.dust.explode(3, this.pet.x, this.pet.y); SFX.play('step'); }
        this.updateZone(false);
        this.checkGrass(delta);
      }
      this.pet.walkBob(moving);
      S().pos = { x: Math.round(this.pet.x), y: Math.round(this.pet.y) };
    }
    checkGrass(delta) {
      const p = this.patches.find(p => { const dx = (this.pet.x - p.x) / p.rx, dy = (this.pet.y - p.y) / p.ry; return dx * dx + dy * dy < 1; });
      if (!p) { this.grassT = 0; return; }
      this.grassT += delta;
      // 草丛沙沙
      if (Math.floor(this.grassT / 160) !== Math.floor((this.grassT - delta) / 160)) {
        SFX.play('rustle');
        p.tufts.forEach(t => { if (Math.abs(t.x - this.pet.x) < 50 && Math.abs(t.y - this.pet.y) < 40) this.tweens.add({ targets: t, scaleY: { from: 0.7, to: t.scaleX }, duration: 260, ease: 'Back.Out' }); });
        FX.burst(this, this.pet.x, this.pet.y - 10, { tex: 'leafp', count: 3, speed: 120, life: 500, scale: 0.8, gravity: 200, rotate: true, depth: this.pet.y + 2 });
      }
      if (this.time.now < this.graceUntil) return;
      if (this.grassT > 500 && Math.floor(this.grassT / 300) !== Math.floor((this.grassT - delta) / 300) && Math.random() < (G.forceEncounter ? 1 : 0.16)) this.encounter(p.u);
    }
    encounter(u) {
      if (Quiz.inCooldown()) { this.graceUntil = this.time.now + 4000; G.openCooldown(); return; }
      if (S().stamina < 3) { this.graceUntil = this.time.now + 4000; G.hud.toast('体力用完啦，明天再来吧（家长可恢复）', C.red); return; }
      this.locked = true; this.pet.walkBob(false); this.target = null; this.marker.setVisible(false);
      const ex = this.add.image(this.pet.x + 40, this.pet.y - this.pet.h - 20, 'excl').setDepth(5000).setScale(0);
      this.tweens.add({ targets: ex, scale: 1, duration: 260, ease: 'Back.Out' });
      SFX.play('alert');
      this.time.delayedCall(450, () => { G.canPlay(this, 3); G.trans.go(this, 'Battle', { unit: u }, 'encounter'); });
    }
    revealZone(u) {
      this.locked = true; const z = ZONES[u], zx = z.x * SC, zy = z.y * SC, f = this.fogs[u];
      this.cameras.main.stopFollow();
      this.cameras.main.pan(zx, zy, 900, 'Sine.easeInOut');
      this.time.delayedCall(1000, () => {
        SFX.play('whoosh'); SFX.play('fanfare');
        if (f) {
          f.puffs.forEach(p => { const a = Math.atan2(p.y - zy, p.x - zx) || Math.random() * 6; this.tweens.killTweensOf(p); this.tweens.add({ targets: p, x: p.x + Math.cos(a) * 400, y: p.y + Math.sin(a) * 300, alpha: 0, scale: p.scale * 1.8, duration: 1100, ease: 'Cubic.Out', onComplete: () => p.destroy() }); });
          this.tweens.killTweensOf(f.lock); this.tweens.add({ targets: f.lock, scale: 1.8, alpha: 0, angle: 40, duration: 500, ease: 'Back.In', onComplete: () => f.lock.destroy() }); f.lbl.destroy();
          FX.burst(this, zx, zy, { tex: 'spark', count: 40, speed: 500, life: 1000, scale: 1, tint: [0xffffff, C.sun, C.mint], add: true, depth: 3000 });
        }
        this.makePatch(u);
        if (this.signs[u]) { this.signs[u].destroy(); this.makeSign(u, zx, zy - z.r * SC * 0.72, true); }
        FX.banner(this, '新区域解锁：' + UNITS[u - 1].zh, { scroll: 0, y: 240, hold: 1800, color: C.mint });
        FX.confetti(this, { scroll: 0 });
        this.time.delayedCall(2200, () => { this.cameras.main.pan(this.pet.x, this.pet.y, 700, 'Sine.easeInOut', false, (c, prog) => { if (prog === 1) { this.cameras.main.startFollow(this.pet, true, 0.1, 0.1); this.locked = false; } }); });
      });
    }
    evolve(to) {
      this.locked = true; const hud = G.hud; const s = S();
      const from = s.petStage, fk = PET.stages[from].key, tk = PET.stages[to].key;
      const dim = hud.add.rectangle(W / 2, H / 2, W, H, 0x1b1030, 0).setDepth(300); hud.tweens.add({ targets: dim, fillAlpha: 0.8, duration: 400 });
      const rays = FX.rays(hud, W / 2, 430, 0xc9b8ff, { depth: 301, r: 500 });
      const a = hud.add.image(W / 2, 560, fk).setOrigin(0.5, 1).setDepth(302); a.setScale((from >= 2 ? 280 : 260) / a.height);
      const b = hud.add.image(W / 2, 560, tk).setOrigin(0.5, 1).setDepth(302).setVisible(false); b.setScale((to >= 2 ? 300 : 260) / b.height);
      FX.banner(hud, '咦？' + s.petName + '的样子在变化…', { y: 120, hold: 2400, color: C.grape, depth: 310 });
      let n = 0, delay = 380;
      const flip = () => {
        n++; const showB = n % 2 === 1; a.setVisible(!showB); b.setVisible(showB); (showB ? b : a).setTintFill(0xffffff); SFX.play('wobble');
        if (n < 12) { delay = Math.max(60, delay * 0.8); hud.time.delayedCall(delay, flip); }
        else {
          a.destroy(); b.clearTint(); b.setVisible(true); hud.cameras.main.flash(500, 255, 255, 255); SFX.play('fanfare');
          FX.confetti(hud, { depth: 320 }); FX.burst(hud, W / 2, 420, { tex: 'star', count: 24, speed: 500, life: 1200, scale: 0.8, depth: 320 });
          s.petStage = to; Save.save(); this.pet.h = PET.h(112, 125, to); this.pet.setStage(to);
          FX.banner(hud, s.petName + '进化成了「' + PET.name(to) + '」！', { y: 120, hold: 2200, color: C.coral, depth: 310 });
          hud.tweens.add({ targets: b, y: 540, duration: 600, yoyo: true, repeat: 1, ease: 'Sine.InOut' });
          hud.syncNow();
          hud.time.delayedCall(2800, () => { [dim, rays, b].forEach(o => hud.tweens.add({ targets: o, alpha: 0, duration: 400, onComplete: () => o.destroy() })); this.locked = false; hud.time.delayedCall(450, () => G.openPet()); });
        }
      };
      hud.time.delayedCall(900, flip);
    }
  }

  /* ================= 地图 UI（不随镜头滚动）================= */
  class MapUI extends Phaser.Scene {
    constructor() { super({ key: 'MapUI' }); }
    create() {
      const bar = this.add.container(W / 2, H - 62);
      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.18); g.fillRoundedRect(-450, -48 + 8, 900, 100, 34);
      g.fillStyle(C.out); g.fillRoundedRect(-455, -53, 910, 106, 38);
      g.fillStyle(0xfff3dc); g.fillRoundedRect(-450, -48, 900, 96, 34);
      g.fillStyle(0xffffff, 0.6); g.fillRoundedRect(-430, -42, 860, 14, 7);
      bar.add(g);
      const defs = [
        ['pet', '宠物', PET.key(1), C.coral, () => G.openPet()],
        ['shoot', '守城', 'ic_shoot', 0xff9f5a, () => this.play('Shoot')],
        ['fish', '钓鱼', 'ic_fish', C.sky, () => this.play('Fish')],
        ['dex', '图鉴', 'ic_dex', C.sun, () => G.openDex()],
        ['wrong', '错题本', 'ic_book', C.grape, () => G.openWrong()],
        ['parent', '家长', 'ic_parent', C.mint, () => G.openParent()]
      ];
      G.test.ui = {};
      defs.forEach((d, i) => {
        const b = button(this, -370 + i * 148, -2, 138, 72, d[1], { icon: d[2], color: d[3], size: 24, onClick: d[4] });
        bar.add(b); G.test.ui[d[0]] = b;
        b.setScale(0); this.tweens.add({ targets: b, scale: 1, delay: 100 + i * 70, duration: 380, ease: 'Back.Out' });
      });
      bar.y = H + 80; this.tweens.add({ targets: bar, y: H - 62, duration: 450, ease: 'Back.Out' });
      // 当前区域牌
      this.chip = this.add.container(W - 210, 46);
      const cg = this.add.graphics(); cg.fillStyle(C.out); cg.fillRoundedRect(-184, -28, 368, 56, 28); cg.fillStyle(0x5a6bd8); cg.fillRoundedRect(-180, -24, 360, 48, 24); cg.fillStyle(0xffffff, 0.25); cg.fillRoundedRect(-166, -20, 332, 12, 6);
      this.chip.add(cg); this.chipT = txt(this, 0, 0, '', 22); this.chip.add(this.chipT);
      this.setUnit(S().curUnit, false);
      this.add.text(W - 24, 86, '方向键/WASD 或 点地面走动 · 每局 -3 体力', { fontFamily: UI.FONT, fontSize: '15px', color: '#ffffff', stroke: '#2b4a6b', strokeThickness: 4 }).setOrigin(1, 0);
    }
    setUnit(u, anim) {
      if (!this.chipT) return;
      this.chipT.setText('第' + u + '单元 · ' + UNITS[u - 1].zh + '  ' + UNITS[u - 1].title);
      if (anim) { this.chip.setScale(1.25); this.tweens.add({ targets: this.chip, scale: 1, duration: 400, ease: 'Back.Out' }); }
    }
    play(key) {
      const map = this.scene.get('Map'); if (map.locked) return;
      if (!G.canPlay(this, 3)) return;
      map.locked = true;
      G.trans.go(map, key, { unit: S().curUnit });
    }
  }

  window.Scenes = { Boot, Title, Hatch, MapScene, MapUI };
})();
