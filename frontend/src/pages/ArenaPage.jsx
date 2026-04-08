import React, { useState, useRef, useEffect } from 'react';
import { useGame, FACTIONS } from '../context/GameContext';
import HPBar from '../components/HPBar';
import CommentCard from '../components/CommentCard';
import LiveBarrage from '../components/LiveBarrage';
import CriticalHitEffect from '../components/CriticalHitEffect';

export default function ArenaPage() {
  const { user, factions, currentTopic, comments, postComment, isPrisoner,
    setPage, criticalHit, connected } = useGame();
  const [inputText, setInputText] = useState('');
  const commentsEndRef = useRef(null);
  const fInfo = user ? FACTIONS[user.faction] : null;

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length]);

  const handlePost = () => {
    if (!inputText.trim() || isPrisoner) return;
    postComment(inputText.trim());
    setInputText('');
  };

  const sortedComments = [...comments].sort((a, b) => a.timestamp - b.timestamp).slice(-80);

  return (
    <div className="arena-page">
      <LiveBarrage />
      {criticalHit && <CriticalHitEffect hit={criticalHit} />}

      {/* 頂部導航 */}
      <nav className="arena-nav">
        <div className="nav-left">
          <span className="nav-logo">⚔️ 寶島大亂鬥</span>
          {fInfo && (
            <div className="nav-faction" style={{ color: fInfo.color }}>
              {fInfo.emoji} {fInfo.name} 陣營
            </div>
          )}
        </div>
        <div className="nav-right">
          <button className="nav-btn" onClick={() => setPage('chat')}>
            💬 同溫層
          </button>
          <button className="nav-btn" onClick={() => setPage('tribunal')}>
            📊 每週戰報
          </button>
        </div>
      </nav>

      <div className="arena-layout">
        {/* 左欄：血條 */}
        <aside className="arena-sidebar">
          <h3 className="sidebar-title">⚔️ 戰況血條</h3>
          <HPBar factions={factions} />

          <div className="topic-box">
            <div className="topic-label">🔥 今日引戰題</div>
            <div className="topic-text">{currentTopic}</div>
          </div>

          <div className="rules-box">
            <div className="rules-title">📜 戰場規則</div>
            <ul className="rules-list">
              <li>👍 讚 → 對敵方扣血</li>
              <li>💥 5讚以上 → 暴擊！</li>
              <li>👎 倒讚 → 對己方友傷</li>
              <li>🐢 8倒讚 → 送進戰俘營</li>
            </ul>
          </div>
        </aside>

        {/* 中央：留言區 */}
        <main className="arena-main">
          <div className="comments-header">
            <h2>🩸 戰場留言區</h2>
            <span className="comment-count">{comments.length} 則發言</span>
          </div>

          <div className="comments-feed">
            {sortedComments.length === 0 ? (
              <div className="no-comments">
                <p>戰場一片寂靜...</p>
                <p>成為第一個開戰的勇士！</p>
              </div>
            ) : (
              sortedComments.map(c => (
                <CommentCard key={c.id} comment={c} />
              ))
            )}
            <div ref={commentsEndRef} />
          </div>

          {/* 輸入區 */}
          <div className="comment-input-area">
            {isPrisoner ? (
              <div className="prisoner-notice">
                🐢 你在太平洋戰俘營服刑中，暫時無法發言！（24 小時後解除）
              </div>
            ) : (
              <div className="input-row">
                {fInfo && (
                  <span className="input-faction-badge" style={{ background: fInfo.color }}>
                    {fInfo.emoji} {fInfo.name}
                  </span>
                )}
                <input
                  className="comment-input"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handlePost()}
                  placeholder="輸入你的戰狼發言... (Enter 發送)"
                  maxLength={140}
                />
                <button
                  className="post-btn"
                  onClick={handlePost}
                  disabled={!inputText.trim()}
                >
                  ⚔️ 出戰
                </button>
              </div>
            )}
            <div className="input-hint">
              {inputText.length}/140 字 ・ 讚讚的留言會造成暴擊傷害！
            </div>
          </div>
        </main>

        {/* 右欄：熱門留言 */}
        <aside className="arena-right">
          <h3 className="sidebar-title">🏆 熱門戰狼發言</h3>
          <div className="top-comments">
            {[...comments]
              .sort((a, b) => b.likes - a.likes || b.timestamp - a.timestamp)
              .slice(0, 5)
              .map((c, i) => {
                const f = FACTIONS[c.faction];
                return (
                  <div key={c.id} className="top-comment-item">
                    <span className="top-rank">#{i + 1}</span>
                    <span className="top-emoji">{f?.emoji}</span>
                    <div className="top-content">
                      <div className="top-user">{c.username}</div>
                      <div className="top-text">{c.text.slice(0, 40)}{c.text.length > 40 ? '...' : ''}</div>
                    </div>
                    <span className="top-likes">👍{c.likes}</span>
                  </div>
                );
              })
            }
            {comments.length === 0 && (
              <p className="no-top">還沒有留言，快去開戰！</p>
            )}
          </div>
        </aside>
      </div>

      {/* 手機底部導覽列 */}
      <nav className="mobile-bottom-nav">
        <button className="mobile-nav-btn active" onClick={() => setPage('arena')}>
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
        <div className="mobile-nav-btn" style={{ cursor: 'default' }}>
          <span className="mobile-nav-icon">{fInfo?.emoji || '👤'}</span>
          <span style={{ color: fInfo?.color, fontSize: 9 }}>{fInfo?.name}</span>
        </div>
      </nav>
    </div>
  );
}
