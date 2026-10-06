(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const header = $(".header");
  const burger = $(".burger");
  const nav = $(".nav");
  const overlay = $(".nav-overlay");

  const toggleNav = (open) => {
    nav.classList.toggle("open", open);
    overlay.classList.toggle("open", open);
    document.body.style.overflow = open ? "hidden" : "";
  };

  burger?.addEventListener("click", () => toggleNav(!nav.classList.contains("open")));
  overlay?.addEventListener("click", () => toggleNav(false));
  $$(".nav a").forEach((a) => a.addEventListener("click", () => toggleNav(false)));

  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 8);
  });

  // Акции на первом экране: слайды меняются сами, пауза при наведении
  const promo = $(".promos");
  const promoSlides = $$(".promo-slide", promo);
  const promoDots = $(".promo-dots", promo);
  if (promoSlides.length > 1 && promoDots) {
    const PROMO_TIME = 5000;
    const auto = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let current = 0;
    let remaining = PROMO_TIME;
    let startedAt = 0;
    let timer = null;
    let paused = false;
    promoDots.style.setProperty("--promo-time", PROMO_TIME + "ms");
    promoDots.classList.toggle("auto", auto);
    const dots = promoSlides.map((_, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", "Акция " + (i + 1) + " из " + promoSlides.length);
      dot.addEventListener("click", () => show(i));
      promoDots.append(dot);
      return dot;
    });
    const schedule = () => {
      clearTimeout(timer);
      timer = null;
      if (!auto || paused) return;
      startedAt = Date.now();
      timer = setTimeout(() => show(current + 1), remaining);
    };
    const show = (i) => {
      current = (i + promoSlides.length) % promoSlides.length;
      promoSlides.forEach((s, n) => s.classList.toggle("active", n === current));
      dots.forEach((d, n) => d.classList.toggle("active", n === current));
      remaining = PROMO_TIME;
      schedule();
    };
    const pause = () => {
      if (paused) return;
      paused = true;
      if (timer) remaining = Math.max(300, remaining - (Date.now() - startedAt));
      clearTimeout(timer);
      timer = null;
      promoDots.classList.add("paused");
    };
    const resume = () => {
      if (!paused) return;
      paused = false;
      promoDots.classList.remove("paused");
      schedule();
    };
    promo.addEventListener("mouseenter", pause);
    promo.addEventListener("mouseleave", resume);
    promo.addEventListener("focusin", pause);
    promo.addEventListener("focusout", resume);
    document.addEventListener("visibilitychange", () => (document.hidden ? pause() : resume()));
    let touchX = null;
    promo.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
    promo.addEventListener("touchend", (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) > 40) show(current + (dx < 0 ? 1 : -1));
    });
    show(0);
  }

  $$(".slider").forEach((slider) => {
    const track = $(".slider__track", slider);
    const prev = $(".arrow--prev", slider);
    const next = $(".arrow--next", slider);
    if (!track || !prev || !next) return;
    const step = () => {
      const item = track.firstElementChild;
      return item ? item.getBoundingClientRect().width + 8 : track.clientWidth;
    };
    const update = () => {
      prev.disabled = track.scrollLeft < 4;
      next.disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 4;
    };
    prev.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: "smooth" }));
    next.addEventListener("click", () => track.scrollBy({ left: step(), behavior: "smooth" }));
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();

    // Автопрокрутка (data-autoplay="мс"): пауза при наведении, в конце возвращается к началу
    const delay = Number(slider.dataset.autoplay);
    if (delay && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      let hold = false;
      let visible = false;
      ["mouseenter", "focusin", "touchstart"].forEach((ev) => slider.addEventListener(ev, () => { hold = true; }, { passive: true }));
      ["mouseleave", "focusout"].forEach((ev) => slider.addEventListener(ev, () => { hold = false; }));
      new IntersectionObserver((e) => { visible = e[0].isIntersecting; }, { threshold: 0.4 }).observe(slider);
      setInterval(() => {
        if (hold || !visible || document.hidden) return;
        const atEnd = track.scrollLeft + track.clientWidth > track.scrollWidth - 4;
        track.scrollTo({ left: atEnd ? 0 : track.scrollLeft + step(), behavior: "smooth" });
      }, delay);
    }
  });

  $$(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$(".tab").forEach((t) => t.classList.remove("active"));
      $$(".panel").forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      $("#" + tab.dataset.panel)?.classList.add("active");
    });
  });

  $$("[data-more]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const box = btn.closest(".service").querySelector(".more");
      box.classList.toggle("open");
      btn.textContent = box.classList.contains("open") ? "Свернуть" : "Подробнее";
    });
  });

  const modal = $("#modal");
  const closeModal = () => modal.classList.remove("open");
  const openModal = (title) => {
    if (title) modal.querySelector("h3").textContent = title;
    modal.classList.add("open");
    modal.querySelector("input")?.focus();
  };
  $$("[data-modal]").forEach((el) => {
    el.addEventListener("click", () => openModal(el.dataset.modal));
  });
  $(".modal__close")?.addEventListener("click", closeModal);
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
      toggleNav(false);
    }
  });

  const toast = $("#toast");
  const showToast = (text) => {
    toast.textContent = text;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3200);
  };

  const maskPhone = (input) => {
    let v = input.value.replace(/\D/g, "");
    if (!v) {
      input.value = "";
      return;
    }
    if (v.startsWith("8")) v = "7" + v.slice(1);
    if (!v.startsWith("7")) v = "7" + v;
    v = v.slice(0, 11);
    const p = v.split("");
    let out = "+7";
    if (p.length > 1) out += " (" + p.slice(1, 4).join("");
    if (p.length >= 5) out += ") " + p.slice(4, 7).join("");
    if (p.length >= 8) out += "-" + p.slice(7, 9).join("");
    if (p.length >= 10) out += "-" + p.slice(9, 11).join("");
    input.value = out;
  };
  $$('input[type="tel"]').forEach((input) => {
    input.addEventListener("input", () => maskPhone(input));
  });

  // Заявки пока никуда не отправляются: здесь нужно подключить отправку (почта, Telegram или CRM)
  $$("form").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = form.querySelector('[name="name"]')?.value.trim();
      const phone = form.querySelector('[name="phone"]')?.value.trim();
      if (!name || !phone || phone.replace(/\D/g, "").length < 11) {
        showToast("Укажите имя и телефон полностью");
        return;
      }
      form.reset();
      closeModal();
      showToast("Спасибо! Мы свяжемся с вами в ближайшее время");
    });
  });

  const animateCount = (el) => {
    const target = Number(el.dataset.count);
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    const duration = 1400;
    const start = performance.now();
    const run = (el.countRun = (el.countRun || 0) + 1);
    const tick = (now) => {
      if (el.countRun !== run) return;
      const p = Math.min(1, (now - start) / duration);
      const decimals = Number(el.dataset.decimals) || 0;
      const val = target * (1 - Math.pow(1 - p, 3));
      el.textContent = prefix + val.toLocaleString("ru-RU", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const el = entry.target;
        // Блоки внутри [data-replay] анимируются при каждом появлении на экране, остальные один раз
        const replay = Boolean(el.closest("[data-replay]"));
        if (!entry.isIntersecting) {
          if (replay) el.classList.remove("in");
          return;
        }
        if (entry.intersectionRatio < 0.2 || el.classList.contains("in")) return;
        el.classList.add("in");
        $$("[data-count]", el).forEach(animateCount);
        if (!replay) io.unobserve(el);
      });
    },
    { threshold: [0, 0.2] }
  );
  $$(".reveal").forEach((el) => io.observe(el));

  // Ипотечный калькулятор: сравнение платежа по рыночной ставке и ставке с агентством
  const calc = $("#calc");
  if (calc) {
    const rub = (n) => Math.round(n).toLocaleString("ru-RU") + " ₽";
    const years = (n) => n + " " + (n % 10 === 1 && n % 100 !== 11 ? "год" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "года" : "лет");
    const out = (name, text) => { $('[data-out="' + name + '"]', calc).textContent = text; };
    const payment = (sum, rate, months) => {
      const r = rate / 100 / 12;
      return r === 0 ? sum / months : (sum * r) / (1 - Math.pow(1 + r, -months));
    };
    const recalc = () => {
      const v = {};
      $$("[data-in]", calc).forEach((input) => {
        v[input.dataset.in] = Number(input.value);
        input.style.setProperty("--fill", ((input.value - input.min) / (input.max - input.min)) * 100 + "%");
      });
      const downSum = (v.price * v.down) / 100;
      const loan = v.price - downSum;
      const months = v.term * 12;
      const payMarket = payment(loan, v.rateMarket, months);
      const payOurs = payment(loan, v.rateOurs, months);
      const gainMonth = payMarket - payOurs;
      out("price", rub(v.price));
      out("down", v.down + "% · " + rub(downSum));
      out("term", years(v.term));
      out("rateMarket", v.rateMarket.toLocaleString("ru-RU") + "%");
      out("rateOurs", v.rateOurs.toLocaleString("ru-RU") + "%");
      out("payMarket", rub(payMarket));
      out("payOurs", rub(payOurs));
      out("overMarket", rub(payMarket * months - loan));
      out("overOurs", rub(payOurs * months - loan));
      out("gainTotal", rub(Math.max(0, gainMonth * months)));
      out("gainMonth", rub(Math.max(0, gainMonth)));
      $(".calc__gain", calc).classList.toggle("is-loss", gainMonth <= 0);
    };
    $$("[data-in]", calc).forEach((input) => input.addEventListener("input", recalc));
    recalc();
  }

  // Сообщение менеджера через 40 секунд после захода на сайт (один раз за визит)
  const chat = $("#chat");
  if (chat) {
    const CHAT_DELAY = 40000;
    let seen = false;
    try { seen = sessionStorage.getItem("chatSeen") === "1"; } catch (e) {}
    const hideChat = () => {
      chat.classList.remove("show");
      document.body.classList.remove("chat-open");
      setTimeout(() => { chat.hidden = true; }, 400);
    };
    if (!seen) {
      setTimeout(() => {
        try { sessionStorage.setItem("chatSeen", "1"); } catch (e) {}
        chat.hidden = false;
        requestAnimationFrame(() => chat.classList.add("show"));
        document.body.classList.add("chat-open");
        setTimeout(() => chat.classList.add("typed"), 1600);
      }, CHAT_DELAY);
    }
    $(".chat__close", chat).addEventListener("click", hideChat);
    $$("a, [data-modal]", chat).forEach((el) => el.addEventListener("click", hideChat));
  }
})();