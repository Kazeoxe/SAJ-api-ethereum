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
