'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Check, CircleCheck, Loader2, Send } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { useConfirm } from '@/hooks/useConfirm';
import { Button, LargeTitle, Notice, Page, Pill, Row, buttonClass, formatDateIST } from '@/components/app/ui';
import { IconBox, List, SectionHeader } from '@/components/app/seller';

/** One numbered step: green tick when done, crimson number when it's the current one */
function Step({
  n,
  done,
  active,
  title,
  body,
  children,
}: {
  n: number;
  done?: boolean;
  active?: boolean;
  title: string;
  body?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <li className="flex gap-3 px-4 py-4">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[15px] font-bold ${
          done ? 'bg-ok text-white' : active ? 'bg-tint text-white' : 'bg-fill text-label-2'
        }`}
        aria-hidden
      >
        {done ? <Check className="h-[18px] w-[18px]" strokeWidth={3} /> : n}
      </span>
      <div className="min-w-0 flex-1 pt-1">
        <p className={`text-[16px] font-semibold leading-snug ${done ? 'text-label-2' : 'text-label'}`}>
          <span className="sr-only">Step {n}{done ? ', done' : ''}: </span>
          {title}
        </p>
        {body && <p className="mt-0.5 text-[14px] leading-snug text-label-2">{body}</p>}
        {children && <div className="mt-3">{children}</div>}
      </div>
    </li>
  );
}

export default function VendorTelegramPage() {
  const confirm = useConfirm();
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
      toast.error(e?.message ?? "Couldn't make your Telegram link. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDisconnect() {
    const ok = await confirm({
      title: 'Stop Telegram alerts?',
      description: "You won't get new orders on Telegram any more. You can connect again any time.",
      confirmLabel: 'Stop alerts',
      cancelLabel: 'Keep alerts',
      destructive: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await apiClient.disconnectTelegram();
      setStatus({ linked: false, linkedAt: null });
      toast.success('Telegram disconnected');
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't disconnect. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const linked = Boolean(status?.linked);

  return (
    <Page>
      <LargeTitle
        title="Order alerts on Telegram"
        subtitle="Get a message for every new order and accept it with one tap · हर नए ऑर्डर पर मैसेज"
        back={{ href: '/vendor/settings', label: 'My shop' }}
      />

      {/* ── Status ── */}
      <section className="mb-6">
        <List>
          <Row
            leading={
              <IconBox tone={linked ? 'ok' : 'brand'} size={44}>
                <Send className="h-5 w-5" />
              </IconBox>
            }
            title={<span className="font-semibold">Telegram</span>}
            subtitle={
              !status
                ? 'Checking…'
                : linked
                  ? status.linkedAt
                    ? `Connected on ${formatDateIST(status.linkedAt)}`
                    : 'Your orders come to Telegram'
                  : 'Not connected yet'
            }
            trailing={
              !status ? (
                <Loader2 className="h-5 w-5 animate-spin text-label-3" aria-label="Checking" />
              ) : linked ? (
                <Pill tone="ok">Connected</Pill>
              ) : (
                <Pill tone="neutral">Not connected</Pill>
              )
            }
          />
        </List>
      </section>

      {!status ? (
        <div className="space-y-3 rounded-2xl bg-card p-4" aria-hidden>
          <div className="h-5 w-40 rounded-full bg-fill animate-pulse" />
          <div className="h-12 rounded-full bg-fill animate-pulse" />
        </div>
      ) : linked ? (
        <>
          <div className="mb-6">
            <Notice tone="ok" icon={<CircleCheck className="h-5 w-5 text-ok" aria-hidden />}>
              <p className="font-semibold">You&apos;re all set</p>
              <p className="mt-0.5 text-label-2">
                Every new order comes to Telegram. Tap Accept or Reject right in the message. If you don&apos;t
                answer in 10 minutes, the order becomes a pre-order.
              </p>
            </Notice>
          </div>
          <Button variant="danger" full className="bg-bad-soft" onClick={handleDisconnect} loading={busy}>
            Stop Telegram alerts
          </Button>
        </>
      ) : (
        <section className="mb-6">
          <SectionHeader title="3 easy steps" />
          <ol className="overflow-hidden rounded-2xl bg-card divide-y divide-hairline">
            <Step
              n={1}
              done={Boolean(deepLink)}
              active={!deepLink}
              title="Make your Telegram link"
              body={deepLink ? 'Link ready' : 'Tap the button. It takes a second.'}
            >
              {!deepLink && (
                <Button full onClick={handleConnect} loading={busy}>
                  <Send className="h-5 w-5" aria-hidden />
                  Connect Telegram
                </Button>
              )}
            </Step>

            <Step
              n={2}
              active={Boolean(deepLink)}
              title="Open it in Telegram"
              body="Open the link on the phone where you use Telegram. No Telegram? Get it free from the Play Store."
            >
              {deepLink && (
                <>
                  {/* New tab so this page keeps checking for the link in the background */}
                  <a href={deepLink} target="_blank" rel="noreferrer" className={buttonClass('primary', 'lg', true)}>
                    <Send className="h-5 w-5" aria-hidden />
                    Open Telegram
                  </a>
                  <p className="mt-2 break-all text-[13px] leading-snug text-label-3">{deepLink}</p>
                </>
              )}
            </Step>

            <Step
              n={3}
              title="Tap Start in Telegram"
              body="That's it. This page changes to Connected by itself."
            >
              {deepLink && (
                <p className="flex items-center gap-2 text-[14px] text-label-2" role="status">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Waiting for Telegram…
                </p>
              )}
            </Step>
          </ol>
          <p className="px-1 pt-2 text-[13px] leading-snug text-label-2">
            If you don&apos;t answer an order in 10 minutes, it becomes a pre-order.
          </p>
        </section>
      )}
    </Page>
  );
}
