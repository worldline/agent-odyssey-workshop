"use strict";

const byId = (id) => document.getElementById(id);
const money = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });
let catalogue = null;
let paymentModes = [];
let policy = null;
let loading = false;
let quoteRequestId = 0;
const HTTP_RECORDS = [];
let recordSequence = 0;

const ICONS = {
  card: '<svg viewBox="0 0 28 28" aria-hidden="true"><rect x="3" y="6" width="22" height="16" rx="3"/><path d="M3 11h22M7 17h5"/></svg>',
  wallet: '<svg viewBox="0 0 28 28" aria-hidden="true"><path d="M5 8V6a2 2 0 0 1 2-2h15v4M5 8h18a2 2 0 0 1 2 2v12H7a3 3 0 0 1-3-3V10a2 2 0 0 1 1-2Z"/><path d="M25 12h-7v6h7M21 15h.1"/></svg>',
  bank_transfer: '<svg viewBox="0 0 28 28" aria-hidden="true"><path d="m3 10 11-6 11 6H3ZM6 12v9m8-9v9m8-9v9M3 24h22"/></svg>',
};

function formatMoney(cents) {
  return money.format(cents / 100);
}

function setStatus(message, state = "ready") {
  byId("service-status").textContent = message;
  byId("service-status").dataset.state = state;
}

function resetQuote(title = "Ready for a quote", note = "Select a method and calculate its fee.") {
  quoteRequestId += 1;
  byId("quote-result").hidden = true;
  byId("empty-result").hidden = false;
  byId("empty-title").textContent = title;
  byId("empty-note").textContent = note;
}

function renderHttpRecord() {
  const selected = Number(byId("http-record").value);
  const record = HTTP_RECORDS.find((item) => item.id === selected);
  byId("http-status").textContent = record ? String(record.status) : "—";
  byId("http-status").classList.toggle("failed", !!record && record.status >= 400);
  byId("http-response").textContent = record ? record.responseText : "Run an API request to inspect its response.";
}

function recordHttp(method, path, status, responseText) {
  const record = { id: ++recordSequence, method, path, status, responseText };
  HTTP_RECORDS.push(record);
  if (HTTP_RECORDS.length > 12) HTTP_RECORDS.shift();
  const select = byId("http-record");
  select.replaceChildren();
  for (const item of [...HTTP_RECORDS].reverse()) {
    const option = document.createElement("option");
    option.value = String(item.id);
    option.textContent = item.method + " " + item.path;
    select.append(option);
  }
  select.value = String(record.id);
  renderHttpRecord();
}

function showResponseView(http) {
  byId("http-view").hidden = !http;
  byId("summary-view").hidden = http;
  byId("http-tab").setAttribute("aria-selected", String(http));
  byId("summary-tab").setAttribute("aria-selected", String(!http));
}

async function api(path, body) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  const responseText = await response.text();
  recordHttp(body === undefined ? "GET" : "POST", path, response.status, responseText);
  if (!response.ok) {
    throw new Error("Service request failed (HTTP " + response.status + ").");
  }
  return JSON.parse(responseText);
}

function methodLabel(method) {
  return method.display_name || method.name;
}

function markSelection() {
  const selected = byId("payment-method").value;
  for (const card of byId("methods-body").children) {
    const active = card.dataset.method === selected;
    card.classList.toggle("selected", active);
    card.setAttribute("aria-pressed", String(active));
  }
}

function renderData() {
  const select = byId("payment-method");
  const cards = byId("methods-body");
  select.replaceChildren();
  cards.replaceChildren();
  paymentModes = catalogue.methods.flatMap((method) => {
    const base = { method, apiMethod: method.id };
    const logo = { visa: "visa.svg", mastercard: "mastercard.svg" }[method.id] || null;
    return [{ ...base, id: method.id, name: methodLabel(method), logo }];
  });
  for (const mode of paymentModes) {
    const method = mode.method;
    const enabled = policy.allowed_payment_methods.includes(mode.apiMethod);
    const option = document.createElement("option");
    option.value = mode.id;
    option.textContent = mode.name + (enabled ? "" : " — disabled");
    select.append(option);
    const card = document.createElement("button");
    card.type = "button";
    card.className = "method-card" + (enabled ? "" : " mode-disabled");
    card.dataset.method = mode.id;
    const icon = document.createElement("span");
    icon.className = "method-icon";
    if (mode.logo) {
      icon.classList.add("network-logo");
      const image = document.createElement("img");
      image.src = "/assets/" + mode.logo;
      image.alt = mode.name + " logo";
      icon.append(image);
    } else icon.innerHTML = ICONS[mode.apiMethod] || ICONS.card;
    const description = document.createElement("span");
    const name = document.createElement("span");
    name.className = "method-name";
    name.textContent = mode.name;
    const rate = document.createElement("span");
    rate.className = "method-rate";
    rate.textContent = (method.rate_basis_points / 100).toFixed(2) + "% + " + formatMoney(method.fixed_fee_cents);
    description.append(name, rate);
    const badge = document.createElement("span");
    badge.className = "method-state" + (enabled ? "" : " unavailable");
    badge.textContent = enabled ? "Enabled" : "Disabled";
    card.append(icon, description, badge);
    card.addEventListener("click", () => {
      select.value = mode.id;
      markSelection();
      resetQuote();
    });
    cards.append(card);
  }
  markSelection();
  const names = paymentModes.filter((mode) => policy.allowed_payment_methods.includes(mode.apiMethod)).map((mode) => mode.name);
  byId("policy-summary").textContent = names.join(" · ");
  byId("policy-cap").textContent = "Default: " + formatMoney(policy.max_fee_cents) + " · Visa: " + (policy.percentage_fee_caps.visa / 100).toFixed(2) + "% of amount";
}

