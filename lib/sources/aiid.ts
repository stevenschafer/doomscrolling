import { createHash } from 'crypto';
import { RawStory } from '../db';

const AIID_ENDPOINT = 'https://incidentdatabase.ai/api/graphql';

interface AIIDReport {
  url: string;
  title: string;
  source_domain: string;
  image_url: string | null;
  text: string;
}

interface AIIDIncident {
  incident_id: number;
  title: string;
  date: string;
  description: string;
  reports: AIIDReport[];
}

export async function fetchFromAIID(): Promise<RawStory[]> {
  const stories: RawStory[] = [];

  try {
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const query = `
      query RecentIncidents($date: DateTime!) {
        incidents(filter: { date_modified: { GTE: $date } }) {
          incident_id
          title
          date
          description
          reports {
            url
            title
            source_domain
            image_url
            text
          }
        }
      }
    `;

    const res = await fetch(AIID_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { date: twoDaysAgo } }),
    });

    if (!res.ok) {
      console.error('AIID fetch failed:', res.statusText);
      return [];
    }

    const data = await res.json();
    const incidents: AIIDIncident[] = data?.data?.incidents ?? [];

    for (const incident of incidents) {
      const report = incident.reports?.[0];
      const url = report?.url ?? `https://incidentdatabase.ai/cite/${incident.incident_id}`;
      const urlHash = createHash('sha256').update(url).digest('hex');

      stories.push({
        source_id: urlHash,
        title: incident.title || report?.title || `AI Incident #${incident.incident_id}`,
        url,
        source_name: report?.source_domain ?? 'AI Incident Database',
        image_url: report?.image_url ?? null,
        published_at: incident.date || new Date().toISOString(),
        excerpt: incident.description || report?.text?.slice(0, 800) || null,
      });
    }
  } catch (err) {
    console.error('AIID fetch error:', err);
  }

  return stories;
}
