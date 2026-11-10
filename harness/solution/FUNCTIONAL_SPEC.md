# Functional specification

North Star Supply quotes fees and evaluates merchant policy. Currency: EUR. Identifiers: visa, mastercard, wallet, bank_transfer. An HTTP 200 quote means the simulation completed, not that a method is eligible.

| Method | Fee | Merchant cap |
|---|---|---|
| Visa | 0.90% + 80 cents | 1.50% of payment amount |
| Mastercard | 1.40% + 20 cents | 150 cents |
| Wallet | 1.20% + 10 cents | 150 cents |
| Bank transfer | 0.40% + 10 cents | Disabled |

At €100: fees are 170/160/130/50 cents respectively; only Wallet is eligible. At €1,000 Visa costs 980 cents and its cap is 1,500 cents. Percentage caps round down; proportional fees round half up, in integer cents.

Dashboard: list methods/rates, select amount and method, show quote components and the API-owned validation verdict, inspect merchant rules. The simulator may show actual HTTP payload/status without extra requests. No real transaction is executed.
