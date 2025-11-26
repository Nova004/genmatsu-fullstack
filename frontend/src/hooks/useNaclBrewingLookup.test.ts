import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import useNaclBrewingLookup from './useNaclBrewingLookup';
import apiClient from '../services/apiService';

// Mock the API client
vi.mock('../services/apiService', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('useNaclBrewingLookup', () => {
  const mockSetValue = vi.fn();
  const mockWatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should fetch data and set value on success', async () => {
    mockWatch.mockReturnValue(10); // cg1cWaterContent
    (apiClient.get as any).mockResolvedValue({
      data: { NaCl_NaCl_Water: 123 },
    });

    renderHook(() =>
      useNaclBrewingLookup(mockWatch as any, mockSetValue, '15%'),
    );

    // Fast-forward debounce
    await act(async () => {
      vi.runAllTimers();
    });

    expect(apiClient.get).toHaveBeenCalledWith(
      '/api/nacl/lookup/10/15%25/null',
    );
    expect(mockSetValue).toHaveBeenCalledWith(
      'calculations.naclBrewingTable',
      123,
    );
  });

  it('should handle chemicalsType parameter correctly', async () => {
    mockWatch.mockReturnValue(20);
    (apiClient.get as any).mockResolvedValue({
      data: { NaCl_NaCl_Water: 456 },
    });

    renderHook(() =>
      useNaclBrewingLookup(mockWatch as any, mockSetValue, '4%', 'Type A'),
    );

    await act(async () => {
      vi.runAllTimers();
    });

    // 'Type A' should be encoded to 'Type%20A'
    expect(apiClient.get).toHaveBeenCalledWith(
      '/api/nacl/lookup/20/4%25/Type%20A',
    );
    expect(mockSetValue).toHaveBeenCalledWith(
      'calculations.naclBrewingTable',
      456,
    );
  });

  it('should not fetch if water content is missing or invalid', async () => {
    mockWatch.mockReturnValue(null);

    renderHook(() =>
      useNaclBrewingLookup(mockWatch as any, mockSetValue, '15%'),
    );

    await act(async () => {
      vi.runAllTimers();
    });

    expect(apiClient.get).not.toHaveBeenCalled();
    expect(mockSetValue).toHaveBeenCalledWith(
      'calculations.naclBrewingTable',
      null,
    );
  });

  it('should handle API error gracefully', async () => {
    mockWatch.mockReturnValue(10);
    (apiClient.get as any).mockRejectedValue(new Error('Network Error'));

    renderHook(() =>
      useNaclBrewingLookup(mockWatch as any, mockSetValue, '15%'),
    );

    await act(async () => {
      vi.runAllTimers();
    });

    expect(apiClient.get).toHaveBeenCalled();
    expect(mockSetValue).toHaveBeenCalledWith(
      'calculations.naclBrewingTable',
      null,
    );
  });

  it('should debounce API calls', async () => {
    mockWatch.mockReturnValue(10);
    (apiClient.get as any).mockResolvedValue({
      data: { NaCl_NaCl_Water: 123 },
    });

    const { rerender } = renderHook(() =>
      useNaclBrewingLookup(mockWatch as any, mockSetValue, '15%'),
    );

    // Advance time partially (200ms) - should not call yet
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    expect(apiClient.get).not.toHaveBeenCalled();

    // Update watch value (simulate user typing)
    mockWatch.mockReturnValue(11);
    rerender();

    // Advance another 200ms (total 400ms from start, but 200ms from last change)
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    expect(apiClient.get).not.toHaveBeenCalled();

    // Advance full 500ms
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(apiClient.get).toHaveBeenCalledTimes(1);
    // Should call with the latest value (11)
    expect(apiClient.get).toHaveBeenCalledWith(
      '/api/nacl/lookup/11/15%25/null',
    );
  });
});
