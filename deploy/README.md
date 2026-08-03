# Deploy bare-metal — Arateki API (Rust + SQLite)

API em **binário estático Rust** (`apps/api-rs`) na `t3.nano`, via `systemd`, sem Docker e sem Node em runtime. O banco é um arquivo SQLite (`/var/lib/arateki/arateki.db`).

O home-server ainda pode rodar a API Node em Docker (`docker-compose.prod.yml`); o caminho de produção na T3 é o binário.

## 1. Pré-requisitos no host

```bash
# Sem Node obrigatório. Só o CLI do sqlite para backup opcional:
sudo pacman -S --noconfirm sqlite   # Arch
# ou: sudo apt-get install -y sqlite3
```

## 2. Usuário e diretórios

```bash
sudo useradd --system --create-home --shell /usr/sbin/nologin arateki || true
sudo mkdir -p /var/lib/arateki /opt/arateki/bin /etc/arateki /var/www/arateki/dist-front
sudo chown -R arateki:arateki /var/lib/arateki /opt/arateki
```

`/var/lib/arateki` guarda o `.db` (+ WAL/SHM). É o único path de escrita na unit (`ReadWritePaths`).

## 3. Variáveis de ambiente

Crie `/etc/arateki/api.env`:

```ini
PORT=3333
HOST=127.0.0.1
SQLITE_PATH=/var/lib/arateki/arateki.db
JWT_SECRET=<gerar-um-segredo-forte>
JWT_EXPIRES_IN=2h
ADMIN_LOGIN=admin
ADMIN_PASSWORD=<senha-inicial-do-admin-min-12-chars>
PUBLIC_SITE_URL=https://arateki.com
```

```bash
sudo chown arateki:arateki /etc/arateki/api.env
sudo chmod 600 /etc/arateki/api.env
```

`HOST=127.0.0.1` mantém a API só atrás do nginx. O bootstrap do admin roda no start se ainda não houver admin.

## 4. Binário

O CI (job `build`) produz `x86_64-unknown-linux-musl` estático e o job `deploy-ec2-t3-nano` instala em:

```text
/opt/arateki/bin/arateki-api
```

Manual:

```bash
# no runner ou máquina de build:
cd apps/api-rs
cargo build --release --target x86_64-unknown-linux-musl
sudo install -m 755 target/x86_64-unknown-linux-musl/release/arateki-api /opt/arateki/bin/arateki-api
```

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
sudo cp deploy/nginx-arateki.conf /etc/nginx/…  # ajuste ao layout do host
# front: root /var/www/arateki/dist-front;
# /api/  → proxy_pass http://127.0.0.1:3333;
```

## 7. Deploy user (CI SSH)

Usuário `deploy` com chave dedicada e sudoers mínimo, por exemplo:

```text
deploy ALL=(root) NOPASSWD: /usr/bin/install, /usr/bin/cp, /usr/bin/systemctl, /usr/bin/mkdir, /bin/mkdir
```

Secrets no environment `production`: `EC2_SSH_KEY`, `EC2_HOST` (e JWT/ADMIN já usados no build).

Disparo: **Actions → Deploy Arateki → Run workflow → `ec2-t3-nano`** (ou `both`).

## 8. Backup

```bash
sudo -u arateki deploy/backup-arateki.sh
```

## Testes locais do binário

```bash
cd apps/api-rs
cargo test
JWT_SECRET=dev ADMIN_PASSWORD=admin-password SQLITE_PATH=:memory: PORT=3333 \
  cargo run --release
curl -s http://127.0.0.1:3333/api/health
```
