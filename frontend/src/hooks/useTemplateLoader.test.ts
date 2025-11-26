import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTemplateLoader } from './useTemplateLoader';
import { getLatestTemplateByName } from '../services/formService';

// Mock the service
vi.mock('../services/formService', () => ({
  getLatestTemplateByName: vi.fn(),
}));

describe('useTemplateLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load template successfully from API', async () => {
    const mockData = {
      template: { id: 1, name: 'Test Template' },
      items: [{ id: 1, label: 'Field 1' }],
    };
    (getLatestTemplateByName as any).mockResolvedValue(mockData);

    const onTemplateLoaded = vi.fn();

    const { result } = renderHook(() =>
      useTemplateLoader({ templateName: 'TestTemplate', onTemplateLoaded }),
    );

    // Initial state should be loading
    expect(result.current.isLoading).toBe(true);

    // Wait for loading to finish
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.fields).toEqual(mockData.items);
    expect(result.current.error).toBeNull();
    expect(onTemplateLoaded).toHaveBeenCalledWith(mockData.template);
    expect(getLatestTemplateByName).toHaveBeenCalledWith('TestTemplate');
  });

  it('should handle API error gracefully', async () => {
    (getLatestTemplateByName as any).mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() =>
      useTemplateLoader({
        templateName: 'TestTemplate',
        onTemplateLoaded: vi.fn(),
      }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toContain(
      'ไม่สามารถโหลดข้อมูล Master (TestTemplate) ได้',
    );
    expect(result.current.fields).toEqual([]);
  });

  it('should handle invalid data structure from API', async () => {
    // API returns data but missing 'items'
    const invalidData = { template: { id: 1 } };
    (getLatestTemplateByName as any).mockResolvedValue(invalidData);

    const { result } = renderHook(() =>
      useTemplateLoader({
        templateName: 'TestTemplate',
        onTemplateLoaded: vi.fn(),
      }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toContain(
      'โครงสร้าง Master ของ TestTemplate ไม่ถูกต้อง',
    );
  });

  it('should use static blueprint if provided (skip API)', async () => {
    const staticData = {
      template: { id: 2, name: 'Static' },
      items: [{ id: 2, label: 'Static Field' }],
    };

    const { result } = renderHook(() =>
      useTemplateLoader({
        templateName: 'TestTemplate',
        onTemplateLoaded: vi.fn(),
        staticBlueprint: staticData,
      }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.fields).toEqual(staticData.items);
    expect(getLatestTemplateByName).not.toHaveBeenCalled();
  });
});
