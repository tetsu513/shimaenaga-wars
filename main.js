/* =========================================================
   Shooting Ultimate — all-in-one (updated)
   - GameOver: shake stop + BGM fade out
   - Player: move 4 directions within bottom-half area
   Controls: ← → ↑ ↓ / Space / Enter
   Mobile: Left/Right/Shot buttons (vertical not on mobile yet)
========================================================= */

// ---------- Canvas sizing (responsive) ----------
const canvas = document.getElementById("game");
const wrap = document.getElementById("wrap");
// iOS Safari: prevent text-selection loupe / callout during play
wrap.addEventListener("touchstart", (e) => {
  if (scene === Scene.Play) e.preventDefault();
}, { passive: false });

wrap.addEventListener("touchmove", (e) => {
  if (scene === Scene.Play) e.preventDefault();
}, { passive: false });

// ===== GameOver: tap anywhere (canvas) to return Title (robust on iOS) =====
canvas.addEventListener("pointerdown", (e) => {
  if (scene !== Scene.Over) return;

  e.preventDefault(); // iOS Safari対策（タップがクリック化・ズーム化するのを防ぐ）
  scene = Scene.Title;
  titleUnlocked = false;
  menuIndex = 0;
  se(520,0.06,"sine",0.08);
  startBgm("title");
}, { passive: false });

// Drag anywhere on canvas to move the player (relative)
wrap.addEventListener("pointerdown", (e) => {
  // タイトル画面の「最初のタップ」等、既存処理があるので邪魔しないように
  // Play中だけドラッグ移動を有効にする
  if (scene !== Scene.Play) return;


// UIボタンの操作はドラッグ扱いにしない
if (e.target && e.target.closest && e.target.closest(".btn")) return;

// ドラッグ開始
drag.active = true;
drag.pointerId = e.pointerId;
drag.lastX = e.clientX;
drag.lastY = e.clientY;
drag.dx = 0;
drag.dy = 0;

// Touching the screen = keep firing (mobile)
touch.shot = true;




  drag.pointerId = e.pointerId;
  drag.lastX = e.clientX;
  drag.lastY = e.clientY;
  drag.dx = 0;
  drag.dy = 0;

  // iOS: prevent scroll/zoom selection
  e.preventDefault();
  canvas.setPointerCapture?.(e.pointerId);
}, { passive: false });

wrap.addEventListener("pointermove", (e) => {
  if (!drag.active || e.pointerId !== drag.pointerId) return;
  const x = e.clientX;
  const y = e.clientY;

  drag.dx += (x - drag.lastX);
  drag.dy += (y - drag.lastY);

  drag.lastX = x;
  drag.lastY = y;
  e.preventDefault();
}, { passive: false });

function endDrag(e){
  if (!drag.active) return;
  if (e && drag.pointerId != null && e.pointerId !== drag.pointerId) return;
  drag.active = false;
  drag.pointerId = null;
  touch.shot = false;
  drag.dx = 0;
  drag.dy = 0;
}

wrap.addEventListener("pointerup", (e) => { endDrag(e); e.preventDefault(); }, { passive:false });
wrap.addEventListener("pointercancel", (e) => { endDrag(e); e.preventDefault(); }, { passive:false });
wrap.addEventListener("pointerleave", () => { endDrag(); }, { passive:false });

// Title: first click to show menu
wrap.addEventListener("pointerdown", () => {
  // Title: first click to show menu
  if (scene === Scene.Title && !titleUnlocked) {
    titleUnlocked = true;
    ensureAudio();
    startBgm("title");
    se(520, 0.06, "sine", 0.10);
    return;
  }

    // Title: tap to decide (mobile)
  if (scene === Scene.Title && titleUnlocked) {
    if (menuIndex === 0) {
      ensureAudio();
      resetRun();
      scene = Scene.Play;
      startBgm("play");
      jingle("start");
    } else if (menuIndex === 1) {
      scene = Scene.How;
      ensureAudio();
      startBgm("title");
      se(520,0.06,"sine",0.08);
    } else {
      scene = Scene.Settings;
      ensureAudio();
      startBgm("title");
      se(420,0.06,"sine",0.08);
    }
    return; // ← タップを消費（End側に流れない）
  }

  // Ending: click to return title
  if (scene === Scene.End) {
    endClicked = true;
  }
}, { passive: true });


// --- Background images ---
const bgImages = {
  0: new Image(), // Title
  1: new Image(),
  2: new Image(),
  3: new Image(),
};
bgImages[0].src = "assets/title.png";
bgImages[1].src = "assets/bg_stage1.png";
bgImages[2].src = "assets/bg_stage2.png";
bgImages[3].src = "assets/bg_stage3.png";

// --- Enemy sprites ---
const enemyImgs = {
  straight: new Image(),
  zig: new Image(),
  shooter: new Image(),
};
enemyImgs.straight.src = "assets/enemy_straight.png";
enemyImgs.zig.src      = "assets/enemy_zig.png";
enemyImgs.shooter.src  = "assets/enemy_shooter.png";

// 見た目サイズ（当たり判定は e.w/e.h のまま使う）
const ENEMY_SPR_W = 56;
const ENEMY_SPR_H = 56;


// --- Player sprite (top-down shimaenaga) ---
const playerImg = new Image();
playerImg.src = "assets/shimaenaga_top.png"; 

// --- Boss sprites ---
const bossImgs = {
  1: new Image(),
  2: new Image(),
  3: new Image(),
};
bossImgs[1].src = "assets/boss_stage1.png";
bossImgs[2].src = "assets/boss_stage2.png";
bossImgs[3].src = "assets/boss_stage3.png";

const bossCoreImg = new Image();
bossCoreImg.src = "assets/boss_core.png";

// 見た目サイズ（当たり判定は boss.w / boss.h / boss.core.w / boss.core.h を使い続ける）
const BOSS_SPR = {
  1: { w: 260, h: 140, coreW: 58, coreH: 58 }, // ★目にピッタリ
  2: { w: 250, h: 140, coreW: 60, coreH: 60 },
  3: { w: 160, h: 160, coreW: 64, coreH: 64 },
};



// 見た目サイズ（当たり判定は player.w / player.h を使い続ける）
const PLAYER_SPR_W = 96;
const PLAYER_SPR_H = 96;




const ctx = canvas.getContext("2d");

const BASE_W = 480;
const BASE_H = 720;

function resizeCanvas() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scale = Math.min(vw / BASE_W, vh / BASE_H);

  canvas.width = Math.floor(BASE_W * scale);
  canvas.height = Math.floor(BASE_H * scale);

  ctx.setTransform(scale, 0, 0, scale, 0, 0);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const W = BASE_W;
const H = BASE_H;

// ---------- Input ----------
const keys = new Set();
window.addEventListener("keydown", (e) => {
if (["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Space","ShiftLeft","Enter"].includes(e.code)) e.preventDefault();
  // Ending: Enter/Space を「1回押し」として拾う
  if (scene === Scene.End && !e.repeat && (e.code === "Enter" || e.code === "Space")) {
    endKeyPressed = true;
  }
  keys.add(e.code);
});
window.addEventListener("keyup", (e) => keys.delete(e.code));
// ===== iOS Safari: prevent double-tap zoom & gesture zoom =====
let _lastTouchEnd = 0;

