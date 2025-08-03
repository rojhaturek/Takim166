import React, { useEffect, useState } from 'react';
import { getWeeklyPlan, listPlans, deletePlan } from '../api.js';

/**
 * WeeklyPlan component
 *
 * Allows the user to generate a new weekly study plan and displays a
 * list of previously generated plans. Each plan includes subjects for
 * specific days and optional tests. The user can delete old plans.
 */
const WeeklyPlan = () => {
  const [currentPlan, setCurrentPlan] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPlans = async () => {
    try {
      const res = await listPlans();
      setPlans(res.data);
    } catch (err) {
      setError('Planlar yüklenirken hata oluştu');
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadPlans();
      setLoading(false);
    };
    init();
  }, []);

  const createPlan = async () => {
    setError(null);
    try {
      const res = await getWeeklyPlan();
      setCurrentPlan(res.data);
      // Reload list to include newly created plan
      await loadPlans();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Plan oluşturulurken hata oluştu');
      }
    }
  };

  const handleDelete = async (id) => {
    setError(null);
    try {
      await deletePlan(id);
      // Remove from local state
      setPlans((prev) => prev.filter((p) => p.id !== id));
      // If currentPlan deleted, clear
      if (currentPlan && currentPlan.id === id) {
        setCurrentPlan(null);
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Plan silinirken hata oluştu');
      }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Haftalık Plan</h2>
      {error && <p className="text-red-500">{error}</p>}
      <button
        onClick={createPlan}
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
      >
        Yeni Plan Oluştur
      </button>
      {currentPlan && (
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-xl font-semibold mb-2">Oluşturulan Plan ({currentPlan.week_start})</h3>
          <h4 className="font-semibold mt-2">Konu Dağılımı</h4>
          <ul className="list-disc ml-5 mb-2">
            {currentPlan.subjects.map((sub, idx) => (
              <li key={idx}>{sub.day}: {sub.topic} ({sub.duration} saat)</li>
            ))}
          </ul>
          {currentPlan.tests && currentPlan.tests.length > 0 && (
            <>
              <h4 className="font-semibold mt-2">Testler</h4>
              <ul className="list-disc ml-5">
                {currentPlan.tests.map((test, idx) => (
                  <li key={idx}>{test.day}: {test.subject} ({test.num_questions} soru)</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-xl font-semibold mb-2">Tüm Planlar</h3>
        {loading ? (
          <p>Yükleniyor...</p>
        ) : plans && plans.length > 0 ? (
          <ul className="space-y-2">
            {plans.map((plan) => (
              <li key={plan.id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <span className="font-semibold">{plan.week_start}</span> – {plan.subjects.length} konu
                </div>
                <button
                  onClick={() => handleDelete(plan.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                >
                  Sil
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>Plan bulunamadı.</p>
        )}
      </div>
    </div>
  );
};

export default WeeklyPlan;