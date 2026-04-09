import React, { useState } from 'react';
import { useGame, FACTIONS } from '../context/GameContext';

// 模擬歷史週報資料
const WEEKLY_HISTORY = [
  { week: '第 1 週', winner: 'south', loser: 'north', topic: '北部粽到底是不是 3D 油飯？', damage: { south: 150, north: 320, central: 180, east: 120, island: 230 } },
  { week: '第 2 週', winner: 'central', loser: 'island', topic: '丹丹漢堡到底算不算神店？', damage: { south: 200, north: 160, central: 90, east: 280, island: 310 } },
  { week: '第 3 週', winner: 'east', loser: 'north', topic: '自來水煮沸直接喝，有沒有味道？', damage: { south: 180, north: 340, central: 220, east: 80, island: 190 } },
];

export default function TribunalPage() {
  const { factions, user, setPage, FACTIONS: ctxFactions } = useGame();
  const userFactionInfo = user ? FACTIONS[user.faction] : null;
  const [defeatFilter, setDefeatFilter] = useState(false);

  const userFaction = user?.faction;
  const isDefeated = userFaction && factions && factions[userFaction]?.hp < 300;

  // 本週目前戰況
  const sortedFactions = factions
    ? Object.values(factions).sort((a, b) => b.hp - a.hp)
    : [];

  const winner = sortedFactions[0];
  const loser = sortedFactions[sortedFactions.length - 1];

  return (
    <div className={`tribunal-page ${isDefeated && defeatFilter ? 'defeat-filter' : ''}`}>
      <div className="tribunal-header">
        <button className="back-btn" onClick={() => setPage('arena')}>← 回戰場</button>
        <h2>📊 每週戰況法庭</h2>
        <p>敗者將承受「戰敗濾鏡」的恥辱</p>
      </div>

      {/* 本週即時排行 */}
      <div className="tribunal-section">
        <h3>⚔️ 本週即時排行榜</h3>
        <div className="ranking-table">
          {sortedFactions.map((f, i) => {
            const info = FACTIONS[f.id];
            const pct = (f.hp / f.maxHp) * 100;
            const isWinner = i === 0;
            const isLoser = i === sortedFactions.length - 1;
            const isUser = f.id === userFaction;

            return (
              <div
                key={f.id}
                className={`ranking-row ${isWinner ? 'rank-winner' : ''} ${isLoser ? 'rank-loser' : ''} ${isUser ? 'rank-user' : ''}`}
                style={{ '--faction-color': info.color }}
              >
                <div className="rank-position">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </div>
                <span className="rank-emoji">{info.emoji}</span>
                <div className="rank-info">
                  <div className="rank-name">
                    {info.name}
                    {isUser && <span className="rank-you">（你）</span>}
                  </div>
                  <div className="rank-hp-track">
                    <div
                      className="rank-hp-fill"
                      style={{ width: `${pct}%`, background: info.color }}
                    />
                  </div>
                </div>
                <div className="rank-hp-text">{Math.round(f.hp)} HP</div>
                {isWinner && <span className="rank-badge winner-badge">👑 領先</span>}
                {isLoser && <span className="rank-badge loser-badge">💀 危機</span>}
              </div>
            );
          })}
        </div>

        {winner && loser && (
          <div className="prediction-box">
            <div className="prediction-winner">
              🏆 目前領先：{FACTIONS[winner.id]?.emoji} {FACTIONS[winner.id]?.name}
            </div>
            <div className="prediction-loser">
              ⚠️ 敗戰邊緣：{FACTIONS[loser.id]?.emoji} {FACTIONS[loser.id]?.name}
            </div>
          </div>
        )}
      </div>

      {/* 敗戰濾鏡說明 */}
      {isDefeated && (
        <div className="defeat-warning">
          <h3>💀 你的陣營瀕臨戰敗！</h3>
          <p>若本週結算時落敗，下週一登入時整個介面將套上「戰敗濾鏡」，直到贏回來！</p>
          <button
            className="toggle-filter-btn"
            onClick={() => setDefeatFilter(!defeatFilter)}
          >
            {defeatFilter ? '關閉濾鏡預覽' : '預覽戰敗濾鏡 😱'}
          </button>
        </div>
      )}

      {/* 歷史週報 */}
      <div className="tribunal-section">
        <h3>📜 歷史週報</h3>
        <div className="history-list">
          {WEEKLY_HISTORY.map((week, i) => {
            const w = FACTIONS[week.winner];
            const l = FACTIONS[week.loser];
            return (
              <div key={i} className="history-item">
                <div className="history-week">{week.week}</div>
                <div className="history-topic">🔥 {week.topic}</div>
                <div className="history-result">
                  <span className="history-winner">🏆 {w.emoji} {w.name} 獲勝</span>
                  <span className="history-sep">VS</span>
                  <span className="history-loser">💀 {l.emoji} {l.name} 戰敗</span>
                </div>
                <div className="history-damage-bars">
                  {Object.entries(week.damage).map(([fid, dmg]) => {
                    const fi = FACTIONS[fid];
                    return (
                      <div key={fid} className="mini-bar">
                        <span>{fi.emoji}</span>
                        <div className="mini-bar-track">
                          <div
                            className="mini-bar-fill"
                            style={{ width: `${(dmg / 400) * 100}%`, background: fi.color }}
                          />
                        </div>
                        <span className="mini-bar-val">-{dmg}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 稱號說明 */}
      <div className="tribunal-section">
        <h3>🎖️ 地區專屬稱號</h3>
        <div className="titles-grid">
          {[
            { faction: 'south', titles: ['糖分主宰者', '熱情使者', '甜蜜戰神'], condition: '南部陣營連勝' },
            { faction: 'central', titles: ['消波塊守護神', '大肚山霸主', '海線之王'], condition: '中部陣營連勝' },
            { faction: 'north', titles: ['天龍人代言者', '捷運依賴症患者', '大安森林守護者'], condition: '北部陣營連勝' },
            { faction: 'east', titles: ['秘境探索者', '好山好水信徒', '太魯閣勇士'], condition: '東部陣營連勝' },
            { faction: 'island', titles: ['離島霸主', '澎湖菊島之子', '跨海戰士'], condition: '外島陣營連勝' },
          ].map((group) => {
            const f = FACTIONS[group.faction];
            return (
              <div key={group.faction} className="title-group" style={{ '--color': f.color }}>
                <div className="title-faction">{f.emoji} {f.name}</div>
                <div className="title-condition">{group.condition}解鎖</div>
                {group.titles.map((t, i) => (
                  <div key={i} className="title-badge-row">
                    <span className="title-lock">🔒</span>
                    <span className="title-name">{t}</span>
                    <span className="title-level">Lv.{i + 1}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* 手機底部導覽列 */}
      <nav className="mobile-bottom-nav">
        <button className="mobile-nav-btn" onClick={() => setPage('arena')}>
          <span className="mobile-nav-icon">⚔️</span>
          戰場
        </button>
        <button className="mobile-nav-btn" onClick={() => setPage('chat')}>
          <span className="mobile-nav-icon">💬</span>
          同溫層
        </button>
        <button className="mobile-nav-btn active" onClick={() => setPage('tribunal')}>
          <span className="mobile-nav-icon">📊</span>
          戰報
        </button>
        <button className="mobile-nav-btn" onClick={() => setPage('rulebook')}>
          <span className="mobile-nav-icon">📖</span>
          規則書
        </button>
      </nav>
    </div>
  );
}