// Double-tap zoom killer (iOS Safari)
document.addEventListener("touchend", (e) => {
  const now = Date.now();
  if (now - _lastTouchEnd <= 300) {
    e.preventDefault(); // stop double-tap zoom
  }
  _lastTouchEnd = now;
}, { passive: false });

// Gesture zoom prevent (pinch etc.)
document.addEventListener("gesturestart", (e) => e.preventDefault(), { passive:false });
document.addEventListener("gesturechange", (e) => e.preventDefault(), { passive:false });
document.addEventListener("gestureend", (e) => e.preventDefault(), { passive:false });

// Long-press context menu prevent
document.addEventListener("contextmenu", (e) => e.preventDefault());


// Mobile buttons
const touch = { left:false, right:false, up:false, down:false, shot:false };
// ===== Drag control (relative) =====
const drag = {
  active: false,
  pointerId: null,
  lastX: 0,
  lastY: 0,
  dx: 0,
  dy: 0,
};


// End画面用：1回クリック検知
let endClicked = false;
let endKeyPressed = false; // End画面用：Enter/Spaceの1回押し検知

function bindHold(btnId, keyName) {
  const el = document.getElementById(btnId);
  const on = () => (touch[keyName] = true);
  const off = () => (touch[keyName] = false);
  el.addEventListener("pointerdown", (e) => { e.preventDefault(); on(); });
  el.addEventListener("pointerup", (e) => { e.preventDefault(); off(); });
  el.addEventListener("pointercancel", off);
  el.addEventListener("pointerleave", off);
}

// ---------- Audio (BGM + SE) ----------
const AudioCtx = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioCtx();

const AudioBus = {
  master: 0.65,
  bgm: 0.55,
  se: 0.80,
};

function ensureAudio() {
  if (audioCtx.state !== "running") audioCtx.resume();
}

function saveSettings() {
  localStorage.setItem("stg_settings", JSON.stringify(AudioBus));
}
function loadSettings() {
  const s = localStorage.getItem("stg_settings");
  if (!s) return;
  try {
    const o = JSON.parse(s);
    if (typeof o.master === "number") AudioBus.master = o.master;
    if (typeof o.bgm === "number") AudioBus.bgm = o.bgm;
    if (typeof o.se === "number") AudioBus.se = o.se;
  } catch {}
}
loadSettings();

function se(freq=440, time=0.06, type="square", vol=0.12) {
  ensureAudio();
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = vol * AudioBus.se * AudioBus.master;
  o.connect(g).connect(audioCtx.destination);
  o.start();
  o.stop(audioCtx.currentTime + time);
}

function jingle(kind="start") {
  if (kind === "start") { se(660,0.06,"sine",0.12); setTimeout(()=>se(880,0.07,"sine",0.12),70); }
  if (kind === "boss")  { se(220,0.16,"sawtooth",0.14); setTimeout(()=>se(196,0.18,"sawtooth",0.14),160); }
  if (kind === "clear") { se(523,0.06,"triangle",0.10); setTimeout(()=>se(659,0.08,"triangle",0.10),80); setTimeout(()=>se(784,0.10,"triangle",0.10),170); }
  if (kind === "dead")  { se(150,0.14,"sawtooth",0.14); setTimeout(()=>se(120,0.18,"sawtooth",0.14),140); }
}

let bgmNode = null;
let bgmGain = null;

function stopBgm() {
  if (bgmNode) { try { bgmNode.stop(); } catch {} }
  bgmNode = null;
  bgmGain = null;
}

function startBgm(mode="title") {
  ensureAudio();
  stopBgm();

  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  const lfo = audioCtx.createOscillator();
  const lfoG = audioCtx.createGain();

  o.type = mode === "boss" ? "sawtooth" : "square";
  lfo.type = "sine";
  lfo.frequency.value = mode === "title" ? 2.2 : mode === "boss" ? 4.0 : 3.0;
  lfoG.gain.value = mode === "boss" ? 35 : 18;

  o.frequency.value = mode === "title" ? 180 : mode === "boss" ? 110 : 150;

  lfo.connect(lfoG).connect(o.frequency);

  g.gain.value = 0.0001;
  o.connect(g).connect(audioCtx.destination);

  o.start();
  lfo.start();

  g.gain.setTargetAtTime(AudioBus.bgm * AudioBus.master * 0.10, audioCtx.currentTime, 0.12);

  bgmNode = o;
  bgmGain = g;
}

function updateBgmVolume() {
  if (!bgmGain) return;
  bgmGain.gain.setTargetAtTime(AudioBus.bgm * AudioBus.master * 0.10, audioCtx.currentTime, 0.08);
}

// ★追加：BGMフェードアウト（ほどほどで止める）
function fadeOutBgm(time = 0.35) {
  if (!bgmGain || !bgmNode) return;
  const now = audioCtx.currentTime;
  bgmGain.gain.cancelScheduledValues(now);
  bgmGain.gain.setValueAtTime(bgmGain.gain.value, now);
  bgmGain.gain.linearRampToValueAtTime(0.0001, now + time);
  setTimeout(() => { stopBgm(); }, time * 1000 + 60);
}

// ---------- Game State / Scenes ----------
const Scene = { Title:"title", How:"how", Settings:"settings", Play:"play", Over:"over", End:"end" };
let scene = Scene.Title;

let tick = 0;
let score = 0;
let highScore = Number(localStorage.getItem("stg_highscore") || "0");

// scoring
let combo = 0;
let comboTimer = 0;
let multiplier = 1;
let noMiss = true;

// life
const MAX_LIVES = 5;
let lives = 3;
let invincible = 0;

// feel
/* ===== Stage system (3 stages) ===== */
let stage = 1;            // 1..3
let stageKills = 0;       // 現ステージで倒した雑魚数
let bossAlive = false;    // ボス戦中か
let stageIntro = 0;       // ステージ表示残りフレーム（例：120=2秒）
let gameClearTimer = 0;   // GAME CLEAR 表示用（フレーム）
// ===== Ending (after Stage 3 clear) =====
let endingTimer = 0;        // 経過フレーム
let endingCharN = 0;        // ナレーションの表示文字数（タイプ風）
const ENDING_TEXT = "こうして世界の平和は、シマエナガによって守られたのだった。";

// ===== Debug (remove for release) =====
const DEBUG = true; //これをfalseにすれば無敵モードは無効になる
let debugInvincible = false;
let debugPrevN = false;
let debugPrevB = false;
let debugPrevK = false;


const STAGES = {
  1: { // beginner
    killsToBoss: 12,
    spawnP: 0.020,        // 雑魚出現率
    shotP:  0.008,        // 雑魚弾率
    enemyVy: 1.8,         // 雑魚速度
    enemyHp: 1,           // 雑魚耐久（必要なら）
    bossHp:  60,
    bossShotP: 0.012,
    bossBulSpd: 3.2
  },
  2: { // normal
    killsToBoss: 18,
    spawnP: 0.028,
    shotP:  0.012,
    enemyVy: 2.2,
    enemyHp: 1,
    bossHp:  95,
    bossShotP: 0.016,
    bossBulSpd: 3.8
  },
  3: { // hard
    killsToBoss: 24,
    spawnP: 0.036,
    shotP:  0.018,
    enemyVy: 2.6,
    enemyHp: 2,
    bossHp:  140,
    bossShotP: 0.022,
    bossBulSpd: 4.6
  }
};





