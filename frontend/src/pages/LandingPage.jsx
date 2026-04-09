import React from 'react';
import { useGame } from '../context/GameContext';

export default function LandingPage() {
  const { setPage, connected } = useGame();

  return (
    <div className="landing-page">
      <div className="landing-bg-particles">
        {['⚔️','🔥','💥','🗡️','🛡️','🏆'].map((e, i) => (
          <span key={i} className="particle" style={{ '--i': i }}>{e}</span>
        ))}
      </div>

      <div className="landing-content">
        <div className="landing-badge">🔥 每天晚上 8 點開戰</div>
        <h1 className="landing-title">
          寶島大亂鬥
          <span className="title-sub">戰起來！</span>
        </h1>
        <p className="landing-slogan">
          「別攔我！今天我就要讓他知道什麼才是真正的美味/常識！」
        </p>

        <div className="faction-preview">
          {[
            { emoji: '🐉', name: '天龍北', desc: '天龍人就是不一樣' },
            { emoji: '🦁', name: '慶記中', desc: '消波塊守護者' },
            { emoji: '🌊', name: '暖男南', desc: '糖分主宰者' },
            { emoji: '🏔️', name: '好山東', desc: '秘境探索者' },
            { emoji: '🏝️', name: '外島幫', desc: '跨海戰士' },
          ].map((f, i) => (
            <div key={i} className="faction-preview-card">
              <span className="faction-preview-emoji">{f.emoji}</span>
              <span className="faction-preview-name">{f.name}</span>
              <span className="faction-preview-desc">{f.desc}</span>
            </div>
          ))}
        </div>

        <div className="landing-features">
          <div className="feature-item">
            <span className="feature-icon">🩸</span>
            <span>即時血條系統</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">💬</span>
            <span>按讚造成暴擊</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📡</span>
            <span>彈幕滿天飛</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🐢</span>
            <span>戰俘營懲罰</span>
          </div>
        </div>

        <div className="landing-cta-row">
          <button
            className="landing-btn"
            onClick={() => setPage('select')}
          >
            ⚔️ 選擇陣營・參戰！
          </button>
          <button
            className="landing-rule-btn"
            onClick={() => setPage('rulebook')}
          >
            📖 規則書
          </button>
        </div>

        <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
          <span className="status-dot" />
          {connected ? '伺服器連線中' : '連線中，請稍候...'}
        </div>
      </div>
    </div>
  );
}
