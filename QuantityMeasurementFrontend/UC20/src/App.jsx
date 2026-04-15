import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

import Sidebar     from './components/Sidebar';
import MobileNav   from './components/MobileNav';
import AuthModal   from './components/AuthModal';

import HomePage        from './pages/HomePage';
import ConvertPage    from './pages/ConvertPage';
import ArithmeticPage from './pages/ArithmeticPage';
import HistoryPage    from './pages/HistoryPage';

export default function App() {
  // Modal state
  const [modalOpen, setModalOpen]     = useState(false);
  const [modalForm, setModalForm]     = useState('login');
  // Mobile nav state
  const [mobileOpen, setMobileOpen]   = useState(false);

  const openModal = (form) => {
    setModalForm(form);
    setModalOpen(true);
    setMobileOpen(false); // close mobile nav if open
  };

  const closeModal = () => setModalOpen(false);

  return (
    <AuthProvider>
      <ToastProvider>
        <div className="app">

          {/* ── Desktop Sidebar ── */}
          <Sidebar onOpenModal={openModal} />

          {/* ── Mobile Top Bar + Overlay Nav ── */}
          <MobileNav
            isOpen={mobileOpen}
            onClose={() => setMobileOpen(prev => !prev)}
            onOpenModal={openModal}
          />

          {/* ── Main Content ── */}
          <div className="main-content">
            <main>
              <Routes>
                <Route path="/"            element={<HomePage onOpenModal={openModal} />} />
                <Route path="/convert"     element={<ConvertPage />} />
                <Route path="/arithmetic"  element={<ArithmeticPage />} />
                <Route path="/history"     element={<HistoryPage onOpenModal={openModal} />} />
                {/* Catch-all → home */}
                <Route path="*"            element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>

          {/* ── Auth Modal ── */}
          <AuthModal
            isOpen={modalOpen}
            onClose={closeModal}
            defaultForm={modalForm}
          />

        </div>
      </ToastProvider>
    </AuthProvider>
  );
}
