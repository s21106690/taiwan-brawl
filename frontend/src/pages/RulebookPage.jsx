import React, { useState, useRef, useEffect } from 'react';
import { useGame, FACTIONS } from '../context/GameContext';

const CHAPTERS = [
  {
    id: 'intro',
    icon: '⚔️',
    title: '歡迎來到戰場',
    sections: [
      {
        subtitle: '這是什麼地方？',
        content: '寶島大亂鬥是一個讓台灣各地網友「合法互撕」的生存競技平台。五大陣營同台廝殺，靠著留言、按讚、倒讚決定勝負——最後存活的陣營，就是本輪台灣之霸！',
      },
      {
        subtitle: '基本流程',
        steps: [
          '選擇陣營，宣誓效忠（三個月不得叛逃）',
          '進入烽火台，看今日引戰題',
          '發表你的戰狼留言，讓敵人有機可倒讚',
          '瘋狂倒讚敵方留言，造成傷害！',
          '同陣營互相按讚，補充血量！',
          '讓敵方血條歸零→淪陷，最後存活者就是王者',
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
    id: 'combat',
    icon: '🔥',
    title: '戰鬥機制',
    sections: [
      {
        subtitle: '核心原則',
        content: '留言本身不造成傷害——傷害來自「按讚」與「倒讚」的互動。你要讓對方的爛留言被瘋狂倒讚，同時保護己方的好留言！',
      },
      {
        subtitle: '倒讚：主要攻擊手段',
        damages: [
          {
            icon: '💢',
            label: '重拳倒讚（每小時限 10 次）',
            effect: '每次造成 8 點傷害，直接扣對方陣營血條。額度用盡前，火力全開！',
            color: '#ef4444',
            type: 'terrible',
          },
          {
            icon: '👎',
            label: '普通倒讚（超出額度後）',
            effect: '每小時 10 次重拳用盡後，倒讚降為 2 點傷害。仍有效，但不建議浪費在雜魚留言上。',
            color: '#f97316',
            type: 'bad',
          },
          {
            icon: '🎯',
            label: '集火加成（30 秒內 3 人以上同時倒讚）',
            effect: '短時間內多人圍毆同一則留言，觸發集火加成！傷害 ×1.5 倍，配合同溫層號召更有效！',
            color: '#f59e0b',
            type: 'great',
          },
          {
            icon: '🌋',
            label: '邏輯慘敗（倒讚 ≥ 3 倍按讚，且倒讚 ≥ 5）',
            effect: '發言被判定「邏輯慘敗」，觸發地區大地震！對該陣營造成一次性 5% 最大血量的毀滅傷害（每則留言只觸發一次）。',
            color: '#dc2626',
            type: 'terrible',
          },
        ],
      },
      {
        subtitle: '按讚：防守與回血',
        damages: [
          {
            icon: '👍',
            label: '同陣營按讚（互相補血）',
            effect: '按讚同陣營的留言，為己方陣營回血 3 點！敵人猛攻時，隊友要拼命互讚來撐住血條！',
            color: '#22c55e',
            type: 'good',
          },
          {
            icon: '🐍',
            label: '跨陣營按讚（背骨仔懲罰）',
            effect: '按讚敵方留言視為「認同敵人」，己方陣營被扣 2 點血！按讚前想清楚，別做害群之馬！',
            color: '#8b5cf6',
            type: 'bad',
          },
          {
            icon: '💥',
            label: '暴擊留言（累積 5 讚）',
            effect: '一則留言被己方隊友按到 5 個讚，觸發暴擊！額外為己方回血 20 點，並廣播到全戰場！',
            color: '#f59e0b',
            type: 'great',
          },
        ],
        tip: '💡 戰術提示：集中力量倒讚敵方血量最低的陣營，讓他們先淪陷！己方瀕危時，大家快來互讚補血！',
      },
    ],
  },
  {
    id: 'strategy',
    icon: '🧠',
    title: '進階戰術',
    sections: [
      {
        subtitle: '重拳額度管理',
        content: '每個帳號每小時有 10 次重拳倒讚（8 傷害/次），超出後降為 2 傷害。UI 左側有進度條顯示剩餘次數，合理分配攻擊目標！',
        tip: '⚔️ 戰術：把重拳留給最有傷害性的留言（例如正在引爆、快要觸發地震的那條），不要浪費在沒人在意的廢文上。',
      },
      {
        subtitle: '集火攻擊',
        content: '30 秒內，有 3 個以上不同玩家倒讚同一則留言，就會觸發集火加成（×1.5 傷害）。這就是同溫層密謀的用處！',
        dos: [
          '在同溫層貼出目標留言，號召大家一起倒讚',
          '選擇敵方血量最低的陣營集中攻擊',
          '優先攻擊剛發出來的熱留言（還在 30 秒窗口內）',
          '輪流保留重拳額度，確保持續火力',
        ],
        donts: [
          '分散倒讚到不同留言（無法觸發集火）',
          '幫敵方留言按讚（背骨仔扣己方血）',
          '一個人猛刷倒讚（超額後只剩 2 傷害，浪費）',
          '留言到被圍毆（爛文送人頭）',
        ],
      },
      {
        subtitle: '同溫層（陣營密室）',
        content: '點擊頂部「同溫層」進入你的陣營專屬密室。這裡只有自己人看得到，可以協調攻擊目標、互相打氣、交換情報。敵方完全無法查看！',
        tip: '💬 效果最大化：「欸大家快去倒讚北部人那條「北部粽比較優」的文！他們再撐 3 倒讚就地震了！」',
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
        content: '當你的留言累積 8 個倒讚，系統判定你的論點已被大家否定，你將被強制關入太平洋戰俘營。',
        punishments: [
          '禁言 24 小時，無法在戰場發言',
          '無法使用同溫層聊天室',
          '頭像強制變成海龜 🐢',
          '全伺服器公告你被關進去（供人嘲笑）',
        ],
      },
      {
        subtitle: '如何避免進戰俘營？',
        content: '對方要 8 次倒讚才能把你送進去，只要留言有一點質量就很難被湊到。要注意：你的爛留言不只是被倒讚，還會讓敵方陣營持續獲得傷害！',
        tip: '⚠️ 最慘的情況：你發了一條被倒讚 10 次、按讚 1 次的留言 → 邏輯慘敗大地震 + 進戰俘營，一條文讓己方崩盤！',
      },
    ],
  },
  {
    id: 'victory',
    icon: '🏆',
    title: '獲勝條件與重置',
    sections: [
      {
        subtitle: '淪陷與存活',
        content: '當一個陣營的血條歸零，該陣營立即進入「淪陷狀態」。淪陷的玩家無法再發文，只能繼續按讚/倒讚，以旁觀者身份影響戰局。',
        punishments: [
          '無法在戰場發言',
          'HP 條顯示斜線灰色',
          '仍可按讚/倒讚影響戰局',
          '等待下一輪重新開戰',
        ],
      },
      {
        subtitle: '台灣之霸',
        content: '最後一個血條未歸零的陣營，就是本輪「台灣之霸」！全台灣地圖會變成該陣營的代表色，並宣告勝利。',
        tip: '🏆 勝利獎勵：貢獻最多傷害的玩家獲得「開戰大將軍」封號，並被記錄進英雄塚——永久記錄！',
      },
      {
        subtitle: '慶功模式與重置',
        steps: [
          '勝利宣告後進入 30 分鐘「慶功模式」',
          '贏家可以對輸家進行最後的彈幕嘲諷',
          '30 分鐘後戰場自動重置，所有血條補滿',
          '每週日 23:59 若無人勝出，以血量最多者強制勝利',
          '週一 00:00 全面重置，發布新引戰題，新賽季開始！',
        ],
      },
      {
        subtitle: '英雄塚',
        content: '每一輪的「開戰大將軍」（當輪傷害最高的玩家）都會被記錄在英雄塚中，永久展示。勝利畫面可以查看歷屆大將軍排行，讓你的名字流傳戰史！',
        tip: '📜 想上英雄塚？不是靠亂發文，是靠精準倒讚！找對目標、觸發集火和地震，才能最大化傷害！',
      },
    ],
  },
];

export default function RulebookPage() {
  const { setPage, user } = useGame();
  const [activeChapter, setActiveChapter] = useState('intro');
  const contentRef = useRef(null);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeChapter]);

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
        <div className="rulebook-content" ref={contentRef}>
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

              {sec.tip && <div className="section-tip">{sec.tip}</div>}

              {sec.dos && sec.donts && (
                <div className="dos-donts">
                  <div className="dos">
                    <div className="dos-title">✅ 這樣做</div>
                    <ul>{sec.dos.map((d, i) => <li key={i}>{d}</li>)}</ul>
                  </div>
                  <div className="donts">
                    <div className="donts-title">❌ 不要這樣</div>
                    <ul>{sec.donts.map((d, i) => <li key={i}>{d}</li>)}</ul>
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

          {/* 章節切換 */}
          <div className="chapter-nav-btns">
            {CHAPTERS.findIndex(c => c.id === activeChapter) > 0 && (
              <button className="chapter-prev" onClick={() => {
                const idx = CHAPTERS.findIndex(c => c.id === activeChapter);
                setActiveChapter(CHAPTERS[idx - 1].id);
              }}>← 上一章</button>
            )}
            {CHAPTERS.findIndex(c => c.id === activeChapter) < CHAPTERS.length - 1 ? (
              <button className="chapter-next" onClick={() => {
                const idx = CHAPTERS.findIndex(c => c.id === activeChapter);
                setActiveChapter(CHAPTERS[idx + 1].id);
              }}>下一章 →</button>
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
            <span className="mobile-nav-icon">⚔️</span>戰場
          </button>
          <button className="mobile-nav-btn" onClick={() => setPage('chat')}>
            <span className="mobile-nav-icon">💬</span>同溫層
          </button>
          <button className="mobile-nav-btn" onClick={() => setPage('tribunal')}>
            <span className="mobile-nav-icon">📊</span>戰報
          </button>
          <button className="mobile-nav-btn active">
            <span className="mobile-nav-icon">📖</span>規則書
          </button>
        </nav>
      )}
    </div>
  );
}
