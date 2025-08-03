import React, { useEffect, useState } from 'react';
import { getMiniTest, submitMiniTest } from '../api.js';

/**
 * MiniTest component
 *
 * Fetches a short practice test from the backend and presents it to the
 * user. The user selects answers to each question and submits them for
 * evaluation. After submission, a summary of correct and incorrect
 * answers is displayed along with the total score. In a real system
 * this page could update user progress and trigger additional learning
 * resources based on the outcome.
 */
const MiniTest = () => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load test questions on mount
  useEffect(() => {
    const loadTest = async () => {
      try {
        const res = await getMiniTest();
        // The backend returns questions including the correct answer
        // Remove the answer key so users don't see it
        const sanitized = res.data.questions.map(({ answer, ...rest }) => rest);
        setQuestions(sanitized);
      } catch (err) {
        setError('Mini test yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };
    loadTest();
  }, []);

  const handleAnswerChange = (qId, value) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    // Construct answers array expected by API
    const answersArray = questions.map((q) => ({ id: q.id, answer: answers[q.id] ?? '' }));
    try {
      const res = await submitMiniTest(answersArray);
      setResult(res.data);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Test değerlendirilirken hata oluştu');
      }
    }
  };

  if (loading) {
    return <p>Yükleniyor...</p>;
  }
  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4">Mini Test</h2>
      {result ? (
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-xl font-semibold mb-2">Sonuçlar</h3>
          <p>
            Toplam {result.total} sorudan {result.correct} doğru cevap verdiniz.
          </p>
          <table className="w-full text-left border-collapse mt-4">
            <thead>
              <tr>
                <th className="border px-2 py-1">Soru</th>
                <th className="border px-2 py-1">Doğru Cevap</th>
                <th className="border px-2 py-1">Cevabınız</th>
                <th className="border px-2 py-1">Durum</th>
            <th className="border px-2 py-1">Açıklama</th>
              </tr>
            </thead>
            <tbody>
              {result.details.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-2 py-1">{item.id}</td>
                  <td className="px-2 py-1">{item.correct_answer}</td>
                  <td className="px-2 py-1">{item.your_answer || '-'}</td>
                  <td className="px-2 py-1">
                    {item.correct ? (
                      <span className="text-green-600">Doğru</span>
                    ) : (
                      <span className="text-red-600">Yanlış</span>
                    )}
                  </td>
                  <td className="px-2 py-1 text-sm">
                    {item.explanation ? item.explanation : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {questions.map((q) => (
            <div key={q.id} className="bg-white p-4 rounded shadow">
              <p className="font-semibold mb-2">{q.prompt}</p>
              <div className="space-y-1">
                {q.choices.map((choice, idx) => (
                  <label key={idx} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      value={choice}
                      checked={answers[q.id] === choice}
                      onChange={() => handleAnswerChange(q.id, choice)}
                    />
                    <span>{choice}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Gönder ve Sonuçları Gör
          </button>
        </form>
      )}
    </div>
  );
};

export default MiniTest;