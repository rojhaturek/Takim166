import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  submitQuestionnaire,
  fetchQuestionnaireAI,
  submitQuestionnaireAI,
} from '../api.js';

/**
 * Questionnaire component
 *
 * Collects user preferences such as learning style, daily study hours
 * and topics they find difficult. This information is sent to the
 * backend and stored as an AI interaction. After submission the user
 * is redirected to the mini test page. All fields are optional but
 * recommended to improve personalisation.
 */
const Questionnaire = () => {
  const navigate = useNavigate();
  // Dynamic questionnaire state
  const [dynamicQuestions, setDynamicQuestions] = useState(null);
  const [dynamicAnswers, setDynamicAnswers] = useState({});
  // Static form state (fallback)
  const [form, setForm] = useState({
    learning_style: '',
    daily_hours: '',
    difficult_topics: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Try to fetch AI-generated questionnaire on mount
    const loadAIQuestions = async () => {
      try {
        const res = await fetchQuestionnaireAI();
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setDynamicQuestions(res.data);
        } else {
          setDynamicQuestions(null);
        }
      } catch (err) {
        // Ignore errors and fall back to static form
        setDynamicQuestions(null);
      } finally {
        setLoading(false);
      }
    };
    loadAIQuestions();
  }, []);

  const handleDynamicChange = (id, value) => {
    setDynamicAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleStaticChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (dynamicQuestions) {
        // Build answers array for AI questionnaire
        const answersArray = dynamicQuestions.map((q) => ({
          id: q.id,
          answer: dynamicAnswers[q.id] !== undefined ? dynamicAnswers[q.id] : '',
        }));
        await submitQuestionnaireAI({ answers: answersArray });
      } else {
        // Prepare payload for static questionnaire
        const payload = {
          learning_style: form.learning_style || undefined,
          daily_hours: form.daily_hours ? parseInt(form.daily_hours) : undefined,
          difficult_topics: form.difficult_topics
            ? form.difficult_topics
                .split(',')
                .map((t) => t.trim())
                .filter((t) => t.length > 0)
            : undefined,
        };
        await submitQuestionnaire(payload);
      }
      navigate('/mini-test');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Anket gönderilirken hata oluştu');
      }
    }
  };

  if (loading) {
    return <p>Yükleniyor...</p>;
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-semibold mb-4">Kullanıcı Anketi</h2>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {dynamicQuestions ? (
          // Render AI-generated questions
          dynamicQuestions.map((q) => (
            <div key={q.id}>
              <label className="block mb-1 font-medium">{q.question}</label>
              {q.type === 'choice' && Array.isArray(q.options) ? (
                <select
                  className="w-full border border-gray-300 px-3 py-2 rounded"
                  value={dynamicAnswers[q.id] || ''}
                  onChange={(e) => handleDynamicChange(q.id, e.target.value)}
                >
                  <option value="">Seçiniz...</option>
                  {q.options.map((opt, idx) => (
                    <option key={idx} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : q.type === 'number' ? (
                <input
                  type="number"
                  className="w-full border border-gray-300 px-3 py-2 rounded"
                  value={dynamicAnswers[q.id] || ''}
                  onChange={(e) => handleDynamicChange(q.id, e.target.value)}
                />
              ) : (
                <input
                  type="text"
                  className="w-full border border-gray-300 px-3 py-2 rounded"
                  value={dynamicAnswers[q.id] || ''}
                  onChange={(e) => handleDynamicChange(q.id, e.target.value)}
                />
              )}
            </div>
          ))
        ) : (
          // Static fallback form
          <>
            <div>
              <label className="block mb-1">Öğrenme Stili</label>
              <select
                name="learning_style"
                value={form.learning_style}
                onChange={handleStaticChange}
                className="w-full border border-gray-300 px-3 py-2 rounded"
              >
                <option value="">Seçiniz...</option>
                <option value="visual">Görsel</option>
                <option value="auditory">İşitsel</option>
                <option value="kinesthetic">Uygulamalı</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">Günlük Çalışma Süresi (saat)</label>
              <input
                type="number"
                name="daily_hours"
                value={form.daily_hours}
                onChange={handleStaticChange}
                className="w-full border border-gray-300 px-3 py-2 rounded"
                min="1"
              />
            </div>
            <div>
              <label className="block mb-1">Zorlandığınız Konular (virgül ile ayırınız)</label>
              <textarea
                name="difficult_topics"
                value={form.difficult_topics}
                onChange={handleStaticChange}
                className="w-full border border-gray-300 px-3 py-2 rounded"
                rows="3"
                placeholder="Örn: limit, türev, devre analizi"
              ></textarea>
            </div>
          </>
        )}
        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded"
        >
          Gönder ve Devam Et
        </button>
      </form>
    </div>
  );
};

export default Questionnaire;