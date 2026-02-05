# Guía: Crear APK TWA y Publicar en Play Store

## Requisitos Previos
- ✅ PWA funcionando en HTTPS: https://garloalimentos.com
- ✅ Manifest.json configurado
- ✅ Service Worker activo
- ✅ Íconos en todos los tamaños

---

## PASO 1: Generar el APK con PWABuilder (Método más fácil)

### 1.1 Ir a PWABuilder
1. Abre: https://www.pwabuilder.com/
2. Ingresa tu URL: `https://garloalimentos.com`
3. Clic en **"Start"**

### 1.2 Revisar puntuación
- PWABuilder analizará tu PWA
- Debería mostrar puntuación alta en Manifest, Service Worker y Security

### 1.3 Generar paquete Android
1. Clic en **"Package for stores"**
2. Selecciona **"Android"**
3. Configura las opciones:

```
Package ID: com.garloalimentos.ventasruta
App name: Ventas por Ruta
Short name: VentasRuta
App version: 1.0.0
App version code: 1
Host: garloalimentos.com
Start URL: /
Display mode: Standalone
Status bar color: #2563eb
Splash screen color: #ffffff
```

### 1.4 Opción de firma
Selecciona: **"New signing key"** (PWABuilder generará uno para ti)

### 1.5 Descargar
- Clic en **"Generate"**
- Descarga el archivo ZIP
- Contiene: APK, AAB (Android App Bundle), y el keystore

---

## PASO 2: Obtener el SHA256 Fingerprint

### Opción A: Si PWABuilder generó tu keystore

El ZIP descargado incluye un archivo `signing.keystore`. Para obtener el fingerprint:

```bash
keytool -list -v -keystore signing.keystore -alias my-key-alias
```

Cuando pida contraseña, usa la que PWABuilder te mostró (está en el archivo `signing-key-info.txt` del ZIP).

Copia el **SHA256** que aparece, se ve así:
```
SHA256: AB:CD:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB
```

### Opción B: Si usarás Google Play App Signing (recomendado)

Google Play genera su propia firma. Después de subir tu app:
1. Ve a Google Play Console > Tu app > Setup > App signing
2. Copia el **SHA-256 certificate fingerprint** de "App signing key certificate"

---

## PASO 3: Actualizar assetlinks.json en tu servidor

### 3.1 Conecta a tu servidor AWS
```bash
ssh ubuntu@3.17.236.80
```

### 3.2 Edita el archivo assetlinks.json
```bash
sudo nano /home/ubuntu/app/dist/public/.well-known/assetlinks.json
```

### 3.3 Reemplaza el contenido con tu fingerprint real
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.garloalimentos.ventasruta",
      "sha256_cert_fingerprints": [
        "TU_SHA256_FINGERPRINT_AQUI"
      ]
    }
  }
]
```

### 3.4 Verificar que está accesible
```
https://garloalimentos.com/.well-known/assetlinks.json
```

Debe mostrar el JSON con tu fingerprint.

---

## PASO 4: Crear cuenta de Google Play Developer

### 4.1 Registrarse
1. Ve a: https://play.google.com/console/signup
2. Pago único: **$25 USD**
3. Completa la verificación de identidad

### 4.2 Crear la aplicación
1. Clic en **"Create app"**
2. Nombre: `Ventas por Ruta - Garlo Alimentos`
3. Idioma: Español
4. Tipo: Aplicación
5. Categoría: Negocios o Productividad
6. Gratis

---

## PASO 5: Preparar la ficha de Play Store

### 5.1 Información requerida

**Título:** Ventas por Ruta - Garlo Alimentos

**Descripción corta (80 caracteres):**
```
Sistema de ventas e inventario para vendedores de ruta
```

**Descripción completa (4000 caracteres):**
```
Ventas por Ruta es una aplicación diseñada para vendedores de ruta que necesitan gestionar sus ventas, inventario y clientes de manera eficiente.

CARACTERÍSTICAS PRINCIPALES:

📦 Gestión de Inventario
- Control de stock en tiempo real
- Productos por pieza, kilo o mixto
- Alertas de stock bajo

💰 Registro de Ventas
- Ventas rápidas con carrito intuitivo
- Descuentos por volumen automáticos
- Tickets compartibles por WhatsApp

👥 Gestión de Clientes
- Base de clientes por ruta
- Sistema de créditos y abonos
- Historial de compras

📱 Funciona sin Internet
- Registra ventas offline
- Sincroniza automáticamente al conectarse
- Nunca pierdas una venta

📊 Reportes
- Resumen de ventas diario
- Exportación a Excel
- Historial completo

Desarrollado por Garlo Alimentos para optimizar las ventas de ruta.
```

### 5.2 Recursos gráficos necesarios

| Recurso | Tamaño | Descripción |
|---------|--------|-------------|
| Ícono | 512x512 PNG | Ya tienes: `/icons/icon-512x512.png` |
| Feature graphic | 1024x500 PNG | Imagen promocional |
| Screenshots | Mínimo 2 | Capturas de la app |
| Screenshots tablet | Opcional | Para tablets |

### 5.3 Clasificación de contenido
- Completa el cuestionario de clasificación
- Tu app es "Para todos" (sin contenido objetable)

---

## PASO 6: Subir el AAB a Play Store

### 6.1 Ir a Production
1. En Google Play Console, selecciona tu app
2. Ve a **Release > Production**
3. Clic en **"Create new release"**

### 6.2 Subir el archivo
- Sube el archivo `.aab` (Android App Bundle) del ZIP de PWABuilder
- NO subas el APK, Google prefiere AAB

### 6.3 Notas de la versión
```
Versión 1.0.0
- Lanzamiento inicial
- Gestión de ventas e inventario
- Soporte offline
- Tickets compartibles por WhatsApp
```

### 6.4 Revisar y publicar
1. Clic en **"Review release"**
2. Corrige cualquier error o advertencia
3. Clic en **"Start rollout to Production"**

---

## PASO 7: Esperar revisión

- Google revisa las apps nuevas (1-7 días)
- Recibirás email cuando sea aprobada
- Si hay rechazos, te indicarán qué corregir

---

## Resumen de archivos necesarios

| Archivo | Ubicación | Estado |
|---------|-----------|--------|
| manifest.json | `/manifest.json` | ✅ Listo |
| Service Worker | `/sw.js` | ✅ Listo |
| assetlinks.json | `/.well-known/assetlinks.json` | ⚠️ Actualizar fingerprint |
| Íconos 512x512 | `/icons/icon-512x512.png` | ✅ Listo |
| Íconos maskable | `/icons/maskable/icon-512x512.png` | ✅ Listo |

---

## Comandos útiles

### Verificar assetlinks.json
```bash
curl https://garloalimentos.com/.well-known/assetlinks.json
```

### Probar con la herramienta de Google
https://developers.google.com/digital-asset-links/tools/generator

### Ver fingerprint de un keystore
```bash
keytool -list -v -keystore tu-keystore.jks -alias tu-alias
```

---

## Problemas comunes

### "La app no abre en pantalla completa"
- Verifica que assetlinks.json tenga el fingerprint correcto
- Asegúrate de que esté accesible en `/.well-known/assetlinks.json`

### "Error de verificación de Digital Asset Links"
- El fingerprint no coincide
- El archivo no está en la ruta correcta
- Problemas de caché (espera unos minutos)

### "Rechazo por política de Play Store"
- Revisa que no uses permisos innecesarios
- Asegúrate de tener política de privacidad
