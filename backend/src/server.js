const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const distPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(distPath));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// ─── 常數 ─────────────────────────────────────────────────────────────────────

const FACTIONS = {
  north:   { id: 'north',   name: '天龍北', emoji: '🐉', color: '#4f46e5', maxHp: 1000 },
  central: { id: 'central', name: '慶記中', emoji: '🦁', color: '#dc2626', maxHp: 1000 },
  south:   { id: 'south',   name: '暖男南', emoji: '🌊', color: '#0891b2', maxHp: 1000 },
  east:    { id: 'east',    name: '好山東', emoji: '🏔️', color: '#16a34a', maxHp: 1000 },
  island:  { id: 'island',  name: '外島幫', emoji: '🏝️', color: '#d97706', maxHp: 1000 },
};

const DAILY_TOPICS = [
  '北部粽到底是不是 3D 油飯？',
  '丹丹漢堡到底算不算神店，還是只是吃粗飽的？',
  '滷肉飯上面加肉鬆是不是一種邪教？',
  '吃火鍋把芋頭丟下去煮的，是不是都該抓去關？',
  '自來水煮沸直接喝，到底有沒有味道？',
  '機車兩段式左轉是保護安全還是歧視機車族？',
  '冬天氣溫 15 度，濕冷 vs 狂風，哪裡比較冷？',
  '哪裡的火車站設計最像迷宮，讓人最容易迷路？',
  '珍珠奶茶要加冰還是去冰，這根本是人格測驗？',
  '鳳梨酥裡面有沒有鳳梨，才是正宗的？',
  '肉圓要炸的還是要蒸的？',
  '台灣哪裡的人最會說「啊就」？',
];

const HEAVY_DISLIKE_LIMIT = 10;    // 每小時重拳額度
const HEAVY_DISLIKE_DMG  = 8;      // 重拳傷害
const NORMAL_DISLIKE_DMG = 2;      // 超額後傷害
const LIKE_HEAL          = 3;      // 同陣營按讚回血
const TRAITOR_PENALTY    = 2;      // 背骨仔按讚己方扣血
const FOCUS_MULTIPLIER   = 1.5;    // 集火加成
const FOCUS_WINDOW_MS    = 30000;  // 集火時間窗口 30 秒
const FOCUS_THRESHOLD    = 3;      // 觸發集火需要幾人
const EARTHQUAKE_PCT     = 0.05;   // 邏輯慘敗傷害（最大血量 5%）
const CELEBRATION_MS     = 30 * 60 * 1000; // 慶功模式 30 分鐘

// ─── 遊戲狀態 ─────────────────────────────────────────────────────────────────

function freshFactions() {
  return Object.fromEntries(
    Object.entries(FACTIONS).map(([k, f]) => [k, {
      ...f, hp: f.maxHp, fallen: false,
    }])
  );
}

let gameState = {
  factions: freshFactions(),
  currentTopic: DAILY_TOPICS[0],
  topicIndex: 0,
  comments: [],
  victoryAnnounced: false,
  celebrationMode: false,
  celebrationEndsAt: null,
  winner: null,
  heroHall: [],          // 英雄塚（歷屆開戰大將軍）
};

const users = new Map();      // socketId -> user
const factionRooms = {};      // factionId -> Set<socketId>

// ─── 戰鬥邏輯 ─────────────────────────────────────────────────────────────────

/** 對指定陣營扣血，若歸零觸發淪陷 */
function damageFaction(factionId, dmg) {
  const f = gameState.factions[factionId];
  if (!f || f.fallen) return 0;
  const actual = Math.min(f.hp, Math.round(dmg));
  f.hp = Math.max(0, f.hp - actual);
  if (f.hp === 0) declareFallen(factionId);
  return actual;
}

/** 對指定陣營回血 */
function healFaction(factionId, amount) {
  const f = gameState.factions[factionId];
  if (!f || f.fallen) return;
  f.hp = Math.min(f.maxHp, f.hp + Math.round(amount));
}

/** 陣營淪陷 */
function declareFallen(factionId) {
  const f = gameState.factions[factionId];
  if (f.fallen) return;
  f.fallen = true;
  console.log(`💀 ${FACTIONS[factionId].name} 淪陷！`);
  io.emit('faction:fallen', { faction: FACTIONS[factionId] });
  checkVictory();
}

