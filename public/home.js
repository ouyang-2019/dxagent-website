/* DX Agent 主页专用:首屏 3D 星系的加载门槛(渐进增强,失败时保留原 6 宫格) */
(function () {
  "use strict";

  var doc = document;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  var studioMap = doc.querySelector(".studio-map");
  var requestedQuality = new URLSearchParams(window.location.search).get("quality");
  var saveData = navigator.connection && navigator.connection.saveData;

  /* Three.js r186 需要 WebGL2;不支持时不预留 3D 尺寸,避免回退造成布局偏移 */
  function hasWebGL2() {
    try {
      var gl = doc.createElement("canvas").getContext("webgl2");
      var lose = gl && gl.getExtension("WEBGL_lose_context");
      if (lose) lose.loseContext();
      return Boolean(gl);
    } catch (error) {
      return false;
    }
  }

  if (
    studioMap &&
    !reduceMotion.matches &&
    !saveData &&
    requestedQuality !== "off" &&
    "IntersectionObserver" in window &&
    "ResizeObserver" in window &&
    hasWebGL2()
  ) {
    /* 先为 3D 预留最终尺寸(窄屏更高),避免模块就绪后布局偏移 */
    studioMap.classList.add("is-3d-pending");
    var keepGrid = function () {
      studioMap.classList.remove("is-3d-pending");
      studioMap.setAttribute("data-scene", "fallback");
    };
    var whenIdle = window.requestIdleCallback || function (callback) {
      return window.setTimeout(callback, 200);
    };
    whenIdle(function () {
      import("./scene/engine.mjs")
        .then(function (scene) {
          var galaxy = scene.mount(studioMap, { requested: requestedQuality });
          if (!galaxy) {
            keepGrid();
            return;
          }
          reduceMotion.addEventListener("change", function (event) {
            if (event.matches) galaxy.destroy();
          });
        })
        .catch(keepGrid); /* 模块加载失败时保持静态 6 宫格 */
    }, { timeout: 1500 });
  } else if (studioMap) {
    studioMap.setAttribute("data-scene", "off");
  }
})();
