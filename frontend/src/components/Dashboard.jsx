// ════════════════════════════════════════════════════════════════════════════
// Author: Miller Polania
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { ledgerService } from '../services/api';
import Transfer from './Transfer';
import Movements from './Movements';

export default function Dashboard() {
  const { user, logout } = useAuthContext();
  const [balance, setBalance] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  //Efecto existente para el Balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!user?.id || user.id === 'null' || user.id === 'undefined') {
        console.log("Petición de balance abortada: Esperando un ID de usuario real.");
        return;
      }

      try {
        console.log(`Enviando ID real a Java para balance: ${user.id}`);
        const res = await ledgerService.getBalance(user.id);
        setBalance(res.data.balance);
      } catch (err) {
        console.error("Error trayendo saldo (Circuit Breaker Activado)");
      }
    };

    if (user && user.id && user.id !== 'null' && user.id !== 'undefined') {
      fetchBalance();
    }
  }, [user, refresh]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id || user.id === 'null' || user.id === 'undefined') return;
      
      try {
        const res = await ledgerService.getNotifications(user.id);
        setNotifications(res.data);
      } catch (err) {
        console.error("Error trayendo notificaciones locales", err);
      }
    };

    if (user && user.id && user.id !== 'null' && user.id !== 'undefined') {
      fetchNotifications();
    }
  }, [user, refresh]);

  return (
    <div className="dashboard-shell">
      <header className="app-topbar">
        <div className="greeting">
          Bienvenido, {user?.username || 'Usuario'} 🏦
          <span>Banca Móvil</span>
        </div>
        <button onClick={logout} className="logout-btn">Cerrar Sesión</button>
      </header>

      <div className="app-content">
        {activeTab === 'home' && (
          <>
            <section className="balance-box">
              <div className="balance-top">
                <div>
                  <h3>Tu Saldo Disponible</h3>
                  <p className="amount">${balance.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</p>
                </div>
                <button onClick={() => setRefresh(!refresh)} className="refresh-btn">🔄</button>
              </div>
            </section>

            {notifications.length > 0 && (
              <section className="notifications-box">
                <h4>🔔 Avisos y Centro de Alertas</h4>
                <ul>
                  {notifications.map((alert, index) => (
                    <li key={index} style={{ marginBottom: '5px' }}>{alert}</li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}

        {activeTab === 'transfer' && (
          <>
            <h2 className="page-title">Transferir</h2>
            <Transfer onTransferSuccess={() => setRefresh(!refresh)} />
          </>
        )}

        {activeTab === 'movements' && (
          <>
            <h2 className="page-title">Movimientos</h2>
            <Movements refreshTrigger={refresh} />
          </>
        )}

        {activeTab === 'profile' && (
          <>
            <h2 className="page-title">Perfil</h2>
            <div className="page-card">
              <div className="profile-header">
                <div className="profile-avatar">
                  {(user?.username || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="profile-name">{user?.username || 'Usuario'}</span>
              </div>
              <div className="profile-row">
                <span className="label">Teléfono</span>
                <span className="value">{user?.phone_number || 'N/D'}</span>
              </div>
              <div className="profile-row">
                <span className="label">ID de cuenta</span>
                <span className="value">{user?.id || 'N/D'}</span>
              </div>
            </div>
            <button onClick={logout} className="logout-btn-full">Cerrar Sesión</button>
          </>
        )}
      </div>

      <nav className="bottom-nav">
        <button
          className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <span className="nav-icon">🏠</span>
          Inicio
        </button>
        <button
          className={`nav-item ${activeTab === 'transfer' ? 'active' : ''}`}
          onClick={() => setActiveTab('transfer')}
        >
          <span className="nav-icon">💸</span>
          Transferir
        </button>
        <button
          className={`nav-item ${activeTab === 'movements' ? 'active' : ''}`}
          onClick={() => setActiveTab('movements')}
        >
          <span className="nav-icon">📋</span>
          Movimientos
        </button>
        <button
          className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <span className="nav-icon">👤</span>
          Perfil
        </button>
      </nav>
    </div>
  );
}