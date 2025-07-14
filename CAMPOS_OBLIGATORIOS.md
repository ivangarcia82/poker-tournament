# Campos Obligatorios - Sistema de Torneos de Poker

## 📋 Resumen de Campos Obligatorios

### 🔐 Autenticación

#### Registro de Usuario (`/api/auth/register`)
- **name** * - Nombre completo del usuario
- **email** * - Email único del usuario
- **password** * - Contraseña (mínimo 6 caracteres)

#### Login (`/api/auth/login`)
- **email** * - Email del usuario
- **password** * - Contraseña del usuario

### 🏆 Torneos

#### Crear Torneo (`/api/tournaments`)
- **name** * - Nombre del torneo
- **buyIn** * - Precio de entrada (número positivo)
- **rake** * - Porcentaje de rake (0-100%)
- **maxPlayers** * - Máximo número de jugadores
- **minPlayers** * - Mínimo número de jugadores
- **startTime** * - Fecha y hora de inicio
- **initialStack** * - Fichas iniciales
- **blindStructure** * - Estructura de blinds (mínimo 1 nivel)

#### Estructura de Blinds
- **level** * - Nivel del blind
- **smallBlind** * - Ciega pequeña
- **bigBlind** * - Ciega grande
- **duration** * - Duración en minutos

### 👥 Jugadores

#### Agregar Jugador a Torneo (`/api/tournaments/[id]/players`)
- **name** * - Nombre del jugador
- **email** - Email (opcional, pero debe ser único si se proporciona)
- **phone** - Teléfono (opcional)
- **userId** - ID de usuario (opcional)
- **clubPlayerId** - ID de jugador del club (opcional)

#### Club Players (`/api/club-players`)
- **name** * - Nombre del jugador
- **email** - Email (opcional, pero debe ser único si se proporciona)
- **phone** - Teléfono (opcional)
- **notes** - Notas (opcional)

### 💰 Pagos

#### Registrar Pago (`/api/tournaments/[id]/players/[playerId]/payments`)
- **amount** * - Monto del pago
- **method** * - Método de pago
- **reference** - Referencia (opcional)
- **notes** - Notas (opcional)

### 🎁 Bonos

#### Crear Bono (`/api/tournaments/[id]/bonuses`)
- **name** * - Nombre del bono
- **chips** * - Cantidad de fichas
- **price** * - Precio del bono

### 🏅 Premios

#### Configurar Premios (`/api/tournaments/[id]/prizes`)
- **position** * - Posición del premio
- **percentage** * - Porcentaje del prize pool

## 🎯 Convenciones de UI

### Marcado Visual
- **Campos obligatorios**: Etiqueta con asterisco rojo (*)
- **Campos opcionales**: Etiqueta con texto "(Opcional)" en gris
- **Campos únicos**: Etiqueta con texto "(Debe ser único)" en gris

### Validación
- **Frontend**: Validación en tiempo real con mensajes de error
- **Backend**: Validación con Zod schemas
- **Base de datos**: Constraints de integridad

### Mensajes de Error
- **Campo requerido**: "El [campo] es obligatorio"
- **Email duplicado**: "Ya existe un jugador con este email"
- **Formato inválido**: "Email inválido"
- **Rango inválido**: "El rake debe estar entre 0 y 100"

## 🔧 Implementación

### Componentes de Formulario
- `FormField` - Componente base para campos
- `InputField` - Campo de entrada con validación
- `TextAreaField` - Área de texto con validación
- `SelectField` - Campo de selección con validación

### Validación
- **Zod schemas** para validación de tipos
- **React Hook Form** para manejo de formularios
- **Mensajes de error** consistentes en español

### Base de Datos
- **Constraints únicos** en campos críticos
- **Valores por defecto** para campos opcionales
- **Relaciones** con eliminación en cascada

## 📝 Notas Importantes

1. **Emails únicos**: Los emails deben ser únicos en `User` y `ClubPlayer`
2. **Validación en capas**: Frontend, backend y base de datos
3. **Mensajes claros**: Todos los errores en español
4. **UX consistente**: Asteriscos rojos para campos obligatorios
5. **Feedback inmediato**: Validación en tiempo real 