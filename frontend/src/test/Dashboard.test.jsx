// ════════════════════════════════════════════════════════════════════════════
// Author: Miller Polania
// ════════════════════════════════════════════════════════════════════════════

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Dashboard from '../components/Dashboard';
import { ledgerService } from '../services/api';
import { useAuthContext } from '../context/AuthContext';

vi.mock('../services/api', () => ({
  ledgerService: {
    getBalance: vi.fn(), getMovements: vi.fn(),
    executeTransfer: vi.fn(), getNotifications: vi.fn(),
  },
  identityService: { login: vi.fn(), register: vi.fn() },
  default: {},
}));

vi.mock('../context/AuthContext', () => ({ useAuthContext: vi.fn() }));

vi.mock('../components/Transfer', () => ({
  default: ({ onTransferSuccess }) => (
    <button onClick={onTransferSuccess}>MockTransfer</button>
  ),
}));

vi.mock('../components/Movements', () => ({
  default: () => <div>MockMovements</div>,
}));

describe('Dashboard', () => {
  const mockLogout = vi.fn();
  const mockUser = { id: 1, username: 'testuser', phone_number: '3001112233' };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthContext.mockReturnValue({ user: mockUser, logout: mockLogout });
    ledgerService.getBalance.mockResolvedValue({ data: { balance: 5000 } });
    ledgerService.getNotifications.mockResolvedValue({ data: ['Alerta de seguridad', 'Actualiza tu info'] });
  });

  it('renderiza el mensaje de bienvenida con el nombre del usuario', () => {
    render(<Dashboard />);
    expect(screen.getByText(/bienvenido, testuser/i)).toBeInTheDocument();
  });

  it('llama getBalance con el id del usuario al montar', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(ledgerService.getBalance).toHaveBeenCalledWith(1);
    });
  });

  it('llama getNotifications con el id del usuario al montar', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(ledgerService.getNotifications).toHaveBeenCalledWith(1);
    });
  });

  it('muestra las notificaciones cuando hay datos', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Alerta de seguridad')).toBeInTheDocument();
      expect(screen.getByText('Actualiza tu info')).toBeInTheDocument();
    });
  });

  it('llama logout al hacer clic en cerrar sesión', () => {
    render(<Dashboard />);
    fireEvent.click(screen.getByText(/cerrar sesión/i));
    expect(mockLogout).toHaveBeenCalled();
  });

  it('no llama a los servicios si el usuario no tiene id', () => {
    useAuthContext.mockReturnValue({ user: null, logout: mockLogout });
    render(<Dashboard />);
    expect(ledgerService.getBalance).not.toHaveBeenCalled();
    expect(ledgerService.getNotifications).not.toHaveBeenCalled();
  });

  it('no muestra la sección de notificaciones cuando la lista está vacía', async () => {
    ledgerService.getNotifications.mockResolvedValue({ data: [] });
    render(<Dashboard />);
    await waitFor(() => {
      expect(ledgerService.getNotifications).toHaveBeenCalled();
    });
    expect(screen.queryByText(/avisos y centro de alertas/i)).not.toBeInTheDocument();
  });
});
