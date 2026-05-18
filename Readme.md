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
- Guest contact inquiries now submit via AJAX so visitors can send messages without a full page refresh.
- Admin inquiry list automatically refreshes periodically to surface new guest messages without manual reload.

## 🏗️ Architecture

### Backend (Spring Boot)
- **Framework**: Spring Boot with Gradle
- **Database**: H2 (local development) / Railway MySQL / MySQL with Docker Compose
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
└── 📄 build.gradle       # Gradle configuration
```

## 🔧 Setup & Installation

### Prerequisites
- Java 21+
- Gradle wrapper included (`gradlew` / `gradlew.bat`)
- Node.js (optional, for frontend development)

### Backend Setup
1. Clone the repository
2. Navigate to project directory
3. Run with Gradle for local development (H2):
   ```powershell
   $env:SPRING_PROFILES_ACTIVE="local"
   .\gradlew.bat bootRun
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

### Railway Deployment With Railway MySQL

Use the `railway` Spring profile when the HealthDesk backend service and Railway MySQL service are in the same Railway project. The Spring Boot app serves both the backend API and the static frontend pages from the same deployed Railway service.

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
HEALTHDESK_DEMO_USERS_ENABLED=true
HEALTHDESK_DEMO_DOCTOR_PASSWORD=<strong-demo-password>
HEALTHDESK_DEMO_DOCTOR_EMAIL=<real-doctor-otp-email>
HEALTHDESK_DEMO_NURSE_PASSWORD=<strong-demo-password>
HEALTHDESK_DEMO_NURSE_EMAIL=<real-nurse-otp-email>
HEALTHDESK_DEMO_STAFF_PASSWORD=<strong-demo-password>
HEALTHDESK_DEMO_STAFF_EMAIL=<real-staff-otp-email>
MFA_DELIVERY_MODE=emailjs
EMAILJS_SERVICE_ID=<emailjs-service-id>
EMAILJS_TEMPLATE_ID=<emailjs-template-id>
EMAILJS_PUBLIC_KEY=<emailjs-public-key>
EMAILJS_PRIVATE_KEY=<emailjs-private-key-optional>
APP_CORS_ALLOWED_ORIGINS=https://<your-railway-app-domain>
```

Do not also set `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, or `SPRING_DATASOURCE_PASSWORD` when using this profile, because direct datasource variables override the Railway profile.

The repository includes `railway.json`, which deploys with the `Dockerfile` and uses `/hello` as the health check path. After changing variables, redeploy or restart the Railway service so seeded users are updated.

After deployment, open:

```text
https://<your-railway-app-domain>/app/login.html
```

### Local Frontend Access
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

### OTP and Demo Users

All normal users created through the admin UI have MFA enabled. Seeded demo users also require OTP when `HEALTHDESK_DEMO_USERS_ENABLED=true`.

Configure demo users with real inboxes so they can receive OTP messages:

```bash
HEALTHDESK_DEMO_USERS_ENABLED=true
HEALTHDESK_DEMO_DOCTOR_PASSWORD=<strong-demo-password>
HEALTHDESK_DEMO_DOCTOR_EMAIL=doctor@example.com
HEALTHDESK_DEMO_NURSE_PASSWORD=<strong-demo-password>
HEALTHDESK_DEMO_NURSE_EMAIL=nurse@example.com
HEALTHDESK_DEMO_STAFF_PASSWORD=<strong-demo-password>
HEALTHDESK_DEMO_STAFF_EMAIL=staff@example.com
```

If demo emails are left as defaults like `doctor@healthdesk.local`, the login will still ask for OTP, but the user cannot receive it in a real inbox. In console mode or when delivery fails, check the backend logs for the OTP.

For production OTP delivery, use one of:

```bash
MFA_DELIVERY_MODE=emailjs
EMAILJS_SERVICE_ID=<emailjs-service-id>
EMAILJS_TEMPLATE_ID=<emailjs-template-id>
EMAILJS_PUBLIC_KEY=<emailjs-public-key>
EMAILJS_PRIVATE_KEY=<emailjs-private-key-optional>
```

or SMTP:

```bash
MFA_DELIVERY_MODE=email
MAIL_USERNAME=<smtp-email-address>
MAIL_PASSWORD=<smtp-app-password>
```

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

Run tests with Gradle:
```bash
./gradlew test
```

## 📝 Development Notes

- Frontend authentication now uses the backend API; older demo helpers remain only for non-critical seeded UI data.
- Backend provides full REST API
- H2 database for development
- MySQL recommended for production
- CORS configured for frontend integration
- Admin inquiry dashboard polls the backend for new messages so new guest inquiries appear without manual refresh.

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
