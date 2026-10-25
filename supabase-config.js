/*
 * CKAVOX SUPABASE CONFIGURATION
 *
 * Shyiramo Project URL na publishable key bya project yawe.
 * Ntushyiremo secret key cyangwa service_role key.
 */

window.CKAVOX_SUPABASE_URL =
  "PASTE_YOUR_SUPABASE_PROJECT_URL_HERE";

window.CKAVOX_SUPABASE_PUBLISHABLE_KEY =
  "PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE";

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
