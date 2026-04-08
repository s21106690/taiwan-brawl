import React, { useState, useRef, useEffect } from 'react';
import { useGame, FACTIONS } from '../context/GameContext';

const TACTICS = [
  '欸兄弟們聽好，等一下集中火力攻他們那個「北部粽是油飯」的點！',
  '拿出你們的邏輯武器，別只是在那裡飆話！',
  '記住！讚讚的留言才會造成暴擊傷害，要有梗！',
  '對他們的飲食習慣動手！這是最痛的！',
  '不要只有一句，多說幾句邏輯！',
  '有人去守著那條留言的倒讚，確保沒有友軍傷亡！',
];

export default function ChatPage() {
  const { user, factionMessages, sendFactionMessage, setPage, isPrisoner } = useGame();
  const [msg, setMsg] = useState('');
  const messagesEndRef = useRef(null);
  const fInfo = user ? FACTIONS[user.faction] : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [factionMessages.length]);

  const handleSend = () => {
    if (!msg.trim() || isPrisoner) return;
    sendFactionMessage(msg.trim());
    setMsg('');
  };

  return (
    <div className="chat-page" style={{ '--faction-color': fInfo?.color }}>
      <div className="chat-header">
        <button className="back-btn" onClick={() => setPage('arena')}>← 回戰場</button>
        <div className="chat-title">
          <span>{fInfo?.emoji}</span>
          <div>
            <h2>{fInfo?.name} 同溫層</h2>
            <p>保密！只有自己人看得到</p>
          </div>
        </div>
      </div>

      <div className="chat-layout">
        {/* 聊天主區 */}
        <div className="chat-main">
          <div className="chat-security-notice">
            🔒 本聊天室為高度機密！敵方陣營無法查看。擬定戰術，集中火力！
          </div>

          <div className="messages-list">
            {factionMessages.length === 0 ? (
              <div className="no-messages">
                <p>還沒有戰術討論...</p>
                <p>快召集你的陣營兄弟！</p>
              </div>
            ) : (
              factionMessages.map((m, i) => (
                <div key={i} className={`message-bubble ${m.isSelf ? 'self' : 'other'}`}>
                  {!m.isSelf && (
                    <div className="message-user">{fInfo?.emoji} {m.username}</div>
                  )}
                  <div className="message-text">{m.message}</div>
                  <div className="message-time">
                    {new Date(m.timestamp).toLocaleTimeString('zh-TW', {
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-row">
            {isPrisoner ? (
              <div className="prisoner-notice">🐢 你在戰俘營，無法使用同溫層！</div>
            ) : (
              <>
                <input
                  className="chat-input"
                  value={msg}
                  onChange={e => setMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="擬定戰術..."
                  maxLength={200}
                />
                <button className="chat-send-btn" onClick={handleSend} disabled={!msg.trim()}>
                  發送
                </button>
              </>
            )}
          </div>
        </div>

        {/* 戰術建議側欄 */}
        <aside className="tactics-sidebar">
          <h3>📋 AI 戰術建議</h3>
          <p className="tactics-subtitle">常用攻略模板：</p>
          <div className="tactics-list">
            {TACTICS.map((t, i) => (
              <div
                key={i}
                className="tactic-item"
                onClick={() => setMsg(t)}
              >
                {t}
              </div>
            ))}
          </div>

          <div className="prison-reminder">
            <h4>🚨 戰俘營提醒</h4>
            <p>留言被 8 個倒讚就會進太平洋戰俘營！禁言 24 小時，頭像變海龜 🐢</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
