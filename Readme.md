# HealthDesk - Clinic Patient Record & Appointment System

A comprehensive healthcare management system built with Spring Boot backend and static HTML/CSS/JavaScript frontend, featuring role-based access control for administrators, doctors, nurses, and staff.

## 🚀 Features

### Functional Requirements (FR)
- **FR-1 / FR-15**: Patient medical fields are encrypted at rest, and the app is designed to run over HTTPS/TLS in deployment for encryption in transit.
- **FR-2 / FR-11**: JWT login with OTP-based MFA and role-based access control for Admin, Doctor, Nurse, and Staff.
- **FR-3**: Patient records store medical history, previous diagnoses, allergies, medications, and basic profile data.
- **FR-4 / FR-5**: Doctors and nurses can search, view, and update assigned patient records only.
- **FR-6**: Patient records are archived instead of deleted.
- **FR-7 / FR-8**: Staff can schedule appointments and view appointment lists.
- **FR-9 / FR-10**: Staff can cancel or reschedule appointments with a reason, at least one day before the appointment, and the system prevents double booking.
- **FR-12**: Admin and authorized medical users can view reports based on their role.
- **FR-13 / FR-14**: Frontend screens include confirmation/toast messages and print support for records and summaries.

## 🏗️ Architecture

### Backend (Spring Boot)
- **Framework**: Spring Boot 3.1.5
- **Database**: H2 (local development) / PostgreSQL on Render / MySQL with Docker Compose
- **Security**: JWT authentication with MFA support
- **API**: RESTful endpoints with validation

### Frontend (Static Web)
- **Technology**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Custom CSS with admin theme
- **Storage**: Backend database for system data; localStorage is used only for browser session tokens and limited UI state
- **UI**: Responsive design with role-specific dashboards

## 📁 Project Structure

```
HealthDesk/
├── 📂 src/main/java/com/healthdesk/
│   ├── 📂 config/          # Configuration classes
│   ├── 📂 controller/      # REST controllers
│   ├── 📂 dto/            # Data transfer objects
│   ├── 📂 exception/      # Exception handlers
│   ├── 📂 model/          # JPA entities
│   ├── 📂 repository/     # Data repositories
│   ├── 📂 security/       # Security configuration
│   └── 📂 service/        # Business logic services
│
├── 📂 src/main/resources/
│   ├── 📂 static/app/     # Frontend application
│   │   ├── 📂 css/        # Stylesheets
│   │   ├── 📂 js/         # JavaScript files
│   │   └── 📄 *.html      # Role-specific pages
│   ├── 📂 static/guest/   # Public pages
│   └── 📄 application.properties
│
├── 📂 database/           # Database scripts
│   ├── 📄 schema.sql      # Database schema
│   └── 📄 seed-data.sql   # Initial data
│
└── 📄 pom.xml            # Maven configuration
```

## 🔧 Setup & Installation

### Prerequisites
- Java 21+
- Maven 3.6+
- Node.js (optional, for frontend development)

### Backend Setup
1. Clone the repository
2. Navigate to project directory
3. Run with Maven for local development (H2):
   ```powershell
   $env:SPRING_PROFILES_ACTIVE="local"
   .\mvnw.cmd spring-boot:run
   ```
4. Access H2 console at: http://localhost:8080/api/h2-console
5. Access API at: http://localhost:8080
6. Local trial login:
   - URL: http://localhost:8080/app/login.html
   - Username: `admin`
   - Password: `Admin12345!`
   - OTP: printed in the Spring Boot console when requested

### Docker / MySQL Setup
1. Start services with Docker Compose:
   ```bash
   docker compose up --build
   ```
2. The app uses the `docker` Spring profile and connects to MySQL at `healthdesk-db`.
3. Access the app at: http://localhost:8080

### Railway Backend With Railway MySQL

Use the `railway` Spring profile when the backend service and Railway MySQL service are in the same Railway project.

Set these variables on the backend service:

