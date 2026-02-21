# Step-by-step: Staff subdomain on Hostinger VPS

Your main site **expressfinloans.com** is already running on the VPS. Follow these steps to add **staff.expressfinloans.com** for the staff portal.

---

## Step 1: Get your VPS IP (if you need it for DNS)

On the VPS, run:

```bash
curl -4 ifconfig.me
```

Note the IP (e.g. `123.45.67.89`). You need it only if you add an **A** record in Step 2.

---

## Step 2: Add DNS record for the subdomain

### Option A: DNS in Hostinger (hPanel)

1. Log in to **Hostinger** → **hPanel**.
2. Open **Domains** → select **expressfinloans.com** (or **Advanced** → **DNS / Nameservers**).
3. Go to **DNS Zone** / **Manage DNS**.
4. **Add record:**
   - **Type:** `A`  
   - **Name:** `staff` (or `staff.expressfinloans.com` if the panel asks for full name)  
   - **Points to / Value:** your VPS IP from Step 1  
   - **TTL:** 300 (or default)  
5. Save.

(Optional) For **admin.expressfinloans.com** as an alias, add another **A** record with Name `admin` and the same IP.

**Option B: CNAME instead of A**

- **Type:** CNAME  
- **Name:** `staff`  
- **Points to:** `expressfinloans.com` (or the main domain Hostinger shows)

Wait 5–15 minutes for DNS to update. Check with:

```bash
ping staff.expressfinloans.com
```

You should see your VPS IP.

---

## Step 3: Web server config (Nginx or Apache)

Your app is likely behind Nginx or Apache. We need the subdomain to hit the **same app** (same port, e.g. 5020).

### If you use **Nginx**

1. SSH into the VPS.
2. Edit the enabled site config:
   ```bash
   sudo nano /etc/nginx/sites-enabled/expressfinloans.com
   ```

3. In the **first** `server { }` block (the one with `listen 443 ssl`), change the `server_name` line to:
   ```nginx
   server_name expressfinloans.com www.expressfinloans.com staff.expressfinloans.com admin.expressfinloans.com;
   ```

4. In the **second** `server { }` block (the one with `listen 80`), change the `server_name` line to the same:
   ```nginx
   server_name expressfinloans.com www.expressfinloans.com staff.expressfinloans.com admin.expressfinloans.com;
   ```
   (And add redirect/conditions for the subdomains if you want them to force HTTPS; otherwise the next step with Certbot will handle it.)

5. Save (Ctrl+O, Enter, Ctrl+X).
6. Test and reload:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

7. **Important:** Extend the SSL certificate to include the subdomain (see Step 4 below).

### If you use **Apache**

1. Open the vhost config:
   ```bash
   sudo nano /etc/apache2/sites-available/expressfinloans.com.conf
   ```
2. Add the subdomain with `ServerAlias`:
   ```apache
   ServerName expressfinloans.com
   ServerAlias www.expressfinloans.com staff.expressfinloans.com admin.expressfinloans.com
   ```
3. Save, then:
   ```bash
   sudo apache2ctl configtest
   sudo systemctl reload apache2
   ```

---

## Step 4: SSL (HTTPS) for the subdomain

The subdomain must use HTTPS. Two common ways:

### Option A: Hostinger SSL in hPanel

1. In **Hostinger** → **Domains** → **expressfinloans.com** → **SSL**.
2. If there is an option to add **staff.expressfinloans.com** to the certificate or to issue a new certificate that includes it, do that.
3. If Hostinger manages Nginx/Apache for you, it may auto-update the certificate; otherwise continue with Option B.

### Option B: Certbot on the VPS (Let’s Encrypt)

1. Install Certbot if needed:
   ```bash
   sudo apt update
   sudo apt install certbot python3-certbot-nginx
   ```
   (Use `python3-certbot-apache` if you use Apache.)

2. Get a certificate that includes the subdomain:
   ```bash
   sudo certbot --nginx -d expressfinloans.com -d www.expressfinloans.com -d staff.expressfinloans.com
   ```
   (Add `-d admin.expressfinloans.com` if you use it.)

3. Follow the prompts. Certbot will update Nginx and set up HTTPS.
4. Test renewal:
   ```bash
   sudo certbot renew --dry-run
   ```

After this, **https://staff.expressfinloans.com** should open (it may show the main site until the app is configured in the next steps).

---

## Step 5: Set env and rebuild the app on the VPS

1. SSH into the VPS and go to the app folder:
   ```bash
   cd ~/expressfinloans
   ```

2. Edit `.env`:
   ```bash
   nano .env
   ```
   Add or update (use your real values if different):
   ```env
   STAFF_DOMAIN=staff.expressfinloans.com
   VITE_STAFF_HOSTS=staff.expressfinloans.com,admin.expressfinloans.com
   ```
   Save (Ctrl+O, Enter, Ctrl+X).

3. **Rebuild** (needed so the frontend knows the staff hosts):
   ```bash
   npm run build
   ```

4. **Restart** the app (example with PM2):
   ```bash
   pm2 restart expressfinloans-app
   ```
   If you use another process manager, restart that instead.

---

## Step 6: Test

1. **Public site:**  
   Open **https://expressfinloans.com** — should show the normal home page.

2. **Staff subdomain:**  
   Open **https://staff.expressfinloans.com** — should show the staff login page (not the main website).

3. **Redirect from main site:**  
   Open **https://expressfinloans.com/staff** — should redirect to **https://staff.expressfinloans.com/**.

4. **Login:**  
   On staff.expressfinloans.com, log in with your admin user (e.g. admin / Admin@123) and change the password from Profile if needed.

---

## Troubleshooting

| Issue | What to check |
|-------|----------------|
| staff.expressfinloans.com shows main site | Nginx/Apache `server_name` includes `staff.expressfinloans.com`, app restarted after adding `VITE_STAFF_HOSTS` and running `npm run build`. |
| SSL error on staff.expressfinloans.com | Certificate includes `staff.expressfinloans.com` (Certbot or Hostinger SSL). |
| 502 Bad Gateway on subdomain | App is running (e.g. `pm2 status`); proxy passes to the correct port (e.g. 5020). |
| “Loading…” forever on staff subdomain | Backend and session/DB are working; check browser console and `pm2 logs`. |

---

## Summary checklist

- [ ] DNS: A or CNAME record for `staff` → VPS IP or main domain  
- [ ] Nginx/Apache: `server_name` includes `staff.expressfinloans.com`  
- [ ] SSL: Certificate covers `staff.expressfinloans.com`  
- [ ] `.env`: `STAFF_DOMAIN` and `VITE_STAFF_HOSTS` set  
- [ ] `npm run build` run after changing `VITE_STAFF_HOSTS`  
- [ ] App restarted (e.g. `pm2 restart expressfinloans-app`)  
- [ ] https://staff.expressfinloans.com shows staff login  
- [ ] https://expressfinloans.com/staff redirects to staff subdomain  
