/*!
 * product.js - product page interactions.
 * Plain JavaScript, no dependencies. Content remains visible when JavaScript
 * is disabled; this file only enhances menus, tabs, and reveal timing.
 */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  function initMenu() {
    var menuToggle = document.querySelector("[data-menu-toggle]");
    var siteNav = document.getElementById("site-nav");

    function isOpen() {
      return Boolean(siteNav) && siteNav.classList.contains("is-open");
    }

    function setOpen(open) {
      if (menuToggle) {
        menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
      }
      if (siteNav) {
        siteNav.classList.toggle("is-open", open);
      }
    }

    function closeMenu() {
      if (isOpen()) {
        setOpen(false);
      }
    }

    if (menuToggle) {
      menuToggle.addEventListener("click", function () {
        setOpen(!isOpen());
      });
    }

    if (!siteNav) {
      return;
    }

    siteNav.addEventListener("click", function (event) {
      var target = event.target;
      if (target && typeof target.closest === "function" && target.closest("a")) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isOpen()) {
        closeMenu();
        if (menuToggle) {
          menuToggle.focus();
        }
      }
    });

    document.addEventListener("click", function (event) {
      var target = event.target;
      if (
        target &&
        typeof target.closest === "function" &&
        target.closest("#site-nav, [data-menu-toggle]")
      ) {
        return;
      }
      closeMenu();
    });

    var desktop = window.matchMedia("(min-width: 800px)");
    var closeOnDesktop = function (mq) {
      if (mq.matches) {
        closeMenu();
      }
    };
    if (typeof desktop.addEventListener === "function") {
      desktop.addEventListener("change", closeOnDesktop);
    } else if (typeof desktop.addListener === "function") {
      desktop.addListener(closeOnDesktop);
    }
    if (desktop.matches) {
      closeMenu();
    }
  }

  function initDemoTabs() {
    var tabs = Array.prototype.slice.call(document.querySelectorAll("[data-demo-tab]"));
    var panels = Array.prototype.slice.call(document.querySelectorAll("[data-demo-panel]"));
    if (tabs.length === 0) {
      return;
    }

    function select(tab) {
      var key = tab.getAttribute("data-demo-tab");
      tabs.forEach(function (item) {
        var selected = item === tab;
        item.setAttribute("aria-selected", selected ? "true" : "false");
        item.setAttribute("tabindex", selected ? "0" : "-1");
      });
      panels.forEach(function (panel) {
        panel.hidden = panel.getAttribute("data-demo-panel") !== key;
      });
    }

    select(tabs.filter(function (tab) { return tab.getAttribute("aria-selected") === "true"; })[0] || tabs[0]);

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        select(tab);
      });

      tab.addEventListener("keydown", function (event) {
        var nextIndex;
        if (event.key === "ArrowRight") {
          nextIndex = (index + 1) % tabs.length;
        } else if (event.key === "ArrowLeft") {
          nextIndex = (index - 1 + tabs.length) % tabs.length;
        } else if (event.key === "Home") {
          nextIndex = 0;
        } else if (event.key === "End") {
          nextIndex = tabs.length - 1;
        } else {
          return;
        }
        event.preventDefault();
        var next = tabs[nextIndex];
        select(next);
        next.focus();
      });
    });
  }

  function initReveal() {
    var items = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
    if (items.length === 0) {
      return;
    }

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (item) {
        item.classList.add("is-visible");
      });
      return;
    }

    document.documentElement.classList.add("reveal-ready");
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
    );

    items.forEach(function (item, index) {
      item.style.transitionDelay = Math.min(index * 55, 220) + "ms";
      observer.observe(item);
    });
  }

  function init() {
    initMenu();
    initDemoTabs();
    initReveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