```bash
SPRING_PROFILES_ACTIVE=railway
MYSQLHOST=${{MySQL.MYSQLHOST}}
MYSQLPORT=${{MySQL.MYSQLPORT}}
MYSQLDATABASE=${{MySQL.MYSQLDATABASE}}
MYSQLUSER=${{MySQL.MYSQLUSER}}
MYSQLPASSWORD=${{MySQL.MYSQLPASSWORD}}
JWT_SECRET=<long-random-secret>
ENCRYPTION_SECRET_KEY=<long-random-secret>
HEALTHDESK_ADMIN_USERNAME=admin
HEALTHDESK_ADMIN_EMAIL=<admin-email>
HEALTHDESK_ADMIN_PASSWORD=<strong-admin-password>
MFA_DELIVERY_MODE=console
APP_CORS_ALLOWED_ORIGINS=https://temporary.vercel.app
```

Do not also set `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, or `SPRING_DATASOURCE_PASSWORD` when using this profile, because direct datasource variables override the Railway profile.

### Frontend Access
- Public pages: http://localhost:8080/guest/
- Login page: http://localhost:8080/app/login.html
- Admin dashboard: http://localhost:8080/app/admin.html
- Doctor dashboard: http://localhost:8080/app/doctor.html
- Nurse dashboard: http://localhost:8080/app/nurse.html
- Staff dashboard: http://localhost:8080/app/staff.html

### Initial Admin Account
Default passwords are not committed. Set these environment variables before running or deploying:

```bash
JWT_SECRET=replace-with-a-long-random-secret
ENCRYPTION_SECRET_KEY=replace-with-a-long-random-encryption-key
HEALTHDESK_ADMIN_USERNAME=admin
HEALTHDESK_ADMIN_EMAIL=admin@example.com
HEALTHDESK_ADMIN_PASSWORD=replace-with-a-strong-password
```

Optional demo role accounts can be seeded only when `HEALTHDESK_DEMO_USERS_ENABLED=true` and the matching demo passwords are supplied.

## Render Deployment

This repository includes `render.yaml` and a Dockerfile for Render.

Recommended Render PostgreSQL environment variables:

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://<host>:<port>/<database>
SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.postgresql.Driver
SPRING_DATASOURCE_USERNAME=<database-user>
SPRING_DATASOURCE_PASSWORD=<database-password>
SPRING_JPA_DATABASE_PLATFORM=org.hibernate.dialect.PostgreSQLDialect
JWT_SECRET=<long-random-secret>
ENCRYPTION_SECRET_KEY=<long-random-secret>
HEALTHDESK_ADMIN_EMAIL=<admin-email>
HEALTHDESK_ADMIN_PASSWORD=<strong-admin-password>
MAIL_USERNAME=<smtp-email-address>
MAIL_PASSWORD=<smtp-app-password>
MFA_DELIVERY_MODE=email
APP_CORS_ALLOWED_ORIGINS=https://<guest-site>.netlify.app,https://<app-site>.netlify.app
```

Use `/hello` as the health check path. After deploy, open `/app/login.html`.

For real OTP email, use `MFA_DELIVERY_MODE=email` and set valid SMTP credentials. Render Free may block SMTP ports such as 587; if email OTP fails after deploy, use an email API provider or a hosting plan/network that allows SMTP.

## Vercel Static Frontend

You can deploy the static frontend to Vercel while keeping the Java backend on a separate host such as Render, Railway, or another Java-friendly provider.

- Use `vercel.json` at the repository root to serve the frontend from:
  - `src/main/resources/static/guest` for the public guest pages
  - `src/main/resources/static/app` for the dashboard pages
- Keep the backend API deployed on a separate service.
- Set `APP_CORS_ALLOWED_ORIGINS` on the backend to allow your Vercel domain, for example:

```bash
APP_CORS_ALLOWED_ORIGINS=https://<your-vercel-domain>.vercel.app
```

Before deploying, update the API base URL in both runtime config files:

```javascript
src/main/resources/static/guest/js/runtime-config.js
src/main/resources/static/app/js/runtime-config.js
```

Example:

```javascript
window.HEALTHDESK_API_BASE_URL = 'https://healthdesk-api.<your-host>.app/api';
```

