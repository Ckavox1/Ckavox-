(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const ADMIN_EMAIL = "cedrickkayiranga354@gmail.com";

  let client = null;
  let session = null;

  function say(message, success = false) {
    const element = $("adminStatus");
    if (!element) return;

    element.textContent = message;
    element.style.color = success ? "#20c568" : "#f5c542";
  }

  function validURL(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function updateClock() {
    const now = new Date();

    if ($("adminTime")) {
      $("adminTime").textContent = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Africa/Kigali",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      }).format(now);
    }

    if ($("adminDate")) {
      $("adminDate").textContent = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Africa/Kigali",
        day: "2-digit",
        month: "short",
        year: "numeric"
      }).format(now);
    }
  }

  function isAdmin() {
    return Boolean(
      session &&
      (session.user.email || "").toLowerCase() === ADMIN_EMAIL
    );
  }

  function showEditor(show) {
    $("adminEditorPanel")?.classList.toggle("hidden", !show);
    $("adminPostsPanel")?.classList.toggle("hidden", !show);
    $("adminLoginPanel")?.classList.toggle("hidden", show);
  }

  async function checkSession() {
    if (!client) return;

    const { data, error } = await client.auth.getSession();

    if (error) {
      session = null;
      showEditor(false);
      say(error.message);
      return;
    }

    session = data.session;

    if (!session) {
      showEditor(false);
      return;
    }

    if (!isAdmin()) {
      await client.auth.signOut();
      session = null;
      showEditor(false);
      say("This account is not authorized to access CKAVOX Admin.");
      return;
    }

    showEditor(true);
    say("Admin signed in successfully.", true);
    await loadPosts();
  }

  async function login(event) {
    event.preventDefault();

    if (!client) {
      say("Configure Supabase first.");
      return;
    }

    const email = $("adminEmail").value.trim().toLowerCase();
    const password = $("adminPassword").value;

    if (email !== ADMIN_EMAIL) {
      say("Use the authorized admin email.");
      return;
    }

    const { data, error } = await client.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      say("Sign-in failed: " + error.message);
      return;
    }

    session = data.session;
    await checkSession();
  }

  async function resetPassword() {
    if (!client) {
      say("Configure Supabase first.");
      return;
    }

    const email = $("adminEmail").value.trim().toLowerCase();

    if (email !== ADMIN_EMAIL) {
      say("Enter the authorized admin email.");
      return;
    }

    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    });

    say(
      error
        ? error.message
        : "If the account exists, a password-reset email will be sent.",
      !error
    );
  }

  async function publish(event) {
    event.preventDefault();

    if (!isAdmin()) {
      say("Admin sign-in is required.");
      return;
    }

    const title = $("postTitle").value.trim();
    const category = $("postCategory").value;
    const image_url = $("postImage").value.trim();
    const article_url = $("postUrl").value.trim();
    const description = $("postDescription").value.trim();
    const published = $("postPublished").value === "true";

    if (!title || !description) {
      say("Enter a title and description.");
      return;
    }

    if (!validURL(image_url) || !validURL(article_url)) {
      say("Enter valid HTTP or HTTPS URLs for the image and article.");
      return;
    }

    const { error } = await client.from("stories").insert({
      title,
      category,
      image_url,
      article_url,
      description,
      published,
      created_by: session.user.id
    });

    if (error) {
      say("Could not publish: " + error.message);
      return;
    }

    $("publishForm").reset();
    $("postCategory").value = "films";
    $("postPublished").value = "true";

    say("Content saved successfully.", true);
    await loadPosts();
  }

  async function loadPosts() {
    const list = $("adminContentList");
    list.replaceChildren();

    const loading = document.createElement("p");
    loading.textContent = "Loading posts...";
    list.append(loading);

    const { data, error } = await client
      .from("stories")
      .select("id,title,category,image_url,article_url,description,published,created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    list.replaceChildren();

    if (error) {
      say("Could not load posts: " + error.message);
      return;
    }

    if (!data || data.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-note";
      empty.textContent = "No posts have been added yet.";
      list.append(empty);
      return;
    }

    data.forEach((post) => {
      const item = document.createElement("article");
      item.className = "admin-item";

      const image = document.createElement("img");
      image.src = post.image_url;
      image.alt = "";
      image.loading = "lazy";
      image.onerror = () => image.style.display = "none";

      const info = document.createElement("div");
      info.className = "admin-item-info";

      const title = document.createElement("strong");
      title.textContent = post.title;

      const details = document.createElement("small");
      details.textContent =
        `${post.category} · ${post.published ? "Published" : "Unpublished"}`;

      info.append(title, details);

      const button = document.createElement("button");
      button.type = "button";
      button.className = "delete-button";
      button.textContent = "Delete";
      button.addEventListener("click", () => removePost(post.id));

      item.append(image, info, button);
      list.append(item);
    });
  }

  async function removePost(id) {
    if (!isAdmin()) {
      say("Admin authorization is required.");
      return;
    }

    if (!confirm("Delete this CKAVOX post? This cannot be undone.")) {
      return;
    }

    const { error } = await client
      .from("stories")
      .delete()
      .eq("id", id);

    if (error) {
      say("Could not delete: " + error.message);
      return;
    }

    say("Post deleted successfully.", true);
    await loadPosts();
  }

  async function signOut() {
    if (client) {
      await client.auth.signOut();
    }

    session = null;
    showEditor(false);
    say("You have signed out.");
  }

  document.addEventListener("DOMContentLoaded", async () => {
    updateClock();
    setInterval(updateClock, 1000);

    $("adminLoginForm").addEventListener("submit", login);
    $("adminResetBtn").addEventListener("click", resetPassword);
    $("publishForm").addEventListener("submit", publish);
    $("adminSignOutBtn").addEventListener("click", signOut);

    const url = window.CKAVOX_SUPABASE_URL || "";
    const key = window.CKAVOX_SUPABASE_PUBLISHABLE_KEY || "";

    if (
      !window.supabase ||
      !url.startsWith("https://") ||
      !key ||
      key.includes("PASTE_YOUR")
    ) {
      showEditor(false);
      say("Supabase is not configured. Complete supabase-config.js first.");
      return;
    }

    client = window.CKAVOX_SUPABASE_CLIENT ||
      window.supabase.createClient(url, key);

    client.auth.onAuthStateChange((_event, newSession) => {
      session = newSession;
      setTimeout(checkSession, 0);
    });

    await checkSession();
  });
})();
