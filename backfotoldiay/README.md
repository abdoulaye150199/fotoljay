# API Fotol Jay

Application web de vente de produits d'occasion avec authentification JWT.

## Installation

1. Cloner le repository
2. Installer les dépendances : `npm install`
3. Configurer la base de données PostgreSQL et mettre à jour `.env`
4. Exécuter les migrations Prisma : `npx prisma migrate dev`
5. Créer les comptes admin/modérateur : `npm run seed`
6. Démarrer le serveur : `npm run dev`

## Test des endpoints Auth avec Postman

### 1. Inscription (Register) - Pour les vendeurs uniquement

- **Méthode** : POST
- **URL** : `http://localhost:3000/auth/register`
- **Headers** :
  - Content-Type: application/json
- **Body** (raw JSON) :
  ```json
  {
    "email": "vendeur@example.com",
    "password": "motdepasse123"
  }
  ```
- **Note** : Seuls les comptes VENDEUR peuvent être créés via cette endpoint. Les comptes ADMIN et MODERATEUR sont créés via le script de seed (`npm run seed`).
- **Réponse attendue** :
 {
    "message": "User registered successfully",
    "user": {
        "id": "778eeb43-8cf6-491e-a2fd-8eb80bd45a94",
        "email": "vendeur.die@gmail.com",
        "username": null,
        "displayName": null,
        "role": "VENDEUR",
        "isActive": true,
        "createdAt": "2025-10-09T22:40:09.001Z",
        "updatedAt": "2025-10-09T22:40:09.001Z"
    }
}

### 2. Connexion (Login)

- **Méthode** : POST
- **URL** : `http://localhost:3000/auth/login`
- **Headers** :
  - Content-Type: application/json
- **Body** (raw JSON) :
  ```json
  {
    "email": "vendeur.die@gmail.com",
    "password": "password123"
  }
  ```
- **Réponse attendue** :
  ```json
  {
    "message": "Login successful",
    "user": {
      "id": "uuid",
      "email": "vendeur@example.com",
      "role": "VENDEUR",
      "isActive": true,
      "createdAt": "2025-10-09T22:20:19.859Z",
      "updatedAt": "2025-10-09T22:20:19.859Z"
    }
  }
  ```
- **Cookies** : Le token JWT sera automatiquement défini dans les cookies selon le rôle :
  - VENDEUR : `token_vendeur`
  - ADMIN : `token_admin`
  - MODERATEUR : `token_moderateur`

### Notes importantes

- Le token JWT est stocké dans les cookies HTTP-only pour la sécurité, avec un nom spécifique au rôle.
- Pour tester des routes protégées, inclure le cookie approprié dans les requêtes (token_vendeur, token_admin, ou token_moderateur).
- Comptes pré-créés :
  - Admin : admin@fotoljay.com / admin123 (cookie: token_admin)
  - Modérateur : mod@fotoljay.com / mod123 (cookie: token_moderateur)
- Les mots de passe sont hashés avec bcrypt

## Test des endpoints Products avec Postman

### Prérequis
- Avoir un token JWT valide (se connecter via `/auth/login`)
- Inclure le cookie approprié dans les requêtes (token_vendeur, token_admin, ou token_moderateur)

### 1. Créer un produit (POST /products) - VENDEUR uniquement

- **Méthode** : POST
- **URL** : `http://localhost:3000/products`
- **Headers** :
  - Content-Type: application/json
- **Cookies** : token_vendeur (requis)
- **Body** (raw JSON) :
  ```json
  {
    "title": "iPhone 12 Pro",
    "description": "Téléphone en excellent état, 128GB",
    "priceCfa": 500000,
    "photos": [
      {
        "url": "https://example.com/photo1.jpg",
        "filename": "photo1.jpg",
        "mimeType": "image/jpeg",
        "size": 2048000
      }
    ]
  }
  ```
- **Réponse attendue** (201) :
  ```json
  {
    "id": "uuid",
    "title": "iPhone 12 Pro",
    "description": "Téléphone en excellent état, 128GB",
    "priceCfa": 500000,
    "sellerId": "uuid",
    "status": "EN_ATTENTE",
    "isVip": false,
    "photos": [...],
    "createdAt": "2025-10-10T16:27:00.000Z",
    "updatedAt": "2025-10-10T16:27:00.000Z",
    "seller": {...}
  }
  ```

### 2. Lister les produits (GET /products) - Tous

- **Méthode** : GET
- **URL** : `http://localhost:3000/products`
- **Query params** (optionnels) :
  - status=VALIDE
  - isVip=true
  - sellerId=uuid
  - limit=10
  - offset=0
