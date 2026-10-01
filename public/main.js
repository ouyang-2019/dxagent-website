/* DX Agent 个人主页交互:移动端菜单、滚动高亮、渐入动效 */
(function () {
  "use strict";

  var doc = document;
  doc.documentElement.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- 页头滚动状态 ---------- */

  var header = doc.querySelector("[data-header]");

  function updateHeader() {
    if (header) {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    }
  }

  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  /* ---------- 移动端导航菜单 ---------- */

  var navToggle = doc.querySelector("[data-nav-toggle]");
  var navPanel = doc.querySelector("[data-nav-panel]");

  function setMenu(open) {
    if (!navToggle || !navPanel) return;
    navToggle.setAttribute("aria-expanded", String(open));
    navPanel.classList.toggle("is-open", open);
  }

  function isMenuOpen() {
    return navToggle && navToggle.getAttribute("aria-expanded") === "true";
  }

  if (navToggle && navPanel) {
    navToggle.addEventListener("click", function () {
      setMenu(!isMenuOpen());
    });

    doc.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isMenuOpen()) {
        setMenu(false);
        navToggle.focus();
      }
    });

    doc.addEventListener("click", function (event) {
      if (
        isMenuOpen() &&
        !navPanel.contains(event.target) &&
        !navToggle.contains(event.target)
      ) {
        setMenu(false);
      }
    });

    navPanel.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        setMenu(false);
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 720 && isMenuOpen()) {
        setMenu(false);
      }
    });
  }

  /* ---------- 导航滚动高亮 ---------- */

  var navLinks = Array.prototype.slice.call(
    doc.querySelectorAll('.nav-link[href^="#"]')
  );
  var sections = navLinks
    .map(function (link) {
      return doc.getElementById(link.getAttribute("href").slice(1));
    })
    .filter(Boolean);

  var spyTicking = false;

  function updateSpy() {
    spyTicking = false;
    if (sections.length === 0) return;
    var line = window.innerHeight * 0.4;
    var currentId = null;
    var atBottom =
      window.innerHeight + window.scrollY >=
      doc.documentElement.scrollHeight - 2;
    if (atBottom) {
      currentId = sections[sections.length - 1].id;
    } else {
      sections.forEach(function (section) {
        if (section.getBoundingClientRect().top <= line) {
          currentId = section.id;
        }
      });
    }
    navLinks.forEach(function (link) {
      if (link.getAttribute("href") === "#" + currentId) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function requestSpy() {
    if (!spyTicking) {
      spyTicking = true;
      window.requestAnimationFrame(updateSpy);
    }
  }

  window.addEventListener("scroll", requestSpy, { passive: true });
  window.addEventListener("resize", requestSpy);
  updateSpy();

  /* ---------- 滚动渐入 ---------- */

  var revealEls = Array.prototype.slice.call(doc.querySelectorAll("[data-reveal]"));

  if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else if (revealEls.length > 0) {
    var revealer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 }
    );
    revealEls.forEach(function (el) {
      revealer.observe(el);
    });

    /* 用户中途切换系统动效偏好时,直接显示全部内容 */
    reduceMotion.addEventListener("change", function (event) {
      if (event.matches) {
        revealEls.forEach(function (el) {
          el.classList.add("is-visible");
        });
        revealer.disconnect();
      }
    });
  }
})();
