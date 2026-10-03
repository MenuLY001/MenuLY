# Addons & Future Features

## Superadmin Features
- Invoices / receipts (PDF) and payment reminders before the trial or subscription ends.
- Coupon / referral codes, which are useful when selling to hotels by relationship.
- Trial-expiring list ("these 3 end this week") with a one-click WhatsApp or email nudge.
- Usage analytics per restaurant: QR scans, menu views, last login, number of menu items.
- Churn and conversion stats: trial → paid rate, signups per week.
- Announcements / broadcast message shown inside restaurant dashboards (maintenance, new features).
- Support tickets or feedback inbox from restaurant owners.
- System health: storage used (images), errors, failed uploads.
- Export to CSV for payments (handy for accounting).
- Role-based admins (support staff who can view but not suspend or see revenue), plus 2FA for your own login.


	Impersonation actions not logged in audit trail	❌ Not fixed
8	SuperAdmin refresh() doesn't handle 403 (expired token — silently fails)	❌ Not fixed
💡 Low-Priority Issues — 2/9 Fixed, 7 Remaining

11	apiFetch doesn't check res.ok — errors pass silently	❌ Not fixed
12	Menu footer shows hardcoded "Open today"	❌ Not fixed — cosmetic
13	No rate limiting on /api/auth/register	❌ Not fixed — needs deploy-time config
14	No Content-Security-Policy header	❌ Not fixed
15	PlansTab uses alert() instead of toast	❌ Not fixed
16	Native confirm() dialogs (not accessible)	❌ Not fixed
17	No middleware.ts for server-side route protection	❌ Not fixed