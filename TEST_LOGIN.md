# 🧪 PRUEBA DE LOGIN MÓVIL CON AZURE AD

## ✅ Sistema Validado - Funcionando Correctamente

La integración con Azure AD está funcionando al 100%. El sistema:
- ✅ Conecta con Azure AD
- ✅ Valida credenciales correctamente
- ✅ Rechaza contraseñas incorrectas
- ✅ Retorna errores apropiados

---

## 🔐 PROBAR CON POSTMAN O THUNDER CLIENT

### Endpoint:
```
POST http://localhost:5000/api/auth/login-mobile
```

### Headers:
```
Content-Type: application/json
```

### Body (JSON):
```json
{
  "email": "michael.ramirez@ingenierialegal.com.co",
  "password": "TU_CONTRASEÑA_REAL_AQUI"
}
```

### Respuesta Exitosa (200):
```json
{
  "success": true,
  "user": {
    "id": 1,
    "nombre": "Michael Ramirez",
    "email": "michael.ramirez@ingenierialegal.com.co",
    "rol": "Perito",
    "foto": null
  },
  "tokens": {
    "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "microsoft": "eyJ0eXAiOiJKV1QiLCJub25jZSI6Ij...",
    "refresh": "0.AXoA8Nr..."
  },
  "expiresIn": "24h"
}
```

### Respuesta Error (401):
```json
{
  "error": "AuthenticationError",
  "message": "Credenciales inválidas"
}
```

---

## 📱 PROBAR DESDE LA APP MÓVIL

1. Iniciar backend:
```bash
cd backend
npm start
```

2. Iniciar app móvil:
```bash
cd perito-app
npm start
```

3. En el login:
   - Email: `michael.ramirez@ingenierialegal.com.co`
   - Contraseña: Tu contraseña real de Microsoft

---

## 🔑 CONFIGURACIÓN DE AZURE AD (Ya está hecha)

✅ Resource Owner Password Credentials (ROPC) habilitado
✅ Cliente público permitido
✅ Permisos de Microsoft Graph configurados

---

## 🚀 SIGUIENTE PASO PARA MVP

Ahora que la autenticación funciona, los siguientes pasos son:

1. **Ajustar endpoint de casos** - Que todos los peritos vean todos los casos
2. **Ajustar SyncService** - Usar token de Microsoft para subir a OneDrive
3. **Completar formulario** - Agregar campos del Excel de avalúos

---

## ⚠️ IMPORTANTE - SEGURIDAD

- ❌ NO subir este archivo a Git (ya está en .gitignore)
- ❌ NO compartir las credenciales
- ✅ Usar solo en ambiente de desarrollo/pruebas
- ✅ En producción considerar usar OAuth2 completo (más seguro)
