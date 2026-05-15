# 🍔 Fredys Burger App

Monorepo full-stack para el sistema de pedidos online de Fredys Burger.

## Stack
- **Frontend**: Next.js 15 · TypeScript · Tailwind CSS · Framer Motion · Zustand
- **Backend**: NestJS · TypeScript · Prisma · PostgreSQL
- **Infra**: Docker · Turborepo · pnpm workspaces

## Estructura
```
fredys-burger-app/
├── apps/
│   ├── web/          # Next.js (puerto 3000)
│   └── api/          # NestJS (puerto 3001)
├── packages/
│   └── types/        # Tipos TypeScript compartidos
└── docker-compose.yml
```

## Cómo levantar

### 1. Requisitos
- Node.js >= 20
- pnpm >= 9
- Docker Desktop

### 2. Levantar la base de datos
```bash
docker compose up -d
```

### 3. Instalar dependencias
```bash
pnpm install
```

### 4. Generar Prisma client
```bash
pnpm db:generate
```

### 5. Crear tablas y cargar datos
```bash
pnpm db:migrate    # Crea las tablas
pnpm db:seed       # Carga categorías, productos y admin
```

### 6. Levantar todo en desarrollo
```bash
pnpm dev
```

## URLs
| Servicio   | URL                         |
|------------|-----------------------------|
| Web        | http://localhost:3000        |
| API        | http://localhost:3001        |
| Swagger    | http://localhost:3001/docs   |
| pgAdmin    | http://localhost:5050        |
| Admin Panel| http://localhost:3000/admin  |

## Credenciales admin
- **Email**: admin@fredysburger.com
- **Password**: fredys2026admin

## Env variables

### apps/api/.env
```
DATABASE_URL="postgresql://fredys:fredys_secret@localhost:5432/fredys_burger"
JWT_SECRET="fredys_jwt_secret_change_in_production_2026"
PORT=3001
```

### apps/web/.env.local
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WA_NUMBER=5493425039876
```
