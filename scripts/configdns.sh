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
  echo "Exemplo: sudo ./scripts/configdns.sh"
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
read -p "Digite o domínio DuckDNS completo (ex: uno.grubert.duckdns.org): " INPUT_DOMAIN

if [[ -z "$INPUT_DOMAIN" ]]; then
  log_err "Domínio não pode estar vazio."
  exit 1
fi

# Se o usuário digitou apenas o prefixo sem ponto, completar com .duckdns.org
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
# Extrair o domínio raiz registrado no DuckDNS (ex: uno.grubert.duckdns.org -> grubert)
STRIPPED_DOMAIN="${FULL_DOMAIN%.duckdns.org}"
DUCKDNS_SUB="${STRIPPED_DOMAIN##*.}"
UPDATE_URL="https://www.duckdns.org/update?domains=${DUCKDNS_SUB}&token=${DUCKDNS_TOKEN}&ip="
RESPONSE=$(curl -s "$UPDATE_URL")

if [[ "$RESPONSE" == "OK" ]]; then
  log_succ "DuckDNS (${DUCKDNS_SUB}.duckdns.org) atualizado com sucesso para o IP atual!"
else
  log_warn "Resposta do DuckDNS: '$RESPONSE'. Verifique se o token e o domínio estão corretos."
fi

# ==============================================================================
# INSTALAÇÃO E CONFIGURAÇÃO DO CADDY (Proxy Reverso + SSL Automático)
# ==============================================================================
log_info "Verificando/Instalando Caddy Server..."

if ! command -v caddy &> /dev/null; then
  log_info "Instalando dependências para repositório oficial do Caddy..."
  apt-get update -y
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl gnupg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y
  apt-get install -y caddy
  log_succ "Caddy instalado com sucesso."
else
  log_info "Caddy já está instalado."
fi

# Criar configuração do Caddyfile para o domínio do usuário
CADDYFILE_PATH="/etc/caddy/Caddyfile"
log_info "Escrevendo configuração do Caddy em $CADDYFILE_PATH..."

cat > "$CADDYFILE_PATH" <<EOF
${FULL_DOMAIN} {
	# Proxy reverso para o Uno KaWiHe na porta 3000
	# Suporta HTTP, HTTPS, WebSockets (WSS) e headers de IP real automaticamente
	reverse_proxy 127.0.0.1:3000
}
EOF

# Garantir liberação de portas 80 e 443 no firewall (UFW ou iptables Oracle Cloud)
if command -v ufw &> /dev/null && ufw status | grep -q "Status: active"; then
  ufw allow 80/tcp || true
  ufw allow 443/tcp || true
  log_succ "Portas 80 e 443 liberadas no UFW."
elif command -v iptables &> /dev/null; then
  for port in 80 443; do
    if ! iptables -C INPUT -p tcp --dport "$port" -j ACCEPT 2>/dev/null; then
      iptables -I INPUT 1 -p tcp --dport "$port" -j ACCEPT || true
    fi
  done
  log_succ "Portas 80 e 443 liberadas no iptables."
fi

# Testar e reiniciar Caddy
log_info "Testando configuração do Caddy..."
caddy fmt --overwrite "$CADDYFILE_PATH"
caddy validate --config "$CADDYFILE_PATH"

log_info "Reiniciando serviço Caddy..."
systemctl daemon-reload
systemctl enable caddy
systemctl restart caddy

sleep 2
if ! systemctl is-active --quiet caddy; then
  log_err "O serviço Caddy falhou ao iniciar! Veja os logs:"
  journalctl -u caddy -n 20 --no-pager || true
  exit 1
fi

echo ""
echo "===================================================================="
echo "🎉 CONFIGURAÇÃO DE DNS & SSL CONCLUÍDA COM SUCESSO!"
echo "===================================================================="
echo "🌐 Seu jogo agora está seguro e acessível publicamente em:"
echo "   👉 https://${FULL_DOMAIN}"
echo ""
echo "🔒 O Caddy está gerando/renovando o certificado SSL Let's Encrypt"
echo "   e fazendo proxy reverso para http://127.0.0.1:3000 (com WebSockets)."
echo "===================================================================="