- **Réponse attendue** (200) :
  ```json
  [
    {
      "id": "uuid",
      "title": "iPhone 12 Pro",
      "description": "Téléphone en excellent état",
      "priceCfa": 500000,
      "status": "VALIDE",
      "isVip": false,
      "photos": [...],
      "seller": {...},
      "_count": {
        "views": 5
      }
    }
  ]
  ```

### 3. Voir les détails d'un produit (GET /products/:id) - Tous

- **Méthode** : GET
- **URL** : `http://localhost:3000/products/{productId}`
- **Cookies** : Optionnel (pour compter la vue si connecté)
- **Réponse attendue** (200) :
  ```json
  {
    "id": "uuid",
    "title": "iPhone 12 Pro",
    "description": "Téléphone en excellent état",
    "priceCfa": 500000,
    "status": "VALIDE",
    "isVip": false,
    "photos": [...],
    "seller": {...},
    "views": [...],
    "_count": {
      "views": 6
    }
  }
  ```

### 4. Modifier un produit (PUT /products/:id) - VENDEUR propriétaire uniquement

- **Méthode** : PUT
- **URL** : `http://localhost:3000/products/{productId}`
- **Cookies** : token_vendeur (requis)
- **Body** (raw JSON) :
  ```json
  {
    "title": "iPhone 12 Pro Max",
    "description": "Téléphone en parfait état, 256GB",
    "priceCfa": 600000,
    "photos": [
      {
        "url": "https://example.com/newphoto.jpg",
        "filename": "newphoto.jpg"
      }
    ]
  }
  ```
- **Réponse attendue** (200) : Objet produit mis à jour

### 5. Republier un produit (PATCH /products/:id/republish) - VENDEUR propriétaire

- **Méthode** : PATCH
- **URL** : `http://localhost:3000/products/{productId}/republish`
- **Cookies** : token_vendeur (requis)
- **Body** : Vide
- **Réponse attendue** (200) : Objet produit avec dates mises à jour

### 6. Changer le statut (PATCH /products/:id/status) - MODERATEUR/ADMIN

- **Méthode** : PATCH
- **URL** : `http://localhost:3000/products/{productId}/status`
- **Cookies** : token_admin ou token_moderateur (requis)
- **Body** (raw JSON) :
  ```json
  {
    "status": "VALIDE",
    "reason": "Produit approuvé après vérification"
  }
  ```
- **Réponse attendue** (200) : Objet produit avec statut mis à jour

### 7. Marquer comme VIP (PATCH /products/:id/vip) - ADMIN ou VENDEUR propriétaire

- **Méthode** : PATCH
- **URL** : `http://localhost:3000/products/{productId}/vip`
- **Cookies** : token_admin ou token_vendeur (requis)
- **Body** (raw JSON, optionnel) :
  ```json
  {
    "durationDays": 30
  }
  ```
- **Réponse attendue** (200) : Objet produit avec isVip=true et vipUntil défini

### 8. Supprimer un produit (DELETE /products/:id) - VENDEUR propriétaire ou ADMIN

- **Méthode** : DELETE
- **URL** : `http://localhost:3000/products/{productId}`
- **Cookies** : token_vendeur ou token_admin (requis)
- **Body** : Vide
- **Réponse attendue** (200) :
  ```json
  {
    "message": "Product deleted"
  }
  ```

### Codes d'erreur courants

- **400 Bad Request** : Données invalides ou manquantes
- **401 Unauthorized** : Token manquant ou invalide
- **403 Forbidden** : Permissions insuffisantes
- **404 Not Found** : Produit non trouvé

### Notes

- Les produits en statut EN_ATTENTE peuvent être modifiés par leur propriétaire
- Seuls MODERATEUR et ADMIN peuvent changer le statut des produits
- La suppression marque le produit comme SUPPRIME plutôt que de le supprimer physiquement
- Les vues sont automatiquement comptées lors de l'accès aux détails
- Les produits VIP ont une priorité d'affichage et une durée limitée

## Test des endpoints Photos avec Postman

### Prérequis
- Avoir un token JWT valide (se connecter via `/auth/login`)
- Avoir créé un produit (voir section Products)
- Inclure le cookie approprié dans les requêtes (token_vendeur, token_admin, ou token_moderateur)

### 1. Créer une photo (POST /products/:productId/photos) - VENDEUR propriétaire du produit

- **Méthode** : POST
- **URL** : `http://localhost:3000/products/{productId}/photos`
- **Headers** :
  - Content-Type: application/json
