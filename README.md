# Fiskeapp

Fiskeapp is a web application for registering, viewing and managing fish catches on an interactive map.

The app lets users add catches with information such as location, fishers name, weight, length, bait, date, species and image. Catches are displayed as map pins and can be searched or filtered by name and year.

The project is built with Node.js, Express, leaflet, EJS, Sequelize and MySQL.

## Features

- Interactive fishing map
- Register fish catches with:
  - Fishers name
  - Weight
  - Length
  - Bait
  - Date
  - Species
  - Image
  - Map coordinates
- User registration and login
- JWT-based authentication
- Admin/user roles
- Admin moderation of unpublished catches
- Edit and delete catches
- Search catches by name and year
- Upload images with Cloudinary
- Site-based routing for different fishing areas, for example:

```txt
/s/kvaestad
```

## Tech Stack

- Node.js
- Express
- EJS
- Sequelize
- MySQL
- JWT
- bcrypt
- Multer
- Cloudinary
- Leaflet
- Leaflet MarkerCluster

## Installation

Clone the repository:

```bash
git clone https://github.com/offlaff/fiskeapp.git
cd fiskeapp
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the root folder:

```env
PORT=3000

DB=your_database_name
DB_USERNAME=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=localhost
DB_PORT=3306

JWT_SECRET=your_jwt_secret
INIT_SECRET=your_private_initialization_secret

ADMIN_NAME=Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password

NORTHEAST_LAT=59.462346
NORTHEAST_LNG=6.40663
SOUTHWEST_LAT=59.451664
SOUTHWEST_LNG=6.360802
CENTER_LAT=59.456599116158394
CENTER_LNG=6.3862352690536195

CLOUDINARY_URL=your_cloudinary_url
```

## Database Setup

Add `kvaestad` to your database:

```sql
INSERT INTO Valds (name, river, site, createdAt, updatedAt)
VALUES ('kvaestad', 'suldalslaagen', 'kvaestad', NOW(), NOW());
```

Add fish species to your database:

````sql
INSERT INTO Species (name, createdAt, updatedAt)
VALUES
('Laks', NOW(), NOW()),
('Fjellørret', NOW(), NOW()),
('Sjøørret', NOW(), NOW());

## Run the Application

Start the application:

```bash
npm start
````

The app will run on:

http://localhost:3000

The root route redirects to:

/s/kvaestad

### Admin user

the app includes an init route that creates an admin user from the environment variables.

## Author

Olav K. Bjerga
