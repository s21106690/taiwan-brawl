const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

// 部署時 serve 前端靜態檔
const distPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(distPath));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// ─── 資料庫（In-memory，模擬 Redis）──────────────────────────────────────────

const FACTIONS = {
  north: { id: 'north', name: '天龍北', emoji: '🐉', color: '#4f46e5', hp: 1000, maxHp: 1000 },
  central: { id: 'central', name: '慶記中', emoji: '🦁', color: '#dc2626', hp: 1000, maxHp: 1000 },
  south: { id: 'south', name: '暖男南', emoji: '🌊', color: '#0891b2', hp: 1000, maxHp: 1000 },
  east: { id: 'east', name: '好山東', emoji: '🏔️', color: '#16a34a', hp: 1000, maxHp: 1000 },
  island: { id: 'island', name: '外島幫', emoji: '🏝️', color: '#d97706', hp: 1000, maxHp: 1000 },
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
];

const FACTION_TITLES = {
  south: ['糖分主宰者', '熱情使者', '甜蜜戰神'],
  central: ['消波塊守護神', '大肚山霸主', '海線之王'],
  north: ['天龍人代言者', '捷運依賴症患者', '大安森林守護者'],
  east: ['秘境探索者', '好山好水信徒', '太魯閣勇士'],
  island: ['離島霸主', '澎湖菊島之子', '跨海戰士'],
};

// 遊戲狀態
let gameState = {
  factions: JSON.parse(JSON.stringify(FACTIONS)),
  currentTopic: DAILY_TOPICS[Math.floor(Math.random() * DAILY_TOPICS.length)],
  topicIndex: 0,
  comments: [],
  weeklyStats: Object.fromEntries(Object.keys(FACTIONS).map(k => [k, { wins: 0, losses: 0 }])),
  prisoners: new Set(), // 被關進戰俘營的 userId
};

const users = new Map(); // socketId -> user
const factionRooms = {}; // factionId -> Set of socketId

// ─── 工具函式 ─────────────────────────────────────────────────────────────────

function applyDamage(attackerFaction, damage) {
  const enemies = Object.keys(gameState.factions).filter(f => f !== attackerFaction);
  const dmgPerEnemy = Math.floor(damage / enemies.length);
  enemies.forEach(f => {
    gameState.factions[f].hp = Math.max(0, gameState.factions[f].hp - dmgPerEnemy);
  });
}

function applyFriendlyFire(faction, damage) {
  gameState.factions[faction].hp = Math.max(0, gameState.factions[faction].hp - damage);
}

function resetDailyBattle() {
  Object.keys(gameState.factions).forEach(f => {
    gameState.factions[f].hp = gameState.factions[f].maxHp;
  });
  gameState.topicIndex = (gameState.topicIndex + 1) % DAILY_TOPICS.length;
  gameState.currentTopic = DAILY_TOPICS[gameState.topicIndex];
  gameState.comments = [];
  io.emit('battle:reset', gameState);
}