- **Cookies** : token_vendeur (requis)
- **Body** (raw JSON) :
  ```json
  {
    "url": "https://example.com/photo.jpg",
    "filename": "photo.jpg",
    "mimeType": "image/jpeg",
    "size": 2048000,
    "capturedWithCamera": true
  }
  ```
- **Réponse attendue** (201) :
  ```json
  {
    "id": "uuid",
    "productId": "uuid",
    "url": "https://example.com/photo.jpg",
    "filename": "photo.jpg",
    "mimeType": "image/jpeg",
    "size": 2048000,
    "capturedWithCamera": true,
    "createdAt": "2025-10-11T13:00:00.000Z"
  }
  ```

### 2. Lister les photos d'un produit (GET /products/:productId/photos) - Tous

- **Méthode** : GET
- **URL** : `http://localhost:3000/products/{productId}/photos`
- **Cookies** : Optionnel
- **Réponse attendue** (200) :
  ```json
  [
    {
      "id": "uuid",
      "productId": "uuid",
      "url": "https://example.com/photo.jpg",
      "filename": "photo.jpg",
      "mimeType": "image/jpeg",
      "size": 2048000,
      "capturedWithCamera": true,
      "createdAt": "2025-10-11T13:00:00.000Z",
      "_count": {
        "views": 0
      }
    }
  ]
  ```

### 3. Voir les détails d'une photo (GET /photos/:id) - Tous

- **Méthode** : GET
- **URL** : `http://localhost:3000/photos/{photoId}`
- **Cookies** : Optionnel (pour compter la vue si connecté)
- **Réponse attendue** (200) :
  ```json
  {
    "id": "uuid",
    "productId": "uuid",
    "url": "https://example.com/photo.jpg",
    "filename": "photo.jpg",
    "mimeType": "image/jpeg",
    "size": 2048000,
    "capturedWithCamera": true,
    "createdAt": "2025-10-11T13:00:00.000Z",
    "product": {
      "id": "uuid",
      "title": "iPhone 12 Pro",
      "seller": {
        "id": "uuid",
        "displayName": "Vendeur"
      }
    },
    "_count": {
      "views": 1
    }
  }
  ```
- **Note** : Chaque accès à cette endpoint incrémente le compteur de vues.

### 4. Supprimer une photo (DELETE /photos/:id) - VENDEUR propriétaire ou ADMIN

- **Méthode** : DELETE
- **URL** : `http://localhost:3000/photos/{photoId}`
- **Cookies** : token_vendeur ou token_admin (requis)
- **Body** : Vide
- **Réponse attendue** (200) :
  ```json
  {
    "message": "Photo deleted"
  }
  ```

### Codes d'erreur courants

- **400 Bad Request** : Données invalides ou manquantes
- **401 Unauthorized** : Token manquant ou invalide
- **403 Forbidden** : Permissions insuffisantes (pas propriétaire)
- **404 Not Found** : Photo ou produit non trouvé

### Notes

- Les photos sont associées à un produit spécifique
- Seuls les vendeurs peuvent ajouter des photos à leurs propres produits
- Les vues des photos sont comptées séparément des vues des produits
- La suppression d'une photo est définitive

## Système de suivi des vues

### Implémentation des vues

Le système de suivi des vues a été implémenté pour compter les consultations des produits et photos sans nécessiter d'installation de dépendances supplémentaires. Il utilise les fonctionnalités natives de Prisma et PostgreSQL.

#### Tables de vues

- **ProductView** : Enregistre chaque consultation d'un produit
- **PhotoView** : Enregistre chaque consultation d'une photo

#### Champs des tables de vues

```sql
model ProductView {
  id         String   @id @default(uuid())
  productId  String
  product    Product  @relation(fields: [productId], references: [id])
  viewedAt   DateTime @default(now())
  viewerId   String?  // ID de l'utilisateur connecté (null pour visiteurs anonymes)
  viewer     User?    @relation(fields: [viewerId], references: [id])

  @@index([productId, viewedAt])
}

model PhotoView {
  id        String   @id @default(uuid())
  photoId   String
  photo     Photo    @relation(fields: [photoId], references: [id])
  viewedAt  DateTime @default(now())
  viewerId  String?  // ID de l'utilisateur connecté (null pour visiteurs anonymes)
  viewer    User?    @relation(fields: [viewerId], references: [id])

  @@index([photoId, viewedAt])
}
```

#### Déclenchement des vues

Les vues sont automatiquement comptées lors de l'accès aux endpoints suivants :

