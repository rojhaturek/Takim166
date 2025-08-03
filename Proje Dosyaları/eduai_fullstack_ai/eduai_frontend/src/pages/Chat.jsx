import React, { useState } from 'react';
import { sendChat } from '../api.js';

/**
 * Chat component
 *
 * Provides a simple text interface for conversing with the AI tutor.
 * Messages are displayed in sequence with the user and AI roles. Each
 * message sent by the user triggers a POST to the `/chat` endpoint and
 * appends the AI's reply to the conversation. Basic error handling is
 * included.
 */
const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userText = input.trim();
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setInput('');
    setError(null);
    setLoading(true);
    try {
      const res = await sendChat(userText);
      const reply = res.data.reply || '';
      setMessages((prev) => [...prev, { role: 'ai', text: reply }]);
    } catch (err) {
      setError('Mesaj gönderilemedi.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to render message text with clickable links
  const renderMessage = (text) => {
    // Split by whitespace to identify URLs
    return text.split(/\s+/).map((word, idx) => {
      if (word.startsWith('http')) {
        return (
          <a
            key={idx}
            href={word}
            className="text-blue-600 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {word}
          </a>
        );
      }
      return <React.Fragment key={idx}>{word}{' '}</React.Fragment>;
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h2 className="text-2xl font-semibold">Sohbet</h2>
      <div className="border border-gray-300 p-4 rounded h-80 overflow-y-auto bg-white">
        {messages.length === 0 && (
          <p className="text-gray-500">Henüz mesaj yok. Sorularınızı sormaya başlayın!</p>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className="mb-3">
            <p className={msg.role === 'user' ? 'font-semibold' : 'font-semibold text-green-700'}>
              {msg.role === 'user' ? 'Siz' : 'AI'}:
            </p>
            <p className="ml-2 whitespace-pre-wrap">{renderMessage(msg.text)}</p>
          </div>
        ))}
        {loading && <p className="text-sm text-gray-500">Yükleniyor...</p>}
      </div>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSend} className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border border-gray-300 px-3 py-2 rounded"
          placeholder="Sorunuzu yazın..."
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          Gönder
        </button>
      </form>
    </div>
  );
};

export default Chat;