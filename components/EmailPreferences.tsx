'use client';

import { useState } from 'react';

interface Props {
  dailyBriefing: boolean;
  weeklyDigest: boolean;
}

export function EmailPreferences({ dailyBriefing, weeklyDigest }: Props) {
  const [daily, setDaily] = useState(dailyBriefing);
  const [weekly, setWeekly] = useState(weeklyDigest);
  const [saving, setSaving] = useState(false);

  async function toggle(field: 'daily_briefing_enabled' | 'weekly_digest_enabled', value: boolean) {
    setSaving(true);
    try {
      const res = await fetch('/api/account/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        if (field === 'daily_briefing_enabled') setDaily(value);
        else setWeekly(value);
      }
    } catch (err) {
      console.error('Failed to update preference:', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border border-border rounded-lg divide-y divide-border bg-card-bg">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <p className="text-sm font-bold">Daily briefing email</p>
          <p className="text-xs text-muted">Top 5 stories, delivered at 7am ET</p>
        </div>
        <button
          onClick={() => toggle('daily_briefing_enabled', !daily)}
          disabled={saving}
          className={`relative w-11 h-6 rounded-full transition-colors ${daily ? 'bg-fg' : 'bg-border'}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform bg-bg ${daily ? 'translate-x-5' : ''}`}
          />
        </button>
      </div>
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <p className="text-sm font-bold">Weekly digest email</p>
          <p className="text-xs text-muted">Doom Index, synthesis report, podcast link</p>
        </div>
        <button
          onClick={() => toggle('weekly_digest_enabled', !weekly)}
          disabled={saving}
          className={`relative w-11 h-6 rounded-full transition-colors ${weekly ? 'bg-fg' : 'bg-border'}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform bg-bg ${weekly ? 'translate-x-5' : ''}`}
          />
        </button>
      </div>
    </div>
  );
}
