// ════════════════════════════════════════════════════════════════════════════
// Author: Miller Polania
// ════════════════════════════════════════════════════════════════════════════

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Transfer from '../components/Transfer';
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

describe('Transfer', () => {
  const mockOnSuccess = vi.fn();
  const mockUser = { id: 1, username: 'testuser', phone_number: '3001112233' };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthContext.mockReturnValue({ user: mockUser });
  });

  it('renderiza inputs de teléfono y monto', () => {
    render(<Transfer onTransferSuccess={mockOnSuccess} />);
    expect(screen.getByPlaceholderText(/número de celular/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/monto/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirmar/i })).toBeInTheDocument();
  });

  it('muestra estado de procesamiento al hacer submit', async () => {
    ledgerService.executeTransfer.mockResolvedValue({ data: {} });

    render(<Transfer onTransferSuccess={mockOnSuccess} />);
    fireEvent.change(screen.getByPlaceholderText(/número de celular/i), { target: { value: '3009998877' } });
    fireEvent.change(screen.getByPlaceholderText(/monto/i), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    expect(screen.getByText(/procesando/i)).toBeInTheDocument();
  });

  it('muestra mensaje de éxito tras transferencia exitosa', async () => {
    ledgerService.executeTransfer.mockResolvedValue({ data: {} });

    render(<Transfer onTransferSuccess={mockOnSuccess} />);
    fireEvent.change(screen.getByPlaceholderText(/número de celular/i), { target: { value: '3009998877' } });
    fireEvent.change(screen.getByPlaceholderText(/monto/i), { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    await waitFor(() => {
      expect(screen.getByText(/transferencia exitosa/i)).toBeInTheDocument();
    });
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it('muestra mensaje de error si la transferencia falla', async () => {
    ledgerService.executeTransfer.mockRejectedValue(new Error('Insufficient funds'));

    render(<Transfer onTransferSuccess={mockOnSuccess} />);
    fireEvent.change(screen.getByPlaceholderText(/número de celular/i), { target: { value: '3009998877' } });
    fireEvent.change(screen.getByPlaceholderText(/monto/i), { target: { value: '9999999' } });
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    await waitFor(() => {
      expect(screen.getByText(/fallo/i)).toBeInTheDocument();
    });
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('llama executeTransfer con los argumentos correctos', async () => {
    ledgerService.executeTransfer.mockResolvedValue({ data: {} });

    render(<Transfer onTransferSuccess={mockOnSuccess} />);
    fireEvent.change(screen.getByPlaceholderText(/número de celular/i), { target: { value: '3009998877' } });
    fireEvent.change(screen.getByPlaceholderText(/monto/i), { target: { value: '200' } });
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    await waitFor(() => {
      expect(ledgerService.executeTransfer).toHaveBeenCalledWith(1, '3009998877', '200');
    });
  });
});
