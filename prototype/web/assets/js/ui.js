/**
 * Utilidades de interfaz compartidas por las pantallas de FRONT-002.
 * No contienen lógica de negocio ni acceso a datos.
 */
(function () {
  "use strict";

  function show(element) {
    if (element) {
      element.hidden = false;
    }
  }

  function hide(element) {
    if (element) {
      element.hidden = true;
    }
  }

  function setMessage(element, text, kind) {
    if (!element) {
      return;
    }
    if (!text) {
      element.textContent = "";
      element.hidden = true;
      return;
    }
    element.textContent = text;
    element.dataset.kind = kind || "info";
    element.hidden = false;
  }

  function clearMessage(element) {
    setMessage(element, "", "info");
  }

  function setBusy(button, busy, busyLabel) {
    if (!button) {
      return;
    }
    if (busy) {
      button.dataset.originalLabel = button.textContent;
      button.textContent = busyLabel || "Procesando…";
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
    } else {
      if (button.dataset.originalLabel) {
        button.textContent = button.dataset.originalLabel;
        delete button.dataset.originalLabel;
      }
      button.disabled = false;
      button.removeAttribute("aria-busy");
    }
  }

  function formObject(form) {
    return Object.fromEntries(new FormData(form).entries());
  }

  function text(value, fallback) {
    const normalized = String(value === undefined || value === null ? "" : value).trim();
    return normalized || fallback || "";
  }

  window.UI = {
    show,
    hide,
    setMessage,
    clearMessage,
    setBusy,
    formObject,
    text
  };
})();
