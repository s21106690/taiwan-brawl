import React, { useState } from 'react';
import { useGame, FACTIONS } from '../context/GameContext';

const FACTION_DATA = [
  {
    id: 'north',
    titles: ['天龍人代言者', '捷運依賴症患者', '大安森林守護者'],
    desc: '我們只坐捷運，不騎機車。氣溫 20 度就穿羽絨衣，這叫品味。',
    power: '都市優越感',
    weakness: '一出木柵就迷路',
  },
  {
    id: 'central',
    titles: ['消波塊守護神', '大肚山霸主', '海線之王'],
    desc: '大里、烏日、太平，台中才是台灣的精華！海線人最硬！',
    power: '吃辣不皺眉',
    weakness: '空氣品質 xd',
  },
  {
    id: 'south',
    titles: ['糖分主宰者', '熱情使者', '甜蜜戰神'],
    desc: '我們的醬汁就是要甜！熱情豪邁，天氣熱心更熱！',
    power: '在地人情味',
    weakness: '高雄捷運班距',
  },
  {
    id: 'east',
    titles: ['秘境探索者', '好山好水信徒', '太魯閣勇士'],
    desc: '花東縱谷、太魯閣峽谷，台灣最美的風景都在這！',
    power: '心靈療癒buff',
    weakness: '台9線塞車',
  },
  {
    id: 'island',
    titles: ['離島霸主', '澎湖菊島之子', '跨海戰士'],
    desc: '搭飛機或船才能回家，我們才是最硬的！金門、澎湖、馬祖立！',
    power: '跨海意志力',
    weakness: '颱風封島 QQ',
  },
];

export default function FactionSelectPage() {
  const { joinGame, setPage } = useGame();
  const [selectedFaction, setSelectedFaction] = useState(null);
  const [username, setUsername] = useState('');
  const [hoveredFaction, setHoveredFaction] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleJoin = () => {
    if (!username.trim() || !selectedFaction) return;
    setConfirmed(true);
    setTimeout(() => {
      joinGame(username.trim(), selectedFaction);
    }, 1500);
  };

  const fInfo = hoveredFaction || selectedFaction;
  const factionDetail = FACTION_DATA.find(f => f.id === fInfo);

  if (confirmed) {
    const f = FACTIONS[selectedFaction];
    return (
      <div className="faction-confirm-screen" style={{ '--faction-color': f.color }}>
        <div className="confirm-content">
          <div className="confirm-emoji">{f.emoji}</div>
          <h2>效忠誓言</h2>
          <p className="confirm-name">{username}</p>
          <p>正式加入 <strong>{f.name}</strong></p>
          <p className="confirm-warning">⚠️ 三個月內不得叛逃！</p>
          <div className="confirm-loading">進入戰場中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="faction-select-page">
      <div className="select-header">
        <button className="back-btn" onClick={() => setPage('landing')}>← 返回</button>
        <h2>選擇你的陣營</h2>
        <p className="select-warning">⚠️ 一旦選定，三個月內不得叛逃！</p>
      </div>

      <div className="faction-grid">
        {FACTION_DATA.map((fd) => {
          const f = FACTIONS[fd.id];
          const isSelected = selectedFaction === fd.id;
          return (
            <div
              key={fd.id}
              className={`faction-card ${isSelected ? 'selected' : ''}`}
              style={{ '--faction-color': f.color, '--faction-bg': f.bg }}
              onClick={() => setSelectedFaction(fd.id)}
              onMouseEnter={() => setHoveredFaction(fd.id)}
              onMouseLeave={() => setHoveredFaction(null)}
            >
              <div className="fc-emoji">{f.emoji}</div>
              <div className="fc-name">{f.name}</div>
              <div className="fc-desc">{fd.desc}</div>
              <div className="fc-stats">
                <div className="fc-stat">
                  <span className="fc-stat-label">⚡ 戰力</span>
                  <span className="fc-stat-value">{fd.power}</span>
                </div>
                <div className="fc-stat">
                  <span className="fc-stat-label">💀 弱點</span>
                  <span className="fc-stat-value">{fd.weakness}</span>
                </div>
              </div>
              <div className="fc-titles">
                {fd.titles.map((t, i) => (
                  <span key={i} className="fc-title-badge">{t}</span>
                ))}
              </div>
              {isSelected && <div className="fc-selected-mark">✓ 選擇中</div>}
            </div>
          );
        })}
      </div>

      <div className="join-panel">
        <input
          className="username-input"
          type="text"
          placeholder="輸入你的戰場稱號..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={16}
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
        />
        <button
          className={`join-btn ${selectedFaction && username.trim() ? 'ready' : ''}`}
          onClick={handleJoin}
          disabled={!selectedFaction || !username.trim()}
        >
          {selectedFaction
            ? `⚔️ 效忠 ${FACTIONS[selectedFaction].name}・參戰！`
            : '先選擇陣營'}
        </button>
      </div>
    </div>
  );
}
