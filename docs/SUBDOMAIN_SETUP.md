# Subdomain setup: staff.expressfinloans.com

- **expressfinloans.com** → Public website (end users)
- **staff.expressfinloans.com** → Staff portal (admins and employees; one login, role-based views)
- **admin.expressfinloans.com** → Same as staff portal (optional alias)

## 1. DNS

Add an **A** or **CNAME** record for the staff subdomain pointing to the same server as the main site:

| Type  | Name  | Value                 | TTL |
|-------|-------|-----------------------|-----|
| A     | staff | YOUR_SERVER_IP        | 300 |
| CNAME | staff | expressfinloans.com   | 300 |

(Optional) For **admin.expressfinloans.com** as an alias:

| Type  | Name  | Value                 | TTL |
|-------|-------|-----------------------|-----|
| A     | admin | YOUR_SERVER_IP        | 300 |

## 2. SSL (HTTPS)

Your server must serve HTTPS for the subdomain. Examples:

- **Let’s Encrypt (Certbot):**  
  `sudo certbot certonly --nginx -d expressfinloans.com -d staff.expressfinloans.com -d admin.expressfinloans.com`  
  (or use your web server’s plugin for certbot.)

- **Nginx:** In the server block for `expressfinloans.com`, add `server_name staff.expressfinloans.com admin.expressfinloans.com;` (or a separate server block that points to the same app).

- **Apache:** Add a `ServerAlias staff.expressfinloans.com admin.expressfinloans.com` (or equivalent) so the same vhost handles the subdomains.

Reload the web server after changing config. Ensure the app is reached for both the main domain and the subdomains (same port/proxy).

## 3. Environment variables

In `.env` (and in the environment used for `npm run build`):

```env
STAFF_DOMAIN=staff.expressfinloans.com
VITE_STAFF_HOSTS=staff.expressfinloans.com,admin.expressfinloans.com
```

- **STAFF_DOMAIN** – Used by the server to redirect main-domain `/staff` and `/admin` to the staff subdomain.
- **VITE_STAFF_HOSTS** – Used at **build time** so the frontend knows which hostnames should show the staff app. Rebuild after changing: `npm run build`.

## 4. Build and deploy

1. Set `VITE_STAFF_HOSTS` (and optionally `STAFF_DOMAIN`) in the environment used for build.
2. Run `npm run build`.
3. Deploy the built app and restart (e.g. `pm2 restart expressfinloans-app`).
4. Ensure the reverse proxy (Nginx/Apache) forwards both `expressfinloans.com` and `staff.expressfinloans.com` (and `admin.expressfinloans.com` if used) to the same Node app.

## 5. Behaviour

- **expressfinloans.com** – Serves the public site. Visiting `/staff` or `/admin` redirects to `https://staff.expressfinloans.com/` (or `/login` etc.).
- **staff.expressfinloans.com** – Serves only the staff portal (login, dashboard, my-leads, etc.). Paths are at root: `/`, `/login`, `/dashboard`, `/profile`, etc.
- **admin.expressfinloans.com** – Same as staff; both admins and employees use it; role decides the menu (admin vs employee).

No need to use `/admin` vs `/staff` paths; everyone uses the same staff subdomain.
