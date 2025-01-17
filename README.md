# Setup du projet

## Base de données

docker compose up -d

## Lancer sajauth (microservice d'authentification Springboot)
### Cela va créer les entitées en base de données

cd sajauth <br>
mvn spring-boot:run

## Lancer le frontend

npm install <br>
npm run start

## Lancer le backend nodejs (microservice de gestion des wallets)

cd sajnest <br>
npm install <br>
npm run start:dev

## Ne pas utiliser la connexion d'HETIC (qui empêche l'envoi de mail)


# Endpoints API Authentication

## Authentification

### POST `/api/v1/auth/register`
Permet de créer un nouveau compte utilisateur. Un email de confirmation sera envoyé à l'adresse fournie.
- Body: `{ email, password }`

### POST `/api/v1/auth/login`
Authentifie un utilisateur et retourne un token JWT d'accès.
- Body: `{ email, password }`
- Rate limit: 5 minutes de timeout après plusieurs échecs

### POST `/api/v1/auth/verify-email`
Valide l'email d'un utilisateur via le token reçu par email.
- Body: `{ token }`

### GET `/api/v1/validate-token`
Vérifie si le token d'authentification est valide.
- Requiert un token Bearer

### GET `/api/v1/auth/refresh-token`
Renouvelle le token d'accès en utilisant le refresh token.
- Requiert un cookie `refreshToken`

### DELETE `/api/v1/logout`
Déconnecte l'utilisateur en révoquant ses tokens.
- Requiert un token Bearer

## Gestion du mot de passe

### POST `/api/v1/auth/forgot-password`
Initie le processus de réinitialisation du mot de passe. Un email avec un lien de réinitialisation sera envoyé.
- Body: `{ email }`

### POST `/api/v1/auth/reset-password`
Réinitialise le mot de passe de l'utilisateur avec le token reçu par email.
- Body: `{ token, password }`

## Sécurité et validation
- Validation des emails via regex
- Politique de mot de passe forte (8 caractères minimum, majuscule, minuscule, chiffre, caractère spécial)
- Protection contre les attaques par force brute avec timeout
- Gestion des tokens JWT avec refresh token
- Confirmation d'email obligatoire

# Endpoints API Wallet Ethereum

## Gestion des Wallets

### GET `/wallet/get_wallet`
Récupère les informations du wallet de l'utilisateur.
- Requiert les données d'authentification
- Retourne les détails du wallet Ethereum associé

### PUT `/wallet/update_wallet`
Met à jour les informations du wallet.
- Requiert les données d'authentification
- Body: données du wallet à mettre à jour

### GET `/wallet/balance-history`
Récupère l'historique des balances du wallet.
- Requiert les données d'authentification
- Retourne l'historique des transactions et des balances

## Sécurité
- Toutes les routes nécessitent une authentification
- Les requêtes sont effectuées via des API dédiées (WalletAPI)
- Communication sécurisée pour les opérations sensibles sur les wallets
