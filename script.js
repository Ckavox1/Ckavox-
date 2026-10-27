 (() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const config = window.CKAVOX_CONFIG || {};

  const supabaseUrl =
    config.SUPABASE_URL ||
    window.CKAVOX_SUPABASE_URL ||
    "";

  const supabaseKey =
    config.SUPABASE_ANON_KEY ||
    window.CKAVOX_SUPABASE_PUBLISHABLE_KEY ||
    "";

  const configured =
    supabaseUrl.startsWith("https://") &&
    supabaseKey &&
    !supabaseUrl.includes("PASTE_") &&
    !supabaseKey.includes("PASTE_");

  const db =
    configured && window.supabase
      ? window.supabase.createClient(supabaseUrl, supabaseKey)
      : null;

  let currentUser = null;
  let isAdmin = false;
  let authMode = "login";
  let currentCategory = "All";
  let stories = [];
  let slideIndex = 0;
  let slideTimer;

  // Umwaka uri muri footer
  $("#year").textContent = new Date().getFullYear();

  // FEATURE SLIDESHOW
  const slides = $$(".feature-card");
  const dotsBox = $("#sliderDots");

  slides.forEach((slide, index) => {
    const dot = document.createElement("button");

    dot.type = "button";
    dot.setAttribute(
      "aria-label",
      `Show featured slide ${index + 1}`
    );

    dot.addEventListener("click", () => showSlide(index, true));

    dotsBox.appendChild(dot);
  });

  function showSlide(index, resetTimer = false) {
    if (!slides.length) return;

    slideIndex = (index + slides.length) % slides.length;

    slides.forEach((slide, i) => {
      slide.classList.toggle("active", i === slideIndex);
    });

    $$("#sliderDots button").forEach((dot, i) => {
      dot.classList.toggle("active", i === slideIndex);
    });

    const heroNumber = $(".hero-number");

    if (heroNumber) {
      heroNumber.innerHTML = `0${slideIndex + 1} <span>/ 04</span>`;
    }

    if (resetTimer) {
      startSlider();
    }
  }

  function startSlider() {
    clearInterval(slideTimer);

    slideTimer = setInterval(() => {
      showSlide(slideIndex + 1);
    }, 4000);
  }

  $("#slidePrev").addEventListener("click", () => {
    showSlide(slideIndex - 1, true);
  });

  $("#slideNext").addEventListener("click", () => {
    showSlide(slideIndex + 1, true);
  });

  showSlide(0);
  startSlider();

  // MOBILE NAVIGATION
  $("#menuToggle").addEventListener("click", () => {
    $("#mainNav").classList.toggle("open");
  });

  $$("#mainNav a").forEach(link => {
    link.addEventListener("click", () => {
      $("#mainNav").classList.remove("open");
    });
  });

  // AUTHENTICATION MODAL
  const modal = $("#authModal");
  const authMessage = $("#authMessage");

  function openAuth(mode = "login") {
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");

    setAuthMode(mode);
    updateAuthState();
  }

  function closeAuth() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }

  $("#openAuth").addEventListener("click", () => {
    openAuth("login");
  });

  $("#footerLogin").addEventListener("click", () => {
    openAuth("login");
  });

  $("#closeAuth").addEventListener("click", closeAuth);

  modal.addEventListener("click", event => {
    if (event.target === modal) {
      closeAuth();
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeAuth();
    }
  });

  $$(".auth-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      setAuthMode(tab.dataset.mode);
    });
  });

  function setAuthMode(mode) {
    authMode = mode;

    $$(".auth-tab").forEach(tab => {
      tab.classList.toggle(
        "active",
        tab.dataset.mode === mode
      );
    });

    $("#authTitle").innerHTML =
      mode === "login"
        ? 'Your account, <span>your access.</span>'
        : 'Join the <span>CKAVOX community.</span>';

    $("#authSubmit").textContent =
      mode === "login"
        ? "Login ↗"
        : "Create account ↗";

    $("#authPassword").autocomplete =
      mode === "login"
        ? "current-password"
        : "new-password";

    authMessage.textContent = "";
  }

  function sayAuth(message, isError = false) {
    authMessage.textContent = message;

    authMessage.style.color = isError
      ? "#ff8989"
      : "var(--gold)";
  }

  async function updateAuthState() {
    $("#logoutBtn").classList.toggle(
      "hidden",
      !currentUser
    );

    $("#openAuth").textContent = currentUser
      ? "Account"
      : "Sign up / Login";

    if (!db) {
      if (!currentUser) {
        sayAuth(
          "Website account login needs the Supabase setup in config.js."
        );
      }

      return;
    }

    if (currentUser) {
      sayAuth(
        isAdmin
          ? "Signed in as admin. Your admin dashboard is available below."
          : `Signed in as ${currentUser.email}. Publishing is reserved for CKAVOX admins.`
      );

      let adminLink = $("#adminDashboardLink");

      if (isAdmin && !adminLink) {
        adminLink = document.createElement("a");
        adminLink.id = "adminDashboardLink";
        adminLink.className = "btn btn-gold";
        adminLink.href = "admin.html";
        adminLink.textContent = "Open admin dashboard ↗";

        $("#logoutBtn").before(adminLink);
      }

      if (!isAdmin && adminLink) {
        adminLink.remove();
      }
    }
  }

  // CHECK SUPABASE SESSION
  if (db) {
    db.auth.getSession().then(async ({ data }) => {
      currentUser = data.session?.user || null;

      await checkAdmin();
      updateAuthState();
    });

    db.auth.onAuthStateChange((_event, session) => {
      currentUser = session?.user || null;

      setTimeout(async () => {
        await checkAdmin();
        updateAuthState();
      }, 0);
    });
  }

  // CHECK ADMIN PERMISSION
  async function checkAdmin() {
    isAdmin = false;

    if (!db || !currentUser) {
      return;
    }

    const { data, error } = await db
      .from("admin_users")
      .select("user_id")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    isAdmin = !error && !!data;
  }

  // SIGN UP / LOGIN
  $("#authForm").addEventListener("submit", async event => {
    event.preventDefault();

    if (!db) {
      sayAuth(
        "First configure the Supabase Project URL and publishable key in config.js.",
        true
      );

      return;
    }

    const email = $("#authEmail").value.trim();
    const password = $("#authPassword").value;

    $("#authSubmit").disabled = true;
    $("#authSubmit").textContent = "Please wait…";

    try {
      if (authMode === "signup") {
        const { data, error } = await db.auth.signUp({
          email,
          password
        });

        if (error) {
          throw error;
        }

        sayAuth(
          data.session
            ? "Account created. You can now log in."
            : "Account created. Check your email to confirm, then log in."
        );
      } else {
        const { error } = await db.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          throw error;
        }

        sayAuth("Login successful.");

        await new Promise(resolve => setTimeout(resolve, 400));

        await checkAdmin();
        await updateAuthState();
        await loadStories();
      }
    } catch (error) {
      sayAuth(
        error.message || "Something went wrong. Please try again.",
        true
      );
    } finally {
      $("#authSubmit").disabled = false;

      $("#authSubmit").textContent =
        authMode === "login"
          ? "Login ↗"
          : "Create account ↗";
    }
  });

  // LOGOUT
  $("#logoutBtn").addEventListener("click", async () => {
    if (db) {
      await db.auth.signOut();
    }

    currentUser = null;
    isAdmin = false;

    $("#authForm").reset();

    sayAuth("You are logged out.");
    updateAuthState();

    const adminLink = $("#adminDashboardLink");

    if (adminLink) {
      adminLink.remove();
    }
  });

  // PROTECT TEXT DISPLAY
  function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[character]));
  }

  // STORY CARD
  function storyCard(story) {
    const title = escapeHTML(
      story.title || "Untitled story"
    );

    const excerpt = escapeHTML(
      story.excerpt || story.body || ""
    );

    const category = escapeHTML(
      story.category || "News"
    );

    const date = story.created_at
      ? new Date(story.created_at).toLocaleDateString(
          undefined,
          {
            year: "numeric",
            month: "short",
            day: "numeric"
          }
        )
      : "";

    const image = story.image_url
      ? escapeHTML(story.image_url)
      : "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=900&q=80";

    const link = story.link_url
      ? escapeHTML(story.link_url)
      : "#";

    return `
      <article class="story-card">
        <div class="story-image">
          <img
            loading="lazy"
            src="${image}"
            alt="${title}"
            onerror="this.src='https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=900&q=80'"
          >
          <span class="story-category">${category}</span>
        </div>

        <div class="story-body">
          <h3>${title}</h3>
          <p>${excerpt}</p>

          <div class="story-meta">
            <span>${date}</span>

            <a
              class="story-read"
              href="${link}"
              ${story.link_url ? 'target="_blank" rel="noopener"' : ""}
            >
              ${story.link_url ? "Read more ↗" : "CKAVOX story"}
            </a>
          </div>
        </div>
      </article>
    `;
  }

  // DISPLAY STORIES
  function renderStories() {
    const filtered =
      currentCategory === "All"
        ? stories
        : stories.filter(
            story => story.category === currentCategory
          );

    const grid = $("#storyGrid");

    if (!filtered.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <span>✦</span>
          <h3>
            ${
              stories.length
                ? "No stories in this category yet"
                : "Your next story starts here"
            }
          </h3>

          <p>
            ${
              stories.length
                ? "Choose another category to see more stories."
                : "New stories published by CKAVOX will appear in this space."
            }
          </p>
        </div>
      `;
    } else {
      grid.innerHTML = filtered
        .map(storyCard)
        .join("");
    }
  }

  // LOAD PUBLISHED STORIES FROM SUPABASE
  async function loadStories() {
    const status = $("#loadStatus");

    if (!db) {
      status.textContent =
        "Connect Supabase to load stories published by the CKAVOX admin.";

      return;
    }

    status.textContent = "Loading stories…";

    const { data, error } = await db
      .from("posts")
      .select(
        "id,title,excerpt,body,category,image_url,link_url,created_at"
      )
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(60);

    if (error) {
      status.textContent =
        "Stories are temporarily unavailable. Check the Supabase setup.";

      console.error(error);
      return;
    }

    stories = data || [];

    renderStories();

    status.textContent = stories.length
      ? `${stories.length} published ${
          stories.length === 1 ? "story" : "stories"
        }`
      : "";
  }

  // FILTER STORIES
  $$("#filterRow button").forEach(button => {
    button.addEventListener("click", () => {
      currentCategory = button.dataset.category;

      $$("#filterRow button").forEach(item => {
        item.classList.toggle(
          "selected",
          item === button
        );
      });

      renderStories();
    });
  });

  // CLICK CATEGORY TO FILTER
  $$(".category-card").forEach(card => {
    card.addEventListener("click", () => {
      const category = card.dataset.jump;

      currentCategory = category;

      $$("#filterRow button").forEach(button => {
        button.classList.toggle(
          "selected",
          button.dataset.category === category
        );
      });

      renderStories();
    });
  });

  // FIXED CLOCK: KIGALI TIME
  const clockTime = $("#clockTime");
  const clockDate = $("#clockDate");

  function updateClock() {
    const now = new Date();

    if (clockTime) {
      clockTime.textContent = new Intl.DateTimeFormat(
        "en-GB",
        {
          timeZone: "Africa/Kigali",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false
        }
      ).format(now);
    }

    if (clockDate) {
      clockDate.textContent = new Intl.DateTimeFormat(
        "en-GB",
        {
          timeZone: "Africa/Kigali",
          day: "2-digit",
          month: "short",
          year: "numeric"
        }
      ).format(now);
    }
  }

  updateClock();

  setInterval(updateClock, 1000);

  // FOUR PHOTOS PER CATEGORY
  // Each slideshow changes automatically every 4 seconds.
  const photoCategories = [
    {
      name: "Sports",
      label: "SPORTS",
      jump: "Sports",
      photos: [
        ["Football action", "photo-1574629810360-7efbbe195018"],
        ["Basketball game", "photo-1546519638-68e109498ffc"],
        ["Stadium crowd", "photo-1522778119026-d647f0596c20"],
        ["Racing sport", "photo-1533561052604-c3beb6d55b8d"]
      ]
    },
    {
      name: "Trending",
      label: "TRENDING",
      jump: "Trending",
      photos: [
        ["Trending entertainment", "photo-1492684223066-81342ee5ff30"],
        ["Live event", "photo-1506157786151-b8491531f063"],
        ["Popular culture", "photo-1524368535928-5b5e00ddc76b"],
        ["Crowd and celebration", "photo-1501386761578-eac5c94b800a"]
      ]
    },
    {
      name: "News",
      label: "NEWS",
      jump: "News",
      photos: [
        ["Newsroom", "photo-1504711434969-e33886168f5c"],
        ["Newspaper", "photo-1495020689067-958852a7765e"],
        ["Journalism", "photo-1503694978374-8a2fa686963a"],
        ["Media discussion", "photo-1529107386315-e1a2ed48a620"]
      ]
    },
    {
      name: "Music",
      label: "MUSIC",
      jump: "Music",
      photos: [
        ["Live music", "photo-1470229722913-7c0e2dbbafd3"],
        ["Concert stage", "photo-1501386761578-eac5c94b800a"],
        ["Headphones", "photo-1505740420928-5e560c06d30e"],
        ["Music performance", "photo-1516280440614-37939bbacd81"]
      ]
    },
    {
      name: "Films",
      label: "FILMS",
      jump: "Films",
      photos: [
        ["Cinema", "photo-1489599849927-2ee91cede3ba"],
        ["Movie camera", "photo-1485846234645-a62644f84728"],
        ["Film production", "photo-1440404653325-ab127d49abc1"],
        ["Movie theatre", "photo-1478720568477-152d9b164e26"]
      ]
    },
    {
      name: "Technology",
      label: "TECHNOLOGY",
      jump: "Technology",
      photos: [
        ["Technology circuit board", "photo-1518770660439-4636190af475"],
        ["Computer workstation", "photo-1498050108023-c5249f4df085"],
        ["Digital devices", "photo-1519389950473-47ba0277781c"],
        ["Laptop and code", "photo-1515879218367-8466d910aaa4"]
      ]
    },
    {
      name: "Other Content",
      label: "DISCOVER",
      jump: "Other Content",
      photos: [
        ["Interesting discoveries", "photo-1519681393784-d120267933ba"],
        ["Nature and travel", "photo-1470770841072-f978cf4d019e"],
        ["Books and learning", "photo-1507842217343-583bb7270b66"],
        ["Creative ideas", "photo-1455390582262-044cdead277a"]
      ]
    }
  ];

  const visualGrid = $("#visualCategoryGrid");

  if (visualGrid) {
    photoCategories.forEach(category => {
      const card = document.createElement("article");

      card.className = "visual-category-card";

      card.innerHTML = `
        <div class="visual-category-head">
          <h3>${category.name}</h3>
          <span>${category.label}</span>
        </div>

        <div class="visual-photo-frame">
          <img
            loading="lazy"
            alt="${category.name}"
            src="https://images.unsplash.com/${category.photos[0][1]}?auto=format&fit=crop&w=1100&q=85"
          >

          <span class="visual-photo-shade"></span>
          <span class="visual-photo-caption">
            ${category.photos[0][0]}
          </span>
        </div>

        <div class="visual-photo-controls">
          <button
            type="button"
            class="photo-prev"
            aria-label="Previous ${category.name} photo"
          >‹</button>

          <span class="visual-photo-dots">
            ${category.photos.map((photo, index) =>
              `<i class="${index === 0 ? "active" : ""}"></i>`
            ).join("")}
          </span>

          <span class="photo-count">1 / 4</span>

          <button
            type="button"
            class="photo-next"
            aria-label="Next ${category.name} photo"
          >›</button>
        </div>
      `;

      visualGrid.appendChild(card);

      let indexNow = 0;

      const img = $("img", card);
      const caption = $(".visual-photo-caption", card);
      const count = $(".photo-count", card);
      const dots = $$(".visual-photo-dots i", card);

      function showPhoto(nextIndex) {
        indexNow =
          (nextIndex + category.photos.length) %
          category.photos.length;

        const photo = category.photos[indexNow];

        img.src =
          `https://images.unsplash.com/${photo[1]}?auto=format&fit=crop&w=1100&q=85`;

        img.alt = `${category.name}: ${photo[0]}`;
        caption.textContent = photo[0];
        count.textContent = `${indexNow + 1} / 4`;

        dots.forEach((dot, index) => {
          dot.classList.toggle(
            "active",
            index === indexNow
          );
        });
      }

      $(".photo-prev", card).addEventListener("click", () => {
        showPhoto(indexNow - 1);
      });

      $(".photo-next", card).addEventListener("click", () => {
        showPhoto(indexNow + 1);
      });

      setInterval(() => {
        showPhoto(indexNow + 1);
      }, 4000);
    });
  }

  // Tangiza inkuru ziri muri Supabase
  loadStories();

})();
