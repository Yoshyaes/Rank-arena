# Deploying Rank Arena on Cloudways (WordPress Integration)

The game runs at `twaveragegamers.com/arena` alongside your WordPress site.

## Architecture

```
WordPress (Apache/Nginx) on Cloudways
├── twaveragegamers.com/*        → WordPress (PHP)
├── twaveragegamers.com/arena/*  → React static files (built by Vite)
└── twaveragegamers.com/arena/api/* → Node.js Express (via reverse proxy)
```

The SQLite database file lives on the server at `~/rankarena/data/rankarena.db`.

---

## Step 1: SSH into your Cloudways server

In Cloudways dashboard → Server → Master Credentials → get your SSH details.

```bash
ssh master_username@your-server-ip
```

## Step 2: Install Node.js

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

## Step 3: Upload the project

From your local machine, push to a Git repo first, then clone on the server:

```bash
# On the server:
cd ~
git clone https://github.com/YOUR_USERNAME/rank-arena.git rankarena
cd rankarena
```

Or use SFTP to upload the project folder.

## Step 4: Install dependencies and build

```bash
cd ~/rankarena
npm install
cd client && npm install && cd ..

# Create .env
cp .env.example .env
nano .env
# Set: RAWG_API_KEY, ADMIN_PASSWORD, NODE_ENV=production, PORT=3001

# Seed database
npm run seed

# Fetch cover art
npm run fetch-covers

# Build the React frontend
npm run build
```

## Step 5: Start the Node.js server with PM2

```bash
cd ~/rankarena
pm2 start server/index.js --name rankarena
pm2 save
pm2 startup   # Follow the instructions it prints to auto-start on reboot
```

Verify it's running:
```bash
curl http://localhost:3001/api/health
# Should return: {"status":"ok","timestamp":"..."}
```

## Step 6: Copy the built frontend to WordPress

```bash
# Find your WordPress public directory (usually something like):
# /home/master/applications/YOUR_APP/public_html/

# Copy the built React app to /arena within WordPress:
cp -r ~/rankarena/dist /home/master/applications/YOUR_APP/public_html/arena
```

## Step 7: Configure Nginx reverse proxy

In Cloudways dashboard → Application → Vhost Configuration, or via SSH edit the Nginx config:

```bash
# Find your Nginx config — usually at:
# /etc/nginx/conf.d/your-app.conf
# or managed through Cloudways dashboard

# Add this inside your server block:
```

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

# Rank Arena frontend — serve static files
location /arena {
    alias /home/master/applications/YOUR_APP/public_html/arena;
    try_files $uri $uri/ /arena/index.html;
}
```

Restart Nginx:
```bash
sudo service nginx reload
```

**Note:** If Cloudways manages Nginx and you can't edit the config directly, you can add custom Nginx directives through the Cloudways dashboard: Application → Application Settings → Nginx Configuration.

## Step 8: Verify

Visit `https://twaveragegamers.com/arena` — you should see the game.

Test the API:
```bash
curl https://twaveragegamers.com/arena/api/health
```

---

## Updating the game

When you push new code:

```bash
cd ~/rankarena
git pull
npm install
cd client && npm install && npm run build && cd ..
cp -r dist /home/master/applications/YOUR_APP/public_html/arena
pm2 restart rankarena
```

## Daily challenge auto-generation

Challenges auto-generate when a user visits and none exists for today. To pre-generate:

```bash
# Via cron (runs at 11:55 PM daily):
crontab -e
# Add: 55 23 * * * cd ~/rankarena && /home/master/.nvm/versions/node/v20.*/bin/node server/lib/challengeGenerator.js
```

Or use the admin API:
```bash
curl -X POST https://twaveragegamers.com/arena/api/admin/challenge \
  -H "Authorization: Basic $(echo -n 'admin:YOUR_ADMIN_PASSWORD' | base64)" \
  -H "Content-Type: application/json" \
  -d '{"challenge_date": "2026-03-26", "stat_category": "metacritic", "auto_generate": true}'
```

## Backup

The entire database is a single file:
```bash
cp ~/rankarena/data/rankarena.db ~/rankarena/data/rankarena.db.backup
```
