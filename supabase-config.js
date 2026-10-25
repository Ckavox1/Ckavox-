

window.CKAVOX_SUPABASE_URL =
  "https://guuppgqreghdxhvkfrqy.supabase.co/rest/v1/";

window.CKAVOX_SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_weWwdJqlkdK9ao7CIW0ycg_ihXXJpOL";

window.CKAVOX_ADMIN_EMAIL =
  "cedrickkayiranga354@gmail.com";

(() => {
  const url = window.CKAVOX_SUPABASE_URL;
  const key = window.CKAVOX_SUPABASE_PUBLISHABLE_KEY;

  if (
    !window.supabase ||
    !url ||
    !url.startsWith("https://") ||
    !key ||
    key.includes("PASTE_YOUR")
  ) {
    console.warn(
      "CKAVOX: Complete supabase-config.js with your Supabase Project URL and publishable key."
    );
    return;
  }

  window.CKAVOX_SUPABASE_CLIENT =
    window.supabase.createClient(url, key);
})();
