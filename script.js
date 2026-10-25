(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const categories = {
    films: [
      {
        title: "Explore action films",
        description: "Discover action, adventure and cinema stories.",
        image: "photo-1489599849927-2ee91cede3ba"
      },
      {
        title: "Superhero movies",
        description: "Explore superhero films and entertainment.",
        image: "photo-1440404653325-ab127d49abc1"
      },
      {
        title: "Cinema highlights",
        description: "Discover popular films and movie news.",
        image: "photo-1478720568477-152d9b164e26"
      },
      {
        title: "African cinema",
        description: "Explore African film and entertainment.",
        image: "photo-1517604931442-7e0c8ed2963c"
      }
    ],

    sports: [
      {
        title: "Football",
        description: "Discover football stories and match updates.",
        image: "photo-1522778119026-d647f0596c20"
      },
      {
        title: "Formula 1",
        description: "Explore racing, teams and drivers.",
        image: "photo-150 racing"
      },
      {
        title: "Basketball",
        description: "Follow basketball news and competitions.",
        image: "photo-1546519638-68e109498ffc"
      },
      {
        title: "Sports highlights",
        description: "Explore sports from around the world.",
        image: "photo-1461896836934-2c9e4c2f9f1b"
      }
    ],

    technology: [
      {
        title: "Artificial intelligence",
        description: "Discover AI tools and new innovations.",
        image: "photo-1677442136019-21780ecad995"
      },
      {
        title: "Modern technology",
        description: "Explore devices, computers and technology.",
        image: "photo-1518770660439-4636190af475"
      },
      {
        title: "Digital innovation",
        description: "Learn about technology changing the world.",
        image: "photo-1519389950473-47ba0277781c"
      },
      {
        title: "Future technology",
        description: "Explore ideas shaping the digital future.",
        image: "photo-1451187580459-43490279c0fa"
      }
    ],

    showbiz: [
      {
        title: "Celebrity stories",
        description: "Explore entertainment and celebrity news.",
        image: "photo-1516280440614-37939bbacd81"
      },
      {
        title: "Red carpet",
        description: "Discover entertainment events and highlights.",
        image: "photo-1492684223066-81342ee5ff30"
      },
      {
        title: "African stars",
        description: "Explore African entertainment and artists.",
        image: "photo-1501386761578-eac5c94b800a"
      },
      {
        title: "Entertainment world",
        description: "Discover stories from the world of showbiz.",
        image: "photo-1524368535928-5b5e00ddc76b"
      }
    ],

    news: [
      {
        title: "World news",
        description: "Explore news from around the world.",
        image: "photo-1495020689067-958852a7765e"
      },
      {
        title: "African news",
        description: "Discover stories from across Africa.",
        image: "photo-1504711434969-e33886168f5c"
      },
      {
        title: "Business news",
        description: "Explore business and economic developments.",
        image: "photo-1460925895917-afdab827c52f"
      },
      {
        title: "Digital news",
        description: "Discover trending digital stories.",
        image: "photo-1497366754035-f200968a6e72"
      }
    ],

    music: [
      {
        title: "African music",
        description: "Explore music from Rwanda and Africa.",
        image: "photo-1516280440614-37939bbacd81"
      },
      {
        title: "Live music",
        description: "Discover live performances and concerts.",
        image: "photo-1501386761578-eac5c94b800a"
      },
      {
        title: "Music production",
        description: "Explore studios, artists and production.",
        image: "photo-1598488035139-bdbb2231ce04"
      },
      {
        title: "International music",
        description: "Discover music from around the world.",
        image: "photo-1511379938547-c1f69419868d"
      }
    ]
  };

  function imageURL(id) {
    if (!id || id.includes(" ")) {
      return "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=800&q=80";
    }

    return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;
  }

  function updateClock() {
    const now = new Date();

    if ($("liveTime")) {
      $("liveTime").textContent = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Africa/Kigali",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      }).format(now);
    }

    if ($("liveDate")) {
      $("liveDate").textContent = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Africa/Kigali",
        day: "2-digit",
        month: "short",
        year: "numeric"
      }).format(now);
    }

    if ($("currentYear")) {
      $("currentYear").textContent = new Intl.DateTimeFormat("en", {
        timeZone: "Africa/Kigali",
        year: "numeric"
      }).format(now);
    }
  }

  function safeURL(value) {
    try {
      const url = new URL(value);
      return ["https:", "http:"].includes(url.protocol);
    } catch {
      return false;
    }
  }

  function createCard(post, category) {
    const article = document.createElement("article");
    article.className = "content-card";

    const imageWrap = document.createElement("div");
    imageWrap.className = "card-image-wrap";

    const img = document.createElement("img");
    img.src = post.image_url || imageURL(post.image);
    img.alt = post.title || "CKAVOX story";
    img.loading = "lazy";
    img.onerror = () => {
      img.onerror = null;
      img.src = imageURL("photo-1516280440614-37939bbacd81");
    };

    const badge = document.createElement("span");
    badge.className = "card-category";
    badge.textContent = category;

    imageWrap.append(img, badge);

    const body = document.createElement("div");
    body.className = "card-body";

    const title = document.createElement("h3");
    title.textContent = post.title;

    const description = document.createElement("p");
    description.textContent = post.description || "";

    body.append(title, description);

    if (post.article_url && safeURL(post.article_url)) {
      const link = document.createElement("a");
      link.className = "card-link";
      link.href = post.article_url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Explore more ↗";
      body.append(link);
    }

    article.append(imageWrap, body);
    return article;
  }

  function renderCategory(category, posts) {
    const track = $(`slider-${category}`);
    if (!track) return;

    track.replaceChildren();

    if (!posts || posts.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-note";
      empty.textContent = "More CKAVOX stories coming soon.";
      track.append(empty);
      return;
    }

    posts.forEach((post) => {
      track.append(createCard(post, category));
    });
  }

  function renderDefaults() {
    Object.entries(categories).forEach(([category, posts]) => {
      renderCategory(
        category,
        posts.map((post) => ({
          ...post,
          image_url: imageURL(post.image),
          article_url: category === "films"
            ? "https://www.netflix.com/"
            : category === "music"
              ? "https://open.spotify.com/"
              : category === "sports"
                ? "https://www.livescore.com/"
                : "https://www.google.com/"
        }))
      );
    });
  }

  function setupSliders() {
    document.querySelectorAll("[data-prev]").forEach((button) => {
      button.addEventListener("click", () => {
        const track = $(`slider-${button.dataset.prev}`);
        if (track) {
          track.scrollBy({
            left: -track.clientWidth * 0.8,
            behavior: "smooth"
          });
        }
      });
    });

    document.querySelectorAll("[data-next]").forEach((button) => {
      button.addEventListener("click", () => {
        const track = $(`slider-${button.dataset.next}`);
        if (track) {
          track.scrollBy({
            left: track.clientWidth * 0.8,
            behavior: "smooth"
          });
        }
      });
    });

    setInterval(() => {
      document.querySelectorAll(".slider-track").forEach((track) => {
        if (track.scrollWidth <= track.clientWidth + 5) return;

        const atEnd =
          track.scrollLeft + track.clientWidth >= track.scrollWidth - 5;

        track.scrollTo({
          left: atEnd ? 0 : track.scrollLeft + track.clientWidth * 0.8,
          behavior: "smooth"
        });
      });
    }, 4000);
  }

  function setupMobileMenu() {
    const button = $("menuToggle");
    const nav = $("mainNav");

    if (!button || !nav) return;

    button.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      button.setAttribute("aria-expanded", String(open));
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        button.setAttribute("aria-expanded", "false");
      });
    });
  }

  function setupAccount() {
    const form = $("accountForm");
    if (!form) return;

    const status = $("accountStatus");

    function say(message, success = false) {
      status.textContent = message;
      status.style.color = success ? "#20c568" : "#f5c542";
    }

    function getClient() {
      return window.CKAVOX_SUPABASE_CLIENT || null;
    }

    $("signInBtn")?.addEventListener("click", async (event) => {
      event.preventDefault();

      const client = getClient();
      if (!client) return say("Supabase is not configured yet.");

      const email = $("accountEmail").value.trim();
      const password = $("accountPassword").value;

      if (!email || !password) return say("Enter your email and password.");

      const { error } = await client.auth.signInWithPassword({
        email,
        password
      });

      say(error ? error.message : "You are signed in.", !error);
    });

    $("signUpBtn")?.addEventListener("click", async () => {
      const client = getClient();
      if (!client) return say("Supabase is not configured yet.");

      const email = $("accountEmail").value.trim();
      const password = $("accountPassword").value;

      if (!email || password.length < 8) {
        return say("Enter your email and a password of at least 8 characters.");
      }

      const { error } = await client.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      say(
        error ? error.message : "Check your email to complete registration if confirmation is enabled.",
        !error
      );
    });

    $("resetPasswordBtn")?.addEventListener("click", async () => {
      const client = getClient();
      if (!client) return say("Supabase is not configured yet.");

      const email = $("accountEmail").value.trim();
      if (!email) return say("Enter your email first.");

      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      });

      say(
        error ? error.message : "If the account exists, a password reset email will be sent.",
        !error
      );
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      $("signInBtn")?.click();
    });
  }

  async function loadPublishedPosts() {
    const client = window.CKAVOX_SUPABASE_CLIENT;
    if (!client) return;

    const { data, error } = await client
      .from("stories")
      .select("id,title,category,image_url,article_url,description")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.warn("CKAVOX posts could not load:", error.message);
      return;
    }

    const grouped = {};

    for (const post of data || []) {
      if (!grouped[post.category]) grouped[post.category] = [];
      grouped[post.category].push(post);
    }

    Object.keys(categories).forEach((category) => {
      if (grouped[category]?.length) {
        renderCategory(category, grouped[category]);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    updateClock();
    setInterval(updateClock, 1000);

    renderDefaults();
    setupSliders();
    setupMobileMenu();
    setupAccount();
    loadPublishedPosts();
  });
})();
