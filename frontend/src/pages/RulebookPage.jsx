import React, { useState } from 'react';
import { useGame, FACTIONS } from '../context/GameContext';

const CHAPTERS = [
  {
    id: 'intro',
    icon: '⚔️',
    title: '歡迎來到戰場',
    sections: [
      {
        subtitle: '這是什麼地方？',
        content: '寶島大亂鬥是一個讓台灣各地網友「合法互撕」的競技平台。每天晚上 8 點，系統發布一道引戰題，全台五大陣營互相廝殺，用留言和按讚決定勝負。',
      },
      {
        subtitle: '基本流程',
        steps: [
          '選擇陣營，宣誓效忠（三個月不得叛逃）',
          '進入烽火台，看今日引戰題',
          '發表你的戰狼留言，替陣營攻打敵人',
          '幫己方的好留言按讚，讓它造成暴擊！',
          '週末結算勝負，輸的人受罰',
        ],
      },
    ],
  },
  {
    id: 'factions',
    icon: '🏳️',
    title: '五大陣營',
    sections: [
      {
        subtitle: '加入哪個陣營？',
        content: '根據你的身份認同選擇，一旦選定三個月內不能更換。每個陣營都有獨特稱號系統，連勝可以解鎖。',
        factionList: true,
      },
      {
        subtitle: '陣營稱號',
        content: '根據你的陣營連勝次數，可以解鎖三個專屬稱號（Lv.1 → Lv.3）。稱號顯示在你的名字旁，讓敵人知道你的戰績！',
        badges: ['糖分主宰者', '消波塊守護神', '天龍人代言者', '秘境探索者', '跨海戰士'],
      },
    ],
  },
  {
    id: 'arena',
    icon: '🔥',
    title: '每日烽火台',
    sections: [
      {
        subtitle: '戰場規則',
        content: '每天晚上 8 點，系統自動發布一道「引戰題」，題目精準踩在台灣人的痛點上。每個陣營有 1000 點血條，靠留言互相廝殺。',
      },
      {
        subtitle: '傷害判定系統',
        damages: [
          { icon: '👍', label: '按讚（一般）', effect: '對所有敵方陣營各造成 1 點傷害', color: '#22c55e', type: 'good' },
          { icon: '💥', label: '暴擊（5 讚以上）', effect: '觸發暴擊！留言繼續獲讚，每讚追加 3 點傷害', color: '#f59e0b', type: 'great' },
          { icon: '👎', label: '倒讚（一般）', effect: '對自己陣營造成 1 點友軍傷害（發廢言要付出代價！）', color: '#ef4444', type: 'bad' },
          { icon: '🐢', label: '8 個倒讚', effect: '發言者被關進太平洋戰俘營，禁言 24 小時！', color: '#dc2626', type: 'terrible' },
        ],
      },
      {
        subtitle: '彈幕系統',
        content: '當一條留言累積 10 個讚，它會以巨大字體橫掃整個螢幕！好的發言讓全場都看到你的名字！',
      },
    ],
  },
  {
    id: 'strategy',
    icon: '🧠',
    title: '進階戰術',
    sections: [
      {
        subtitle: '同溫層（陣營密室）',
        content: '點擊頂部「同溫層」進入你的陣營專屬密室。這裡只有自己人看得到，可以擬定戰術，協調攻擊方向。敵方完全無法查看！',
        tip: '💡 小技巧：在同溫層協調好攻擊方向，集中火力讓同一條留言衝上 5 讚觸發暴擊！',
      },
      {
        subtitle: '什麼樣的留言最有效？',
        dos: [
          '有理有據，附上具體例子',
          '幽默諷刺，讓人忍不住按讚',
          '踩在對方陣營的痛點上',
          '反將一軍，把對方的攻擊變成自己的優勢',
        ],
        donts: [
          '無腦飆髒話（容易被倒讚）',
          '離題廢言（浪費火力）',
          '對人身攻擊（觸發戰俘營懲罰）',
          '跳針重複同樣的話（無聊沒有讚）',
        ],
      },
    ],
  },
  {
    id: 'prison',
    icon: '🐢',
    title: '太平洋戰俘營',
    sections: [
      {
        subtitle: '什麼情況會被關？',
        content: '當你的留言累積 8 個倒讚，系統判定為惡意發言或跳針，你將被強制關入太平洋戰俘營。',
        punishments: [
          '禁言 24 小時，無法在戰場發言',
          '無法使用同溫層聊天室',
          '頭像強制變成海龜 🐢',
          '全伺服器公告你被關進去的消息（供人嘲笑）',
        ],
      },
      {
        subtitle: '如何避免進戰俘營？',
        content: '發言要有內容，不要只是飆話。就算你很生氣，也要把情緒轉化成有力的論點。空洞的發言是最沒用的武器。',
        tip: '⚠️ 友情提醒：別忘了你的爛留言也會對自己陣營扣血，你不只害了自己，還害了整個陣營！',
      },
    ],
  },
  {
    id: 'tribunal',
    icon: '📊',
    title: '每週戰報法庭',
    sections: [
      {
        subtitle: '週末結算',
        content: '每週結算時，依照各陣營剩餘血量決定排名。血量最多的陣營獲勝，血量最少的陣營落敗。',
      },
      {
        subtitle: '戰敗懲罰',
        content: '輸的陣營在下週一登入時，整個網站介面強制套上「戰敗濾鏡」（灰階 + 色調偏移），直到他們在下一場戰役中贏回來！',
        tip: '🏆 贏家的陣營在當週剩餘時間享有視覺特效加持，讓對手看了眼紅！',
      },
    ],
  },
];

