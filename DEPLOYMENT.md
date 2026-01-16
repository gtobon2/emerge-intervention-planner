# NAS Deployment Guide

## Overview

The EMERGE Intervention Planner is deployed on a Synology NAS and runs via PM2 (Node.js process manager).

## Server Details

| Item | Value |
|------|-------|
| **NAS IP** | `192.168.86.45` |
| **SSH User** | `Dr.Tobon` |
| **App Location** | `/volume1/docker/emerge-intervention-planner` |
| **Process Manager** | PM2 |
| **PM2 App Name** | `emerge-planner` |
| **GitHub Repo** | `https://github.com/gtobon2/emerge-intervention-planner.git` |
| **Branch** | `claude/setup-project-structure-017VtwLJnseT2Xgo5iFGcjgB` |

## How to Update the App

### Option 1: Manual SSH Update

1. **SSH into the NAS:**
   ```bash
   ssh Dr.Tobon@192.168.86.45
   ```

2. **Navigate to the app directory:**
   ```bash
   cd /volume1/docker/emerge-intervention-planner
   ```

3. **Pull the latest changes:**
   ```bash
   git pull origin claude/setup-project-structure-017VtwLJnseT2Xgo5iFGcjgB
   ```

4. **Install any new dependencies:**
   ```bash
   npm install
   ```

5. **Build the app:**
   ```bash
   npm run build
   ```

6. **Restart the PM2 process:**
   ```bash
   pm2 restart emerge-planner
   ```

7. **Verify it's running:**
   ```bash
   pm2 status emerge-planner
   ```

### Option 2: One-Liner Update

After SSHing into the NAS, run this single command:

```bash
cd /volume1/docker/emerge-intervention-planner && git pull && npm install && npm run build && pm2 restart emerge-planner
```

## PM2 Commands Reference

| Command | Description |
|---------|-------------|
| `pm2 status` | View all running processes |
| `pm2 logs emerge-planner` | View app logs |
| `pm2 logs emerge-planner --lines 100` | View last 100 log lines |
| `pm2 restart emerge-planner` | Restart the app |
| `pm2 stop emerge-planner` | Stop the app |
| `pm2 start emerge-planner` | Start the app |
| `pm2 monit` | Real-time monitoring dashboard |

## Viewing Logs

To troubleshoot issues, check the PM2 logs:

```bash
# View recent logs
pm2 logs emerge-planner --lines 50

# Follow logs in real-time
pm2 logs emerge-planner -f
```

## Environment Variables

The app uses environment variables stored in `/volume1/docker/emerge-intervention-planner/.env`:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin operations)
- `AI_PROVIDER` - AI provider (openai or anthropic)
- `OPENAI_API_KEY` - OpenAI API key

## Troubleshooting

### App not responding
```bash
pm2 restart emerge-planner
pm2 logs emerge-planner --lines 50
```

### Build errors
```bash
cd /volume1/docker/emerge-intervention-planner
npm run build 2>&1 | tail -50
```

### Check if process is running
```bash
pm2 status
```

### Check disk space
```bash
df -h /volume1
```

## Database

The app uses **Supabase** (hosted PostgreSQL) for the database. No database is hosted on the NAS - all data is in the cloud.

- **Supabase Dashboard**: https://supabase.com/dashboard
- **Project**: kbetnrpgagxclzyyjnzs

## Backup

The app data is stored in Supabase, not on the NAS. To backup:

1. Use the Admin page > Data > Export options
2. Or use Supabase dashboard for database backups
