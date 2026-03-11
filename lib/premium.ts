import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/db';

export interface PremiumStatus {
  isLoggedIn: boolean;
  isPremium: boolean;
  email: string | null;
  userId: string | null;
}

export async function getPremiumStatus(): Promise<PremiumStatus> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { isLoggedIn: false, isPremium: false, email: null, userId: null };
    }

    const { data: subscriber } = await getSupabaseAdmin()
      .from('subscribers')
      .select('status')
      .eq('user_id', user.id)
      .single();

    return {
      isLoggedIn: true,
      isPremium: subscriber?.status === 'premium',
      email: user.email ?? null,
      userId: user.id,
    };
  } catch {
    return { isLoggedIn: false, isPremium: false, email: null, userId: null };
  }
}
