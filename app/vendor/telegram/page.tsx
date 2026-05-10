'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';

export default function VendorTelegramPage() {
  const [status, setStatus] = useState<{ linked: boolean; linkedAt: string | null } | null>(null);
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiClient
      .getTelegramStatus()
      .then((s) => setStatus(s))
      .catch(() => setStatus({ linked: false, linkedAt: null }));
  }, []);

  useEffect(() => {
    if (!deepLink || status?.linked) return;
    const id = setInterval(async () => {
      try {
        const s = await apiClient.getTelegramStatus();
        if (s?.linked) {
          setStatus(s);
          setDeepLink(null);
          clearInterval(id);
          toast.success('Telegram connected');
        }
      } catch {
        /* keep polling */
      }
    }, 3000);
    return () => clearInterval(id);
  }, [deepLink, status?.linked]);

  async function handleConnect() {
    setBusy(true);
    try {
      const { deepLink } = await apiClient.createTelegramLink();
      setDeepLink(deepLink);
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not create link');
    } finally {
      setBusy(false);
    }
  }

  async function handleDisconnect() {
    setBusy(true);
    try {
      await apiClient.disconnectTelegram();
      setStatus({ linked: false, linkedAt: null });
      toast.success('Telegram disconnected');
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not disconnect');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '40px auto', padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Telegram</h1>
      <p style={{ color: '#64748B', marginTop: 8 }}>
        Get order pings on Telegram and approve/reject with one tap. If you don't respond in 10 minutes, the order becomes a Pre-Order.
      </p>

      {status?.linked ? (
        <div
          style={{
            marginTop: 24,
            padding: 20,
            background: '#ECFDF5',
            borderRadius: 12,
            border: '1px solid #A7F3D0',
          }}
        >
          <div style={{ fontWeight: 600, color: '#047857' }}>✅ Connected</div>
          {status.linkedAt && (
            <div style={{ color: '#64748B', fontSize: 14, marginTop: 4 }}>
              Linked on {new Date(status.linkedAt).toLocaleDateString()}
            </div>
          )}
          <button
            disabled={busy}
            onClick={handleDisconnect}
            style={{
              marginTop: 16,
              padding: '8px 16px',
              background: 'transparent',
              color: '#DC2626',
              border: '1px solid #FCA5A5',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            Disconnect
          </button>
        </div>
      ) : deepLink ? (
        <div
          style={{
            marginTop: 24,
            padding: 20,
            background: '#EFF6FF',
            borderRadius: 12,
          }}
        >
          <p style={{ marginTop: 0 }}>
            1. Open this link on the phone where you use Telegram: <br />
            <a
              href={deepLink}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#2563EB', wordBreak: 'break-all' }}
            >
              {deepLink}
            </a>
          </p>
          <p>2. Tap <b>Start</b> in Telegram.</p>
          <p style={{ color: '#64748B', fontSize: 14 }}>
            This page will update automatically once you've linked. You can close it afterwards.
          </p>
        </div>
      ) : (
        <button
          disabled={busy}
          onClick={handleConnect}
          style={{
            marginTop: 24,
            padding: '12px 20px',
            background: '#FF9933',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Connect Telegram
        </button>
      )}
    </div>
  );
}
