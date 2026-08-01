// ════════════════════════════════════════════════════════════════════════════
// Author: Miller Polania
// ════════════════════════════════════════════════════════════════════════════

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Movements from '../components/Movements';
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

describe('Movements', () => {
  const mockUser = { id: 1, username: 'testuser', phone_number: '3001112233' };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthContext.mockReturnValue({ user: mockUser });
  });

  it('muestra estado vacío cuando no hay movimientos', async () => {
    ledgerService.getMovements.mockResolvedValue({ data: [] });

    render(<Movements refreshTrigger={false} />);

    await waitFor(() => {
      expect(screen.getByText(/no registras transacciones/i)).toBeInTheDocument();
    });
  });

  it('llama getMovements con el id del usuario', async () => {
    ledgerService.getMovements.mockResolvedValue({ data: [] });

    render(<Movements refreshTrigger={false} />);

    await waitFor(() => {
      expect(ledgerService.getMovements).toHaveBeenCalledWith(1);
    });
  });

  it('renderiza un egreso cuando el teléfono destino no coincide con el usuario', async () => {
    ledgerService.getMovements.mockResolvedValue({
      data: [
        {
          id: 1, origin_account_id: 10,
          destination_phone: '3009998877',
          amount: '500.00', type: 'egreso',
          timestamp: '2025-01-15T10:00:00',
        },
      ],
    });

    render(<Movements refreshTrigger={false} />);

    await waitFor(() => {
      expect(screen.getByText(/enviaste a: 3009998877/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/\-\$500\.00/)).toBeInTheDocument();
  });

  it('renderiza un ingreso cuando el teléfono destino coincide con el usuario', async () => {
    ledgerService.getMovements.mockResolvedValue({
      data: [
        {
          id: 2, origin_account_id: 20,
          destination_phone: '3001112233',
          amount: '100.00', type: 'ingreso',
          timestamp: '2025-01-16T10:00:00',
        },
      ],
    });

    render(<Movements refreshTrigger={false} />);

    await waitFor(() => {
      expect(screen.getByText(/recibiste dinero/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/\+\$100\.00/)).toBeInTheDocument();
  });

  it('renderiza múltiples movimientos correctamente', async () => {
    ledgerService.getMovements.mockResolvedValue({
      data: [
        {
          id: 1, origin_account_id: 10,
          destination_phone: '3009998877',
          amount: '200.00', type: 'egreso',
          timestamp: '2025-01-15T10:00:00',
        },
        {
          id: 2, origin_account_id: 20,
          destination_phone: '3001112233',
          amount: '50.00', type: 'ingreso',
          timestamp: '2025-01-16T10:00:00',
        },
      ],
    });

    render(<Movements refreshTrigger={false} />);

    await waitFor(() => {
      expect(screen.getByText(/enviaste a/i)).toBeInTheDocument();
      expect(screen.getByText(/recibiste dinero/i)).toBeInTheDocument();
    });
  });

  it('no llama getMovements si el usuario no tiene id', () => {
    useAuthContext.mockReturnValue({ user: null });

    render(<Movements refreshTrigger={false} />);

    expect(ledgerService.getMovements).not.toHaveBeenCalled();
  });
});