- **GET /products/:id** : Incrémente le compteur de vues du produit
- **GET /photos/:id** : Incrémente le compteur de vues de la photo

#### Code d'implémentation

Dans `product.service.ts`, la méthode `getProductById` :

```typescript
async getProductById(id: string, viewerId: string | undefined) {
  // ... récupération du produit

  // Incrémenter le compteur de vues
  await prisma.productView.create({
    data: {
      productId: id,
      viewerId: viewerId || null, // null pour visiteurs anonymes
    },
  });

  // ... retourner le produit avec le compte de vues
}
```

#### Comment savoir qui a vu une photo/produit

Pour connaître les utilisateurs qui ont consulté un produit ou une photo :

1. **Via l'API** : Les endpoints retournent le nombre total de vues (`_count.views`)
2. **Via la base de données** : Interroger directement les tables `ProductView` et `PhotoView`

Exemple de requête SQL pour voir qui a vu un produit :

```sql
SELECT pv.viewedAt, u.email, u.displayName
FROM ProductView pv
LEFT JOIN User u ON pv.viewerId = u.id
WHERE pv.productId = 'votre-product-id'
ORDER BY pv.viewedAt DESC;
```

#### Statistiques disponibles

- Nombre total de vues par produit/photo
- Historique des consultations avec timestamps
- Identification des utilisateurs connectés qui ont consulté
- Distinction entre visiteurs connectés et anonymes

#### Avantages de l'implémentation

- **Pas de dépendances externes** : Utilise uniquement Prisma et PostgreSQL
- **Performance** : Requêtes indexées pour un comptage rapide
- **Confidentialité** : Les vues anonymes ne sont pas tracées personnellement
- **Évolutivité** : Facilement extensible pour des statistiques plus poussées

Ce système permet de mesurer l'engagement des utilisateurs et l'intérêt pour les produits sans compromettre la performance de l'application.

## Test des endpoints Notifications avec Postman

### Prérequis
- Avoir un token JWT valide (se connecter via `/auth/login`)
- Inclure le cookie approprié dans les requêtes (token_vendeur, token_admin, ou token_moderateur)

### 1. Récupérer les notifications de l'utilisateur (GET /notifications) - Utilisateur authentifié

- **Méthode** : GET
- **URL** : `http://localhost:3000/notifications`
- **Query params** (optionnels) :
  - limit=10 (défaut: 50)
  - offset=0 (défaut: 0)
- **Cookies** : token_vendeur, token_admin, ou token_moderateur (requis)
- **Réponse attendue** (200) :
  ```json
  [
    {
      "id": "uuid",
      "userId": "uuid",
      "type": "MODERATION_DECISION",
      "title": "Produit approuvé",
      "body": "Votre produit iPhone 12 Pro a été approuvé par notre équipe de modération.",
      "payload": {
        "productId": "uuid",
        "status": "VALIDE"
      },
      "isRead": false,
      "createdAt": "2025-10-12T10:00:00.000Z",
      "sentAt": null
    }
  ]
  ```

### 2. Obtenir le nombre de notifications non lues (GET /notifications/unread-count) - Utilisateur authentifié

- **Méthode** : GET
- **URL** : `http://localhost:3000/notifications/unread-count`
- **Cookies** : token_vendeur, token_admin, ou token_moderateur (requis)
- **Réponse attendue** (200) :
  ```json
  {
    "count": 3
  }
  ```

### 3. Marquer une notification comme lue (PATCH /notifications/:id/read) - Utilisateur authentifié

- **Méthode** : PATCH
- **URL** : `http://localhost:3000/notifications/{notificationId}/read`
- **Cookies** : token_vendeur, token_admin, ou token_moderateur (requis)
- **Body** : Vide
- **Réponse attendue** (200) :
  ```json
  {
    "success": true
  }
  ```

### 4. Marquer toutes les notifications comme lues (PATCH /notifications/mark-all-read) - Utilisateur authentifié

- **Méthode** : PATCH
- **URL** : `http://localhost:3000/notifications/mark-all-read`
- **Cookies** : token_vendeur, token_admin, ou token_moderateur (requis)
- **Body** : Vide
- **Réponse attendue** (200) :
  ```json
  {
    "success": true
  }
  ```

### 5. Supprimer une notification (DELETE /notifications/:id) - Utilisateur authentifié

- **Méthode** : DELETE
- **URL** : `http://localhost:3000/notifications/{notificationId}`
- **Cookies** : token_vendeur, token_admin, ou token_moderateur (requis)
- **Body** : Vide
- **Réponse attendue** (200) :
  ```json
  {
    "success": true
  }
  ```