/** 檢查是否只剩一個陣營存活 → 宣告勝利 */
function checkVictory() {
  if (gameState.victoryAnnounced) return;
  const alive = Object.values(gameState.factions).filter(f => !f.fallen);
  if (alive.length !== 1) return;

  gameState.victoryAnnounced = true;
  gameState.celebrationMode = true;
  gameState.winner = alive[0];
  gameState.celebrationEndsAt = Date.now() + CELEBRATION_MS;

  // 找出本輪傷害最高的大將軍
  let topDmg = 0, champion = null;
  users.forEach(u => {
    if ((u.damageDealt || 0) > topDmg) {
      topDmg = u.damageDealt;
      champion = u;
    }
  });

  const entry = champion ? {
    id: uuidv4(),
    username: champion.username,
    faction: champion.faction,
    factionInfo: FACTIONS[champion.faction],
    damage: topDmg,
    topic: gameState.currentTopic,
    timestamp: Date.now(),
  } : null;

  if (entry) gameState.heroHall.push(entry);
  if (gameState.heroHall.length > 20) gameState.heroHall.shift();

  io.emit('battle:victory', {
    winner: FACTIONS[alive[0].id],
    champion: entry,
    heroHall: [...gameState.heroHall].reverse().slice(0, 10),
    celebrationEndsAt: gameState.celebrationEndsAt,
  });

  console.log(`🏆 ${FACTIONS[alive[0].id].name} 奪得台灣之霸！`);

  // 30 分鐘後自動重置
  setTimeout(() => resetBattle(), CELEBRATION_MS);
}

/** 重置整場戰鬥 */
function resetBattle(forceTopicIdx) {
  const nextIdx = typeof forceTopicIdx === 'number'
    ? forceTopicIdx
    : (gameState.topicIndex + 1) % DAILY_TOPICS.length;

  gameState.factions = freshFactions();
  gameState.topicIndex = nextIdx;
  gameState.currentTopic = DAILY_TOPICS[nextIdx];
  gameState.comments = [];
  gameState.victoryAnnounced = false;
  gameState.celebrationMode = false;
  gameState.celebrationEndsAt = null;
  gameState.winner = null;

  // 重置所有玩家傷害統計
  users.forEach(u => { u.damageDealt = 0; u.dislikeTimestamps = []; });

  io.emit('battle:reset', {
    factions: gameState.factions,
    currentTopic: gameState.currentTopic,
    heroHall: [...gameState.heroHall].reverse().slice(0, 10),
  });
  console.log(`🔄 戰場重置！新題目：${gameState.currentTopic}`);
}

/** 計算玩家重拳額度 */
function getDislikeInfo(user) {
  const now = Date.now();
  if (!user.dislikeTimestamps) user.dislikeTimestamps = [];
  // 清除超過一小時的記錄
  user.dislikeTimestamps = user.dislikeTimestamps.filter(t => now - t < 3600000);
  const isHeavy = user.dislikeTimestamps.length < HEAVY_DISLIKE_LIMIT;
  const remaining = Math.max(0, HEAVY_DISLIKE_LIMIT - user.dislikeTimestamps.length);
  user.dislikeTimestamps.push(now);
  return { isHeavy, remaining };
}

/** 集火偵測：短時間內多人倒讚同一條留言 */
function detectFocusFire(comment) {
  const now = Date.now();
  if (!comment.recentDislikeLog) comment.recentDislikeLog = [];
  comment.recentDislikeLog.push(now);
  // 只留窗口內的記錄
  comment.recentDislikeLog = comment.recentDislikeLog.filter(t => now - t < FOCUS_WINDOW_MS);
  return comment.recentDislikeLog.length >= FOCUS_THRESHOLD;
}

