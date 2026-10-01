/* DX Agent JSON 工具:格式化 / 压缩 / 清空 / 复制。
   纯本地运行:不发起任何网络请求;非法 JSON 通过 try/catch 处理,不会产生未捕获异常。 */
(function () {
  "use strict";

  var doc = document;

  var input = doc.getElementById("json-input");
  var output = doc.getElementById("json-output");
  var status = doc.getElementById("tool-status");
  var inputCount = doc.getElementById("input-count");
  var outputCount = doc.getElementById("output-count");
  var btnFormat = doc.getElementById("btn-format");
  var btnMinify = doc.getElementById("btn-minify");
  var btnClear = doc.getElementById("btn-clear");
  var btnCopy = doc.getElementById("btn-copy");

  if (!input || !output || !status || !btnFormat || !btnMinify || !btnClear || !btnCopy) {
    return;
  }

  function setStatus(message, tone) {
    status.textContent = message;
    if (tone) {
      status.setAttribute("data-tone", tone);
    } else {
      status.removeAttribute("data-tone");
    }
  }

  function updateCounts() {
    if (inputCount) {
      inputCount.textContent = input.value.length + " 字符";
    }
    if (outputCount) {
      outputCount.textContent = output.textContent.length + " 字符";
    }
  }

  /* 把浏览器的解析错误翻译成带行列位置的中文提示 */
  function describeError(error, text) {
    var message = error && error.message ? error.message : String(error);

    // Chromium / V8:"... at position N"
    var atPosition = /position\s+(\d+)/i.exec(message);
    if (atPosition) {
      var pos = Math.min(Number(atPosition[1]), text.length);
      var before = text.slice(0, pos);
      var line = before.split("\n").length;
      var col = pos - before.lastIndexOf("\n");
      return "JSON 解析失败:第 " + line + " 行第 " + col + " 列附近存在问题,请检查该处的标点、引号或括号。";
    }

    // Firefox:"... at line N column M ..."
    var lineCol = /line\s+(\d+)\s+column\s+(\d+)/i.exec(message);
    if (lineCol) {
      return "JSON 解析失败:第 " + lineCol[1] + " 行第 " + lineCol[2] + " 列附近存在问题,请检查该处的标点、引号或括号。";
    }

    return "JSON 解析失败:" + message;
  }

  /* 统一入口:解析输入并执行 action,返回是否成功 */
  function withParsed(action) {
    var text = input.value;

    if (text.trim() === "") {
      output.textContent = "";
      setStatus("请先在输入框中粘贴 JSON 内容。", null);
      updateCounts();
      input.focus();
      return false;
    }

    try {
      output.textContent = action(JSON.parse(text));
      updateCounts();
      return true;
    } catch (error) {
      output.textContent = "";
      setStatus(describeError(error, text), "error");
      updateCounts();
      return false;
    }
  }

  btnFormat.addEventListener("click", function () {
    var ok = withParsed(function (value) {
      return JSON.stringify(value, null, 2);
    });
    if (ok) {
      setStatus("格式化完成,缩进为 2 个空格。", "ok");
    }
  });

  btnMinify.addEventListener("click", function () {
    var ok = withParsed(function (value) {
      return JSON.stringify(value);
    });
    if (ok) {
      setStatus("压缩完成,已移除多余空白。", "ok");
    }
  });

  btnClear.addEventListener("click", function () {
    input.value = "";
    output.textContent = "";
    setStatus("已清空输入与结果。", null);
    updateCounts();
    input.focus();
  });

  /* 复制:优先 Clipboard API,失败时回退到隐藏 textarea + execCommand */
  function legacyCopy(text) {
    var helper = doc.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.top = "-9999px";
    doc.body.appendChild(helper);
    helper.select();
    var ok = false;
    try {
      ok = doc.execCommand("copy");
    } catch (error) {
      ok = false;
    }
    doc.body.removeChild(helper);
    return ok;
  }

  function copyText(text) {
    if (window.isSecureContext && navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(
        function () { return true; },
        function () { return legacyCopy(text); }
      );
    }
    return Promise.resolve(legacyCopy(text));
  }

  btnCopy.addEventListener("click", function () {
    var text = output.textContent;
    if (!text) {
      setStatus("还没有可以复制的结果,请先格式化或压缩。", null);
      return;
    }
    copyText(text).then(function (ok) {
      if (ok) {
        setStatus("已复制到剪贴板。", "ok");
      } else {
        setStatus("复制未成功:浏览器拒绝了剪贴板写入,请手动全选结果复制。", "error");
      }
    });
  });

  /* Ctrl / ⌘ + Enter 快捷格式化 */
  input.addEventListener("keydown", function (event) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      btnFormat.click();
    }
  });

  input.addEventListener("input", updateCounts);
  updateCounts();
})();
