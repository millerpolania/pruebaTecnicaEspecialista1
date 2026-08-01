// ════════════════════════════════════════════════════════════════════════════
// Author: Miller Polania
// ════════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useAuthContext } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import './App.css';

function BankAppContent() {
  const { token } = useAuthContext();
  const [isRegistering, setIsRegistering] = useState(false);

  if (token) {
    return <Dashboard />;
  }

  return isRegistering ? (
    <Register onSwitch={() => setIsRegistering(false)} />
  ) : (
    <Login onSwitch={() => setIsRegistering(true)} />
  );
}

export default function App() {
  return (
    <div className="app-layout">
      <div className="phone-shell">
        <BankAppContent />
      </div>
    </div>
  );
}