const cleanText = (value) => String(value || '').trim();

function getSupabaseBrowserConfig() {
  const supabaseUrl = cleanText(process.env.NEXT_PUBLIC_SUPABASE_URL).replace(/\/+$/, '');
  const anonKey = cleanText(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return { supabaseUrl, anonKey, configured: Boolean(supabaseUrl && anonKey) };
}

function buildProviderUrl(provider, redirectTo) {
  const { supabaseUrl, configured } = getSupabaseBrowserConfig();
  if (!configured) return null;
  const url = new URL(`${supabaseUrl}/auth/v1/authorize`);
  url.searchParams.set('provider', provider);
  url.searchParams.set('redirect_to', redirectTo);
  return url.toString();
}

export const supabase = {
  auth: {
    async signInWithOAuth({ provider, options = {} }) {
      const url = buildProviderUrl(provider, options.redirectTo);
      if (!url) return { data: null, error: { message: 'supabase_auth_not_configured' } };
      window.location.assign(url);
      return { data: { url }, error: null };
    },
  },
};
