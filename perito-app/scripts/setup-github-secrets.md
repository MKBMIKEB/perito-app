# 🔐 Configuración de GitHub Secrets

## 📋 Secrets necesarios para CI/CD

Para que el workflow de GitHub Actions funcione correctamente, necesitas configurar estos secrets:

### 1. 🎯 En GitHub Repository

Ir a: `Settings` > `Secrets and variables` > `Actions` > `New repository secret`

### 2. 📝 Secrets requeridos:

| Secret Name | Descripción | Cómo obtenerlo |
|-------------|-------------|----------------|
| `EXPO_TOKEN` | Token de autenticación de Expo | `eas auth:tokens:create` después de `eas login` |
| `FIREBASE_APP_ID` | ID de la app en Firebase App Distribution | Firebase Console > Project Settings > Your Apps |
| `FIREBASE_SERVICE_ACCOUNT` | JSON del service account de Firebase | Google Cloud Console > Service Accounts |

### 3. 🔧 Pasos detallados:

#### A. Obtener EXPO_TOKEN:
```bash
# 1. Autenticarse
eas login

# 2. Crear token
eas auth:tokens:create

# 3. Copiar el token generado
```

#### B. Obtener FIREBASE_APP_ID:
```
ID ya configurado: 1:273873873725:android:32d55788c3cc7293733354
```

#### C. Crear Service Account de Firebase:
1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Seleccionar proyecto: `savia-424d0`
3. **IAM & Admin** > **Service Accounts**
4. **Create Service Account**:
   - Name: `firebase-app-distribution`
   - Description: `Service account for CI/CD Firebase App Distribution`
5. **Grant access**:
   - Role: `Firebase App Distribution Admin`
   - Role: `Firebase Admin SDK Administrator Service Agent` (opcional)
6. **Create key**:
   - Key type: `JSON`
   - Descargar el archivo JSON

#### D. Configurar el JSON en GitHub:
```bash
# El contenido completo del archivo JSON descargado va en el secret
# Ejemplo:
{
  "type": "service_account",
  "project_id": "savia-424d0",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-app-distribution@savia-424d0.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

### 4. ✅ Verificación:

Una vez configurados todos los secrets, el workflow se ejecutará automáticamente cuando:
- Se haga push a `main` o `develop`
- Se abra un PR hacia `main`

### 5. 🔍 Troubleshooting:

**Error común:** "Invalid service account"
- Verificar que el JSON esté completo
- Confirmar que el service account tiene los roles correctos

**Error común:** "Invalid Expo token"
- El token puede haber expirado
- Generar nuevo token con `eas auth:tokens:create`

### 6. 🚀 Testing:

Para probar la configuración:
```bash
# Crear branch de prueba
git checkout -b test-ci-cd

# Hacer cambio menor
echo "# Test" >> README.md

# Commit y push
git add .
git commit -m "test: CI/CD pipeline"
git push origin test-ci-cd

# Crear PR en GitHub y verificar que el workflow se ejecute
```