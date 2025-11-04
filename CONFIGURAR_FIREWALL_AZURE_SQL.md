# 🔥 Configurar Firewall de Azure SQL

## ⚠️ Problema Actual

```
❌ Error: Cannot open server 'perito-db-server' requested by the login.
Client with IP address '191.95.49.70' is not allowed to access the server.
```

## 🎯 Solución: Agregar tu IP al Firewall

### Tu IP Pública que necesita acceso:
```
191.95.49.70
```

---

## 📋 Pasos Detallados

### Opción 1: Desde Azure Portal (Recomendado)

#### 1. Acceder a Azure Portal
1. Ve a https://portal.azure.com
2. Inicia sesión con: `michael.ramirez@ingenierialegal.com`
3. Contraseña: `3123144098mM`

#### 2. Buscar el Servidor SQL
1. En el buscador superior, escribe: **"SQL servers"**
2. Click en **"SQL servers"**
3. Busca y selecciona: **`perito-db-server`**

#### 3. Configurar Firewall
1. En el menú lateral izquierdo, busca **"Networking"** (Redes)
2. En la sección **"Firewall rules"**, click en **"+ Add a firewall rule"**
3. Llena el formulario:
   - **Rule name:** `IP-Michael-Local`
   - **Start IP:** `191.95.49.70`
   - **End IP:** `191.95.49.70`
4. Click en **"Save"** (arriba)

#### 4. Habilitar Servicios de Azure (Opcional pero Recomendado)
1. En la misma página, busca:
   - ☑️ **"Allow Azure services and resources to access this server"**
2. Marca esta opción
3. Click en **"Save"**

#### 5. Esperar y Verificar
- Espera **1-2 minutos** para que el cambio se aplique
- Reinicia el backend
- Debería conectar exitosamente

---

### Opción 2: Agregar Rango de IPs (Si tu IP cambia frecuentemente)

Si tu IP cambia con frecuencia, puedes agregar un rango:

```
Rule name: IP-Michael-Rango
Start IP:  191.95.0.0
End IP:    191.95.255.255
```

**⚠️ Advertencia:** Esto es menos seguro, úsalo solo si tu IP cambia constantemente.

---

### Opción 3: Desde Azure CLI (Avanzado)

Si prefieres usar comandos:

```bash
# Instalar Azure CLI si no lo tienes
# https://docs.microsoft.com/en-us/cli/azure/install-azure-cli

# Login
az login

# Agregar regla de firewall
az sql server firewall-rule create \
  --resource-group perito-app-rg \
  --server perito-db-server \
  --name IP-Michael-Local \
  --start-ip-address 191.95.49.70 \
  --end-ip-address 191.95.49.70

# Verificar reglas
az sql server firewall-rule list \
  --resource-group perito-app-rg \
  --server perito-db-server
```

---

## ✅ Verificar que Funcionó

### 1. Reiniciar el Backend

Después de configurar el firewall:

```bash
# Detener el backend actual (Ctrl+C en la terminal)
# O en PowerShell:
taskkill //F //IM node.exe

# Iniciar de nuevo
cd backend
npm start
```

### 2. Verificar Logs

Deberías ver:
```
✅ Conectado a Azure SQL Database
```

En lugar de:
```
❌ Error conectando a SQL: Cannot open server...
```

### 3. Probar Crear Caso

1. Ve a: http://localhost:5000/web/crear-caso-simple.html
2. Llena el formulario:
   - Código: `CASO_2025_001`
   - Dirección: `Calle 100 #50-20`
   - Ciudad: `Bogotá`
3. Click en "Crear Caso"
4. Deberías ver: **✅ Caso Creado Exitosamente**

---

## 🔍 Troubleshooting

### Error persiste después de agregar IP

**Causas posibles:**
1. La regla aún no se ha aplicado (espera 5 minutos)
2. Tu IP cambió (verifica tu IP actual)
3. Nombre del servidor incorrecto
4. Credenciales incorrectas

**Verificar IP actual:**
```bash
# Opción 1: Desde navegador
# Ir a: https://www.whatismyip.com/

# Opción 2: PowerShell
curl ifconfig.me

# Opción 3: CMD
curl https://api.ipify.org
```

### Cambió tu IP

Si tu IP cambia con frecuencia:

1. Configura un **rango de IPs** (ver Opción 2 arriba)
2. O usa **Azure Bastion** / **VPN** para IP estática
3. O habilita **"Allow Azure services"** si despliegas en Azure

### No puedes acceder a Azure Portal

Si no tienes permisos de administrador:

1. Pide al administrador de Azure que agregue tu IP
2. O pide que te den rol de **"SQL Server Contributor"**

---

## 📊 Configuración Actual

### Servidor SQL
- **Nombre:** `perito-db-server.database.windows.net`
- **Base de datos:** `PeritoAppDB`
- **Usuario:** `sqladmin`
- **Puerto:** `1433`

### IPs que necesitan acceso
- **Tu IP actual:** `191.95.49.70`
- **Servicios Azure:** ✅ (recomendado habilitar)

---

## 🎯 Resumen de Pasos

1. ✅ **Azure Portal** → **SQL servers** → **perito-db-server**
2. ✅ **Networking** → **+ Add firewall rule**
3. ✅ **IP:** `191.95.49.70` a `191.95.49.70`
4. ✅ **Save** y esperar 1-2 minutos
5. ✅ **Reiniciar backend**
6. ✅ **Probar crear caso**

---

**Una vez configurado el firewall, vuelve y me dices para continuar con la creación de carpetas en OneDrive! 🚀**