// ─── Socket.io ────────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`🟢 ${socket.id}`);

  // ── 加入遊戲 ──
  socket.on('user:join', ({ username, faction }) => {
    const user = {
      id: socket.id,
      username,
      faction,
      isPrisoner: false,
      damageDealt: 0,
      dislikeTimestamps: [],
      likeLog: {},         // factionId -> count，用於背骨仔偵測
    };
    users.set(socket.id, user);

    if (!factionRooms[faction]) factionRooms[faction] = new Set();
    factionRooms[faction].add(socket.id);
    socket.join(`faction:${faction}`);

    socket.emit('game:state', {
      factions: gameState.factions,
      currentTopic: gameState.currentTopic,
      comments: gameState.comments.slice(-50),
      user,
      heroHall: [...gameState.heroHall].reverse().slice(0, 10),
      victoryAnnounced: gameState.victoryAnnounced,
      winner: gameState.winner ? FACTIONS[gameState.winner.id] : null,
      celebrationEndsAt: gameState.celebrationEndsAt,
    });

    io.emit('user:joined', { username, faction: FACTIONS[faction] });
  });

  // ── 發言 ──
  socket.on('comment:post', ({ text }) => {
    const user = users.get(socket.id);
    if (!user) return;

    if (user.isPrisoner) {
      socket.emit('error', { message: '你在戰俘營裡！🐢 禁言中！' });
      return;
    }
    if (gameState.factions[user.faction]?.fallen) {
      socket.emit('error', { message: '你的陣營已淪陷！只能觀戰！' });
      return;
    }
    if (gameState.victoryAnnounced) {
      socket.emit('error', { message: '戰役已結束！等待下一局！' });
      return;
    }

    const comment = {
      id: uuidv4(),
      userId: socket.id,
      username: user.username,
      faction: user.faction,
      factionInfo: FACTIONS[user.faction],
      text,
      likes: 0,
      dislikes: 0,
      voters: {},
      recentDislikeLog: [],
      timestamp: Date.now(),
      isCritical: false,
      isEarthquaked: false,
    };

    gameState.comments.push(comment);
    if (gameState.comments.length > 200) gameState.comments.shift();
    io.emit('comment:new', comment);
  });

  // ── 投票（核心戰鬥邏輯）──
  socket.on('comment:vote', ({ commentId, vote }) => {
    const voter = users.get(socket.id);
    if (!voter) return;

    const comment = gameState.comments.find(c => c.id === commentId);
    if (!comment) return;
    if (comment.voters[socket.id]) return;  // 已投票
    if (comment.userId === socket.id) return; // 不能對自己投票

    comment.voters[socket.id] = vote;

    // ── 倒讚：攻擊對方陣營 ──
    if (vote === 'dislike') {
      comment.dislikes++;

      const { isHeavy, remaining } = getDislikeInfo(voter);
      let dmg = isHeavy ? HEAVY_DISLIKE_DMG : NORMAL_DISLIKE_DMG;

      // 集火加成
      const isFocus = detectFocusFire(comment);
      if (isFocus) {
        dmg = Math.round(dmg * FOCUS_MULTIPLIER);
        io.emit('battle:focus', {
          commentId,
          username: comment.username,
          faction: FACTIONS[comment.faction],
          multiplier: FOCUS_MULTIPLIER,
        });
      }

      const actual = damageFaction(comment.faction, dmg);
      voter.damageDealt = (voter.damageDealt || 0) + actual;

      // 通知投票者剩餘重拳額度
      socket.emit('vote:info', { remaining: Math.max(0, remaining - 1), isHeavy });

      // 邏輯慘敗：倒讚 ≥ 3 倍按讚 且 倒讚 ≥ 5 → 地區大地震（只觸發一次）
      if (!comment.isEarthquaked && comment.dislikes >= 5 && comment.dislikes >= comment.likes * 3) {
        comment.isEarthquaked = true;
        const quakeDmg = gameState.factions[comment.faction]?.maxHp * EARTHQUAKE_PCT || 50;
        damageFaction(comment.faction, quakeDmg);
        voter.damageDealt = (voter.damageDealt || 0) + quakeDmg;
        io.emit('battle:earthquake', {
          comment,
          damage: quakeDmg,
          faction: FACTIONS[comment.faction],
          factions: gameState.factions,
        });
      }

      // 戰俘營：8 倒讚
      if (comment.dislikes >= 8) {
        const commentUser = users.get(comment.userId);
        if (commentUser && !commentUser.isPrisoner) {
          commentUser.isPrisoner = true;
          io.to(comment.userId).emit('prison:enter', {
            message: '你已被送進太平洋戰俘營 🐢 禁言 24 小時！',
          });
          io.emit('prison:announce', {
            username: commentUser.username,
            faction: FACTIONS[commentUser.faction],
          });
        }
      }
    }

    // ── 按讚：同陣營回血 / 跨陣營背骨仔懲罰 ──
    else {
      comment.likes++;

      const isSameFaction = voter.faction === comment.faction;

      if (isSameFaction) {
        // 同陣營按讚 → 回血
        healFaction(comment.faction, LIKE_HEAL);
      } else {
        // 跨陣營按讚 → 背骨仔扣己方血
        voter.likeLog[comment.faction] = (voter.likeLog[comment.faction] || 0) + 1;
        damageFaction(voter.faction, TRAITOR_PENALTY);
        socket.emit('vote:traitor', {
          message: `背骨仔！你按讚了敵方留言，己方扣 ${TRAITOR_PENALTY} 血！`,
        });
      }

      // 暴擊（5 讚）：廣播警報 + 回更多血
      if (comment.likes === 5 && !comment.isCritical) {
        comment.isCritical = true;
        healFaction(comment.faction, 20); // 暴擊額外回血
        io.emit('battle:critical', {
          comment,
          bonus: 20,
          attacker: FACTIONS[comment.faction],
          factions: gameState.factions,
        });
      }

      // 10 讚 → 彈幕
      if (comment.likes >= 10) {
        io.emit('barrage:fire', {
          text: comment.text,
          faction: comment.faction,
          factionInfo: FACTIONS[comment.faction],
          username: comment.username,
        });
      }
    }

    io.emit('comment:updated', comment);
    io.emit('factions:updated', gameState.factions);
  });

  // ── 同溫層 ──
  socket.on('faction:chat', ({ message }) => {
    const user = users.get(socket.id);
    if (!user || user.isPrisoner) return;

    const msg = { username: user.username, message, timestamp: Date.now() };
    socket.to(`faction:${user.faction}`).emit('faction:message', msg);
    socket.emit('faction:message', { ...msg, isSelf: true });
  });

  // ── 斷線 ──
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user && factionRooms[user.faction]) factionRooms[user.faction].delete(socket.id);
    users.delete(socket.id);
  });
});

