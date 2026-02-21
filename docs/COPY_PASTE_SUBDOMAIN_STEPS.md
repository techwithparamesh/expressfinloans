# Copy-paste: Staff & Admin subdomain setup

Run these on your VPS (SSH as root or with sudo). Do the DNS step in Hostinger first.

---

## STEP 1: DNS in Hostinger (do this in browser)

1. Go to https://hostinger.com and log in.
2. Open **Domains** → click **expressfinloans.com**.
3. Go to **DNS / Nameservers** or **Manage DNS** or **DNS Zone**.
4. Click **Add record** or **Add new record**.
5. Add first record:
   - Type: **A**
   - Name: **staff**
   - Points to / Value: **YOUR_VPS_IP** (get it in Step 2 below)
   - TTL: **300**
   - Save.
6. Add second record:
   - Type: **A**
   - Name: **admin**
   - Points to / Value: **YOUR_VPS_IP** (same as above)
   - TTL: **300**
   - Save.

---

## STEP 2: Get your VPS IP (run on VPS)

Copy-paste this in your SSH terminal:

```bash
curl -4 ifconfig.me
```

Use the printed IP in Step 1 for both **staff** and **admin** A records.

---

## STEP 3: Edit Nginx config (run on VPS)

Open the config file:

```bash
sudo nano /etc/nginx/sites-enabled/expressfinloans.com
```

In the **first** `server { }` block (the one with `listen 443 ssl`), find this line:

```
server_name expressfinloans.com www.expressfinloans.com;
```

Change it to (replace the whole line):

```
server_name expressfinloans.com www.expressfinloans.com staff.expressfinloans.com admin.expressfinloans.com;
```

Then in the **second** `server { }` block (the one with `listen 80`), find:

```
server_name expressfinloans.com www.expressfinloans.com;
```

Change it to the same:

```
server_name expressfinloans.com www.expressfinloans.com staff.expressfinloans.com admin.expressfinloans.com;
```

Save and exit: **Ctrl+O**, **Enter**, **Ctrl+X**.

---

## STEP 4: Test Nginx and reload

```bash
sudo nginx -t
```

If it says "syntax is ok", run:

```bash
sudo systemctl reload nginx
```

---

## STEP 5: Add subdomains to SSL certificate (run on VPS)

```bash
sudo certbot certonly --nginx -d expressfinloans.com -d www.expressfinloans.com -d staff.expressfinloans.com -d admin.expressfinloans.com
```

- Use the option to **expand** or **replace** the existing certificate when asked.
- If it asks for email, enter yours.
- When it finishes, reload Nginx again:

```bash
sudo systemctl reload nginx
```

---

## STEP 6: Go to app folder

```bash
cd ~/expressfinloans
```

---

## STEP 7: Edit .env and add subdomain variables

```bash
nano .env
```

Add these two lines at the end (or update if they exist):

```
STAFF_DOMAIN=staff.expressfinloans.com
VITE_STAFF_HOSTS=staff.expressfinloans.com,admin.expressfinloans.com
```

Save and exit: **Ctrl+O**, **Enter**, **Ctrl+X**.

---

## STEP 8: Rebuild the app (needed for subdomain to show staff portal)

```bash
npm run build
```

---

## STEP 9: Restart the app

```bash
pm2 restart expressfinloans-app
```

(If you use a different PM2 app name, use that instead of `expressfinloans-app`.)

---

## STEP 10: Check that it works

Open in browser:

- https://expressfinloans.com → main website
- https://staff.expressfinloans.com → staff login page
- https://admin.expressfinloans.com → same staff login page
- https://expressfinloans.com/staff → should redirect to https://staff.expressfinloans.com/

---

## Quick reference – all VPS commands in order

```bash
curl -4 ifconfig.me
```

```bash
sudo nano /etc/nginx/sites-enabled/expressfinloans.com
```
(Edit both `server_name` lines as in Step 3, then save.)

```bash
sudo nginx -t
```

```bash
sudo systemctl reload nginx
```

```bash
sudo certbot certonly --nginx -d expressfinloans.com -d www.expressfinloans.com -d staff.expressfinloans.com -d admin.expressfinloans.com
```

```bash
sudo systemctl reload nginx
```

```bash
cd ~/expressfinloans
```

```bash
nano .env
```
(Add STAFF_DOMAIN and VITE_STAFF_HOSTS, then save.)

```bash
npm run build
```

```bash
pm2 restart expressfinloans-app
```
