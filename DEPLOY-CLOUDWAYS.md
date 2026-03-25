# Deploying Rank Arena on Cloudways (WordPress Integration)

The game runs at `twaveragegamers.com/arena` alongside your WordPress site.

## Architecture

```
WordPress (Apache/Nginx) on Cloudways
├── twaveragegamers.com/*           → WordPress (PHP)
├── twaveragegamers.com/arena/*     → React static files (built by Vite)
└── twaveragegamers.com/arena/api/* → Node.js Express (via reverse proxy)
```

The SQLite database file lives on the server at `~/rankarena/data/rankarena.db`.

---

## Step 1: SSH into your Cloudways server

In Cloudways dashboard → **Server** → **Master Credentials** → copy the SSH details.

```bash
ssh master_username@your-server-ip
```

## Step 2: Install Node.js and PM2

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
npm install -g pm2
```

Verify:
```bash
node --version   # Should show v20.x
pm2 --version    # Should show 5.x
```

## Step 3: Clone the repo

```bash
cd ~
git clone https://github.com/Yoshyaes/Rank-arena.git rankarena
cd rankarena
```

## Step 4: Install dependencies, configure, seed, and build

```bash
cd ~/rankarena

# Install dependencies
npm install
cd client && npm install && cd ..

# Create .env file
cp .env.example .env
nano .env
```

Set these values in `.env`:
```
RAWG_API_KEY=2eade5f4e79a44fb874f9e3a5c3e2811
ADMIN_PASSWORD=pick-a-strong-password-here
NODE_ENV=production
PORT=3001
```

Then seed the database and build the frontend:
```bash
# Create database and insert 61 games + 18 daily challenges
npm run seed

# Fetch cover art from RAWG (takes ~20 seconds)
npm run fetch-covers

# Build the React frontend
npm run build
```

## Step 5: Start the Node.js server with PM2

```bash
cd ~/rankarena
pm2 start server/index.js --name rankarena
pm2 save
pm2 startup   # Follow the printed instructions to enable auto-start on reboot
```

Verify it's running:
```bash
curl http://localhost:3001/api/health
# Should return: {"status":"ok","timestamp":"..."}
```

## Step 6: Copy the built frontend into WordPress

Find your WordPress public directory. On Cloudways it's typically:
```
/home/master/applications/YOUR_APP_NAME/public_html/
```

You can find the exact path in **Cloudways dashboard → Application → Application Details → Application Path**.

Copy the built React app:
```bash
cp -r ~/rankarena/dist /home/master/applications/YOUR_APP_NAME/public_html/arena
```

## Step 7: Configure Nginx reverse proxy

Cloudways uses Nginx. You need two rules: one to proxy API requests to Node.js, and one to serve the React static files.

### Option A: Via Cloudways dashboard (recommended)

Go to **Application → Application Settings → Nginx Configuration**. In the **Custom Nginx Directives** box (inside the `server` context), paste:

```nginx
# Rank Arena API — proxy to Node.js
location /arena/api/ {
    proxy_pass http://127.0.0.1:3001/arena/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_cache_bypass $http_upgrade;
}

# Rank Arena frontend — serve static files with SPA fallback
location /arena {
    alias /home/master/applications/YOUR_APP_NAME/public_html/arena;
    try_files $uri $uri/ /arena/index.html;
}
```

Replace `YOUR_APP_NAME` with your actual Cloudways application folder name, then click **Save**.

### Option B: Via SSH

Edit the Nginx config directly:
```bash
# Config is usually at one of these paths:
# /etc/nginx/conf.d/your-app.conf
# /home/master/applications/YOUR_APP_NAME/conf/nginx/custom/
sudo nano /etc/nginx/conf.d/your-app.conf
```

Add the same `location` blocks from Option A inside the `server { }` block, then reload:
```bash
sudo service nginx reload
```

## Step 8: Verify

Visit your site:
```
https://twaveragegamers.com/arena
```

You should see the Rank Arena home page. Test the API:
```bash
curl https://twaveragegamers.com/arena/api/health
```

If you see `{"status":"ok",...}` — you're live.

---

## Updating the game

When new code is pushed to the repo:

```bash
cd ~/rankarena
git pull
npm install
cd client && npm install && npm run build && cd ..
cp -r dist /home/master/applications/YOUR_APP_NAME/public_html/arena
pm2 restart rankarena
```

## Daily challenge auto-generation

Challenges auto-generate when the first user visits each day. To pre-generate them instead:

### Option 1: Cron job (recommended)

```bash
crontab -e
```

Add this line (runs at 11:55 PM daily):
```
55 23 * * * cd ~/rankarena && /home/master/.nvm/versions/node/v20.*/bin/node -e "require('dotenv').config(); require('./server/lib/challengeGenerator').generateChallenge(new Date(Date.now() + 86400000).toISOString().split('T')[0])"
```

### Option 2: Admin API

```bash
curl -X POST https://twaveragegamers.com/arena/api/admin/challenge \
  -H "Authorization: Basic $(echo -n 'admin:YOUR_ADMIN_PASSWORD' | base64)" \
  -H "Content-Type: application/json" \
  -d '{"challenge_date": "2026-03-26", "stat_category": "metacritic", "auto_generate": true}'
```

## Backup

The entire database is one file. Back it up anytime:
```bash
cp ~/rankarena/data/rankarena.db ~/rankarena/data/rankarena.db.backup
```

## Troubleshooting

**Game loads but API calls fail (network errors):**
- Check that PM2 is running: `pm2 status`
- Check that Nginx config was saved and reloaded
- Verify the proxy works: `curl http://localhost:3001/arena/api/health`

**PM2 process crashes on reboot:**
- Run `pm2 startup` again and follow the exact command it prints
- Then `pm2 save`

**Nginx returns 502 Bad Gateway:**
- The Node.js process isn't running. Check `pm2 logs rankarena` for errors
- Make sure PORT in `.env` matches the proxy_pass port (3001)

**Cover art images not loading:**
- RAWG CDN URLs may change. Re-run: `cd ~/rankarena && npm run fetch-covers`
