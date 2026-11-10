# Offline payment API fallback for Colab

Use this only if the presenter’s ngrok/backend URL is unavailable. It is a deterministic **local Python mock** of the fictional North Star Supply API; it makes no HTTP requests, performs no real payment, uses no extra packages and requires no API key.

Paste the code below into Colab as a new cell, run that cell, then skip the live backend connectivity-check cell. It defines the same `api_request(method, path, payload=None)` helper used by the notebook tools, so the supplied Pricing/Policy tools can continue unchanged. Leave the Mistral model/key setup separate; live agent inference can still consume API credits.

These responses are **simulated**. Do not describe them as evidence that the backend or ngrok is reachable. A later task may use the hosted service by restoring the notebook’s provided HTTP `api_request` function.

```python
from urllib.parse import parse_qs, urlsplit

_MOCK_METHODS = {
    "visa": {
        "id": "visa",
        "name": "Visa",
        "display_name": "Visa",
        "brands": ["Visa"],
        "description": "Simulated Visa payment: higher fixed fee, lower percentage.",
        "rate_basis_points": 90,
        "fixed_fee_cents": 80,
    },
    "mastercard": {
        "id": "mastercard",
        "name": "Mastercard",
        "display_name": "Mastercard",
        "brands": ["Mastercard"],
        "description": "Simulated Mastercard payment: lower fixed fee, higher percentage.",
        "rate_basis_points": 140,
        "fixed_fee_cents": 20,
    },
    "wallet": {
        "id": "wallet",
        "name": "Wallet",
        "display_name": "Digital wallet",
        "description": "Simulated digital-wallet payment.",
        "rate_basis_points": 120,
        "fixed_fee_cents": 10,
    },
    "bank_transfer": {
        "id": "bank_transfer",
        "name": "Bank transfer",
        "display_name": "Bank transfer",
        "description": "Available for simulation; disabled by this merchant.",
        "rate_basis_points": 40,
        "fixed_fee_cents": 10,
    },
}

_MOCK_POLICY = {
    "merchant_id": "north-star-supply",
    "merchant_name": "North Star Supply",
    "currency": "EUR",
    "allowed_payment_methods": ["visa", "mastercard", "wallet"],
    "max_fee_cents": 150,
    "note": (
        "Fictional onboard shop on the Odyssey shuttle, bound for North Star. "
        "Prices remain in EUR; no space-specific charges. Bank transfer is not "
        "enabled for this shop. No real payments."
    ),
    "percentage_fee_caps": {"visa": 150},
}


def _mock_amount(value):
    # bool is an int subclass in Python; the service does not accept True/False as cents.
    if isinstance(value, bool) or not isinstance(value, int) or not 1 <= value <= 100_000_000:
        raise ValueError("amount_cents must be an integer from 1 to 100000000.")
    return value


def _mock_policy_for_amount(amount_cents=None):
    policy = dict(_MOCK_POLICY)
    policy["allowed_payment_methods"] = list(_MOCK_POLICY["allowed_payment_methods"])
    policy["percentage_fee_caps"] = dict(_MOCK_POLICY["percentage_fee_caps"])
    if amount_cents is None:
        return policy

    amount_cents = _mock_amount(amount_cents)
    policy["amount_cents"] = amount_cents
    policy["effective_fee_caps"] = {
        method_id: (amount_cents * bps // 10_000
                    if method_id in _MOCK_POLICY["percentage_fee_caps"]
                    else _MOCK_POLICY["max_fee_cents"])
        for method_id in _MOCK_METHODS
        for bps in [_MOCK_POLICY["percentage_fee_caps"].get(method_id, 0)]
    }
    return policy


def api_request(method: str, path: str, payload=None) -> dict:
    """Drop-in offline mock for the North Star Supply JSON API helper."""
    method = method.upper()
    parsed = urlsplit(path)
    route = parsed.path

    if method == "GET" and route == "/health":
        return {"status": "ok", "service": "north-star-supply", "demo": True}

    if method == "GET" and route == "/payment-methods":
        return {
            "currency": "EUR",
            "methods": [dict(item) for item in _MOCK_METHODS.values()],
        }

    if method == "GET" and route == "/merchant-policy":
        values = parse_qs(parsed.query, keep_blank_values=True).get("amount_cents")
        if values is None:
            return _mock_policy_for_amount()
        if len(values) != 1 or not values[0].isdigit():
            raise ValueError("Invalid amount_cents.")
        return _mock_policy_for_amount(int(values[0]))

    if method == "POST" and route == "/quotes":
        if not isinstance(payload, dict):
            raise ValueError("Expected a JSON object containing amount_cents and payment_method.")
        amount_cents = _mock_amount(payload.get("amount_cents"))
        payment_method = payload.get("payment_method")
        if not isinstance(payment_method, str) or not 1 <= len(payment_method) <= 64:
            raise ValueError("Use a non-empty payment_method id of at most 64 characters.")
        if payment_method not in _MOCK_METHODS:
            raise KeyError("Unknown payment method.")

        mode = _MOCK_METHODS[payment_method]
        proportional_cents = (amount_cents * mode["rate_basis_points"] + 5_000) // 10_000
        fee_cents = proportional_cents + mode["fixed_fee_cents"]
        quote = {
            "amount_cents": amount_cents,
            "currency": "EUR",
            "payment_method": payment_method,
            "fee_cents": fee_cents,
            "calculation": {
                "rate_basis_points": mode["rate_basis_points"],
                "fixed_fee_cents": mode["fixed_fee_cents"],
                "proportional_fee_cents": proportional_cents,
            },
        }
        cap = _mock_policy_for_amount(amount_cents)["effective_fee_caps"][payment_method]
        enabled = payment_method in _MOCK_POLICY["allowed_payment_methods"]
        within_limit = fee_cents <= cap
        failures = []
        if not enabled:
            failures.append({
                "code": "PAYMENT_METHOD_DISABLED",
                "message": "This payment method is disabled by the merchant.",
            })
        if not within_limit:
            failures.append({
                "code": "FEE_CAP_EXCEEDED",
                "message": "The quoted fee exceeds the applicable merchant limit.",
            })
        quote["validation"] = {
            "status": "passed" if enabled and within_limit else "failed",
            "payment_method_enabled": enabled,
            "fee_within_limit": within_limit,
            "effective_fee_cap_cents": cap,
            "failures": failures,
        }
        return quote

    raise ValueError(f"Unsupported mock API route: {method} {route}")
```

## Optional offline check

After running the mock cell, this makes only local Python calls:

```python
assert api_request("GET", "/health")["service"] == "north-star-supply"
assert api_request("POST", "/quotes", {
    "amount_cents": 10_000, "payment_method": "mastercard"
})["fee_cents"] == 160
assert api_request("GET", "/merchant-policy?amount_cents=10000")["effective_fee_caps"]["visa"] == 150
print("Local payment API mock is ready. No backend request was sent.")
```

At €100 the simulated quotes are Visa 170¢, Mastercard 160¢, Wallet 130¢ and Bank transfer 50¢. The merchant disables Bank transfer; Mastercard and Visa exceed their €100 caps; Wallet is eligible. At €1,000 the API resolves Visa’s cap to 1,500¢ and its fee is 980¢. Values reproduce the reference fixtures and arithmetic; this is still a local mock, not a live service check.
