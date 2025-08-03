import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProfile, getProgress, getAIHistory } from '../api.js';

/**
 * Dashboard component
 *
 * Provides an overview of the user’s profile, selected exams, last
 * questionnaire, progress records and recent AI interactions. This page
 * serves as the landing page after login and allows the user to navigate
 * to other sections such as the mini test, weekly plan and profile.
 */
const Dashboard = () => {
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
          getAIHistory(5),
        ]);
        setProfile(pRes.data);
        setProgress(progRes.data);
        setHistory(histRes.data);
      } catch (err) {
        setError('Veriler yüklenirken hata oluştu');
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
      <h2 className="text-3xl font-semibold">Merhaba, {profile.name}</h2>
      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-xl font-semibold mb-2">Seçtiğiniz Sınavlar</h3>
        {profile.exams && profile.exams.length > 0 ? (
          <ul className="list-disc ml-5">
            {profile.exams.map((exam, idx) => (
              <li key={idx}>{exam}</li>
            ))}
          </ul>
        ) : (
          <p>Henüz sınav seçimi yapılmadı. <Link to="/exams" className="text-blue-600 underline">Sınav Seç</Link></p>
        )}
      </div>
      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-xl font-semibold mb-2">Son Anket</h3>
        {profile.questionnaire ? (
          <div className="space-y-1">
            {profile.questionnaire.learning_style && (
              <p><strong>Öğrenme Stili:</strong> {profile.questionnaire.learning_style}</p>
            )}
            {profile.questionnaire.daily_hours && (
              <p><strong>Günlük Saat:</strong> {profile.questionnaire.daily_hours}</p>
            )}
            {profile.questionnaire.difficult_topics && profile.questionnaire.difficult_topics.length > 0 && (
              <p><strong>Zorlandığınız Konular:</strong> {profile.questionnaire.difficult_topics.join(', ')}</p>
            )}
          </div>
        ) : (
          <p>Henüz anket doldurulmadı. <Link to="/questionnaire" className="text-blue-600 underline">Anket Doldur</Link></p>
        )}
      </div>
      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-xl font-semibold mb-2">İlerleme</h3>
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
          <p>Henüz ilerleme kaydı yok.</p>
        )}
      </div>
      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-xl font-semibold mb-2">Son AI Etkileşimleri</h3>
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
      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-xl font-semibold mb-2">Hızlı Erişim</h3>
        <div className="flex flex-wrap gap-4">
          <Link to="/mini-test" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">Mini Test</Link>
          <Link to="/weekly-plan" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded">Haftalık Plan</Link>
          <Link to="/profile" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Profil</Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;