# Deploy bare-metal — Arateki API (SQLite)

Procedimento de instalação da API em uma `t3.nano` (Ubuntu) rodando direto no host
via `systemd`, sem Docker e sem MongoDB. O banco é um arquivo SQLite
(`/var/lib/arateki/arateki.db`), servido pelo `node:sqlite` embutido no Node ≥ 22.5
(produção em Node 26).

## 1. Pré-requisitos no host

```bash
# Node 26 (via nodesource ou nvm) e pnpm via corepack
node --version            # >= 22.5 (alvo: 26)
corepack enable

# SQLite CLI (apenas para o script de backup)
sudo apt-get update && sudo apt-get install -y sqlite3
```

## 2. Usuário e diretórios

```bash
sudo useradd --system --create-home --shell /usr/sbin/nologin arateki
sudo mkdir -p /var/lib/arateki /opt/arateki/api /etc/arateki /var/www/arateki/dist-front
sudo chown -R arateki:arateki /var/lib/arateki /opt/arateki
```

`/var/lib/arateki` guarda o `.db` (mais os arquivos WAL/SHM). É o único caminho com
escrita liberada pela unit (`ReadWritePaths`).

## 3. Variáveis de ambiente

Copie `apps/api/.env.example` para `/etc/arateki/api.env` e ajuste:

```ini
NODE_ENV=production
PORT=3333
HOST=127.0.0.1
SQLITE_PATH=/var/lib/arateki/arateki.db
JWT_SECRET=<gerar-um-segredo-forte>
JWT_EXPIRES_IN=2h
ADMIN_LOGIN=admin
ADMIN_PASSWORD=<senha-inicial-do-admin>
PUBLIC_SITE_URL=https://arateki.com
CORS_ORIGIN=https://arateki.com,https://www.arateki.com
```

`HOST=127.0.0.1` mantém a API acessível só pelo nginx (proxy reverso). O bootstrap do
admin roda no boot da API; troque a senha pelo endpoint `PATCH /users/password` depois.

```bash
sudo chown arateki:arateki /etc/arateki/api.env
sudo chmod 600 /etc/arateki/api.env
```

## 4. Bundle da aplicação

O CI publica `api-bundle.tar.gz` (ver `.github/workflows/main.yml`). Manualmente:

```bash
sudo tar xzf api-bundle.tar.gz -C /opt/arateki
cd /opt/arateki
sudo -u arateki corepack pnpm install --prod --filter @arateki/api --frozen-lockfile
```

O runtime é só `dist/` + dependências de produção (Fastify etc.). `node:sqlite` é nativo
do Node — não há módulo nativo para compilar.

## 5. systemd

```bash
sudo cp deploy/arateki-api.service /etc/systemd/system/arateki-api.service
sudo systemctl daemon-reload
sudo systemctl enable --now arateki-api
sudo systemctl status arateki-api
journalctl -u arateki-api -f
```

## 6. nginx

```bash
sudo cp deploy/nginx-arateki.conf /etc/nginx/sites-available/arateki.conf
sudo ln -sf /etc/nginx/sites-available/arateki.conf /etc/nginx/sites-enabled/arateki.conf
sudo nginx -t && sudo systemctl reload nginx
```

O frontend estático vai para `/var/www/arateki/dist-front` (o CI faz `rsync`). TLS via
`certbot --nginx` é recomendado fora do escopo deste arquivo.

## 7. Backup diário

```bash
sudo cp deploy/backup-arateki.sh /usr/local/bin/backup-arateki.sh
sudo chmod +x /usr/local/bin/backup-arateki.sh

# cron diário às 03:00 (usa .backup do SQLite — consistente mesmo com a API no ar)
echo '0 3 * * * arateki /usr/local/bin/backup-arateki.sh' | sudo tee /etc/cron.d/arateki-backup
```

`sqlite3 .backup` faz cópia consistente sob WAL sem parar a API. A retenção mantém os
últimos 14 arquivos em `/var/backups/arateki`.

## 8. sudoers do deploy SSH-push (CI)

O usuário `deploy` (usado pelo job `deploy-ec2-t3-nano`) precisa de regras restritas em
`/etc/sudoers.d/arateki-deploy`:

```
deploy ALL=(root) NOPASSWD: /bin/rm -rf /opt/arateki/api, \
  /bin/mkdir -p /opt/arateki/api, \
  /bin/tar xzf /tmp/api-bundle.tar.gz -C /opt/arateki, \
  /usr/bin/systemctl restart arateki-api
```

Ajuste os caminhos dos binários conforme a distro (`which rm tar mkdir systemctl`).
