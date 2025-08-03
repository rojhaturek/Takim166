import React, { useEffect, useState } from 'react';
import { getProfile, getProgress, getAIHistory } from '../api.js';

/**
 * Profile component
 *
 * Displays detailed information about the current user including their
 * name, email, exam selections, questionnaire responses, progress
 * records and recent AI interactions. It is similar to the dashboard
 * but intended as a standalone page for reviewing personal data.
 */
const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [progress, setProgress] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [pRes, progRes, histRes] = await Promise.all([
          getProfile(),
          getProgress(),
          getAIHistory(10),
        ]);
        setProfile(pRes.data);
        setProgress(progRes.data);
        setHistory(histRes.data);
      } catch (err) {
        setError('Profil yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return <p>Yükleniyor...</p>;
  }
  if (error) {
    return <p className="text-red-500">{error}</p>;
  }
  if (!profile) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold">Profil</h2>
      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-xl font-semibold mb-2">Kullanıcı Bilgileri</h3>
        <p><strong>Ad:</strong> {profile.name}</p>
        <p><strong>E‑posta:</strong> {profile.email}</p>
        <p><strong>Seçilen Sınavlar:</strong> {profile.exams && profile.exams.length > 0 ? profile.exams.join(', ') : 'Yok'}</p>
      </div>
      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-xl font-semibold mb-2">Anket</h3>
        {profile.questionnaire ? (
          <div className="space-y-1">
            {profile.questionnaire.learning_style && (
              <p><strong>Öğrenme Stili:</strong> {profile.questionnaire.learning_style}</p>
            )}
            {profile.questionnaire.daily_hours && (
              <p><strong>Günlük Saat:</strong> {profile.questionnaire.daily_hours}</p>
            )}
            {profile.questionnaire.difficult_topics && profile.questionnaire.difficult_topics.length > 0 && (
              <p><strong>Zorlandığı Konular:</strong> {profile.questionnaire.difficult_topics.join(', ')}</p>
            )}
          </div>
        ) : (
          <p>Anket bulunamadı.</p>
        )}
      </div>
      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-xl font-semibold mb-2">İlerleme Kayıtları</h3>
        {progress && progress.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="border px-2 py-1">#</th>
                <th className="border px-2 py-1">Konu</th>
                <th className="border px-2 py-1">Durum</th>
                <th className="border px-2 py-1">Puan</th>
              </tr>
            </thead>
            <tbody>
              {progress.map((rec, idx) => (
                <tr key={rec.id} className="border-t">
                  <td className="px-2 py-1">{idx + 1}</td>
                  <td className="px-2 py-1">{rec.topic}</td>
                  <td className="px-2 py-1">{rec.status}</td>
                  <td className="px-2 py-1">{rec.score ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Henüz ilerleme bulunamadı.</p>
        )}
      </div>
      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-xl font-semibold mb-2">AI Etkileşim Geçmişi</h3>
        {history && history.length > 0 ? (
          <ul className="list-disc ml-5 space-y-1">
            {history.map((item) => (
              <li key={item.id}>
                <strong>{item.interaction_type}</strong> – {new Date(item.timestamp).toLocaleString()}
              </li>
            ))}
          </ul>
        ) : (
          <p>AI etkileşim geçmişi bulunamadı.</p>
        )}
      </div>
    </div>
  );
};

export default Profile;