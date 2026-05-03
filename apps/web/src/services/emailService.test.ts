import { describe, it, expect, vi, beforeEach } from 'vitest';
import { emailService } from './emailService';

describe('emailService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should submit email to waitlist successfully', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'success' }),
    }));

    await emailService.submitToWaitlist('test@example.com');

    expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('email=test%40example.com'),
    }));
  });

  it('should throw error on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    await expect(emailService.submitToWaitlist('test@example.com')).rejects.toThrow('Network error');
  });

  it('should log error if GOOGLE_SCRIPT_URL is missing', async () => {
    // We can't easily change import.meta.env in Vitest if it's constant, 
    // but let's assume it can be mocked or we just test the return value
    // Actually, let's just mock the console.error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // This is a bit hacky to test but let's try to mock the env
    vi.stubEnv('VITE_GOOGLE_SCRIPT_URL', '');
    
    const result = await emailService.submitToWaitlist('test@example.com');
    expect(result).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
    
    vi.unstubAllEnvs();
    consoleSpy.mockRestore();
  });
});