async function loadData() {
  if (loading) return;
  loading = true;
  byId("calculate-button").disabled = true;
  resetQuote();
  setStatus("Connecting", "loading");
  try {
    [catalogue, policy] = await Promise.all([api("/payment-methods"), api("/merchant-policy")]);
    renderData();
    byId("calculate-button").disabled = false;
    setStatus("Service online");
  } catch (error) {
    catalogue = null;
    policy = null;
    resetQuote("Service unavailable", "Check the backend and refresh this page.");
    setStatus("Service unavailable", "error");
  } finally {
    loading = false;
  }
}

function parseAmount(value) {
  const match = /^(\d+)(?:[.,](\d{1,2}))?$/.exec(value.trim());
  if (!match) throw new Error("Enter a positive EUR amount with at most two decimal places.");
  const cents = BigInt(match[1]) * 100n + BigInt((match[2] || "").padEnd(2, "0"));
  if (cents <= 0n || cents > 100000000n) throw new Error("Use an amount above €0 and up to €1,000,000.");
  return Number(cents);
}

byId("http-record").addEventListener("change", renderHttpRecord);
byId("http-tab").addEventListener("click", () => showResponseView(true));
byId("summary-tab").addEventListener("click", () => showResponseView(false));
byId("payment-method").addEventListener("change", () => { markSelection(); resetQuote(); });
byId("amount").addEventListener("input", () => resetQuote());
byId("quote-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!catalogue || !policy || loading) return;
  const button = byId("calculate-button");
  button.disabled = true;
  resetQuote();
  const requestId = ++quoteRequestId;
  setStatus("Calculating", "loading");
  try {
    const mode = paymentModes.find((item) => item.id === byId("payment-method").value);
    if (!mode) throw new Error("Select a payment mode.");
    const amount = parseAmount(byId("amount").value);
    const quote = await api("/quotes", { amount_cents: amount, payment_method: mode.apiMethod });
    const quoteRecord = [...HTTP_RECORDS].reverse().find((item) => item.path === "/quotes");
    if (quoteRecord) { byId("http-record").value = String(quoteRecord.id); renderHttpRecord(); }
    if (requestId !== quoteRequestId) {
      if (catalogue && policy && !loading) setStatus("Service online");
      return;
    }
    const method = catalogue.methods.find((item) => item.id === quote.payment_method);
    if (!method || !Number.isSafeInteger(quote.fee_cents)) throw new Error("The service returned an invalid quote.");
    const validation = quote.validation;
    if (!validation || !["passed", "failed"].includes(validation.status)) throw new Error("The API did not return a policy verdict.");
    const accepted = validation.payment_method_enabled;
    const applicableCap = validation.effective_fee_cap_cents;
    const underCap = validation.fee_within_limit;
    byId("fee-value").textContent = formatMoney(quote.fee_cents);
    byId("calculation-description").textContent = mode.name + " · " + formatMoney(quote.amount_cents) + " payment · " + (quote.calculation.rate_basis_points / 100).toFixed(2) + "% + " + formatMoney(quote.calculation.fixed_fee_cents);
    const eligibility = byId("eligibility");
    eligibility.textContent = validation.status === "passed" ? "Passes merchant policies" : "Fails merchant policies";
    eligibility.classList.toggle("eligible", validation.status === "passed");
    const reasons = byId("eligibility-reasons");
    reasons.replaceChildren();
    const cap = formatMoney(applicableCap);
    for (const [valid, text] of [[accepted, accepted ? "Payment mode enabled" : "Payment mode disabled"], [underCap, underCap ? "Fee within the " + cap + " cap" : "Fee above the " + cap + " cap"]]) {
      const item = document.createElement("li");
      item.textContent = text;
      item.classList.toggle("fail", !valid);
      reasons.append(item);
    }
    byId("empty-result").hidden = true;
    byId("quote-result").hidden = false;
    setStatus("Quote received");
  } catch (error) {
    if (requestId === quoteRequestId) resetQuote("Check the input or connection", error.message);
    setStatus("Check input / service", "error");
  } finally {
    button.disabled = !catalogue || !policy || loading;
  }
});
loadData();
