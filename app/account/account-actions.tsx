'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AccountActions({ isPremium }: { isPremium: boolean }) {
  const router = useRouter();
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCancel() {
    setCancelLoading(true);
    setError('');
    try {
      const res = await fetch('/api/account/cancel', { method: 'POST' });
      if (res.ok) {
        router.refresh();
        setCancelConfirm(false);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to cancel');
      }
    } catch {
      setError('Failed to cancel subscription');
    } finally {
      setCancelLoading(false);
    }
  }

  async function handleDelete() {
    if (deleteText !== 'DELETE') return;
    setDeleteLoading(true);
    setError('');
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' });
      if (res.ok) {
        window.location.href = '/';
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete account');
      }
    } catch {
      setError('Failed to delete account');
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <section>
      <h3 className="text-xs font-bold uppercase tracking-widest font-mono text-muted mb-3">Danger Zone</h3>
      <div className="border border-border rounded-lg divide-y divide-border bg-card-bg">
        {/* Cancel Subscription */}
        {isPremium && (
          <div className="px-6 py-4">
            {!cancelConfirm ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">Cancel subscription</p>
                  <p className="text-xs text-muted">You&rsquo;ll keep access until the end of your billing period.</p>
                </div>
                <button
                  onClick={() => setCancelConfirm(true)}
                  className="text-xs font-bold uppercase tracking-widest font-mono px-3 py-1 border border-red-400 dark:border-red-500 rounded text-red-500 dark:text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm font-bold mb-2">Are you sure?</p>
                <p className="text-xs text-muted mb-3">Your premium features will remain active until the end of the current billing period.</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    disabled={cancelLoading}
                    className="text-xs font-bold uppercase tracking-widest font-mono px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
                  >
                    {cancelLoading ? 'Cancelling...' : 'Confirm Cancel'}
                  </button>
                  <button
                    onClick={() => setCancelConfirm(false)}
                    className="text-xs font-bold uppercase tracking-widest font-mono px-4 py-2 border border-border rounded text-muted hover:text-fg transition-colors"
                  >
                    Never mind
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Delete Account */}
        <div className="px-6 py-4">
          {!deleteConfirm ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">Delete account</p>
                <p className="text-xs text-muted">Permanently delete your account and all data.</p>
              </div>
              <button
                onClick={() => setDeleteConfirm(true)}
                className="text-xs font-bold uppercase tracking-widest font-mono px-3 py-1 border border-red-400 dark:border-red-500 rounded text-red-500 dark:text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm font-bold mb-2">This cannot be undone</p>
              <p className="text-xs text-muted mb-3">Type DELETE to confirm.</p>
              <input
                type="text"
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 text-sm border border-border bg-transparent text-fg rounded mb-3 outline-none focus:border-fg font-mono"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={deleteText !== 'DELETE' || deleteLoading}
                  className="text-xs font-bold uppercase tracking-widest font-mono px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete Account'}
                </button>
                <button
                  onClick={() => { setDeleteConfirm(false); setDeleteText(''); }}
                  className="text-xs font-bold uppercase tracking-widest font-mono px-4 py-2 border border-border rounded text-muted hover:text-fg transition-colors"
                >
                  Never mind
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
    </section>
  );
}
