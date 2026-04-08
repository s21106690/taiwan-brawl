import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import socket from '../socket';

const GameContext = createContext(null);

export const FACTIONS = {
  north: { id: 'north', name: '天龍北', emoji: '🐉', color: '#4f46e5', bg: '#eef2ff' },
  central: { id: 'central', name: '慶記中', emoji: '🦁', color: '#dc2626', bg: '#fef2f2' },
  south: { id: 'south', name: '暖男南', emoji: '🌊', color: '#0891b2', bg: '#ecfeff' },
  east: { id: 'east', name: '好山東', emoji: '🏔️', color: '#16a34a', bg: '#f0fdf4' },
  island: { id: 'island', name: '外島幫', emoji: '🏝️', color: '#d97706', bg: '#fffbeb' },
};

export function GameProvider({ children }) {
  const [user, setUser] = useState(null);
  const [factions, setFactions] = useState(null);
  const [currentTopic, setCurrentTopic] = useState('');
  const [comments, setComments] = useState([]);
  const [barrages, setBarrages] = useState([]);
  const [factionMessages, setFactionMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isPrisoner, setIsPrisoner] = useState(false);
  const [connected, setConnected] = useState(false);
  const [criticalHit, setCriticalHit] = useState(null);
  const [page, setPage] = useState('landing'); // landing | select | arena | chat | tribunal

  const addNotification = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  }, []);

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('game:state', (state) => {
      setFactions(state.factions);
      setCurrentTopic(state.currentTopic);
      setComments(state.comments || []);
      if (state.user) setUser(state.user);
    });

    socket.on('comment:new', (comment) => {
      setComments(prev => [...prev.slice(-199), comment]);
    });

    socket.on('comment:updated', (updated) => {
      setComments(prev => prev.map(c => c.id === updated.id ? updated : c));
    });

    socket.on('factions:updated', (updated) => {
      setFactions(updated);
    });

    socket.on('battle:critical', ({ comment, damage, attacker, factions: updatedFactions }) => {
      setFactions(updatedFactions);
      setCriticalHit({ comment, damage, attacker });
      setTimeout(() => setCriticalHit(null), 3000);
    });

    socket.on('barrage:fire', (barrage) => {
      const id = Date.now() + Math.random();
      setBarrages(prev => [...prev, { ...barrage, id, top: Math.random() * 70 + 10 }]);
      setTimeout(() => setBarrages(prev => prev.filter(b => b.id !== id)), 8000);
    });

    socket.on('faction:message', (msg) => {
      setFactionMessages(prev => [...prev.slice(-99), msg]);
    });

    socket.on('prison:enter', ({ message }) => {
      setIsPrisoner(true);
      addNotification(message, 'error');
    });

    socket.on('prison:announce', ({ username, faction }) => {
      addNotification(`🐢 ${username}（${faction.name}）被關進太平洋戰俘營！`, 'warning');
    });

    socket.on('user:joined', ({ username, faction }) => {
      addNotification(`${faction.emoji} ${username} 加入了 ${faction.name}！`, 'info');
    });

    socket.on('battle:reset', (state) => {
      setFactions(state.factions);
      setCurrentTopic(state.currentTopic);
      setComments([]);
      addNotification('🔔 新的一天！烽火台重置！開始新的戰役！', 'success');
    });

    socket.on('error', ({ message }) => {
      addNotification(message, 'error');
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('game:state');
      socket.off('comment:new');
      socket.off('comment:updated');
      socket.off('factions:updated');
      socket.off('battle:critical');
      socket.off('barrage:fire');
      socket.off('faction:message');
      socket.off('prison:enter');
      socket.off('prison:announce');
      socket.off('user:joined');
      socket.off('battle:reset');
      socket.off('error');
    };
  }, [addNotification]);

  const joinGame = useCallback((username, faction) => {
    const userData = { username, faction };
    socket.emit('user:join', userData);
    setUser({ username, faction, isPrisoner: false });
    setPage('arena');
  }, []);

  const postComment = useCallback((text) => {
    socket.emit('comment:post', { text });
  }, []);

  const voteComment = useCallback((commentId, vote) => {
    socket.emit('comment:vote', { commentId, vote });
  }, []);

  const sendFactionMessage = useCallback((message) => {
    socket.emit('faction:chat', { message });
  }, []);

  return (
    <GameContext.Provider value={{
      user, factions, currentTopic, comments, barrages,
      factionMessages, notifications, isPrisoner, connected,
      criticalHit, page, setPage,
      joinGame, postComment, voteComment, sendFactionMessage,
      FACTIONS,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