/* ===== Skill: Barrier (Hybrid Charge) ===== */
let skillGauge = 0;              // 0..1
let skillActive = 0;             // 残りフレーム
const SKILL_FILL_TIME = 60 * 12; // 生存12秒で満タン
const SKILL_DURATION  = 60 * 3;  // 3秒
const SKILL_RADIUS    = 95;      // 弾消し半径    
let shake = 0;
let flash = 0;
let hitStop = 0;

// player (4-direction + bottom-half bounds)
const player = {
  x: W/2,
  y: H - 70,
  w: 28,
  h: 28,
  speed: 5,
  fireCd: 0,
  weapon: "normal",
  weaponTimer: 0,
  laserCd: 0,
};

// bullets / enemies / items / particles
let bullets = [];
let ebullets = [];
let enemies = [];
let items = [];
let particles = [];

// boss
let boss = null;
let bossBullets = [];

// stage
let stageTime = 0;
let bossCleared = false;
// stageKills / stageIntro は別の場所で let 宣言済み（ここでは再宣言しない）

// ---------- Helpers ----------
const clamp = (v,min,max) => Math.max(min, Math.min(max, v));
const rnd = (a,b) => a + Math.random()*(b-a);

function rectHit(a,b){
  return (
    a.x-a.w/2 < b.x+b.w/2 &&
    a.x+a.w/2 > b.x-b.w/2 &&
    a.y-a.h/2 < b.y+b.h/2 &&
    a.y+a.h/2 > b.y-b.h/2
  );
}

function circleVsRect(c, r){
  const rx = r.x - r.w/2, ry = r.y - r.h/2;
  const cx = clamp(c.x, rx, rx + r.w);
  const cy = clamp(c.y, ry, ry + r.h);
  const dx = c.x - cx, dy = c.y - cy;
  return dx*dx + dy*dy <= c.r*c.r;
}

function circleHitPlayer(cx,cy,cr){
  const pr = Math.max(player.w, player.h)*0.45;
  const dx = cx - player.x, dy = cy - player.y;
  const rr = cr + pr;
  return dx*dx + dy*dy <= rr*rr;
}

function startShake(powerFrames=12){
  shake = Math.max(shake, powerFrames);
}

function addParticles(x,y, n=14){
  for(let i=0;i<n;i++){
    particles.push({
      x, y,
      vx: rnd(-2.5,2.5),
      vy: rnd(-2.5,2.5),
      life: rnd(18,35)
    });
  }
}

function addScore(base){
  combo++;
  comboTimer = 120;
  multiplier = 1 + Math.floor(combo / 5);
  const add = base * multiplier;
  score += add;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("stg_highscore", String(highScore));
  }
}

function breakCombo(){
  combo = 0;
  comboTimer = 0;
  multiplier = 1;
}

function resetRun(){
  tick = 0;
  score = 0;
  combo = 0;
  comboTimer = 0;
  multiplier = 1;
  noMiss = true;

  lives = 3;
  invincible = 0;

  shake = 0;
  flash = 0;
  hitStop = 0;

  bullets = [];
  ebullets = [];
  enemies = [];
  items = [];
  particles = [];

  boss = null;
  bossBullets = [];

  // ===== stage init =====
  stage = 1;  
  stageKills = 0;
  stageIntro = 120; // STAGE 1 表示（2秒想定）
  stageTime = 0;
  bossCleared = false;

  // ★追加：ステージ制用
  stageKills = 0;     // 現ステージ撃破数
  stageIntro = 120;   // STAGE表示フレーム（例：120=2秒）

  player.x = W/2;
  player.y = H - 70;
  player.weapon = "normal";
  player.weaponTimer = 0;
  player.fireCd = 0;
  player.laserCd = 0;
}


function currentStageDef(){
  if (stage === 1) return { bg:"#000", enemyRate: 42, itemRate: 520, enemyMix:[0.60,0.25,0.15], bossAt: 35 };
  if (stage === 2) return { bg:"#020014", enemyRate: 37, itemRate: 460, enemyMix:[0.40,0.30,0.30], bossAt: 45 };
  return { bg:"#001014", enemyRate: 32, itemRate: 420, enemyMix:[0.30,0.30,0.40], bossAt: 55 };
}

// --- Boss core offset (stage-specific) ---
// コアを下にずらす（見た目＋当たり判定が一緒に動く）
const CORE_Y_OFF_BY_STAGE = {
  1: 20,  // Stage1
  2: 14,  // Stage2
  3: 38,   // Stage3
};
function coreYOffsetForStage(s){
  return CORE_Y_OFF_BY_STAGE[s] ?? 0;
}
// --- Boss core X offset (stage-specific) ---
// コアを右にずらす（見た目＋当たり判定が一緒に動く）
const CORE_X_OFF_BY_STAGE = {
  1: 2,   // Stage1
  2: 0,  // Stage2
  3: 1,   // Stage3
};
function coreXOffsetForStage(s){
  return CORE_X_OFF_BY_STAGE[s] ?? 0;
}



// ---------- Spawn: enemies/items/boss ----------
function spawnEnemy(){
  const def = currentStageDef();
  const r = Math.random();
  let type = "straight";
  if (r < def.enemyMix[0]) type="straight";
  else if (r < def.enemyMix[0] + def.enemyMix[1]) type="zig";
  else type="shooter";

  const x = rnd(20, W-20);
  const base = {
    x, y:-30,
    w: 34, h: 26,
    vx: 0,
    vy: rnd(1.5, 2.2) + stage*0.25,
    type,
    hp: type==="shooter" ? 2 : 1,
    shootCd: rnd(60, 120),
    zigPhase: rnd(0, Math.PI*2),
  };

  if (type==="zig") {
    base.vx = rnd(1.2, 2.0) * (Math.random()<0.5?-1:1);
  }
  enemies.push(base);
}

function spawnItem(type, x=rnd(20, W-20), y=-20){
  items.push({ type, x, y, r:9, vy: 2.0 + stage*0.10 });
}

function maybeDropItem(x,y){
const r = Math.random();
const healP = (stage === 3) ? 0.075 : 0.045; // Stage3: 回復を増やす
if (r < healP) spawnItem("heal", x, y);
else if (r < 0.11) spawnItem("three", x, y);
else if (r < 0.175) spawnItem("laser", x, y);
}

function spawnBoss(){
  const maxHp = 220 + stage*80;

  const spr = BOSS_SPR[stage] || BOSS_SPR[1];

  boss = {
    x: W/2,
    y: 125,
    w: spr.w,
    h: spr.h,
    vx: 2.2 + stage*0.7,
    hp: maxHp,
    maxHp,
    phase: 1,
    shootCd: 0,
    coreHit: 0, // コアに当たった瞬間の演出用タイマー
    core: {
  x: W/2 + coreXOffsetForStage(stage),
  y: 125 + coreYOffsetForStage(stage),
  w: spr.coreW,
  h: spr.coreH
}

  };

  bossBullets = [];
  jingle("boss");
  startBgm("boss");
}


// ---------- Weapons ----------
function applyItem(type){
  if (type==="heal") {
    lives = Math.min(MAX_LIVES, lives+1);
    se(880,0.06,"triangle",0.12);
    return;
  }
  if (type==="three") {
    player.weapon = "three";
    player.weaponTimer = 60*10;
    se(520,0.08,"square",0.12);
    return;
  }
  if (type==="laser") {
    player.weapon = "laser";
    player.weaponTimer = 60*8;
    player.laserCd = 0;
    se(300,0.10,"sine",0.12);
  }
}

