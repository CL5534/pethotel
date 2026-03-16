# Pethotel Deployment

## 1. EC2 once-only setup

```bash
sudo apt update
sudo apt install -y git nginx rsync openjdk-17-jdk nodejs npm
mkdir -p ~/apps
cd ~/apps
git clone <YOUR_GITHUB_REPO_URL> pethotel
```

## 2. Backend environment

```bash
sudo mkdir -p /etc/pethotel /opt/pethotel /var/www/pethotel
sudo cp ~/pethotel/deploy/env/pethotel.env.example /etc/pethotel/pethotel.env
sudo nano /etc/pethotel/pethotel.env
```

## 3. systemd service

```bash
sudo cp ~/pethotel/deploy/systemd/pethotel.service /etc/systemd/system/pethotel.service
sudo systemctl daemon-reload
sudo systemctl enable pethotel
```

## 4. Nginx setup

```bash
sudo cp ~/pethotel/deploy/nginx/pethotel.conf /etc/nginx/sites-available/pethotel
sudo ln -s /etc/nginx/sites-available/pethotel /etc/nginx/sites-enabled/pethotel
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

Update `server_name` in `/etc/nginx/sites-available/pethotel` to your real domain.

## 5. First manual deploy

```bash
cd ~/pethotel
chmod +x scripts/deploy.sh
bash scripts/deploy.sh
```

## 6. GitHub Actions secrets

Add these repository secrets:

- `EC2_HOST`
- `EC2_USER`
- `EC2_SSH_KEY`
- `EC2_PORT`

## 7. Automatic deploy

Push to `main`. GitHub Actions will SSH into EC2 and run `scripts/deploy.sh`.

## 8. HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.com -d www.example.com
```