### Types de notifications

- **REPUBLIER_AVANT_SUPPRESSION** : Rappel pour republier un produit avant sa suppression automatique
- **MODERATION_DECISION** : Décision de modération sur un produit (approuvé/rejeté)
- **GENERIC** : Notification générique

### Codes d'erreur courants

- **400 Bad Request** : ID de notification manquant ou invalide
- **401 Unauthorized** : Token manquant ou invalide
- **403 Forbidden** : Tentative d'accès aux notifications d'un autre utilisateur
- **404 Not Found** : Notification non trouvée

### Notes

- Les utilisateurs ne peuvent voir et gérer que leurs propres notifications
- Les notifications sont automatiquement créées lors d'événements importants (modération, rappels, etc.)
- Le système maintient un historique des notifications pour chaque utilisateur
- Les notifications non lues sont mises en évidence dans l'interface

## Test des endpoints Users avec Postman

### Prérequis
- Avoir un token JWT valide (se connecter via `/auth/login`)
- Inclure le cookie approprié dans les requêtes (token_vendeur, token_admin, ou token_moderateur)

### 1. Obtenir le profil utilisateur (GET /users/profile) - Utilisateur authentifié

- **Méthode** : GET
- **URL** : `http://localhost:3000/users/profile`
- **Cookies** : token_vendeur, token_admin, ou token_moderateur (requis)
- **Réponse attendue** (200) :
  ```json
  {
    "id": "uuid",
    "email": "vendeur@example.com",
    "username": "vendeur123",
    "displayName": "Jean Vendeur",
    "role": "VENDEUR",
    "isActive": true,
    "createdAt": "2025-10-09T22:40:09.001Z",
    "updatedAt": "2025-10-09T22:40:09.001Z",
    "_count": {
      "products": 5,
      "notifications": 12
    }
  }
  ```

### 2. Mettre à jour le profil utilisateur (PUT /users/profile) - Utilisateur authentifié

- **Méthode** : PUT
- **URL** : `http://localhost:3000/users/profile`
- **Headers** :
  - Content-Type: application/json
- **Cookies** : token_vendeur, token_admin, ou token_moderateur (requis)
- **Body** (raw JSON) :
  ```json
  {
    "username": "nouveau_username",
    "displayName": "Nouveau Nom Affiché"
  }
  ```
- **Réponse attendue** (200) : Objet profil mis à jour

### 3. Obtenir les statistiques utilisateur (GET /users/stats) - Utilisateur authentifié

- **Méthode** : GET
- **URL** : `http://localhost:3000/users/stats`
- **Cookies** : token_vendeur, token_admin, ou token_moderateur (requis)
- **Réponse attendue** (200) :
  ```json
  {
    "totalProducts": 5,
    "totalNotifications": 12,
    "unreadNotifications": 3
  }
  ```

### 4. Désactiver le compte utilisateur (PATCH /users/deactivate) - Utilisateur authentifié

- **Méthode** : PATCH
- **URL** : `http://localhost:3000/users/deactivate`
- **Cookies** : token_vendeur, token_admin, ou token_moderateur (requis)
- **Body** : Vide
- **Réponse attendue** (200) :
  ```json
  {
    "id": "uuid",
    "email": "vendeur@example.com",
    "isActive": false
  }
  ```

### 5. Lister tous les utilisateurs (GET /users) - ADMIN uniquement

- **Méthode** : GET
- **URL** : `http://localhost:3000/users`
- **Query params** (optionnels) :
  - role=VENDEUR
  - isActive=true
  - limit=10
  - offset=0
- **Cookies** : token_admin (requis)
- **Réponse attendue** (200) :
  ```json
  [
    {
      "id": "uuid",
      "email": "vendeur@example.com",
      "username": "vendeur123",
      "displayName": "Jean Vendeur",
      "role": "VENDEUR",
      "isActive": true,
      "createdAt": "2025-10-09T22:40:09.001Z",
      "_count": {
        "products": 5,
        "notifications": 12
      }
    }
  ]
  ```

### Codes d'erreur courants

- **400 Bad Request** : Données invalides
- **401 Unauthorized** : Token manquant ou invalide
- **403 Forbidden** : Permissions insuffisantes (route admin pour non-admin)
- **404 Not Found** : Utilisateur non trouvé

### Notes

- Les utilisateurs peuvent modifier leur propre profil (username, displayName)
- Seuls les administrateurs peuvent lister tous les utilisateurs
- La désactivation d'un compte empêche la connexion mais conserve les données
- Les statistiques incluent le nombre de produits et notifications de l'utilisateur

