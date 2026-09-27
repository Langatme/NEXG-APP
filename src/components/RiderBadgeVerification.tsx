import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, ShieldCheck, XCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import LogoIcon from './LogoIcon';

type BadgeResult = { verified: true; status: string; rider_profile: { display_name?: string | null } | null };

function problem(code: string) {
  const labels: Record<string, string> = {
    badge_invalid: 'This Rider badge is expired or unavailable.',
    badge_replayed: 'This one-time Rider badge has already been checked.',
    badge_check_rate_limited: 'Too many badge checks were made from this connection. Wait and try later.',
    qr_service_unavailable: 'Rider verification is temporarily unavailable.',
  };
  return labels[code] ?? 'This Rider badge could not be verified.';
}

export default function RiderBadgeVerification() {
  const { isLight } = useTheme();
  const [credential, setCredential] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [result, setResult] = useState<BadgeResult | null>(null);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const verify = async (token: string, key: string) => {
    if (!token || checking) return;
    setChecking(true);
    setError('');
    try {
      const response = await fetch('/api/v1/rider/badges/verify', {
        method: 'POST',
        credentials: 'omit',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'Idempotency-Key': key },
        body: JSON.stringify({ token }),
        cache: 'no-store',
      });
      const body = await response.json().catch(() => null) as { data?: BadgeResult; code?: string; error?: string } | null;
      if (!response.ok || !body?.data?.verified) {
        const code = body?.code ?? body?.error ?? (response.status >= 500 ? 'qr_service_unavailable' : 'badge_invalid');
        if (response.status < 500) setIdempotencyKey(crypto.randomUUID());
        setResult(null);
        setError(problem(code));
        return;
      }
      setResult(body.data);
      setCredential('');
    } catch {
      setError('The result is not confirmed. Retry this same code to reconcile the one-time check.');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    const fragment = window.location.hash.slice(1);
    if (!fragment) return;
    let token = fragment;
    try { token = decodeURIComponent(fragment); } catch { /* Keep the opaque encoded token for the owner API to reject. */ }
    window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}`);
    void verify(token, idempotencyKey);
  }, []);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const token = credential.trim();
    if (!token) return;
    const nextKey = crypto.randomUUID();
    setIdempotencyKey(nextKey);
    void verify(token, nextKey);
  };

  const page = isLight ? 'bg-[#F7F8FA] text-[#1A1D20]' : 'bg-[#111315] text-[#F2F2F2]';
  const card = isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-[#181A1F]';
  const muted = isLight ? 'text-slate-600' : 'text-gray-400';
  const field = isLight ? 'border-slate-300 bg-white text-slate-950' : 'border-white/10 bg-[#111315] text-white';

  return (
    <main className={`min-h-[80vh] px-4 py-10 sm:py-16 ${page}`}>
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center justify-center"><LogoIcon variant="wordmark" className="h-7 w-auto" /></div>
        <section className={`rounded-2xl border p-6 shadow-sm sm:p-8 ${card}`}>
          <div className="flex items-start gap-3">
            {result?.verified ? <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-emerald-600" aria-hidden="true" /> : <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-[#B88728]" aria-hidden="true" />}
            <div>
              <h1 className="text-2xl font-bold">Rider verification</h1>
              <p className={`mt-2 text-sm leading-relaxed ${muted}`}>Check the short-lived badge issued by the Rider for an active NEXG delivery assignment.</p>
            </div>
          </div>

          {checking && <p className={`mt-6 rounded-xl border px-4 py-3 text-sm ${muted}`} role="status">Checking with the QR Proof owner…</p>}
          {error && <div className="mt-6 flex items-start gap-2 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200" role="alert"><XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><p>{error}</p></div>}
          {result?.verified && (
            <div className="mt-6 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100" role="status">
              <p className="font-bold">Verified NEXG Rider</p>
              {result.rider_profile?.display_name && <p className="mt-1 text-sm">{result.rider_profile.display_name}</p>}
              <p className="mt-2 text-sm">Current assignment: {result.status.replaceAll('_', ' ').toLowerCase()}.</p>
              <p className="mt-2 text-xs">The badge was checked once. No phone, address, payout or identity documents are shown.</p>
            </div>
          )}

          {!result?.verified && (
            <form onSubmit={submit} className="mt-6 space-y-3">
              <label htmlFor="rider-badge-token" className="block text-sm font-semibold">Or enter a badge code</label>
              <input id="rider-badge-token" type="password" autoComplete="off" spellCheck={false} maxLength={128} value={credential} onChange={(event) => setCredential(event.target.value)} className={`min-h-12 w-full rounded-xl border px-3 text-sm ${field}`} placeholder="Paste the one-time code" />
              <button type="submit" disabled={checking || !credential.trim()} className="min-h-11 w-full rounded-full bg-[#B88728] px-4 text-sm font-bold text-slate-950 disabled:opacity-50">{checking ? 'Checking…' : 'Verify badge'}</button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
