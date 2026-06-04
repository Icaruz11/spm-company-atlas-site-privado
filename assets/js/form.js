(() => {
  const config = window.SPM_CONFIG || {};

  const ready = (callback) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }
    callback();
  };

  const isLiveEndpoint = (url) =>
    Boolean(url && !String(url).includes("COLE_AQUI") && !String(url).includes("SEU_"));

  const getParams = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get("utm_source") || "",
      utm_medium: params.get("utm_medium") || "",
      utm_campaign: params.get("utm_campaign") || "",
      utm_content: params.get("utm_content") || "",
      utm_term: params.get("utm_term") || "",
      fbclid: params.get("fbclid") || "",
      gclid: params.get("gclid") || "",
    };
  };

  const storageGet = (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };

  const storageSet = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  };

  const saveTrackingParams = () => {
    const params = getParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        storageSet(key, value);
      }
    });
  };

  const fillTrackingFields = (form) => {
    const params = getParams();
    const fields = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
      "fbclid",
      "gclid",
    ];

    fields.forEach((name) => {
      const input = form.querySelector(`[name="${name}"]`);
      if (input) {
        input.value = storageGet(name) || params[name] || "";
      }
    });

    const pageUrl = form.querySelector('[name="page_url"]');
    const referrer = form.querySelector('[name="referrer"]');
    const userAgent = form.querySelector('[name="user_agent"]');

    if (pageUrl) pageUrl.value = window.location.href;
    if (referrer) referrer.value = document.referrer || "";
    if (userAgent) userAgent.value = navigator.userAgent || "";
  };

  const collectDraft = (form) => {
    const draft = {};
    form.querySelectorAll("input, select, textarea").forEach((field) => {
      if (
        !(
          field instanceof HTMLInputElement ||
          field instanceof HTMLSelectElement ||
          field instanceof HTMLTextAreaElement
        )
      ) {
        return;
      }

      if (field.name && !field.matches('[type="hidden"]')) {
        draft[field.name] = field.type === "checkbox" ? field.checked : field.value;
      }
    });
    return draft;
  };

  const collectSubmission = (form) => {
    const submission = {};
    form.querySelectorAll("input, select, textarea").forEach((field) => {
      if (
        !(
          field instanceof HTMLInputElement ||
          field instanceof HTMLSelectElement ||
          field instanceof HTMLTextAreaElement
        )
      ) {
        return;
      }

      if (!field.name || field.name === "website") {
        return;
      }

      submission[field.name] = field.type === "checkbox" ? field.checked : field.value;
    });
    return submission;
  };

  const restoreDraft = (form) => {
    const raw = storageGet(config.formDraftKey || "spm_form_draft");
    if (!raw) return;

    try {
      const draft = JSON.parse(raw);
      Object.entries(draft).forEach(([name, value]) => {
        const field = form.elements.namedItem(name);
        if (!field) return;
        if (field instanceof RadioNodeList) return;

        if (field instanceof HTMLInputElement && field.type === "checkbox") {
          field.checked = Boolean(value);
        } else {
          field.value = value;
        }
      });
    } catch {
      // ignore invalid draft
    }
  };

  const persistDraft = (form) => {
    storageSet(config.formDraftKey || "spm_form_draft", JSON.stringify(collectDraft(form)));
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(config.formDraftKey || "spm_form_draft");
    } catch {
      // ignore
    }
  };

  const showStatus = (form, message, state = "info") => {
    const status = form.querySelector("[data-form-status]");
    if (!status) return;
    status.dataset.state = state;
    status.textContent = message;
  };

  const resetSubmitButton = (form) => {
    const submitButton = form.querySelector('[type="submit"]');
    if (submitButton instanceof HTMLButtonElement) {
      submitButton.disabled = false;
      submitButton.textContent = "Solicitar diagnostico ATLAS ->";
    }
  };

  const handleSuccess = (form, mode) => {
    resetSubmitButton(form);
    clearDraft();

    showStatus(
      form,
      mode === "live"
        ? "Solicitacao enviada com sucesso. Nosso time vai analisar suas informacoes e entrar em contato."
        : "Pre-visualizacao salva localmente para revisao. Configure a URL do Apps Script para ativar o envio real.",
      "success",
    );

    const payload = collectSubmission(form);
    storageSet(
      config.leadKey || "spm_last_lead",
      JSON.stringify({
        ...payload,
        submitted_at: new Date().toISOString(),
        mode,
      }),
    );

    if (window.SPMTracker) {
      window.SPMTracker.track("Lead", {
        content_name: "Formulario Protocolo ATLAS",
        content_category: "Diagnostico Comercial",
      });
    }

    window.setTimeout(() => {
      window.location.href = "/obrigado/";
    }, 650);
  };

  const handleError = (form, message) => {
    resetSubmitButton(form);
    showStatus(
      form,
      message || "Nao foi possivel enviar agora. Tente novamente em alguns instantes.",
      "error",
    );
  };

  const buildSubmissionBody = (form) => {
    const formData = new FormData(form);
    return new URLSearchParams(
      Array.from(formData.entries()).map(([key, value]) => [key, String(value)]),
    );
  };

  const parseScriptResponse = async (response) => {
    const text = await response.text();

    try {
      return JSON.parse(text);
    } catch {
      return {
        status: "error",
        message: text || "Resposta invalida do endpoint.",
      };
    }
  };

  const submitLive = async (form, endpoint) => {
    const response = await fetch(endpoint, {
      method: "POST",
      body: buildSubmissionBody(form),
      mode: "cors",
      redirect: "follow",
    });

    const payload = await parseScriptResponse(response);

    if (!response.ok || payload.status !== "success") {
      throw new Error(payload.message || "O endpoint nao confirmou o recebimento da solicitacao.");
    }

    handleSuccess(form, "live");
  };

  ready(() => {
    const form = document.querySelector("[data-lead-form]");
    if (!form) return;

    saveTrackingParams();
    restoreDraft(form);
    fillTrackingFields(form);

    const submitButton = form.querySelector('[type="submit"]');
    const endpoint = form.dataset.endpoint || config.appsScriptUrl || "";
    const liveEndpoint = isLiveEndpoint(endpoint);

    form.addEventListener("input", () => persistDraft(form));

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      fillTrackingFields(form);

      const honeypot = form.querySelector('[name="website"]');
      if (honeypot instanceof HTMLInputElement && honeypot.value.trim()) {
        showStatus(form, "Envio bloqueado por protecao anti-spam.", "error");
        return;
      }

      if (!form.checkValidity()) {
        form.reportValidity();
        const firstInvalid = form.querySelector(":invalid");
        if (firstInvalid instanceof HTMLElement) {
          firstInvalid.focus();
        }
        showStatus(form, "Revise os campos marcados antes de enviar.", "error");
        return;
      }

      if (submitButton instanceof HTMLButtonElement) {
        submitButton.disabled = true;
        submitButton.textContent = "Enviando...";
      }

      if (!liveEndpoint) {
        handleSuccess(form, "preview");
        return;
      }

      showStatus(form, "Enviando sua solicitacao para analise...", "info");

      try {
        await submitLive(form, endpoint);
      } catch (error) {
        handleError(
          form,
          error instanceof Error
            ? error.message
            : "Nao foi possivel confirmar o envio. Tente novamente em alguns instantes.",
        );
      }
    });
  });
})();