Then run the Vercel deploy from the repository root:

```bash
vercel --prod
```

## Separate Netlify Frontends

You can host the public guest pages and the dashboard app as two separate Netlify sites while keeping the Spring Boot API on Render, Railway, Koyeb, or another Java backend host.

### Backend API

Deploy the Spring Boot backend first and keep the `/api` routes available. Example backend URL:

```text
https://healthdesk-api.onrender.com
```

Set backend CORS to allow both Netlify sites:

```bash
APP_CORS_ALLOWED_ORIGINS=https://healthdesk-clinic.netlify.app,https://healthdesk-app.netlify.app
```

If the Netlify site names are not final yet, deploy Render first, deploy both Netlify sites, then return to Render and update `APP_CORS_ALLOWED_ORIGINS` with the exact Netlify URLs.

### Guest Site on Netlify

Create a Netlify site from the same GitHub repository:

```text
Base directory: leave blank
Build command: leave blank
Publish directory: src/main/resources/static/guest
```

Before deploying, set the backend API URL in:

```text
src/main/resources/static/guest/js/runtime-config.js
```

Example:

```javascript
window.HEALTHDESK_API_BASE_URL = 'https://healthdesk-api.onrender.com/api';
```

The guest site opens at:

```text
https://healthdesk-clinic.netlify.app/
```

### App Site on Netlify

Create a second Netlify site from the same GitHub repository:

```text
Base directory: leave blank
Build command: leave blank
Publish directory: src/main/resources/static/app
```

Before deploying, set the backend API URL in:

```text
src/main/resources/static/app/js/runtime-config.js
```

Example:

```javascript
window.HEALTHDESK_API_BASE_URL = 'https://healthdesk-api.onrender.com/api';
```

The app opens at:

```text
https://healthdesk-app.netlify.app/
```

The included `_redirects` files keep existing `/guest/...` and `/app/...` links working even when each folder is hosted separately.

## 🔐 Security Features

- JWT-based authentication
- Multi-factor authentication (MFA) support
- Role-based access control
- Password encryption
- OTP verification
- Audit logging

## 📊 Database Schema

### Core Tables
- `users` - System users with roles
- `patients` - Patient information
- `appointments` - Appointment scheduling
- `audit_logs` - System activity tracking
- `refresh_tokens` - JWT refresh tokens

## 🖥️ API Endpoints

### Authentication
- `POST /api/auth/login` - User login and OTP verification. Send `otpCode` in the same request after the MFA challenge.

### Users
- `GET /api/users` - List users (Admin)
- `POST /api/users` - Create user (Admin)
- `PUT /api/users/{id}` - Update user (Admin)
- `DELETE /api/users/{id}` - Delete user (Admin)

### Patients
- `GET /api/patients` - List patients
- `POST /api/patients` - Create patient
- `PUT /api/patients/{id}` - Update patient
- `PUT /api/patients/{id}/archive` - Archive patient record

### Appointments
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/{id}/cancel` - Cancel appointment
- `PUT /api/appointments/{id}/reschedule` - Reschedule appointment

## 🎨 Frontend Features

### Role-Specific Dashboards
- **Admin**: User management, system reports, audit logs
- **Doctor**: Patient records, medical updates, appointment schedule
- **Nurse**: Vital signs tracking, patient monitoring, reports
- **Staff**: Appointment scheduling, patient registration, reports

### UI Components
- Responsive design
- Toast notifications
- Modal dialogs
- Data tables with search/filter
- Charts and statistics
- Print functionality

## 📈 Reporting

### Available Reports
- User activity reports
- Appointment statistics
- Patient demographics
- Vital signs summaries
- Medical records reports

### Export Options
- CSV export for all reports
- Print-friendly layouts
- PDF generation support

## 🧪 Testing

Run tests with Maven:
```bash
./mvnw test
```

## 📝 Development Notes

- Frontend authentication now uses the backend API; older demo helpers remain only for non-critical seeded UI data.
- Backend provides full REST API
- H2 database for development
- MySQL recommended for production
- CORS configured for frontend integration

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support, please contact the development team or create an issue in the repository.
