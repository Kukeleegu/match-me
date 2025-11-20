# Complete PostgreSQL Installation Guide for Windows

## Prerequisites
- Windows 10/11 system
- Administrator privileges
- Internet connection

## Step 1: Install PostgreSQL

### Download PostgreSQL
1. Go to https://www.postgresql.org/download/windows/
2. Click "Download the installer"
3. Download the latest version for your system (x86-64 for 64-bit Windows)

### Run the PostgreSQL Installer
1. Run the downloaded `.exe` file as Administrator
2. Follow the installation wizard:
   - **Installation Directory**: Use default `C:\Program Files\PostgreSQL\16`
   - **Select Components**: Keep all selected (PostgreSQL Server, pgAdmin 4, Stack Builder, Command Line Tools)
   - **Data Directory**: Use default `C:\Program Files\PostgreSQL\16\data`
   - **Password**: Set a strong password for the `postgres` superuser (remember this!)
   - **Port**: Use default `5432`
   - **Advanced Options**: Use default locale
3. Click "Next" through the installation
4. Uncheck "Launch Stack Builder" at the end and click "Finish"

### Verify Installation
1. Open **Command Prompt** as Administrator
2. Add PostgreSQL to your PATH (if not already done):
   ```cmd
   setx PATH "%PATH%;C:\Program Files\PostgreSQL\16\bin"
   ```
3. Open a new Command Prompt and test:
   ```cmd
   psql --version
   ```

## Step 2: Initial PostgreSQL Setup

### Access PostgreSQL using Command Prompt
```cmd
psql -U postgres
```
*Enter the password you set during installation*

### Verify connection and check version
```sql
SELECT version();
```

### Exit PostgreSQL
```sql
\q
```

## Step 3: Create Admin User

### Open Command Prompt and connect as postgres user
```cmd
psql -U postgres
```

### Create admin user with full privileges
```sql
CREATE USER admin WITH ENCRYPTED PASSWORD 'your_admin_password' SUPERUSER CREATEDB CREATEROLE;
```

### Verify user creation
```sql
\du
```
*Expected output: Shows admin user with Superuser, Create role, Create DB privileges*

### Exit PostgreSQL
```sql
\q
```

## Step 4: Create Project Database

### Connect as admin user
```cmd
psql -U admin -d postgres
```
*Enter your admin password when prompted*

### Create your project database
```sql
CREATE DATABASE match_me OWNER admin;
```

### Verify database creation
```sql
\l
```

### Connect to your new database
```sql
\c match_me
```

### Exit PostgreSQL
```sql
\q
```

## Step 5: Connect to Your Database

### Connect directly to your project database
```cmd
psql -U admin -d match_me
```

Your PostgreSQL installation is now complete and ready for development on Windows!