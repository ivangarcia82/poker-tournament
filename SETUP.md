# 🚀 Configuración Rápida - Poker Tournament Manager

## ⚡ Configuración en 5 minutos

### 1. Configurar Base de Datos MySQL

```bash
# Crear base de datos
mysql -u root -p
CREATE DATABASE poker_tournament;
exit;
```

### 2. Configurar Variables de Entorno

```bash
# Crear archivo .env
cp .env.example .env

# Editar .env con tus credenciales
DATABASE_URL="mysql://root:tu_contraseña@localhost:3306/poker_tournament"
JWT_SECRET="tu-super-secreto-jwt-aqui-cambialo-en-produccion"
NEXTAUTH_SECRET="tu-super-secreto-nextauth-aqui-cambialo-en-produccion"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Configurar Base de Datos

```bash
# Generar cliente de Prisma
npm run db:generate

# Crear tablas
npm run db:push

# Poblar con datos de ejemplo
npm run db:seed
```

### 4. Ejecutar Aplicación

```bash
# Instalar dependencias (si no lo has hecho)
npm install

# Ejecutar en desarrollo
npm run dev
```

### 5. Acceder al Sistema

Abrir http://localhost:3000

**Usuarios de prueba:**
- Admin: `admin@poker.com` / `admin123`
- Organizador: `organizer@poker.com` / `organizer123`

## 🎯 Funcionalidades Disponibles

### Como Administrador
- ✅ Ver todos los torneos
- ✅ Crear nuevos torneos
- ✅ Gestionar jugadores
- ✅ Ver estadísticas completas

### Como Organizador
- ✅ Crear torneos propios
- ✅ Gestionar jugadores en tus torneos
- ✅ Ver estadísticas de tus torneos

## 🛠️ Comandos Útiles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo
npm run build            # Build de producción
npm run start            # Servidor de producción

# Base de datos
npm run db:generate      # Generar cliente Prisma
npm run db:push          # Sincronizar esquema
npm run db:migrate       # Ejecutar migraciones
npm run db:studio        # Abrir Prisma Studio
npm run db:seed          # Poblar con datos de ejemplo
npm run db:reset         # Resetear base de datos

# Utilidades
npm run lint             # Verificar código
```

## 🔧 Solución de Problemas

### Error de conexión a MySQL
```bash
# Verificar que MySQL esté corriendo
sudo service mysql status

# Verificar credenciales en .env
DATABASE_URL="mysql://usuario:contraseña@localhost:3306/poker_tournament"
```

### Error de Prisma
```bash
# Regenerar cliente
npm run db:generate

# Resetear base de datos
npm run db:reset
```

### Error de dependencias
```bash
# Limpiar e instalar
rm -rf node_modules package-lock.json
npm install
```

## 📱 Próximos Pasos

1. **Personalizar**: Modificar colores, logos y branding
2. **Configurar**: Ajustar estructura de premios y blinds
3. **Desplegar**: Configurar para producción
4. **Extender**: Agregar nuevas funcionalidades

## 🆘 Soporte

Si tienes problemas:
1. Verificar que MySQL esté corriendo
2. Verificar credenciales en .env
3. Ejecutar `npm run db:reset` para empezar limpio
4. Revisar logs en la consola

---

**¡Listo para gestionar torneos de poker! 🃏** 