import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchExams, selectExam } from '../api.js';

/**
 * ExamSelection component
 *
 * Displays a list of available exam types retrieved from the backend
 * and allows the user to associate themselves with one or more exams.
 * After selecting an exam and submitting, the user is redirected to
 * the questionnaire page. The component is protected by the auth guard
 * in App.jsx, so it assumes there is a valid JWT in localStorage.
 */
const ExamSelection = () => {
  const [exams, setExams] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch available exams on mount
  useEffect(() => {
    const loadExams = async () => {
      try {
        const response = await fetchExams();
        setExams(response.data);
      } catch (err) {
        setError('Sınavlar yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };
    loadExams();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!selected) {
      setError('Lütfen bir sınav seçiniz');
      return;
    }
    try {
      await selectExam(selected);
      // After successful selection, navigate to the questionnaire page
      navigate('/questionnaire');
    } catch (err) {
      // Display backend error if available
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Sınav seçimi sırasında hata oluştu');
      }
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-semibold mb-4">Hedef Sınav Seçimi</h2>
      {loading ? (
        <p>Yükleniyor...</p>
      ) : (
        <>
          {error && <p className="text-red-500 mb-2">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1">Sınav Türü</label>
              <select
                className="w-full border border-gray-300 px-3 py-2 rounded"
                value={selected || ''}
                onChange={(e) => setSelected(parseInt(e.target.value))}
              >
                <option value="" disabled>
                  Seçiniz...
                </option>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
            >
              Kaydet ve Devam Et
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default ExamSelection;