function fireNormal(){
  bullets.push({ x:player.x, y:player.y-18, r:4, vx:0, vy:-8 });
  player.fireCd = 9;
  se(640,0.04,"square",0.07);
}

function fireThree(){
  const s = 8;
  [-0.26,0,0.26].forEach(a=>{
    bullets.push({ x:player.x, y:player.y-18, r:4, vx:Math.sin(a)*s, vy:-Math.cos(a)*s });
  });
  player.fireCd = 11;
  se(560,0.05,"square",0.08);
}

function fireLaserPulse(){
  player.laserCd = 16;
  se(140,0.08,"triangle",0.06);
}

// ---------- Damage / Hit feedback ----------
function playerHit(){
  if (!(DEBUG && debugInvincible)) {
    lives--;
  }
  // skill救済：被弾でゲージ加算
  skillGauge = clamp(skillGauge + 0.4, 0, 1);
  noMiss = false;
  invincible = 75;
  flash = 14;
  hitStop = 4;
  startShake(14);
  breakCombo();
  se(120,0.10,"sawtooth",0.12);

  if (lives <= 0) {
    // ★揺れ・フラッシュ・ヒットストップを止める（あなたの採用した1つ目）
    shake = 0;
    flash = 0;
    hitStop = 0;

    // ★BGMをほどほどで止める（フェードアウト）
    fadeOutBgm(0.35);

    scene = Scene.Over;
    skillActive = 0;
    jingle("dead"); // 短いのでOK（長いBGMはfadeOutで止まる）
  }
}

// ---------- Scene UI (menu) ----------
let titleUnlocked = false; // 最初はCLICK表示、クリック後にメニュー表示
let menuIndex = 0;
let settingsIndex = 0;

function pressedOnce(code){
  if (!pressedOnce.prev) pressedOnce.prev = new Set();
  const was = pressedOnce.prev.has(code);
  const now = keys.has(code);
  if (now) pressedOnce.prev.add(code);
  else pressedOnce.prev.delete(code);
  return now && !was;
}

function titleInput(){
  // まず「CLICK」解除（Enterでも解除できる）
  if (!titleUnlocked) {
    if (pressedOnce("Enter")) {
      titleUnlocked = true;
      ensureAudio();
      startBgm("title");
      se(520, 0.06, "sine", 0.10);
    }
    return;
  }

  // 解除後は通常メニュー操作
  if (pressedOnce("Enter")) {
    if (menuIndex === 0) {
      ensureAudio();
      resetRun();
      scene = Scene.Play;
      startBgm("play");
      jingle("start");
    } else if (menuIndex === 1) {
      scene = Scene.How;
      ensureAudio();
      startBgm("title");
      se(520,0.06,"sine",0.08);
    } else {
      scene = Scene.Settings;
      ensureAudio();
      startBgm("title");
      se(420,0.06,"sine",0.08);
    }
  }
  if (pressedOnce("ArrowLeft")) menuIndex = (menuIndex + 2) % 3;
  if (pressedOnce("ArrowRight")) menuIndex = (menuIndex + 1) % 3;
}



function howInput(){
  if (pressedOnce("Enter")) { scene = Scene.Title; se(520,0.06,"sine",0.08); startBgm("title"); }
}

function settingsInput(){
  const step = 0.05;
  if (pressedOnce("ArrowLeft")) settingsIndex = (settingsIndex + 2) % 3;
  if (pressedOnce("ArrowRight")) settingsIndex = (settingsIndex + 1) % 3;

  if (pressedOnce("Enter")) {
    saveSettings();
    scene = Scene.Title;
    se(520,0.06,"sine",0.08);
    startBgm("title");
  }

  if (keys.has("ArrowLeft")) {
    if (settingsIndex === 0) AudioBus.master = clamp(AudioBus.master - step/30, 0, 1);
    if (settingsIndex === 1) AudioBus.bgm = clamp(AudioBus.bgm - step/30, 0, 1);
    if (settingsIndex === 2) AudioBus.se = clamp(AudioBus.se - step/30, 0, 1);
    updateBgmVolume();
  }
  if (keys.has("ArrowRight")) {
    if (settingsIndex === 0) AudioBus.master = clamp(AudioBus.master + step/30, 0, 1);
    if (settingsIndex === 1) AudioBus.bgm = clamp(AudioBus.bgm + step/30, 0, 1);
    if (settingsIndex === 2) AudioBus.se = clamp(AudioBus.se + step/30, 0, 1);
    updateBgmVolume();
  }
}