// ─── Socket.io 事件 ───────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`🟢 連線: ${socket.id}`);

  // 使用者加入
  socket.on('user:join', ({ username, faction }) => {
    const user = {
      id: socket.id,
      username,
      faction,
      score: 0,
      wins: 0,
      isPrisoner: false,
      title: '',
    };
    users.set(socket.id, user);

    if (!factionRooms[faction]) factionRooms[faction] = new Set();
    factionRooms[faction].add(socket.id);
    socket.join(`faction:${faction}`);

    // 傳送目前遊戲狀態給新加入者
    socket.emit('game:state', {
      factions: gameState.factions,
      currentTopic: gameState.currentTopic,
      comments: gameState.comments.slice(-50),
      user,
    });

    io.emit('user:joined', { username, faction: FACTIONS[faction] });
    console.log(`👤 ${username} 加入 ${FACTIONS[faction].name}`);
  });

  // 發送戰場留言
  socket.on('comment:post', ({ text }) => {
    const user = users.get(socket.id);
    if (!user) return;

    if (user.isPrisoner) {
      socket.emit('error', { message: '你在戰俘營裡！24 小時後才能回到戰場！🐢' });
      return;
    }

    const commentId = uuidv4();
    const comment = {
      id: commentId,
      userId: socket.id,
      username: user.username,
      faction: user.faction,
      factionInfo: FACTIONS[user.faction],
      text,
      likes: 0,
      dislikes: 0,
      voters: {},
      timestamp: Date.now(),
      isCritical: false,
    };

    gameState.comments.push(comment);
    if (gameState.comments.length > 200) gameState.comments.shift();

    io.emit('comment:new', comment);
  });

  // 點讚/倒讚
  socket.on('comment:vote', ({ commentId, vote }) => {
    const voter = users.get(socket.id);
    if (!voter) return;

    const comment = gameState.comments.find(c => c.id === commentId);
    if (!comment) return;
    if (comment.voters[socket.id]) return; // 已投過票

    comment.voters[socket.id] = vote;

    if (vote === 'like') {
      comment.likes++;
      // 讚達到暴擊門檻 -> 對敵方造成傷害
      if (comment.likes >= 5 && !comment.isCritical) {
        comment.isCritical = true;
        const damage = comment.likes * 3;
        applyDamage(comment.faction, damage);
        io.emit('battle:critical', {
          comment,
          damage,
          attacker: FACTIONS[comment.faction],
          factions: gameState.factions,
        });
      } else if (comment.isCritical) {
        applyDamage(comment.faction, 3);
      } else {
        applyDamage(comment.faction, 1);
      }
    } else {
      comment.dislikes++;
      // 倒讚 -> 自我傷害
      if (comment.dislikes >= 3) {
        applyFriendlyFire(comment.faction, 5);
        // 惡意發言判定 -> 送入戰俘營
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
      applyFriendlyFire(comment.faction, 1);
    }

    io.emit('comment:updated', comment);
    io.emit('factions:updated', gameState.factions);

    // 彈幕 - 高讚留言廣播
    if (comment.likes >= 10) {
      io.emit('barrage:fire', {
        text: comment.text,
        faction: comment.faction,
        factionInfo: FACTIONS[comment.faction],
        username: comment.username,
      });
    }
  });

  // 同溫層聊天室
  socket.on('faction:chat', ({ message }) => {
    const user = users.get(socket.id);
    if (!user || user.isPrisoner) return;

    socket.to(`faction:${user.faction}`).emit('faction:message', {
      username: user.username,
      message,
      timestamp: Date.now(),
    });
    socket.emit('faction:message', {
      username: user.username,
      message,
      timestamp: Date.now(),
      isSelf: true,
    });
  });

  // 斷線
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user && factionRooms[user.faction]) {
      factionRooms[user.faction].delete(socket.id);
    }
    users.delete(socket.id);
    console.log(`🔴 斷線: ${socket.id}`);
  });
});

// ─── REST API ─────────────────────────────────────────────────────────────────

app.get('/api/state', (req, res) => {
  res.json({
    factions: gameState.factions,
    currentTopic: gameState.currentTopic,
    topComments: [...gameState.comments]
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 10),
    onlineCount: users.size,
  });
});

app.get('/api/topics', (req, res) => {
  res.json({ topics: DAILY_TOPICS });
});

app.post('/api/reset', (req, res) => {
  resetDailyBattle();
  res.json({ message: '戰場已重置！' });
});

// 所有非 API 路由都回傳前端 index.html（SPA fallback）
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ─── 排程：每天晚上 8 點重置 ─────────────────────────────────────────────────
// (簡化版：每小時檢查是否需要重置)
setInterval(() => {
  const now = new Date();
  if (now.getHours() === 20 && now.getMinutes() === 0) {
    resetDailyBattle();
    console.log('🔔 每日烽火台重置！');
  }
}, 60000);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🔥 寶島大亂鬥伺服器啟動於 port ${PORT}`);
  console.log(`📡 WebSocket 準備就緒`);
});
