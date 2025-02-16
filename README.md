
# MediSync Pro - Documentation Technique

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Installation](#installation)
4. [Structure du projet](#structure-du-projet)
5. [Guide du développeur](#guide-du-développeur)
6. [API Reference](#api-reference)
7. [Tests](#tests)
8. [Déploiement](#déploiement)
9. [Maintenance](#maintenance)

## Vue d'ensemble

MediSync Pro est une application de gestion de rendez-vous médicaux conçue pour les professionnels de santé. Elle permet la gestion des patients, des rendez-vous et offre une interface moderne et intuitive.

### Fonctionnalités clés

- Système d'authentification complet
- Gestion des rendez-vous
- Gestion des patients
- Calendrier interactif
- Système de notifications
- Interface responsive

## Architecture

### Stack Technique

**Frontend:**
```
- React 18 avec Vite
- TypeScript
- Zustand (gestion d'état)
- React Query (gestion des données)
- React Router (navigation)
- Tailwind CSS (styles)
- Shadcn/ui (composants UI)
```

**Backend:**
```
- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- JWT (authentification)
- Bcrypt (sécurité)
```

### Diagramme d'architecture
```
Client <-> API Gateway <-> Services Backend <-> Base de données
   ^                            ^
   |                            |
WebSocket <-----------------> Events
```

## Installation

### Prérequis
```bash
Node.js >= 16.0.0
MongoDB >= 5.0
npm >= 8.0.0
```

### Étapes d'installation

1. **Clone du repository**
```bash
git clone [URL_DU_REPO]
cd medisync-pro
```

2. **Installation des dépendances Frontend**
```bash
npm install
```

3. **Installation des dépendances Backend**
```bash
cd appointment-backend
npm install
```

4. **Configuration des variables d'environnement**

Frontend (.env):
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Backend (.env):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/medisync
JWT_SECRET=your_jwt_secret
```

## Structure du projet

### Frontend
```
src/
├── components/              # Composants réutilisables
│   ├── ui/                 # Composants UI de base
│   ├── forms/             # Composants de formulaire
│   └── layout/            # Composants de mise en page
├── hooks/                  # Hooks personnalisés
│   ├── useAuth.ts         # Hook d'authentification
│   └── use-toast.ts       # Hook de notifications
├── pages/                  # Pages de l'application
│   ├── Login.tsx
│   ├── Register.tsx
│   └── [autres pages].tsx
├── services/              # Services API
│   ├── api/
│   │   ├── authService.ts
│   │   ├── appointmentService.ts
│   │   └── clientService.ts
├── types/                 # Types TypeScript
└── utils/                # Utilitaires
```

### Backend
```
src/
├── config/               # Configuration
│   └── database.ts      # Configuration MongoDB
├── controllers/         # Contrôleurs
│   ├── AuthController.ts
│   ├── AppointmentController.ts
│   └── ClientController.ts
├── middleware/          # Middlewares
│   ├── auth.ts         # Authentification
│   └── validation.ts   # Validation
├── models/             # Modèles Mongoose
│   ├── User.ts
│   ├── Appointment.ts
│   └── Client.ts
├── routes/             # Routes API
└── services/          # Services métier
```

## Guide du développeur

### Standards de code

1. **Nommage**
- Composants: PascalCase
- Fonctions: camelCase
- Variables: camelCase
- Types/Interfaces: PascalCase
- Fichiers de composants: PascalCase.tsx

2. **Organisation des imports**
```typescript
// 1. Imports React
import { useState, useEffect } from 'react';
// 2. Imports de bibliothèques
import { useQuery } from '@tanstack/react-query';
// 3. Imports locaux
import { useAuth } from '@/hooks/useAuth';
```

3. **Gestion des états**
```typescript
// Zustand pour l'état global
import { create } from 'zustand';

// React Query pour les données serveur
const { data, isLoading } = useQuery({
  queryKey: ['key'],
  queryFn: fetchData
});
```

### Authentification

L'authentification utilise JWT avec le flux suivant :

1. Login/Register -> Obtention du token
2. Stockage du token (Zustand + localStorage)
3. Utilisation dans les requêtes via le header Authorization

### Gestion des erreurs

```typescript
try {
  // Action
} catch (error) {
  toast({
    title: "Erreur",
    description: error.message,
    variant: "destructive"
  });
}
```

## API Reference

### Endpoints d'authentification

```typescript
POST /api/auth/register
Body: {
  firstName: string
  lastName: string
  email: string
  password: string
}

POST /api/auth/login
Body: {
  email: string
  password: string
}

POST /api/auth/forgot-password
Body: {
  email: string
}

POST /api/auth/reset-password/:token
Body: {
  password: string
}
```

### Endpoints de rendez-vous

```typescript
GET /api/appointments
Query: {
  date?: string
  status?: 'pending' | 'completed' | 'cancelled'
}

POST /api/appointments
Body: {
  clientId: string
  date: string
  time: string
  duration: number
  notes?: string
}
```

### Endpoints clients

```typescript
GET /api/clients
Query: {
  search?: string
  page?: number
  limit?: number
}

POST /api/clients
Body: {
  firstName: string
  lastName: string
  email: string
  phone: string
  notes?: string
}
```

## Tests

### Frontend

```bash
# Tests unitaires
npm run test:unit

# Tests d'intégration
npm run test:integration

# Tests E2E
npm run test:e2e
```

### Backend

```bash
# Tests unitaires
npm run test:unit

# Tests d'intégration
npm run test:integration
```

## Déploiement

### Production Build

```bash
# Frontend
npm run build

# Backend
npm run build
npm run start:prod
```

### Configuration de production

```env
NODE_ENV=production
MONGODB_URI=your_prod_mongodb_uri
JWT_SECRET=your_prod_secret
```

## Maintenance

### Logs et monitoring

- Winston pour les logs
- PM2 pour le monitoring
- Sentry pour le tracking d'erreurs

### Backup

- Sauvegarde quotidienne de la base de données
- Rotation des logs hebdomadaire

### Mises à jour

1. Vérifier les dépendances obsolètes
```bash
npm outdated
```

2. Mettre à jour les dépendances
```bash
npm update
```

3. Tester après chaque mise à jour
```bash
npm run test
```

## Support

Pour obtenir de l'aide :
1. Consulter la documentation
2. Vérifier les issues GitHub
3. Contacter l'équipe de développement

## Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## Licence

Ce projet est sous licence MIT - voir le fichier LICENSE pour plus de détails.
