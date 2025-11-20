# Complete PostgreSQL Installation Guide for Linux

## Prerequisites
- Ubuntu/Debian Linux system
- sudo privileges
- Terminal access

## Step 1: Install PostgreSQL

### Update package list
```bash
sudo apt update
```

### Install PostgreSQL and contrib packages
```bash
sudo apt install postgresql postgresql-contrib
```

### Start and enable PostgreSQL service
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Verify installation
```bash
sudo systemctl status postgresql
```

## Step 2: Initial PostgreSQL Setup

### Access PostgreSQL as postgres user
```bash
sudo -u postgres psql
```

### Set password for postgres user
```sql
ALTER USER postgres PASSWORD '1234';
```

### Check PostgreSQL version
```sql
SELECT version();
```

### Exit PostgreSQL
```sql
\q
```

## Step 3: Create Admin User

### Connect as postgres user
```bash
sudo -u postgres psql
```

### Create admin user with full privileges
```sql
CREATE USER admin WITH ENCRYPTED PASSWORD '1234' SUPERUSER CREATEDB CREATEROLE;
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
```bash
psql -U admin -d postgres -h localhost
```
*Note: Use `-h localhost` to avoid peer authentication issues*

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
```bash
psql -U admin -d match_me -h localhost
```

## Authentication Notes

By default, PostgreSQL uses "peer" authentication for local connections. This means:
- You need to use `-h localhost` flag when connecting as non-system users
- Alternatively, you can modify `/etc/postgresql/16/main/pg_hba.conf` to use `md5` instead of `peer` authentication

## Common Commands

### Connection commands
```bash
# Connect as postgres user
sudo -u postgres psql

# Connect as admin user to default database
psql -U admin -d postgres -h localhost

# Connect as admin user to project database
psql -U admin -d match_me -h localhost
```

### Inside PostgreSQL prompt
```sql
-- List all databases
\l

-- List all users/roles
\du

-- Connect to a different database
\c database_name

-- Show current database and user
\conninfo

-- Exit PostgreSQL
\q
```

## Troubleshooting

### "Peer authentication failed" error
- Use `-h localhost` flag in your connection command
- Or modify pg_hba.conf to use md5 authentication

### Service not starting
```bash
sudo systemctl status postgresql
sudo journalctl -u postgresql
```

### Check PostgreSQL logs
```bash
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

## Security Recommendations

1. Use strong passwords for database users
2. Limit database user privileges as needed
3. Configure proper authentication methods
4. Keep PostgreSQL updated
5. Consider firewall configuration for production environments

## Final Status Check

After completing all steps, you should have:
- ✅ PostgreSQL 16 installed and running
- ✅ Admin user with full privileges
- ✅ `match_me` database owned by admin user
- ✅ Ability to connect and work with your database

Your PostgreSQL installation is now complete and ready for development!