// ---------- Main update loop ----------
function update(){
  if (scene === Scene.Title) { titleInput(); return; }
  if (scene === Scene.How) { howInput(); return; }
  if (scene === Scene.Settings) { settingsInput(); return; }
  if (scene === Scene.Over) {
    if (pressedOnce("Enter") || pressedOnce("NumpadEnter")) {
        scene = Scene.Title; 
        titleUnlocked = false;
        menuIndex = 0;
        se(520,0.06,"sine",0.08); 
        startBgm("title"); 
    }
    return;
  }

if (hitStop > 0) {
  hitStop--;
  if (flash > 0) flash--;
  if (shake > 0) shake--;
  return;
}


  tick++;
  // --- Ending: click to return title ---
if (scene === Scene.End) {
  const ready = (endingCharN >= ENDING_TEXT.length);

  // クリックは pointerdown で endClicked=true にしている
if (ready && (endClicked || endKeyPressed)) {
endClicked = false;    // 消費
endKeyPressed = false; // 消費
scene = Scene.Title;
startBgm("title");

  }
}


// --- Debug: invincible toggle (I key) ---
// --- Debug: stage skip / boss spawn / boss kill ---
if (DEBUG) {
  const nowN = keys.has("KeyN");
  const nowB = keys.has("KeyB");
  const nowK = keys.has("KeyK");

  // N: 次ステージへ（Title以外で有効）
  if (nowN && !debugPrevN && scene === Scene.Play) {
    boss = null;
    bossBullets = [];
    bossCleared = false;

    stage = Math.min(3, stage + 1);
    stageTime = 0;
    stageKills = 0;
    stageIntro = 60; // 1秒だけ表示
  }

  // B: ボス即出現（まだボス中じゃない時だけ）
  if (nowB && !debugPrevB && scene === Scene.Play) {
    if (!boss && !bossCleared) {
      spawnBoss();
    }
  }

  // K: ボス即撃破（ボス戦中だけ）
  if (nowK && !debugPrevK && scene === Scene.Play) {
    if (boss) {
      boss.hp = 0;
    }
  }

  debugPrevN = nowN;
  debugPrevB = nowB;
  debugPrevK = nowK;
}
if (DEBUG) {
  // 1回押し判定用（初回だけ作る）
  if (typeof window._prevI === "undefined") window._prevI = false;

  const nowI = keys.has("KeyI");
  if (nowI && !window._prevI) {
    debugInvincible = !debugInvincible;
  }
  window._prevI = nowI;
}

// --- ENDING progression ---
if (scene === Scene.End) {
  endingTimer++;

  // タイプ風にナレーション表示（早すぎない速度）
  if (endingTimer % 2 === 0 && endingCharN < ENDING_TEXT.length) endingCharN++;

  // エンディング中はゲーム進行を止める
  return;
}



  if (stageIntro > 0) stageIntro--;
  // --- Skill gauge charge (hybrid) ---
  if (skillActive > 0) {
    skillActive--;
  } else {
    skillGauge = clamp(skillGauge + 1 / SKILL_FILL_TIME, 0, 1);
  }

  // --- Activate skill (Shift) ---
  if (pressedOnce("ShiftLeft") && skillGauge >= 1 && skillActive === 0) {
    skillGauge = 0;
    skillActive = SKILL_DURATION;
    se(420, 0.10, "triangle", 0.12);
  }


  stageTime++;

  if (invincible > 0) invincible--;
  if (flash > 0) flash--;
  if (shake > 0) shake--;

  if (comboTimer > 0) comboTimer--;
  else if (combo > 0) breakCombo();

  if (player.weaponTimer > 0) player.weaponTimer--;
  if (player.weaponTimer === 0) player.weapon = "normal";

  if (player.fireCd > 0) player.fireCd--;
  if (player.laserCd > 0) player.laserCd--;

  // ★ 4方向移動（下半分に限定）
  const moveL = keys.has("ArrowLeft") || touch.left;
  const moveR = keys.has("ArrowRight") || touch.right;
  const moveU = keys.has("ArrowUp")   || touch.up;
  const moveD = keys.has("ArrowDown") || touch.down;


  let dx = 0, dy = 0;
  if (moveL) dx -= 1;
  if (moveR) dx += 1;
  if (moveU) dy -= 1;
  if (moveD) dy += 1;

// ===== Drag move (relative) : DO NOT normalize =====
let dragMoveX = 0, dragMoveY = 0;
if (drag.active) {
  const rect = canvas.getBoundingClientRect();
  const sx = BASE_W / rect.width;
  const sy = BASE_H / rect.height;

  // 指の移動量をそのまま使う（追従）
  dragMoveX = drag.dx * sx;
  dragMoveY = drag.dy * sy;

  // 使った分は消費
  drag.dx = 0;
  drag.dy = 0;
}



  if (dx !== 0 || dy !== 0) {
    // 斜めが速くならないよう正規化
    const len = Math.hypot(dx, dy) || 1;
    dx = (dx / len) * player.speed;
    dy = (dy / len) * player.speed;
    player.x += dx;
    player.y += dy;
  }
  // Drag follow (add): 量で動かす（正規化しない）
　if (dragMoveX !== 0 || dragMoveY !== 0) {
  // 追従感の調整（0.6〜1.2くらいで好み）
  const SENS = 1.0;
  player.x += dragMoveX * SENS;
  player.y += dragMoveY * SENS;
}


  const minY = H * 0.50; // 下半分（ここから下のみ）
  player.x = clamp(player.x, player.w/2, W - player.w/2);
  player.y = clamp(player.y, minY + player.h/2, H - player.h/2);

  // shoot
  const wantShot = keys.has("Space") || touch.shot;
  if (wantShot) {
    if (player.weapon === "laser") {
      if (player.laserCd === 0) fireLaserPulse();
    } else if (player.fireCd === 0) {
      if (player.weapon === "three") fireThree();
      else fireNormal();
    }
  }

  // stage progression & boss spawn
  const def = currentStageDef();
  if (!boss && !bossCleared && stageKills >= def.bossAt) spawnBoss();


  // enemy spawning
  const spawnInterval = boss ? Math.max(52, def.enemyRate + 10) : def.enemyRate;
  if (tick % spawnInterval === 0) spawnEnemy();

  // item spawning
  if (tick % def.itemRate === 0) {
    const r = Math.random();
    if (r < 0.25) spawnItem("heal");
    else if (r < 0.62) spawnItem("three");
    else spawnItem("laser");
  }

  // update enemies
  for (const e of enemies) {
    if (e.type === "zig") {
      e.zigPhase += 0.06 + stage*0.01;
      e.x += Math.sin(e.zigPhase) * (1.8 + stage*0.25);
    } else if (e.type === "straight") {
      e.x += Math.sin((tick + e.x) * 0.01) * 0.5;
    } else if (e.type === "shooter") {
      e.shootCd--;
      if (e.shootCd <= 0) {
    e.shootCd = (stage === 3)
        ? rnd(120, 200)        // Stage3: さらに撃つ間隔を長く
        : (stage === 2)
        ? rnd(105, 175)      // Stage2: 少し撃つ間隔を長く
        : (rnd(80, 140) - stage*6);

        const dx2 = (player.x - e.x);
        const dy2 = (player.y - e.y);
        const len2 = Math.max(1, Math.hypot(dx2,dy2));
        const vx = (dx2/len2) * (1.2 + stage*0.25);
        const vy = (dy2/len2) * (2.8 + stage*0.25);
        ebullets.push({ x:e.x, y:e.y+10, r:5, vx, vy });
        se(200,0.03,"sine",0.05);
      }
    }
    e.y += e.vy;
    e.x = clamp(e.x, 18, W-18);
  }

  // update enemy bullets
    // --- Barrier effect: erase enemy bullets ---
  if (skillActive > 0) {
    const R2 = SKILL_RADIUS * SKILL_RADIUS;

    // 通常敵弾
    for (let i = ebullets.length - 1; i >= 0; i--) {
      const b = ebullets[i];
      const dx = b.x - player.x;
      const dy = b.y - player.y;
      if (dx*dx + dy*dy <= R2) {
        ebullets.splice(i, 1);
        // 任意：弾消しスコア（欲しければ有効化）
        // score += 1;
      }
    }

    // ボス弾（存在する場合）
    if (typeof bossBullets !== "undefined") {
      for (let i = bossBullets.length - 1; i >= 0; i--) {
        const b = bossBullets[i];
        const dx = b.x - player.x;
        const dy = b.y - player.y;
        if (dx*dx + dy*dy <= R2) {
          bossBullets.splice(i, 1);
          // score += 1;
        }
      }
    }
  }
  ebullets.forEach(b => { b.x += b.vx; b.y += b.vy; });
  ebullets = ebullets.filter(b => b.y < H + 40 && b.x > -40 && b.x < W+40);


  // update player bullets
  bullets.forEach(b => { b.x += b.vx; b.y += b.vy; });
  bullets = bullets.filter(b => b.y > -60 && b.x > -60 && b.x < W+60);

  // update items
  items.forEach(it => it.y += it.vy);
  items = items.filter(it => it.y < H + 80);

  // update particles
  for (const p of particles) {
    p.x += p.vx; p.y += p.vy;
    p.vx *= 0.98; p.vy *= 0.98;
    p.life--;
  }
  particles = particles.filter(p => p.life > 0);

// enemy miss penalty（修正案①：ライフは減らさずスコアのみ）
for (let i = enemies.length - 1; i >= 0; i--) {
  if (enemies[i].y > H + 20) {
    enemies.splice(i, 1);

    // 取り逃がしペナルティ：スコア減 + コンボ切れ
    score = Math.max(0, score - 10);
    breakCombo();
    se(130, 0.05, "square", 0.06);
  }
}


  // collisions: bullets vs enemies
  for (let i=enemies.length-1; i>=0; i--) {
    const e = enemies[i];

    const laserActive = (player.weapon === "laser" && player.laserCd > 0);
    // --- Laser visual (pulse) ---
  if (laserActive) {
    // まぶしくしない：細め＋透明度低め
    const beamHalf = 7;
    ctx.fillStyle = "rgba(120, 230, 255, 0.28)";
    ctx.fillRect(player.x - beamHalf, 0, beamHalf * 2, player.y - 18);

    // 芯（さらに薄く）
    ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
    ctx.fillRect(player.x - 2, 0, 4, player.y - 18);
  }

    if (laserActive) {
      const beamHalf = 7;
      if (Math.abs(e.x - player.x) <= e.w/2 + beamHalf && e.y < player.y) {
        enemies.splice(i,1);
        stageKills++;
        addParticles(e.x, e.y, 16);
        addScore(10);
        stageKills++;
        maybeDropItem(e.x, e.y);
        se(280,0.02,"square",0.05);
        continue;
      }
    }

    for (let j=bullets.length-1; j>=0; j--) {
      const b = bullets[j];
      if (circleVsRect(b, e)) {
        bullets.splice(j,1);
        e.hp--;
        if (e.hp <= 0) {
          enemies.splice(i,1);
          addParticles(e.x, e.y, 18);
          addScore(10);
          maybeDropItem(e.x, e.y);
          se(280,0.02,"square",0.05);
        } else {
          se(220,0.02,"sine",0.04);
        }
        break;
      }
    }
  }

  // items pickup
  for (let i=items.length-1; i>=0; i--) {
    const it = items[i];
    if (circleHitPlayer(it.x, it.y, it.r)) {
      items.splice(i,1);
      applyItem(it.type);
    }
  }

  // boss update & collisions
  if (boss) {
    const ratio = boss.hp / boss.maxHp;
    boss.phase = ratio < 0.45 ? 2 : 1;

    boss.x += boss.vx;
    if (boss.x < boss.w/2 + 10) boss.vx = Math.abs(boss.vx);
    if (boss.x > W - boss.w/2 - 10) boss.vx = -Math.abs(boss.vx);

boss.core.x = boss.x + coreXOffsetForStage(stage);
boss.core.y = boss.y + coreYOffsetForStage(stage);


    boss.shootCd--;
    if (boss.coreHit > 0) boss.coreHit--;

    
const intervalBase = boss.phase === 1
  ? Math.max(38, 52 - stage*6)
  : Math.max(22, 34 - stage*4);

// phase2だけ撃つ間隔を伸ばす（全ステージ共通）
const phase2Bonus = (boss.phase === 2) ? 10 : 0;

// stage3はさらに少し緩める（既存方針を維持）
const stageBonus = (stage === 3) ? 16 : 0;

const interval = intervalBase + phase2Bonus + stageBonus;


    if (boss.shootCd <= 0) {
      boss.shootCd = interval;

      const baseY = boss.y + boss.h/2 + 8;
      if (boss.phase === 1) {
        [-28,0,28].forEach(dx3 => bossBullets.push({ x: boss.x+dx3, y: baseY, r:5, vx:0, vy: 4.0 + stage*0.5 }));
      } else {
    const angles = (stage === 1)
     ? [-0.35, 0, 0.35]                   // Stage1: 3発
     : (stage === 2)
     ? [-0.50, -0.17, 0.17, 0.50]        // Stage2: 4発
     : [-0.55, -0.25, 0, 0.25, 0.55];    // Stage3: 5発


        angles.forEach(a => bossBullets.push({
        x: boss.x, y: baseY, r: 5,
        vx: Math.sin(a) * (2.0 + stage*0.25),
        vy: Math.cos(a) * (4.1 + stage*0.35),
        }));
    }

      se(170,0.03,"sine",0.05);
    }

    bossBullets.forEach(b => { b.x += b.vx; b.y += b.vy; });
    bossBullets = bossBullets.filter(b => b.y < H + 60 && b.x > -60 && b.x < W+60);

    // damage boss: weakpoint only
    for (let j=bullets.length-1; j>=0; j--) {
      const b = bullets[j];
      if (circleVsRect(b, boss.core)) {
        boss.hp -= 3;
        boss.coreHit = 10; // コア被弾演出（10フレーム）
        bullets.splice(j,1);
        se(160,0.02,"square",0.05);
        addParticles(boss.core.x, boss.core.y, 6);
      }
    }

    // laser weakpoint chip
    if (player.weapon === "laser" && player.laserCd > 0) {
      const beamHalf = 7;
      if (Math.abs(boss.core.x - player.x) <= (boss.core.w/2 + beamHalf)) {
        boss.hp -= 1;
        if (tick % 4 === 0) boss.coreHit = 6; // レーザーは控えめに点滅
      }
    }

    if (boss.hp <= 0) {
      boss = null;
      bossBullets = [];

      const clearBonus = noMiss ? 300 : 150;
      score += clearBonus;

      jingle("clear");
      startBgm("play");

      spawnItem("heal", W/2, 170);
      spawnItem("three", W/2-70, 210);
      spawnItem("laser", W/2+70, 210);

if (stage >= 3) {
  // ===== ENDING =====
  scene = Scene.End;
  endingTimer = 0;
  endingCharN = 0;

  stageIntro = 0;
  stageKills = 0;

  boss = null;
  bossBullets = [];
  ebullets = [];
  bullets = [];
  enemies = [];
  items = [];
  particles = [];

  // クリアSE（和音＋余韻）
  se(659, 0.22, "triangle", 0.30);
  se(784, 0.22, "triangle", 0.30);
  se(988, 0.26, "triangle", 0.40);
  se(1319, 0.20, "sine", 0.25);

  // BGMは静かに（今あるなら使う）
  fadeOutBgm?.(0.6);
} else {



    stage++;
    stageTime = 0;
    bossCleared = false;
    stageKills = 0;
    stageIntro = 120;
    }

      stageKills = 0;     // 次ステージ用に撃破数リセット（重要）
      stageIntro = 120;   // STAGE 2/3 表示（2秒）

    }
  }

  // player hit by enemies/ebullets/boss bullets
  if (invincible === 0) {
    const pRect = { x:player.x, y:player.y, w:player.w, h:player.h };

    for (let i=enemies.length-1;i>=0;i--){
      if (rectHit(pRect, enemies[i])) {
        enemies.splice(i,1);
        playerHit();
        break;
      }
    }

    for (let i=ebullets.length-1;i>=0;i--){
      const b=ebullets[i];
      if (circleHitPlayer(b.x,b.y,b.r)) {
        ebullets.splice(i,1);
        playerHit();
        break;
      }
    }

    for (let i=bossBullets.length-1;i>=0;i--){
      const b=bossBullets[i];
      if (circleHitPlayer(b.x,b.y,b.r)) {
        bossBullets.splice(i,1);
        playerHit();
        break;
      }
    }

    if (boss && rectHit(pRect, boss)) {
      playerHit();
    }
  }
}

