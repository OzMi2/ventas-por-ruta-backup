# Desplegar desde GitHub a AWS Lightsail

## Paso 1: Conectar al servidor
1. Ve a https://lightsail.aws.amazon.com
2. Haz clic en tu instancia Node.js
3. Haz clic en el botón **"Connect using SSH"** (el icono de terminal naranja)

## Paso 2: Actualizar el servidor
```bash
sudo apt update && sudo apt upgrade -y
```

## Paso 3: Instalar Git (si no está instalado)
```bash
sudo apt install -y git
```

## Paso 4: Clonar el repositorio
```bash
cd ~
rm -rf ventas-api
git clone https://github.com/OzMi2/ventas-por-ruta.git ventas-api
cd ventas-api
```

## Paso 5: Instalar dependencias
```bash
npm install
```

## Paso 6: Crear archivo de variables de entorno
```bash
cat > .env << 'EOF'
DATABASE_URL=postgresql://dbmasteruser:021051OzMi$@ls-4968922fb8e404a128a176ad0f584d881b1672c4.c3gwgoyouroc.us-east-2.rds.amazonaws.com:5432/ventasruta?sslmode=require
JWT_SECRET=Estrella_Novia_2025_Estrella_Compromiso_2026_Boda_2027
NODE_ENV=production
PORT=5000
EOF
```

## Paso 7: Construir la aplicación
```bash
npm run build
```

## Paso 8: Configurar PM2 para producción
```bash
# Detener procesos anteriores si existen
pm2 delete all 2>/dev/null || true

# Iniciar el servidor en producción
pm2 start dist/index.cjs --name ventas-api

# Guardar configuración para que inicie al reiniciar
pm2 save
pm2 startup
```

## Paso 9: Verificar que está corriendo
```bash
pm2 status
pm2 logs ventas-api --lines 20
```

## Paso 10: Probar la API
```bash
curl http://localhost:5000/api/health
```

Debería responder:
```json
{"status":"ok","timestamp":"..."}
```

## Paso 11: Probar desde internet
Desde tu navegador, visita:
```
http://3.17.236.80:5000/api/health
```

---

## Comandos útiles

### Ver logs en tiempo real
```bash
pm2 logs ventas-api
```

### Reiniciar el servidor
```bash
pm2 restart ventas-api
```

### Actualizar código desde GitHub
```bash
cd ~/ventas-api
git pull origin main
npm install
npm run build
pm2 restart ventas-api
```

### Ver estado del servidor
```bash
pm2 status
pm2 monit
```
