#!/usr/bin/expect -f
# Automated VPS Deployment using Expect
# Deploys Symbol Population Service to Hostinger VPS

set timeout 60
set password "@VPq6hXpEBDpnLX2"
set host "72.62.148.205"
set user "root"

proc exec_remote {cmd} {
    global password host user

    spawn ssh -o StrictHostKeyChecking=no $user@$host $cmd
    expect {
        "password:" {
            send "$password\r"
            exp_continue
        }
        eof
    }
}

puts "\n╔════════════════════════════════════════════╗"
puts "║  Deploying to Hostinger VPS                ║"
puts "╚════════════════════════════════════════════╝\n"

puts "Host: $host"
puts "User: $user\n"

# Connect and execute deployment
spawn ssh -o StrictHostKeyChecking=no $user@$host

expect {
    "password:" {
        send "$password\r"
        expect "#"

        # Navigate to project
        send "cd /root/blackfire_service\r"
        expect "#"

        # Pull latest changes
        puts "\n📥 Pulling latest changes..."
        send "git pull origin main\r"
        expect "#"

        # Build cron service
        puts "\n🔨 Building Cron Service..."
        send "docker compose -f docker-compose.prod.yml build cron\r"
        expect "#" { }

        # Start cron service
        puts "\n🚀 Starting Cron Service..."
        send "docker compose -f docker-compose.prod.yml up -d cron\r"
        expect "#"

        # Wait a moment
        sleep 3

        # Check status
        puts "\n📊 Checking Service Status..."
        send "docker ps --filter name=blackfire-cron\r"
        expect "#"

        # Show logs
        puts "\n📋 Recent Logs:"
        send "docker logs --tail 20 blackfire-cron\r"
        expect "#"

        # Run test
        puts "\n🧪 Running Test (Dry-Run)..."
        send "docker exec blackfire-cron python3 scripts/populate_symbols.py --dry-run --limit 5\r"
        expect "#"

        # Exit
        send "exit\r"
    }
    timeout {
        puts "\n❌ Connection timeout"
        exit 1
    }
}

puts "\n╔════════════════════════════════════════════╗"
puts "║  ✅ Deployment Completed Successfully!     ║"
puts "╚════════════════════════════════════════════╝\n"

expect eof
