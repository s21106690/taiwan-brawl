import React from 'react';
import { FACTIONS } from '../context/GameContext';

// 簡化台灣輪廓 SVG，五大區域
export default function TaiwanMap({ factions, winner }) {
  const getColor = (fid) => {
    if (winner && winner.id === fid) return FACTIONS[fid].color;
    if (!factions) return '#2a2a3f';
    const f = factions[fid];
    if (!f) return '#2a2a3f';
    if (f.fallen) return '#1a1a2a';
    const pct = f.hp / f.maxHp;
    const base = FACTIONS[fid].color;
    return winner ? '#1a1a2a' : base;
  };

  const factionColor = (fid) => {
    if (winner) return winner.id === fid ? FACTIONS[fid].color : '#1a1a26';
    if (!factions?.[fid]) return '#2a2a3f';
    return factions[fid].fallen ? '#1a1a26' : FACTIONS[fid].color;
  };

  const factionOpacity = (fid) => {
    if (winner) return winner.id === fid ? 1 : 0.15;
    if (!factions?.[fid]) return 0.3;
    if (factions[fid].fallen) return 0.15;
    const pct = factions[fid].hp / factions[fid].maxHp;
    return 0.3 + pct * 0.7;
  };

  return (
    <div className="taiwan-map-wrap">
      <svg viewBox="0 0 200 320" className="taiwan-map-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* 北部 - 天龍北 */}
        <path
          d="M 60 40 L 130 30 L 150 60 L 140 90 L 100 100 L 60 90 Z"
          fill={factionColor('north')}
          fillOpacity={factionOpacity('north')}
          stroke={FACTIONS.north.color}
          strokeWidth={winner?.id === 'north' ? 2.5 : 1}
          strokeOpacity={0.6}
          filter={winner?.id === 'north' ? 'url(#glow)' : undefined}
          className="map-region"
        />
        <text x="100" y="70" textAnchor="middle" fontSize="11" fill="white" fillOpacity={0.9}>
          {FACTIONS.north.emoji}
        </text>
        <text x="100" y="83" textAnchor="middle" fontSize="7" fill="white" fillOpacity={0.7}>
          {FACTIONS.north.name}
        </text>

        {/* 中部 - 慶記中 */}
        <path
          d="M 60 90 L 100 100 L 140 90 L 145 140 L 110 160 L 65 145 Z"
          fill={factionColor('central')}
          fillOpacity={factionOpacity('central')}
          stroke={FACTIONS.central.color}
          strokeWidth={winner?.id === 'central' ? 2.5 : 1}
          strokeOpacity={0.6}
          filter={winner?.id === 'central' ? 'url(#glow)' : undefined}
          className="map-region"
        />
        <text x="103" y="128" textAnchor="middle" fontSize="11" fill="white" fillOpacity={0.9}>
          {FACTIONS.central.emoji}
        </text>
        <text x="103" y="141" textAnchor="middle" fontSize="7" fill="white" fillOpacity={0.7}>
          {FACTIONS.central.name}
        </text>

        {/* 南部 - 暖男南 */}
        <path
          d="M 65 145 L 110 160 L 145 140 L 140 210 L 100 240 L 65 210 Z"
          fill={factionColor('south')}
          fillOpacity={factionOpacity('south')}
          stroke={FACTIONS.south.color}
          strokeWidth={winner?.id === 'south' ? 2.5 : 1}
          strokeOpacity={0.6}
          filter={winner?.id === 'south' ? 'url(#glow)' : undefined}
          className="map-region"
        />
        <text x="103" y="195" textAnchor="middle" fontSize="11" fill="white" fillOpacity={0.9}>
          {FACTIONS.south.emoji}
        </text>
        <text x="103" y="208" textAnchor="middle" fontSize="7" fill="white" fillOpacity={0.7}>
          {FACTIONS.south.name}
        </text>

        {/* 東部 - 好山東（右側山脈）*/}
        <path
          d="M 140 90 L 160 80 L 175 140 L 165 200 L 140 210 L 145 140 Z"
          fill={factionColor('east')}
          fillOpacity={factionOpacity('east')}
          stroke={FACTIONS.east.color}
          strokeWidth={winner?.id === 'east' ? 2.5 : 1}
          strokeOpacity={0.6}
          filter={winner?.id === 'east' ? 'url(#glow)' : undefined}
          className="map-region"
        />
        <text x="158" y="148" textAnchor="middle" fontSize="10" fill="white" fillOpacity={0.9}>
          {FACTIONS.east.emoji}
        </text>
        <text x="158" y="160" textAnchor="middle" fontSize="6.5" fill="white" fillOpacity={0.7}>
          {FACTIONS.east.name}
        </text>

        {/* 外島幫（左下小島）*/}
        <ellipse
          cx="35" cy="240" rx="22" ry="14"
          fill={factionColor('island')}
          fillOpacity={factionOpacity('island')}
          stroke={FACTIONS.island.color}
          strokeWidth={winner?.id === 'island' ? 2.5 : 1}
          strokeOpacity={0.6}
          filter={winner?.id === 'island' ? 'url(#glow)' : undefined}
          className="map-region"
        />
        <text x="35" y="237" textAnchor="middle" fontSize="10" fill="white" fillOpacity={0.9}>
          {FACTIONS.island.emoji}
        </text>
        <text x="35" y="250" textAnchor="middle" fontSize="6" fill="white" fillOpacity={0.7}>
          {FACTIONS.island.name}
        </text>

        {/* 小琉球裝飾 */}
        <ellipse cx="75" cy="268" rx="10" ry="6"
          fill="#1a1a2a" stroke="#333" strokeWidth="0.5" fillOpacity={0.5}/>

        {/* 台灣外框 */}
        <path
          d="M 60 40 L 130 30 L 150 60 L 160 80 L 175 140 L 165 200 L 140 210 L 100 240 L 65 210 L 60 90 Z"
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="0.8"
        />
      </svg>

      {/* 陣營圖例 */}
      <div className="map-legend">
        {Object.values(FACTIONS).map(f => {
          const fallen = factions?.[f.id]?.fallen;
          const isWinner = winner?.id === f.id;
          return (
            <div key={f.id} className={`legend-item ${fallen ? 'legend-fallen' : ''} ${isWinner ? 'legend-winner' : ''}`}>
              <span className="legend-dot" style={{ background: fallen ? '#333' : f.color }} />
              <span>{f.emoji} {f.name}</span>
              {fallen && <span className="legend-fallen-label">淪陷</span>}
              {isWinner && <span className="legend-winner-label">🏆 霸主</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