// ---------- Draw ----------
function draw(){
  // ===== Ending Screen =====
  if (scene === Scene.End) {
    // 平和な背景：とりあえずStage1背景を流用（差し替えたいならここだけ変更）
    const bg = bgImages[1];
    if (bg && bg.complete) ctx.drawImage(bg, 0, 0, W, H);
    else { ctx.fillStyle = "#aee7ff"; ctx.fillRect(0,0,W,H); }

    // うっすら暗幕（文字を読みやすく）
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(0, 0, W, H);

    // ナレーション
    ctx.fillStyle = "#fff";
    ctx.font = "18px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const msg = ENDING_TEXT.slice(0, endingCharN);
    ctx.fillText(msg, W/2, H*0.42);

    // 促し
    ctx.font = "14px system-ui";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText("クリックでタイトルへ", W/2, H*0.62);

    // ここで終了（Play描画などをさせない）
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    return;
  }


  // --- draw background ---
if (scene === Scene.Play) {
  const bg = bgImages[stage];
  if (bg && bg.complete) {
    ctx.drawImage(bg, 0, 0, W, H);
  } else {
    // フォールバック（読み込み前）
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
  }
}
  
  ctx.save();
  if (shake > 0) ctx.translate((Math.random()-0.5)*8, (Math.random()-0.5)*8);

  const def = currentStageDef();
// 背景色は「画像が無い場合のみ」使用
if (!bgImages[stage] || !bgImages[stage].complete) {
  ctx.fillStyle = def.bg;
  ctx.fillRect(0,0,W,H);
}


  // particles
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  for (const p of particles) ctx.fillRect(p.x, p.y, 2, 2);

// HUD（※Play描画の最後にまとめて描画する）

  // scenes
if (scene === Scene.Title) {
  // --- タイトル背景画像 ---
  const bg = bgImages[0];
  if (bg && bg.complete) {
    ctx.drawImage(bg, 0, 0, W, H);
  } else {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
  }

  ctx.textAlign = "center";

  // UI位置（ドングリと被らないよう下寄せ）
  const uiY = Math.floor(H * 0.84);

if (!titleUnlocked) {
  // --- 最初は CLICK 表示（点滅） ---
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(0, uiY - 60, W, 120);

  // ★ CLICK 点滅（ゆっくり）
  const blink = 0.5 + 0.5 * Math.sin(tick * 0.05);
  ctx.globalAlpha = blink;

  ctx.fillStyle = "#fff";
  ctx.font = "28px system-ui";
  ctx.fillText("CLICK", W/2, uiY);

  // 補足テキストは常に表示
  ctx.globalAlpha = 0.85;
  ctx.font = "12px system-ui";
  ctx.fillText("クリックでメニュー表示", W/2, uiY + 30);

  ctx.globalAlpha = 1.0;
  ctx.textAlign = "start";
  ctx.restore();
  return;
}


  // --- メニュー表示 ---
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(0, uiY - 80, W, 160);

  ctx.fillStyle = "#fff";
  ctx.font = "14px system-ui";
  ctx.fillText("←/→ でメニュー切替　Enterで決定", W/2, uiY - 34);

  const labels = ["START", "HOW TO", "SETTINGS"];
  for (let i=0;i<3;i++){
    ctx.font = i===menuIndex ? "22px system-ui" : "18px system-ui";
    ctx.globalAlpha = i===menuIndex ? 1.0 : 0.65;
    ctx.fillText(labels[i], W/2 + (i-1)*140, uiY + 10);
  }
  ctx.globalAlpha = 1.0;

  ctx.font = "12px system-ui";
  ctx.globalAlpha = 0.9;
  ctx.fillText("スマホは下のボタンでも遊べる", W/2, uiY + 55);
  ctx.globalAlpha = 1.0;

  ctx.textAlign = "start";
  ctx.restore();
  return;
}


  if (scene === Scene.How) {
    ctx.textAlign="center";
    ctx.font="26px system-ui";
    ctx.fillText("HOW TO", W/2, 120);

    ctx.font="14px system-ui";
    ctx.fillText("・敵を倒してスコアを稼ぐ（連続撃破で倍率UP）", W/2, 180);
    ctx.fillText("・敵を撃ち漏らすとペナルティ（ライフ or スコア）", W/2, 210);
    ctx.fillText("・アイテム：＋回復 / 3=3WAY / L=LASER", W/2, 240);
    ctx.fillText("・ボスは“コア（中央）”だけが弱点！", W/2, 270);
    ctx.fillText("Enterで戻る", W/2, 330);

    ctx.textAlign="start";
    ctx.restore();
    return;
  }

  if (scene === Scene.Settings) {
    ctx.textAlign="center";
    ctx.font="26px system-ui";
    ctx.fillText("SETTINGS", W/2, 120);

    const itemsS = [
      { name:"MASTER", v: AudioBus.master },
      { name:"BGM", v: AudioBus.bgm },
      { name:"SE", v: AudioBus.se },
    ];

    ctx.font="14px system-ui";
    ctx.fillText("←/→ で項目切替　押しっぱで調整　Enterで戻る", W/2, 155);

    for (let i=0;i<3;i++){
      const y = 220 + i*70;
      ctx.globalAlpha = i===settingsIndex ? 1.0 : 0.55;
      ctx.font = i===settingsIndex ? "18px system-ui" : "16px system-ui";
      ctx.fillText(`${itemsS[i].name}: ${(itemsS[i].v*100)|0}%`, W/2, y);

      ctx.globalAlpha = 0.35;
      ctx.fillRect(W/2 - 140, y + 18, 280, 10);
      ctx.globalAlpha = 0.95;
      ctx.fillRect(W/2 - 140, y + 18, 280*itemsS[i].v, 10);
      ctx.globalAlpha = 1.0;
    }

    ctx.textAlign="start";
    ctx.restore();
    return;
  }

  if (scene === Scene.Over) {
    ctx.textAlign="center";
    ctx.font="34px system-ui";
    ctx.fillText("GAME OVER", W/2, H/2 - 30);
    ctx.font="16px system-ui";
    ctx.fillText(`SCORE ${score} / HI ${highScore}`, W/2, H/2 + 10);
    ctx.fillText("タップでタイトルへ（PCはEnter）", W/2, H/2 + 44);
    ctx.textAlign="start";
    ctx.restore();
    return;
  }

  // play draw
  const laserActive = (player.weapon === "laser" && player.laserCd > 0);
  // --- Barrier visual ---（※下のplayerに描画があるので、ここでは描かない）
  // player
    // --- Laser visual (FINAL / visible) ---
  if (player.weapon === "laser" && player.laserCd > 0) {
    const beamHalf = 7;

    // 外側（淡く）
    ctx.fillStyle = "rgba(120, 230, 255, 0.30)";
    ctx.fillRect(
      player.x - beamHalf,
      0,
      beamHalf * 2,
      player.y - 18
    );

    // 芯（さらに淡く）
    ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
    ctx.fillRect(
      player.x - 2,
      0,
      4,
      player.y - 18
    );
  }

    // --- Barrier visual ---
  if (skillActive > 0) {
    ctx.strokeStyle = "rgba(100,200,255,0.4)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(player.x, player.y, SKILL_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
  }


  const blink = invincible > 0 && Math.floor(invincible/5)%2===0;
if (!blink) {
  // 画像が読めていればPNGを描画、未読込なら従来の三角形でフォールバック
  if (playerImg.complete && playerImg.naturalWidth > 0) {
    ctx.drawImage(
      playerImg,
      Math.round(player.x - PLAYER_SPR_W / 2),
      Math.round(player.y - PLAYER_SPR_H / 2),
      PLAYER_SPR_W,
      PLAYER_SPR_H
    );
  } else {
    // fallback（読み込み前）
    ctx.fillStyle="#4dd2ff";
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - 14);
    ctx.lineTo(player.x - 14, player.y + 14);
    ctx.lineTo(player.x + 14, player.y + 14);
    ctx.closePath();
    ctx.fill();
  }
}


  // bullets
  ctx.fillStyle="#ffd54a";
  for (const b of bullets) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
    ctx.fill();
  }

  // enemies
