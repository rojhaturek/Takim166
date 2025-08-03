import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const NavBar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white py-4 px-6">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-xl font-semibold">
          EduAI
        </Link>
        <div className="flex space-x-4 items-center">
          {!token && (
            <>
              <Link to="/login" className="hover:underline">
                Giriş
              </Link>
              <Link to="/register" className="hover:underline">
                Kayıt
              </Link>
            </>
          )}
          {token && (
            <>
              <Link to="/dashboard" className="hover:underline">
                Panel
              </Link>
              <Link to="/exams" className="hover:underline">
                Sınav Seçimi
              </Link>
              <Link to="/questionnaire" className="hover:underline">
                Anket
              </Link>
              <Link to="/mini-test" className="hover:underline">
                Mini Test
              </Link>
              <Link to="/weekly-plan" className="hover:underline">
                Haftalık Plan
              </Link>
              <Link to="/profile" className="hover:underline">
                Profil
              </Link>
              <Link to="/chat" className="hover:underline">
                Sohbet
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
              >
                Çıkış
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;