/*!
 * shared.js — shared page interactions: mobile nav menu + demo tab switcher.
 * Plain JavaScript, no dependencies. Every hook is optional; pages whose
 * markup lacks a feature simply skip it.
 */
(function () {
  'use strict';

  /* Mobile nav menu ---------------------------------------------------- */

  function initMenu() {
    var menuToggle = document.querySelector('[data-menu-toggle]');
    var siteNav = document.getElementById('site-nav');

    function isOpen() {
      return Boolean(siteNav) && siteNav.classList.contains('is-open');
    }

    function setOpen(open) {
      if (menuToggle) {
        menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
      if (siteNav) {
        siteNav.classList.toggle('is-open', open);
      }
    }

    function closeMenu() {
      if (isOpen()) {
        setOpen(false);
      }
    }

    if (menuToggle) {
      menuToggle.addEventListener('click', function () {
        setOpen(!isOpen());
      });
    }

    if (!siteNav) {
      return;
    }

    // Clicking a link inside the nav closes the menu (in-page anchor jumps).
    siteNav.addEventListener('click', function (event) {
      var target = event.target;
      if (target && typeof target.closest === 'function' && target.closest('a')) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isOpen()) {
        closeMenu();
        if (menuToggle) menuToggle.focus();
      }
    });

    document.addEventListener('click', function (event) {
      var target = event.target;
      if (target && typeof target.closest === 'function' &&
          target.closest('#site-nav, [data-menu-toggle]')) {
        return;
      }
      closeMenu();
    });

    var desktop = window.matchMedia('(min-width: 800px)');
    var closeOnDesktop = function (mq) {
      if (mq.matches) {
        closeMenu();
      }
    };
    if (typeof desktop.addEventListener === 'function') {
      desktop.addEventListener('change', closeOnDesktop);
    } else if (typeof desktop.addListener === 'function') {
      desktop.addListener(closeOnDesktop); // legacy browsers
    }
    if (desktop.matches) {
      closeMenu();
    }
  }

  /* Demo tabs ([data-demo-tab] / [data-demo-panel], matched by key) ----- */

  function initDemoTabs() {
    var tabs = Array.prototype.slice.call(document.querySelectorAll('[data-demo-tab]'));
    var panels = Array.prototype.slice.call(document.querySelectorAll('[data-demo-panel]'));
    if (tabs.length === 0) {
      return;
    }

    function select(tab) {
      var key = tab.getAttribute('data-demo-tab');
      tabs.forEach(function (item) {
        var selected = item === tab;
        item.setAttribute('aria-selected', selected ? 'true' : 'false');
        item.setAttribute('tabindex', selected ? '0' : '-1');
      });
      panels.forEach(function (panel) {
        panel.hidden = panel.getAttribute('data-demo-panel') !== key;
      });
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener('click', function () {
        select(tab);
      });

      tab.addEventListener('keydown', function (event) {
        var nextIndex;
        if (event.key === 'ArrowRight') {
          nextIndex = (index + 1) % tabs.length;
        } else if (event.key === 'ArrowLeft') {
          nextIndex = (index - 1 + tabs.length) % tabs.length;
        } else if (event.key === 'Home') {
          nextIndex = 0;
        } else if (event.key === 'End') {
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

  function init() {
    initMenu();
    initDemoTabs();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
