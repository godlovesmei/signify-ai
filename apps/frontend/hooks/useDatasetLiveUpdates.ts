"use client";
import { useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

/** Invalidate server data on RLS-authorized events; never render event payloads. */
export function useDatasetLiveUpdates(refresh: () => void) {
  const latest = useRef(refresh);
  useEffect(() => { latest.current = refresh; }, [refresh]);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let active = true;
    let unsubscribe: (() => void) | undefined;
    const schedule = () => {
      if (!active) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { timer = undefined; if (active) latest.current(); }, 300);
    };
    const visibleRefresh = () => { if (!document.hidden) schedule(); };
    // Reconcile missed/disconnected events and changes while the tab was asleep.
    const polling = setInterval(visibleRefresh, 10000);
    window.addEventListener('focus', visibleRefresh);
    window.addEventListener('online', visibleRefresh);
    document.addEventListener('visibilitychange', visibleRefresh);
    try {
      const client = createClient();
      const channel = client.channel('dataset-curation-live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'dataset_contributions' }, schedule)
        .subscribe(status => {
          if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') schedule();
        });
      unsubscribe = () => { void client.removeChannel(channel).catch(() => undefined); };
    } catch {
      // Background reconciliation remains available if a socket cannot be opened.
    }
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      clearInterval(polling);
      window.removeEventListener('focus', visibleRefresh);
      window.removeEventListener('online', visibleRefresh);
      document.removeEventListener('visibilitychange', visibleRefresh);
      unsubscribe?.();
    };
  }, []);
}
