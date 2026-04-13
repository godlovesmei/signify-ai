import { describe, expect, it } from 'vitest';
import {
  getActiveWorkspaceNavItem,
  isWorkspaceNavActive,
  isWorkspaceRoute,
} from './workspaceNavConfig';

describe('workspaceNavConfig', () => {
  it('matches active workspace routes including querystring input', () => {
    expect(isWorkspaceNavActive('/translate', '/translate')).toBe(true);
    expect(isWorkspaceNavActive('/translate', '/translate?mode=word')).toBe(true);
    expect(isWorkspaceNavActive('/practice', '/practice')).toBe(true);
    expect(isWorkspaceNavActive('/history', '/history')).toBe(true);
    expect(isWorkspaceNavActive('/reference', '/reference')).toBe(true);
  });

  it('returns false for non-workspace paths', () => {
    expect(isWorkspaceNavActive('/translate', '/')).toBe(false);
    expect(isWorkspaceRoute('/auth/login')).toBe(false);
    expect(getActiveWorkspaceNavItem('/collect')).toBeNull();
  });

  it('resolves the active nav item from a pathname', () => {
    expect(getActiveWorkspaceNavItem('/translate')?.key).toBe('translate');
    expect(getActiveWorkspaceNavItem('/translate/session/abc')?.key).toBe('translate');
    expect(getActiveWorkspaceNavItem('/practice')?.key).toBe('practice');
    expect(getActiveWorkspaceNavItem('/history')?.key).toBe('history');
    expect(getActiveWorkspaceNavItem('/reference')?.key).toBe('reference');
  });
});
