# Deploy Instructions for VPS

## Quick Deploy (One Command)

```bash
ssh root@<VPS_IP> 'bash -s' < deploy-vps.sh
```

Then edit the `.env` file on the VPS with your actual Groq API key:
```bash
ssh root@<VPS_IP> "sed -i 's/YOUR_GROQ_API_KEY_HERE/gsk_YOUR_KEY/' /root/Aura/.env"
ssh root@<VPS_IP> "docker compose -C /root/Aura restart api"
```

## Manual Deploy

```bash
# SSH into your VPS
ssh root@<VPS_IP>

# Install Docker (if needed)
curl -fsSL https://get.docker.com | sh
systemctl enable docker && systemctl start docker

# Clone and setup
cd /root
git clone https://github.com/MaitiGodoy/Aura.git
cd Aura

# Create .env with your Groq API key
echo 'GROQ_API_KEY=gsk_YOUR_KEY_HERE' > .env

# Build and start
docker compose up -d --build

# Verify
curl http://localhost:80/health
```

## Access

- Frontend: `http://<VPS_IP>`
- API: `http://<VPS_IP>/api/converse`
- Health: `http://<VPS_IP>/health`

## Characters

| Character | Voice | Personality |
|-----------|-------|-------------|
| AURA | en-US-EmmaNeural | Female, neutral English mentor |
| iCON | pt-BR-AntonioNeural | Male, carioca accent |
| AMOS | pt-BR-FranciscaNeural | Female, mineira accent |

## Troubleshooting

```bash
# Check logs
docker compose logs -f api
docker compose logs -f frontend

# Restart services
docker compose restart api
docker compose restart frontend

# Rebuild
docker compose down && docker compose up -d --build
```
