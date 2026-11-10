# North Star Supply — short functional brief

The onboard shop needs a small payment-method dashboard and API simulator. Show methods, quote a fee for a EUR amount and display the merchant's eligibility verdict. Use the supplied fixtures and OpenAPI contract; the backend owns every calculation.

- Node/Express API with a plain HTML/CSS/JavaScript frontend served together.
- Integer cents; percentage rates in basis points; proportional fees rounded half up.
- Pricing and eligibility are separate. HTTP 200 can carry validation.status=failed.
- Bank transfer must be quotable even though the merchant disables it.
- Visa's cap is amount-dependent; the other methods use the fixed merchant cap.
- Synthetic/stateless data only. No database, real payments, user accounts or backend LLM.

The supplied design reference is a screenshot of the reference application, not proof of a freshly generated build. Keep scope small and obtain approval before execution.
