import React, { useState, useEffect } from 'react';
import { useGame, FACTIONS } from '../context/GameContext';
import TaiwanMap from './TaiwanMap';

export default function VictoryScreen() {
  const { victory, factions, heroHall, setPage } = useGame();
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!victory?.celebrationEndsAt) return;
    const tick = () => {
      const ms = victory.celebrationEndsAt - Date.now();
      if (ms <= 0) { setTimeLeft('即將重置...'); return; }
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setTimeLeft(`${m}:${s.toString().padStart(2, '0')}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [victory?.celebrationEndsAt]);

  if (!victory) return null;
  const w = victory.winner;
  const wInfo = FACTIONS[w?.id] || w;

  return (
    <div className="victory-overlay">
      <div className="victory-content">
        {/* 標題 */}
        <div className="victory-header">
          <div className="victory-crown">👑</div>
          <h1 className="victory-title" style={{ color: wInfo?.color }}>
            {wInfo?.emoji} {wInfo?.name}
          </h1>
          <div className="victory-subtitle">奪得台灣之霸！</div>
        </div>

        <div className="victory-body">
          {/* 台灣地圖 */}
          <div className="victory-map-section">
            <TaiwanMap factions={factions} winner={wInfo} />
            <div className="victory-map-caption">
              全台變色，{wInfo?.name}制霸！
            </div>
          </div>

          {/* 開戰大將軍 */}
          {victory.champion && (
            <div className="victory-champion" style={{ '--wc': wInfo?.color }}>
              <div className="champion-label">⚔️ 開戰大將軍</div>
              <div className="champion-emoji">{FACTIONS[victory.champion.faction]?.emoji || '🎖️'}</div>
              <div className="champion-name">{victory.champion.username}</div>
              <div className="champion-faction">{FACTIONS[victory.champion.faction]?.name}</div>
              <div className="champion-dmg">
                造成 <strong>{Math.round(victory.champion.damage)}</strong> 點總傷害
              </div>
            </div>
          )}

          {/* 英雄塚 */}
          {heroHall && heroHall.length > 0 && (
            <div className="hero-hall">
              <h3>🏛️ 英雄塚・歷屆大將軍</h3>
              <div className="hero-list">
                {heroHall.slice(0, 6).map((h, i) => {
                  const hf = FACTIONS[h.faction];
                  return (
                    <div key={h.id || i} className="hero-item">
                      <span className="hero-rank">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}</span>
                      <span className="hero-emoji">{hf?.emoji}</span>
                      <div className="hero-info">
                        <div className="hero-name">{h.username}</div>
                        <div className="hero-topic" title={h.topic}>
                          {h.topic?.slice(0, 18)}{h.topic?.length > 18 ? '...' : ''}
                        </div>
                      </div>
                      <span className="hero-dmg">⚔️{Math.round(h.damage)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="victory-footer">
          <div className="victory-timer">
            <span>🎉 慶功模式倒計時</span>
            <span className="timer-count">{timeLeft}</span>
          </div>
          <div className="victory-actions">
            <button className="victory-barrage-btn" onClick={() => setPage('arena')}>
              💬 去嘲諷落敗者！
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
