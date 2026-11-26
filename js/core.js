/* 知识群岛 v0.2 —— 核心：存档 / 音效 / 发音 / 出题 */
(function () {
  'use strict';
  const SAVE_KEY = 'zsqd_v2_save';
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };

  const DEFAULT = () => ({
    v: 3, hatched: false, petStage: 0, petName: '小白', species: 'fox', petBase: 0, pets: [], active: 0, eggs: 0, eggFrom: {},
    stamina: 30, staminaDate: today(), coins: 0, stars: 0,
    words: {}, wrong: {}, unlocked: 1, dex: {}, fish: { common: 0, blue: 0, rare: 0, legend: 0 },
    curUnit: 1, pos: null, cooldownUntil: 0, stats: { answered: 0, correct: 0, rounds: 0 }, tipsSeen: {}
  });

  const Save = {
    data: null,
    load() {
      let d = null;
      try { d = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (e) { d = null; }
      // v2 存档里 petStage 2 = 风语翼狐；v3 起 2 = 成年白狐、3 = 风语翼狐
      if (d && (d.v || 2) < 3) { if (d.petStage === 2) d.petStage = 3; d.v = 3; }
      this.data = Object.assign(DEFAULT(), d || {});
      const x = this.data; // 多宠物：老存档把当前宠物放进 pets[0]
      if (x.hatched && !(x.pets && x.pets.length)) { x.pets = [{ species: x.species || 'fox', petName: x.petName, petStage: x.petStage, petBase: x.petBase || 0 }]; x.active = 0; }
      if (this.data.staminaDate !== today()) { this.data.stamina = 30; this.data.staminaDate = today(); }
      return this.data;
    },
    save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); } catch (e) { } },
    reset() { this.data = DEFAULT(); this.save(); }
  };
  Save.load();
  window.Save = Save;
  window.S = () => Save.data;

  /* ---------------- WebAudio 合成音效 ---------------- */
  const SFX = {
    ctx: null, master: null, muted: false,
    init() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.gain.value = 0.45; this.master.connect(this.ctx.destination);
    },
    tone(f, dur, type, vol, slide, delay) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime + (delay || 0);
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, slide), t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.3, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.05);
    },
    noise(dur, vol, freq, delay, q) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime + (delay || 0);
      const len = Math.floor(this.ctx.sampleRate * dur), buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const s = this.ctx.createBufferSource(); s.buffer = buf;
      const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq || 1200; f.Q.value = q || 0.8;
      const g = this.ctx.createGain(); g.gain.value = vol || 0.3;
      s.connect(f); f.connect(g); g.connect(this.master); s.start(t);
    },
    play(name, p) {
      const T = this.tone.bind(this), N = this.noise.bind(this);
      switch (name) {
        case 'tap': T(900, 0.05, 'sine', 0.12, 1300); break;
        case 'click': T(520, 0.07, 'square', 0.08, 780); T(1040, 0.06, 'sine', 0.1, null, 0.03); break;
        case 'pop': T(400, 0.12, 'sine', 0.25, 1100); break;
        case 'correct': T(660, 0.12, 'triangle', 0.28); T(880, 0.12, 'triangle', 0.28, null, 0.08); T(1320, 0.22, 'triangle', 0.25, null, 0.16); break;
        case 'wrong': T(300, 0.18, 'sawtooth', 0.14, 180); T(220, 0.25, 'sawtooth', 0.12, 140, 0.12); break;
        case 'hit': N(0.18, 0.5, 900); T(180, 0.15, 'sine', 0.4, 60); break;
        case 'crit': N(0.25, 0.6, 1800); T(1200, 0.1, 'square', 0.15, 2400); T(140, 0.3, 'sine', 0.5, 40, 0.02); break;
        case 'ult': for (let i = 0; i < 6; i++) T(300 + i * 140, 0.18, 'sawtooth', 0.1, null, i * 0.05); N(0.6, 0.5, 600, 0.3); T(90, 0.6, 'sine', 0.6, 35, 0.3); break;
        case 'coin': T(1320, 0.07, 'square', 0.07); T(1760, 0.14, 'square', 0.07, null, 0.06); break;
        case 'star': T(1046, 0.1, 'triangle', 0.2); T(1568, 0.25, 'triangle', 0.2, null, 0.08); break;
        case 'whoosh': N(0.3, 0.25, 700, 0, 0.5); break;
        case 'shoot': T(1400, 0.1, 'square', 0.08, 500); break;
        case 'boom': N(0.4, 0.6, 400); T(120, 0.35, 'sine', 0.5, 40); break;
        case 'splash': N(0.45, 0.4, 2200, 0, 0.6); N(0.3, 0.2, 700, 0.05); break;
        case 'bite': T(500, 0.08, 'sine', 0.3, 300); T(500, 0.08, 'sine', 0.3, 300, 0.14); T(600, 0.1, 'sine', 0.3, 300, 0.28); break;
        case 'reel': for (let i = 0; i < 8; i++) T(1500, 0.03, 'square', 0.04, null, i * 0.05); break;
        case 'snap': T(1800, 0.05, 'square', 0.15, 300); N(0.2, 0.3, 3000); break;
        case 'wobble': T(700, 0.08, 'triangle', 0.18, 500); break;
        case 'capture': T(523, 0.12, 'triangle', 0.25); T(659, 0.12, 'triangle', 0.25, null, 0.1); T(784, 0.12, 'triangle', 0.25, null, 0.2); T(1046, 0.4, 'triangle', 0.3, null, 0.3); break;
        case 'fanfare': [523, 659, 784, 1046, 784, 1046].forEach((f, i) => T(f, i === 5 ? 0.5 : 0.14, 'square', 0.1, null, i * 0.12)); break;
        case 'crack': T(1600 + (p || 0) * 200, 0.05, 'square', 0.12, 800); N(0.08, 0.3, 3000); break;
        case 'step': N(0.05, 0.06, 500); break;
        case 'rustle': N(0.18, 0.12, 3500, 0, 0.4); break;
        case 'alert': T(880, 0.08, 'square', 0.12); T(1320, 0.12, 'square', 0.12, null, 0.09); break;
        case 'hurt': T(500, 0.2, 'triangle', 0.25, 200); N(0.15, 0.3, 600); break;
        case 'type': T(1100 + Math.random() * 300, 0.04, 'square', 0.06); break;
        case 'cheer': T(784, 0.08, 'sine', 0.2, 1046); T(1046, 0.12, 'sine', 0.2, 1400, 0.08); break;
      }
    }
  };
  window.SFX = SFX;

  /* ---------------- 发音 ----------------
   * 优先播放人教社官网「Words in each unit」官方单词朗读（js/audio.js，data URI，WebAudio 解码）；
   * 官方音频里没有的词才回落到浏览器 speechSynthesis。iOS Safari 需首次触摸解锁 AudioContext。 */
  const Speech = {
    voice: null, ready: false, bufs: {}, decoding: {}, tok: 0, src: null, unlocked: false,
    stats: { official: 0, tts: 0, last: '', lastSrc: '' },
    init() {
      if (!('speechSynthesis' in window)) return;
      const pick = () => {
        const vs = speechSynthesis.getVoices() || [];
        this.voice = vs.find(v => /en[-_]US/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || null;
        this.ready = !!this.voice;
      };
      pick(); try { speechSynthesis.addEventListener('voiceschanged', pick); } catch (e) { }
    },
    key(t) { return String((t && t.en) || t || '').trim().toLowerCase(); },
    has(t) { return !!(window.WORD_AUDIO && WORD_AUDIO[this.key(t)]); },
    // ok(词)：这个词能不能读出来（官方音频 或 本机英语语音）。不传词时只看本机语音。
    ok(t) { return (t !== undefined && this.has(t)) || this.ready; },
    // 在用户手势里调用：创建/恢复 AudioContext，并播一个静音 buffer 解锁 iOS
    unlock() {
      SFX.init(); const ctx = SFX.ctx; if (!ctx) return;
      if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) { } }
      if (this.unlocked) return;
      try { const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0); this.unlocked = true; } catch (e) { }
    },
    decode(k) {
      if (this.bufs[k]) return Promise.resolve(this.bufs[k]);
      if (this.decoding[k]) return this.decoding[k];
      const ctx = SFX.ctx, uri = WORD_AUDIO[k], b64 = uri.slice(uri.indexOf(',') + 1);
      const bin = atob(b64), u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      const p = new Promise((res, rej) => {
        const r = ctx.decodeAudioData(u8.buffer, res, rej); // 老版 Safari 只支持回调写法
        if (r && r.then) r.then(res, rej);
      }).then(buf => (this.bufs[k] = buf));
      p.catch(() => { delete this.decoding[k]; });
      return (this.decoding[k] = p);
    },
    stop() {
      this.tok++;
      if (this.src) { try { this.src.stop(); } catch (e) { } this.src = null; }
      try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (e) { }
    },
    official(k) {
      SFX.init(); const ctx = SFX.ctx; if (!ctx) return false;
      this.stop(); const tok = this.tok, t0 = Date.now();
      const go = buf => {
        if (tok !== this.tok || Date.now() - t0 > 2500) return; // 已被新的朗读取代 / 等解锁太久就不补放了
        const s = ctx.createBufferSource(); s.buffer = buf; s.connect(ctx.destination); s.start(0); this.src = s;
        this.stats.official++; this.stats.last = k; this.stats.lastSrc = 'official';
      };
      this.decode(k).then(buf => {
        if (ctx.state === 'running') go(buf);
        else ctx.resume().then(() => go(buf), () => { });
      }).catch(e => { console.warn('官方音频解码失败，改用系统语音：' + k, e); this.tts(k); });
      return true;
    },
    tts(text) {
      if (!this.ready) return false;
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.voice = this.voice; u.rate = 0.85; u.pitch = 1.05;
        speechSynthesis.speak(u); this.stats.tts++; this.stats.last = String(text); this.stats.lastSrc = 'tts'; return true;
      } catch (e) { return false; }
    },
    say(text) {
      const k = this.key(text);
      if (this.has(k) && (window.AudioContext || window.webkitAudioContext)) return this.official(k);
      this.stop(); return this.tts(text);
    }
  };
  Speech.init();
  ['pointerdown', 'touchend', 'mousedown', 'keydown'].forEach(ev => window.addEventListener(ev, () => Speech.unlock(), { capture: true, passive: true }));
  window.Speech = Speech;

  /* ---------------- 出题与记账 ---------------- */
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const Quiz = {
    recent: [], wrongTimes: [], combo: 0,
    shuffle,
    poolFor(unit) {
      const s = S(); const u = unit || s.curUnit || 1;
      const main = WORDS.filter(w => w.unit === u);
      return main.length ? main : WORDS.filter(w => w.unit <= s.unlocked);
    },
    pick(unit) {
      const s = S(), pool = this.poolFor(unit);
      const unlockedWrong = Object.keys(s.wrong).map(id => WORDS.find(w => w.id === id)).filter(w => w && w.unit <= s.unlocked && this.recent.indexOf(w.id) < 0);
      let w;
      if (unlockedWrong.length && Math.random() < 0.5) w = unlockedWrong[Math.floor(Math.random() * unlockedWrong.length)];
      else {
        const fresh = pool.filter(x => this.recent.indexOf(x.id) < 0);
        const cand = fresh.length ? fresh : pool;
        // 未掌握的词更常出现
        const weighted = []; cand.forEach(x => { const r = s.words[x.id]; weighted.push(x); if (!r || !r.m) weighted.push(x); });
        w = weighted[Math.floor(Math.random() * weighted.length)];
      }
      this.recent.push(w.id); if (this.recent.length > 8) this.recent.shift();
      return w;
    },
    isWrongWord(w) { return !!S().wrong[w.id]; },
    // type: 'zh2en' 看中文选英文 / 'en2zh' 听(或看)英文选中文
    make(unit, type, n) {
      const w = this.pick(unit); n = n || 4;
      if (!type) type = Math.random() < 0.5 ? 'zh2en' : 'en2zh';
      const key = type === 'zh2en' ? 'en' : 'zh';
      const same = shuffle(WORDS.filter(x => x.unit === w.unit && x.id !== w.id && x.en.toLowerCase() !== w.en.toLowerCase() && x.zh !== w.zh));
      const other = shuffle(WORDS.filter(x => x.unit !== w.unit && x.en.toLowerCase() !== w.en.toLowerCase() && x.zh !== w.zh));
      const opts = [w]; const seen = new Set([w[key]]);
      for (const x of same.concat(other)) { if (opts.length >= n) break; if (!seen.has(x[key])) { seen.add(x[key]); opts.push(x); } }
      const sh = shuffle(opts);
      return { word: w, type, options: sh.map(x => x[key]), answer: sh.indexOf(w), wasWrong: this.isWrongWord(w), t0: performance.now() };
    },
    shortZh(zh) { return zh.split(/[；;]/)[0]; },
    inCooldown() { return S().cooldownUntil > Date.now(); },
    cooldownLeft() { return Math.max(0, Math.ceil((S().cooldownUntil - Date.now()) / 1000)); },
    // 记录一次作答，返回 {coins, star, combo, cooldown}
    record(w, correct) {
      const s = S(); s.stats.answered++;
      const r = s.words[w.id] || (s.words[w.id] = { c: 0, w: 0, st: 0, m: false });
      const out = { coins: 0, star: false, combo: 0, cooldown: false };
      if (correct) {
        s.stats.correct++; r.c++; r.st++; this.combo++; this.wrongTimes = [];
        out.combo = this.combo; out.coins = 10 + (this.combo >= 3 ? 2 : 0);
        if (s.wrong[w.id]) { s.wrong[w.id].ok++; if (s.wrong[w.id].ok >= 2) delete s.wrong[w.id]; }
        if (!r.m && r.c >= 2 && r.st >= 2 && !s.wrong[w.id]) { r.m = true; s.stars++; out.star = true; }
        s.coins += out.coins;
      } else {
        r.w++; r.st = 0; this.combo = 0;
        s.wrong[w.id] = { n: ((s.wrong[w.id] && s.wrong[w.id].n) || 0) + 1, ok: 0 };
        const now = Date.now(); this.wrongTimes.push(now); this.wrongTimes = this.wrongTimes.filter(t => now - t <= 5000);
        if (this.wrongTimes.length >= 3) { s.cooldownUntil = now + 60000; this.wrongTimes = []; out.cooldown = true; }
      }
      Save.save(); return out;
    },
    // 拼写时点错一个字母：只计入「5 秒连错 3 次」的冷却判断
    tapWrong() {
      const now = Date.now(); this.combo = 0; this.wrongTimes.push(now); this.wrongTimes = this.wrongTimes.filter(t => now - t <= 5000);
      if (this.wrongTimes.length >= 3) { S().cooldownUntil = now + 60000; this.wrongTimes = []; Save.save(); return true; }
      return false;
    },
    tapRight() { this.wrongTimes = []; },
    resetRound() { this.combo = 0; this.recent = []; }
  };
  window.Quiz = Quiz;

  /* ---------------- 宠物成长与属性 ----------------
   * 阶段：0 宠物蛋 → 1 幼年白狐 → 2 成年白狐（10 星）→ 3 风语翼狐（20 星）
   * 属性全部由学识星和阶段算出来（不另存），并直接用于对战。 */
  const PET = {
    // 5 种宠物，孵蛋时随机开出一种；每种 3 个成长形态
    SPECIES: {
      fox: { mod: { hp: 0, atk: 0, def: 0, crit: 1.6, ult: 2.6 }, trait: '均衡型：各项平均，没有短板', name: '白狐', names: ['幼年白狐', '成年白狐', '风语翼狐'], keys: ['pet-baby', 'pet-teen', 'pet-adult'], def: '小白', color: 0xfbf4ec, line: '风语系' },
      dragon: { mod: { hp: -10, atk: 3, def: 0, crit: 1.6, ult: 2.8 }, trait: '攻击型：攻击高、大招更痛，血略少', name: '小青龙', names: ['小青龙', '青鳞龙', '翠玉书龙'], keys: ['pet-dragon-1', 'pet-dragon-2', 'pet-dragon-3'], def: '小青', color: 0x7fd6a8, line: '文墨系' },
      robot: { mod: { hp: 0, atk: -1, def: 3, crit: 1.6, ult: 2.6 }, trait: '防御型：防御高，答错掉血少', name: '机器猫', names: ['机器喵', '喷射机械喵', '星辉机甲喵'], keys: ['pet-robot-1', 'pet-robot-2', 'pet-robot-3'], def: '铁蛋', color: 0x9fd2ff, line: '机巧系' },
      bird: { mod: { hp: -10, atk: 0, def: 0, crit: 2.0, ult: 2.6 }, trait: '暴击型：4 秒内答对伤害更高，血略少', name: '云雀', names: ['小云雀', '晴空云雀', '彩虹云雀'], keys: ['pet-bird-1', 'pet-bird-2', 'pet-bird-3'], def: '啾啾', color: 0xffe27a, line: '风语系' },
      otter: { mod: { hp: 30, atk: -1, def: 1, crit: 1.6, ult: 2.4 }, trait: '生命型：血最厚，最能扛', name: '小海獭', names: ['小海獭', '贝壳海獭', '潮汐守护獭'], keys: ['pet-otter-1', 'pet-otter-2', 'pet-otter-3'], def: '贝贝', color: 0xd9a77a, line: '文墨系' }
    },
    sp(s) { s = s || S(); return this.SPECIES[s.species] || this.SPECIES.fox; },
    randomSpecies(s) {
      const own = ((s && s.pets) || []).map(p => p.species);
      let k = Object.keys(this.SPECIES).filter(x => own.indexOf(x) < 0); if (!k.length) k = Object.keys(this.SPECIES);
      return k[Math.floor(Math.random() * k.length)];
    },
    // 这只宠物自己攒的学识星（孵出后才开始算）
    n(s) { s = s || S(); return Math.max(0, (s.stars || 0) - (s.petBase || 0)); },
    stash(s) { s = s || S(); if (!s.hatched) return; s.pets = s.pets || []; s.pets[s.active || 0] = { species: s.species, petName: s.petName, petStage: s.petStage, petBase: s.petBase || 0 }; },
    switchTo(i, s) { s = s || S(); this.stash(s); const p = s.pets[i]; if (!p) return; Object.assign(s, p); s.active = i; this.seen(s); Save.save(); },
    // 新蛋：收服全部 6 只怪物送 1 颗；任一宠物进化到最终形态送 1 颗
    checkEggs(s) {
      s = s || S(); s.eggFrom = s.eggFrom || {}; this.stash(s); let why = '';
      if (!s.eggFrom.dex6 && Object.keys(s.dex || {}).length >= 6) { s.eggFrom.dex6 = 1; s.eggs = (s.eggs || 0) + 1; why = '收服了全部 6 只怪物'; }
      if (!s.eggFrom.final && (s.pets || []).some(p => p.petStage >= 3)) { s.eggFrom.final = 1; s.eggs = (s.eggs || 0) + 1; why = why || '宠物进化到了最终形态'; }
      if (why) Save.save(); return why;
    },
    get stages() {
      const sp = this.sp();
      return [{ name: '宠物蛋', key: 'egg', need: 0 },
        { name: sp.names[0], key: sp.keys[0], need: 0 },
        { name: sp.names[1], key: sp.keys[1], need: 10 },
        { name: sp.names[2], key: sp.keys[2], need: 20 }];
    },
    // 宠物图鉴：记录见过的形态
    seen(s) { s = s || S(); s.petDex = s.petDex || {}; const st = s.petStage || 0; for (let i = 1; i <= st; i++) s.petDex[(s.species || 'fox') + i] = true; return s.petDex; },
    key(st) { return this.sp().keys[Math.max(1, Math.min(3, st || 1)) - 1]; },
    bonus: { hp: [0, 0, 20, 40], atk: [0, 0, 2, 5], def: [0, 0, 2, 4] },
    stage(s) { return (s || S()).petStage || 0; },
    name(st) { return (this.stages[st] || this.stages[1]).name; },
    nextNeed(st) { const n = this.stages[st + 1]; return n ? n.need : 0; },
    // 地图 / 对战等场景里的显示高度：成年和翼狐的图更宽，用大一号
    h(small, big, st) { st = st === undefined ? this.stage() : st; return st >= 2 ? big : small; },
    stats(s) {
      s = s || S(); const st = Math.max(1, s.petStage || 1), n = this.n(s), B = this.bonus;
      const M = this.sp(s).mod;
      const atk = 10 + Math.floor(n / 2) + B.atk[st] + M.atk;
      const def = Math.floor(n / 3) + B.def[st] + M.def;
      return {
        stage: st, stars: n, lv: 1 + n,
        hp: 100 + n * 4 + B.hp[st] + M.hp,
        atk, crit: Math.round(atk * M.crit), ult: Math.round(atk * M.ult),
        def, hurt: Math.max(12, 25 - def),
        mastered: Object.values(s.words || {}).filter(r => r.m).length,
        captured: Object.keys(s.dex || {}).length
      };
    },
    // 回到地图时该进化到哪一阶段（0 = 不用进化）
    evolveTo(s) { s = s || S(); const st = s.petStage || 0; if (st >= 1 && st < 3 && this.n(s) >= this.nextNeed(st)) return st + 1; return 0; }
  };
  window.PET = PET;

  window.MONSTERS = [
    null,
    { name: '哈喽糖糖', key: 'mon1', color: 0xffa6c9 },
    { name: '团团鼠', key: 'mon2', color: 0xf3dfae },
    { name: '虎小萌', key: 'mon3', color: 0xffa64d },
    { name: '芽芽果', key: 'mon4', color: 0xb8e35a },
    { name: '彩虹滴', key: 'mon5', color: 0x9b7bff },
    { name: '钟点糕', key: 'mon6', color: 0xffb3c7 }
  ];
  window.FISH = {
    common: { name: '小橙鱼', tag: '普通', key: 'fish-common', w: [0.3, 0.8], color: 0xffa54a },
    blue: { name: '蓝鳍鱼', tag: '少见', key: 'fish-blue', w: [0.6, 1.4], color: 0x4fb3ff },
    rare: { name: '星紫鱼', tag: '稀有', key: 'fish-rare', w: [1.2, 2.6], color: 0xc46bff },
    legend: { name: '金冠鱼王', tag: '传说', key: 'fish-legend', w: [3, 6], color: 0xffd21f }
  };
})();
