#!/usr/bin/env bash
# ==============================================================================
# 🌐 UNO KAWIHE - CONFIGURADOR DE DNS (DuckDNS) & PROXY REVERSO (Caddy SSL)
# ==============================================================================
# Este script configura:
# 1. DuckDNS (atualiza o IP público da VM para o seu domínio uno.grubert.duckdns.org)
# 2. Caddy Server (Proxy Reverso com SSL/HTTPS automático e suporte a WebSockets para a porta 3000)
# ==============================================================================

set -Eeuo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_succ() { echo -e "${GREEN}[SUCC]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_err()  { echo -e "${RED}[ERROR]${NC} $1"; }

# Garantir execução com sudo/root
if [ "$EUID" -ne 0 ]; then
  log_err "Este script precisa ser executado como root (ou via sudo)."
  echo "Exemplo: sudo ./configdns.sh"
  exit 1
fi

clear
echo "===================================================================="
echo "          CONFIGURADOR DE DOMÍNIO & SSL (DuckDNS + Caddy)           "
echo "===================================================================="
echo ""

# Obter IP público atual
PUBLIC_IP=$(curl -s --max-time 5 https://api.ipify.org || curl -s --max-time 5 https://icanhazip.com || echo "")
log_info "IP Público detectado da VM: ${PUBLIC_IP:-Não foi possível detectar automaticamente}"

# Solicitar ou carregar credenciais DuckDNS
echo ""
read -p "Digite o seu subdomínio DuckDNS completo (ex: uno.grubert.duckdns.org ou apenas uno se for grubert): " INPUT_DOMAIN

if [[ -z "$INPUT_DOMAIN" ]]; then
  log_err "Domínio não pode estar vazio."
  exit 1
fi

# Se o usuário digitou apenas o prefixo (ex: uno), completar com .duckdns.org se não tiver ponto
if [[ "$INPUT_DOMAIN" != *"."* ]]; then
  FULL_DOMAIN="${INPUT_DOMAIN}.duckdns.org"
else
  FULL_DOMAIN="$INPUT_DOMAIN"
fi

read -p "Digite o seu TOKEN do DuckDNS (conta grubert.duckdns.org): " DUCKDNS_TOKEN

if [[ -z "$DUCKDNS_TOKEN" ]]; then
  log_err "Token do DuckDNS não pode estar vazio."
  exit 1
fi

echo ""
log_info "Configurando domínio: ${FULL_DOMAIN}"
log_info "Atualizando IP no DuckDNS..."

# Atualizar IP no DuckDNS
# O DuckDNS aceita o parâmetro ip= vazio para autodetectar o IP de origem da requisição
DUCKDNS_SUB=$(echo "$FULL_DOMAIN" | cut -d'.' -f1)
UPDATE_URL="https://www.duckdns.org/update?domains=${DUCKDNS_SUB}&token=${DUCKDNS_TOKEN}&ip="
RESPONSE=$(curl -s "$UPDATE_URL")

if [[ "$RESPONSE" == "OK" ]]; then
  log_succ "DuckDNS atualizado com sucesso para o IP atual!"
else
  log_warn "Resposta do DuckDNS: '$RESPONSE'. Verifique se o token e o domínio estão corretos."
fi

# ==============================================================================
# INSTALAÇÃO E CONFIGURAÇÃO DO CADDY (Proxy Reverso + SSL Automático)
# ==============================================================================
log_info "Verificando/Instalando Caddy Server..."

if ! command -v caddy &> /dev/null; then
  log_info "Instalando dependências para repositório oficial do Caddy..."
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y
  apt-get install -y caddy
  log_succ "Caddy instalado com sucesso."
else
  log_info "Caddy já está instalado."
fi

# Criar configuração do Caddyfile para o domínio do usuário
LOG_DIR="/var/log/caddy"
mkdir -p "$LOG_DIR"

CADDYFILE_PATH="/etc/caddy/Caddyfile"
log_info "Escrevendo configuração do Caddy em $CADDYFILE_PATH..."

cat > "$CADDYFILE_PATH" <<EOF
${FULL_DOMAIN} {
    # Proxy reverso para o Uno KaWiHe na porta 3000
    # Suporta HTTP, HTTPS, WebSockets (WSS) e headers de IP real automaticamente
    reverse_proxy localhost:3000 {
        header_up Host {host}
        header_up X-Real-IP {remote}
        header_up X-Forwarded-For {remote}
        header_up X-Forwarded-Proto {scheme}
    }

    # Logs de acesso e erro
    log {
        output file ${LOG_DIR}/access.log
        format console
    }
}
EOF

# Garantir liberação de portas 80 e 443 no firewall (UFW)
if command -v ufw &> /dev/null && sudo ufw status | grep -q "Status: active"; then
  sudo ufw allow 80/tcp || true
  sudo ufw allow 443/tcp || true
  log_succ "Portas 80 e 443 liberadas no UFW."
fi

# Testar e reiniciar Caddy
log_info "Testando configuração do Caddy..."
caddy validate --config "$CADDYFILE_PATH"

log_info "Reiniciando serviço Caddy..."
systemctl daemon-reload
systemctl enable caddy
systemctl restart caddy

echo ""
echo "===================================================================="
echo "🎉 CONFIGURAÇÃO DE DNS & SSL CONCLUÍDA COM SUCESSO!"
echo "===================================================================="
echo "🌐 Seu jogo agora está seguro e acessível publicamente em:"
echo "   👉 https://${FULL_DOMAIN}"
echo ""
echo "🔒 O Caddy está gerando/renovando o certificado SSL Let's Encrypt"
echo "   e fazendo proxy reverso para http://localhost:3000 (com WebSockets)."
echo "===================================================================="
