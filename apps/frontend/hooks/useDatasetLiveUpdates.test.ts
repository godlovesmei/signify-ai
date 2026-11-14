import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDatasetLiveUpdates } from './useDatasetLiveUpdates';
const state = vi.hoisted(() => ({
  createClient: vi.fn(), on: vi.fn(), subscribe: vi.fn(), remove: vi.fn(),
  change: null as null | (() => void), status: null as null | ((status: string) => void),
}));
vi.mock('@/utils/supabase/client', () => ({ createClient: state.createClient }));
beforeEach(() => {
  vi.useFakeTimers();
  const channel = { on: state.on, subscribe: state.subscribe };
  state.on.mockReset().mockImplementation((_event, _filter, callback) => { state.change = callback; return channel; });
  state.subscribe.mockReset().mockImplementation(callback => { state.status = callback; return channel; });
  state.remove.mockReset().mockResolvedValue('ok');
  state.createClient.mockReset().mockReturnValue({ channel: () => channel, removeChannel: state.remove });
});
afterEach(() => vi.useRealTimers());
describe('dataset live invalidation', () => {
  it('subscribes to contribution changes and coalesces event bursts', () => {
    const refresh = vi.fn();
    renderHook(() => useDatasetLiveUpdates(refresh));
    expect(state.on).toHaveBeenCalledWith('postgres_changes', { event: '*', schema: 'public', table: 'dataset_contributions' }, expect.any(Function));
    act(() => { state.change?.(); state.change?.(); state.change?.(); vi.advanceTimersByTime(300); });
    expect(refresh).toHaveBeenCalledTimes(1);
  });
  it('reconciles on reconnect, focus and the fallback interval', () => {
    const refresh = vi.fn();
    renderHook(() => useDatasetLiveUpdates(refresh));
    act(() => { state.status?.('SUBSCRIBED'); vi.advanceTimersByTime(300); });
    expect(refresh).toHaveBeenCalledTimes(1);
    act(() => { window.dispatchEvent(new Event('focus')); vi.advanceTimersByTime(300); });
    expect(refresh).toHaveBeenCalledTimes(2);
    act(() => vi.advanceTimersByTime(10000));
    expect(refresh).toHaveBeenCalledTimes(3);
  });
  it('uses the latest filter callback and cleans up socket, timers and listeners', () => {
    const first = vi.fn(), latest = vi.fn();
    const hook = renderHook(({ refresh }) => useDatasetLiveUpdates(refresh), { initialProps: { refresh: first } });
    hook.rerender({ refresh: latest });
    act(() => { state.change?.(); vi.advanceTimersByTime(300); });
    expect(first).not.toHaveBeenCalled(); expect(latest).toHaveBeenCalledOnce();
    expect(state.subscribe).toHaveBeenCalledOnce();
    hook.unmount();
    act(() => { state.change?.(); window.dispatchEvent(new Event('focus')); vi.advanceTimersByTime(20000); });
    expect(latest).toHaveBeenCalledOnce(); expect(state.remove).toHaveBeenCalledOnce();
  });
  it('keeps automatic reconciliation if a socket cannot be created', () => {
    state.createClient.mockImplementation(() => { throw new Error('Unavailable'); });
    const refresh = vi.fn();
    renderHook(() => useDatasetLiveUpdates(refresh));
    act(() => vi.advanceTimersByTime(10300));
    expect(refresh).toHaveBeenCalledOnce();
  });
});
