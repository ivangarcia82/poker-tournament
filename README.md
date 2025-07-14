# 🃏 Poker Tournament Manager

Un sistema completo para gestionar torneos de poker con NextJS, TypeScript y MySQL.

## 🚀 Características

- **Gestión completa de torneos**: Crear, editar y eliminar torneos
- **Gestión de jugadores**: Registrar jugadores, gestionar fichas, add-ons
- **Estructura de blinds**: Configurar niveles de blinds con duración personalizable
- **Cálculo automático de premios**: Sistema inteligente de distribución de premios
- **Cálculo de rake**: Gestión automática de comisiones
- **Estadísticas en tiempo real**: Seguimiento de jugadores, fichas y progreso
- **Autenticación segura**: Sistema de login/registro con JWT
- **Interfaz moderna**: Diseño responsive con Tailwind CSS

## 🛠️ Tecnologías

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Base de datos**: MySQL
- **Autenticación**: JWT, bcryptjs
- **Validación**: Zod, React Hook Form

## 📋 Requisitos Previos

- Node.js 18+ 
- MySQL 8.0+
- npm o yarn

## 🔧 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <tu-repositorio>
   cd poker-tournament
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```
   
   Editar `.env` con tus configuraciones:
   ```env
   # Database
   DATABASE_URL="mysql://usuario:contraseña@localhost:3306/poker_tournament"
   
   # JWT
   JWT_SECRET="tu-super-secreto-jwt-aqui-cambialo-en-produccion"
   
   # Next.js
   NEXTAUTH_SECRET="tu-super-secreto-nextauth-aqui-cambialo-en-produccion"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Configurar la base de datos**
   ```bash
   # Generar el cliente de Prisma
   npx prisma generate
   
   # Ejecutar las migraciones
   npx prisma migrate dev --name init
   ```

5. **Ejecutar el servidor de desarrollo**
   ```bash
   npm run dev
   ```

6. **Abrir en el navegador**
   ```
   http://localhost:3000
   ```

## 🗄️ Estructura de la Base de Datos

### Tablas Principales

- **users**: Usuarios del sistema (organizadores, administradores)
- **tournaments**: Torneos creados
- **players**: Jugadores registrados en torneos
- **blind_structure**: Estructura de blinds por torneo
- **prizes**: Estructura de premios por torneo
- **transactions**: Transacciones (buy-ins, add-ons, premios, rake)

### Relaciones

- Un usuario puede organizar múltiples torneos
- Un torneo tiene múltiples jugadores
- Un torneo tiene una estructura de blinds
- Un torneo tiene una estructura de premios
- Un jugador puede tener múltiples transacciones

## 🎯 Funcionalidades Principales

### Gestión de Torneos

1. **Crear Torneo**
   - Nombre y descripción
   - Buy-in y add-on opcional
   - Porcentaje de rake
   - Límites de jugadores
   - Fecha y hora de inicio
   - Estructura de blinds personalizable

2. **Estructura de Blinds**
   - Múltiples niveles configurables
   - Small blind, big blind y ante
   - Duración por nivel
   - Seguimiento en tiempo real

3. **Estados del Torneo**
   - **REGISTERING**: Registrando jugadores
   - **STARTING**: Iniciando torneo
   - **RUNNING**: En curso
   - **FINISHED**: Finalizado
   - **CANCELLED**: Cancelado

### Gestión de Jugadores

1. **Registro de Jugadores**
   - Nombre obligatorio
   - Email y teléfono opcionales
   - Registro de usuarios existentes

2. **Gestión de Fichas**
   - Asignación de fichas iniciales
   - Edición de fichas durante el torneo
   - Seguimiento de add-ons

3. **Eliminación de Jugadores**
   - Marcar como eliminado
   - Asignar posición final
   - Historial de eliminaciones

### Cálculo de Premios

- **Cálculo automático**: Basado en número de jugadores
- **Estructura estándar**: 1º, 2º, 3º con porcentajes variables
- **Escalabilidad**: Hasta 6 posiciones según participantes
- **Prize pool**: Total disponible después del rake

### Estadísticas y Reportes

- **Estadísticas financieras**: Buy-ins, add-ons, rake, prize pool
- **Estadísticas de jugadores**: Activos, eliminados, promedio de fichas
- **Distribución de fichas**: Ranking en tiempo real
- **Transacciones**: Historial completo de movimientos

## 🔐 Autenticación y Autorización

### Roles de Usuario

- **USER**: Usuario básico, puede ver torneos
- **ORGANIZER**: Puede crear y gestionar torneos
- **ADMIN**: Acceso completo al sistema

### Seguridad

- Contraseñas encriptadas con bcryptjs
- Tokens JWT para sesiones
- Validación de datos con Zod
- Protección CSRF con cookies httpOnly

## 📱 Interfaz de Usuario

### Diseño Responsive

- **Desktop**: Vista completa con todas las funcionalidades
- **Tablet**: Adaptación para pantallas medianas
- **Mobile**: Interfaz optimizada para móviles

### Componentes Principales

- **Dashboard**: Vista general de torneos
- **TournamentDetail**: Detalles completos del torneo
- **PlayerList**: Gestión de jugadores
- **BlindStructure**: Estructura de blinds
- **TournamentStats**: Estadísticas en tiempo real

## 🚀 Despliegue

### Producción

1. **Configurar variables de entorno de producción**
2. **Configurar base de datos de producción**
3. **Ejecutar migraciones**
4. **Build de producción**
   ```bash
   npm run build
   npm start
   ```

### Docker (Opcional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests de integración
npm run test:integration

# Coverage
npm run test:coverage
```

## 📝 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Login de usuario
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Verificar usuario autenticado

### Torneos
- `GET /api/tournaments` - Listar torneos
- `POST /api/tournaments` - Crear torneo
- `GET /api/tournaments/[id]` - Obtener torneo
- `PUT /api/tournaments/[id]` - Actualizar torneo
- `DELETE /api/tournaments/[id]` - Eliminar torneo

### Jugadores
- `GET /api/tournaments/[id]/players` - Listar jugadores
- `POST /api/tournaments/[id]/players` - Agregar jugador
- `PUT /api/tournaments/[id]/players/[playerId]` - Actualizar jugador
- `DELETE /api/tournaments/[id]/players/[playerId]` - Eliminar jugador

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisar la documentación
2. Buscar en issues existentes
3. Crear un nuevo issue con detalles del problema

## 🔄 Roadmap

- [ ] Notificaciones en tiempo real
- [ ] Exportación de reportes PDF
- [ ] Integración con sistemas de pago
- [ ] App móvil nativa
- [ ] Análisis avanzado de estadísticas
- [ ] Sistema de rankings
- [ ] Torneos satélite
- [ ] Integración con redes sociales

---

**¡Disfruta gestionando tus torneos de poker! 🃏**