export default function RulebookPage() {
  const { setPage, user } = useGame();
  const [activeChapter, setActiveChapter] = useState('intro');

  const chapter = CHAPTERS.find(c => c.id === activeChapter);

  return (
    <div className="rulebook-page">
      <div className="rulebook-header">
        <button className="back-btn" onClick={() => setPage(user ? 'arena' : 'landing')}>
          ← {user ? '回戰場' : '返回'}
        </button>
        <div className="rulebook-title-area">
          <h1>📖 規則書</h1>
          <p>新手必讀・老兵複習</p>
        </div>
      </div>

      <div className="rulebook-layout">
        {/* 章節目錄 */}
        <nav className="rulebook-nav">
          {CHAPTERS.map(ch => (
            <button
              key={ch.id}
              className={`chapter-btn ${activeChapter === ch.id ? 'active' : ''}`}
              onClick={() => setActiveChapter(ch.id)}
            >
              <span className="chapter-icon">{ch.icon}</span>
              <span className="chapter-title">{ch.title}</span>
            </button>
          ))}
        </nav>

        {/* 內容區 */}
        <div className="rulebook-content">
          <div className="chapter-header">
            <span className="chapter-big-icon">{chapter.icon}</span>
            <h2>{chapter.title}</h2>
          </div>

          {chapter.sections.map((sec, si) => (
            <div key={si} className="rulebook-section">
              <h3 className="section-subtitle">{sec.subtitle}</h3>

              {sec.content && <p className="section-text">{sec.content}</p>}

              {sec.steps && (
                <ol className="steps-list">
                  {sec.steps.map((step, i) => (
                    <li key={i} className="step-item">
                      <span className="step-number">{i + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              )}

              {sec.factionList && (
                <div className="faction-showcase">
                  {Object.values(FACTIONS).map(f => (
                    <div key={f.id} className="faction-show-card" style={{ '--c': f.color }}>
                      <span className="fs-emoji">{f.emoji}</span>
                      <span className="fs-name">{f.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {sec.badges && (
                <div className="badge-examples">
                  {sec.badges.map((b, i) => (
                    <span key={i} className="badge-example">🎖️ {b}</span>
                  ))}
                </div>
              )}

              {sec.damages && (
                <div className="damage-table">
                  {sec.damages.map((d, i) => (
                    <div key={i} className={`damage-row damage-${d.type}`} style={{ '--dc': d.color }}>
                      <span className="damage-icon">{d.icon}</span>
                      <div className="damage-info">
                        <div className="damage-label">{d.label}</div>
                        <div className="damage-effect">{d.effect}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {sec.tip && (
                <div className="section-tip">
                  {sec.tip}
                </div>
              )}

              {sec.dos && sec.donts && (
                <div className="dos-donts">
                  <div className="dos">
                    <div className="dos-title">✅ 這樣做</div>
                    <ul>
                      {sec.dos.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                  </div>
                  <div className="donts">
                    <div className="donts-title">❌ 不要這樣</div>
                    <ul>
                      {sec.donts.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                  </div>
                </div>
              )}

              {sec.punishments && (
                <ul className="punishment-list">
                  {sec.punishments.map((p, i) => (
                    <li key={i} className="punishment-item">
                      <span>🔒</span> {p}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {/* 章節切換按鈕 */}
          <div className="chapter-nav-btns">
            {CHAPTERS.findIndex(c => c.id === activeChapter) > 0 && (
              <button
                className="chapter-prev"
                onClick={() => {
                  const idx = CHAPTERS.findIndex(c => c.id === activeChapter);
                  setActiveChapter(CHAPTERS[idx - 1].id);
                }}
              >
                ← 上一章
              </button>
            )}
            {CHAPTERS.findIndex(c => c.id === activeChapter) < CHAPTERS.length - 1 ? (
              <button
                className="chapter-next"
                onClick={() => {
                  const idx = CHAPTERS.findIndex(c => c.id === activeChapter);
                  setActiveChapter(CHAPTERS[idx + 1].id);
                }}
              >
                下一章 →
              </button>
            ) : (
              <button className="chapter-next ready" onClick={() => setPage(user ? 'arena' : 'select')}>
                {user ? '⚔️ 回到戰場！' : '⚔️ 去選陣營！'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 手機底部導覽 */}
      {user && (
        <nav className="mobile-bottom-nav">
          <button className="mobile-nav-btn" onClick={() => setPage('arena')}>
            <span className="mobile-nav-icon">⚔️</span>
            戰場
          </button>
          <button className="mobile-nav-btn" onClick={() => setPage('chat')}>
            <span className="mobile-nav-icon">💬</span>
            同溫層
          </button>
          <button className="mobile-nav-btn" onClick={() => setPage('tribunal')}>
            <span className="mobile-nav-icon">📊</span>
            戰報
          </button>
          <button className="mobile-nav-btn active">
            <span className="mobile-nav-icon">📖</span>
            規則書
          </button>
        </nav>
      )}
    </div>
  );
}