// ─── REST API ─────────────────────────────────────────────────────────────────

app.get('/api/state', (req, res) => {
  res.json({
    factions: gameState.factions,
    currentTopic: gameState.currentTopic,
    topComments: [...gameState.comments].sort((a, b) => b.dislikes - a.dislikes).slice(0, 10),
    onlineCount: users.size,
    victoryAnnounced: gameState.victoryAnnounced,
    winner: gameState.winner ? FACTIONS[gameState.winner.id] : null,
    heroHall: [...gameState.heroHall].reverse().slice(0, 10),
  });
});

app.post('/api/reset', (req, res) => {
  resetBattle();
  res.json({ message: '戰場已重置！' });
});

app.get('/api/heroes', (req, res) => {
  res.json({ heroHall: [...gameState.heroHall].reverse() });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ─── 排程 ─────────────────────────────────────────────────────────────────────
// 每分鐘檢查：每週日 23:59 強制結算
setInterval(() => {
  const now = new Date();
  const isSundayNight = now.getDay() === 0 && now.getHours() === 23 && now.getMinutes() === 59;
  if (isSundayNight && !gameState.victoryAnnounced) {
    // 強制以血量判斷勝者
    const sorted = Object.values(gameState.factions)
      .filter(f => !f.fallen)
      .sort((a, b) => b.hp - a.hp);
    if (sorted.length > 0) {
      // 讓其他所有陣營淪陷
      Object.keys(gameState.factions).forEach(fid => {
        if (fid !== sorted[0].id) declareFallen(fid);
      });
    }
  }
  // 週一 00:00 重置
  const isMondayMidnight = now.getDay() === 1 && now.getHours() === 0 && now.getMinutes() === 0;
  if (isMondayMidnight) resetBattle();
}, 60000);

// ─── 啟動 ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🔥 寶島大亂鬥伺服器啟動於 port ${PORT}`);
});
