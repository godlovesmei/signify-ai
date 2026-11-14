import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import messages from '@/messages/en.json';
import { ID } from '@/tests/datasetFixtures';
import { DatasetApiError } from '@/lib/dataset/api';
import PrivateContributionVideo from './PrivateContributionVideo';
const playback = vi.hoisted(() => vi.fn());
vi.mock('@/lib/dataset/api', async original => ({ ...await original<typeof import('@/lib/dataset/api')>(), datasetApi: { playback } }));
function show() { return render(<NextIntlClientProvider locale="en" messages={messages}><PrivateContributionVideo id={ID} /></NextIntlClientProvider>); }
beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:local-preview');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  playback.mockReset().mockResolvedValue(new Blob(['preview'], { type: 'video/webm' }));
});
afterEach(() => vi.useRealTimers());
describe('private video playback', () => {
  it('loads on demand and continues after the former signed URL expiry', async () => {
    vi.useFakeTimers();
    const { container } = show();
    expect(playback).not.toHaveBeenCalled();
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Load private video' })));
    expect(container.querySelector('video')).toHaveAttribute('src', 'blob:local-preview');
    act(() => vi.advanceTimersByTime(3600000));
    expect(container.querySelector('video')).toHaveAttribute('src', 'blob:local-preview');
    expect(playback).toHaveBeenCalledTimes(1);
    expect(localStorage.length).toBe(0);
  });
  it('replays without fetching another URL and revokes the memory copy when closed', async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    const { container, unmount } = show();
    fireEvent.click(screen.getByRole('button', { name: 'Load private video' }));
    await waitFor(() => expect(container.querySelector('video')).not.toBeNull());
    const video = container.querySelector('video')!;
    video.currentTime = 4;
    fireEvent.click(screen.getByRole('button', { name: 'Replay' }));
    expect(video.currentTime).toBe(0);
    expect(play).toHaveBeenCalledTimes(1);
    expect(playback).toHaveBeenCalledTimes(1);
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:local-preview');
  });
  it('distinguishes playback errors from expired access and permits retry', async () => {
    const { container } = show();
    fireEvent.click(screen.getByRole('button', { name: 'Load private video' }));
    await waitFor(() => expect(container.querySelector('video')).not.toBeNull());
    fireEvent.error(container.querySelector('video')!);
    expect(screen.getByText(/video could not be played/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Replay' }));
    await waitFor(() => expect(playback).toHaveBeenCalledTimes(2));
  });
  it('does not render media when the server denies current access', async () => {
    playback.mockRejectedValue(new DatasetApiError(403, 'operation_forbidden'));
    const { container } = show();
    fireEvent.click(screen.getByRole('button', { name: 'Load private video' }));
    await screen.findByRole('alert');
    expect(container.querySelector('video')).toBeNull();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});