for (const e of enemies) {
  const img = enemyImgs[e.type];

  // 画像があればスプライト、未ロードなら従来の四角でフォールバック
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(
      img,
      Math.round(e.x - ENEMY_SPR_W / 2),
      Math.round(e.y - ENEMY_SPR_H / 2),
      ENEMY_SPR_W,
      ENEMY_SPR_H
    );
  } else {
    if (e.type==="straight") ctx.fillStyle="#ff4d4d";
    else if (e.type==="zig") ctx.fillStyle="#ff7a4d";
    else ctx.fillStyle="#ff4d9b";
    ctx.fillRect(e.x-e.w/2, e.y-e.h/2, e.w, e.h);
  }
}


  // enemy bullets
  ctx.fillStyle="#ff9b4d";
  for (const b of ebullets) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
    ctx.fill();
  }

  // items
  for (const it of items) {
    if (it.type==="heal") {
      ctx.fillStyle="#4dff77";
      ctx.beginPath(); ctx.arc(it.x,it.y,it.r,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle="#0a0"; ctx.lineWidth=2;
      ctx.beginPath();
      ctx.moveTo(it.x-it.r*0.5,it.y); ctx.lineTo(it.x+it.r*0.5,it.y);
      ctx.moveTo(it.x,it.y-it.r*0.5); ctx.lineTo(it.x,it.y+it.r*0.5);
      ctx.stroke();
    } else if (it.type==="three") {
      ctx.fillStyle="#7aa7ff";
      ctx.beginPath(); ctx.arc(it.x,it.y,it.r,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#0b2a6b"; ctx.font="10px system-ui"; ctx.textAlign="center";
      ctx.fillText("3", it.x, it.y+3);
      ctx.textAlign="start";
    } else {
      ctx.fillStyle="#ff7ad9";
      ctx.beginPath(); ctx.arc(it.x,it.y,it.r,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#5a003f"; ctx.font="10px system-ui"; ctx.textAlign="center";
      ctx.fillText("L", it.x, it.y+3);
      ctx.textAlign="start";
    }
  }

    // boss
  if (boss) {
    // 1) 本体（ステージ別画像）
    const img = bossImgs[stage];
    if (img && img.complete && img.naturalWidth > 0) {
    // 本体は常に通常描画（phase2でも光らせない）
    ctx.drawImage(
    img,
    Math.round(boss.x - boss.w/2),
    Math.round(boss.y - boss.h/2),
    boss.w,
    boss.h
    );


      ctx.globalAlpha = 1.0;
    } else {
      // fallback（読み込み前）
      ctx.fillStyle="#b54dff";
      ctx.fillRect(boss.x-boss.w/2, boss.y-boss.h/2, boss.w, boss.h);
    }

    // 2) コア（弱点）— 常に描く（core only の見た目が分かるように）
    if (bossCoreImg && bossCoreImg.complete && bossCoreImg.naturalWidth > 0) {
      ctx.save();

const hit = boss.coreHit > 0;
const t = hit ? (boss.coreHit / 10) : 0; // 0〜1
const scale = 1 + t * 0.12;              // 最大12%だけ拡大

if (hit) {
  // 発光（クリスタルが光る感じ）
  ctx.shadowBlur = 18;
  ctx.shadowColor = "rgba(255, 80, 80, 0.95)";
}

const dw = boss.core.w * scale;
const dh = boss.core.h * scale;

ctx.drawImage(
  bossCoreImg,
  Math.round(boss.core.x - dw/2),
  Math.round(boss.core.y - dh/2),
  dw,
  dh
);

ctx.restore();

    } else {
      ctx.fillStyle="#00ffcc";
      ctx.fillRect(boss.core.x-boss.core.w/2, boss.core.y-boss.core.h/2, boss.core.w, boss.core.h);
    }

    // 3) HPバー（今まで通り）
    const barW = boss.w;
    const left = boss.x - barW/2;
    const top = boss.y - boss.h/2 - 16;
    ctx.fillStyle="rgba(255,255,255,0.25)";
    ctx.fillRect(left, top, barW, 8);
    ctx.fillStyle="#fff";
    ctx.fillRect(left, top, barW * clamp(boss.hp/boss.maxHp, 0, 1), 8);

    ctx.fillStyle="#fff";
    ctx.font="12px system-ui";
    ctx.fillText("BOSS (core only)", left, top - 4);

    // 4) ボス弾（今まで通り）
    ctx.fillStyle="#ff9b4d";
    for (const b of bossBullets) {
      ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fill();
    }
  }


  // hit flash overlay
  // ===== HUD（Play描画の最後に描く：ボス等に被られない）=====
  ctx.fillStyle="#fff";
  ctx.font="14px system-ui";
  ctx.fillText(`SCORE ${score}`, 10, 20);
  ctx.fillText(`HI ${highScore}`, 150, 20);
  ctx.fillText(`STAGE ${stage}`, W-88, 20);
  if (DEBUG && debugInvincible) {
  if (DEBUG) {
  ctx.fillStyle = "#fff";
  ctx.font = "12px system-ui";
  ctx.fillText("DBG: N=NextStage  B=Boss  K=KillBoss", 10, 128);
}
  
  ctx.fillStyle = "#fff";
  ctx.font = "12px system-ui";
  ctx.fillText("INVINCIBLE", 10, 112);
}


  ctx.font="18px system-ui";
  ctx.fillText("♥".repeat(Math.max(0,lives)) + "♡".repeat(Math.max(0,MAX_LIVES-lives)), 10, 46);

  ctx.font="12px system-ui";
  if (combo > 0) ctx.fillText(`COMBO ${combo}  x${multiplier}`, 10, 66);

  const wName = player.weapon==="three" ? "3WAY" : player.weapon==="laser" ? "LASER" : "NORMAL";
  const sec = player.weaponTimer > 0 ? Math.ceil(player.weaponTimer/60) : 0;
  ctx.fillText(player.weapon==="normal" ? `WEAPON ${wName}` : `WEAPON ${wName} (${sec}s)`, 10, 82);

  // --- Skill gauge UI ---
  ctx.fillStyle = "rgba(255,255,255,0.20)";
  ctx.fillRect(10, 98, 120, 8);
  ctx.fillStyle = "#4dd2ff";
  ctx.fillRect(10, 98, 120 * skillGauge, 8);
  ctx.fillStyle = "#fff";
  ctx.font = "12px system-ui";
  ctx.fillText("SKILL", 10, 92);

// --- GAME CLEAR overlay ---
if (gameClearTimer > 0) {
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#fff";
  ctx.font = "48px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("GAME CLEAR", W / 2, H / 2);
  ctx.textAlign = "left";
}
// --- Stage intro overlay ---
  if (stageIntro > 0 && gameClearTimer <= 0) {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff";
    ctx.font = "36px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(`STAGE ${stage}`, W / 2, H / 2);
    ctx.textAlign = "left";
  }

  if (flash > 0) {
    ctx.fillStyle = `rgba(255,40,40,${0.18 * (flash/14)})`;
    ctx.fillRect(0,0,W,H);
  }

  ctx.restore();
}

// ---------- Main loop ----------
function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}

// Boot
startBgm("title");
loop();
