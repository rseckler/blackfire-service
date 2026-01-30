# Deployment: Symbol Population Service

Anleitung zum Deployment des automatischen Symbol-Befüllungs-Services auf dem Server.

## Was wurde erstellt?

✅ **Automatischer Service** der mehrmals täglich läuft
✅ **Python-Script** das Symbole aus vorhandenen Daten befüllt
✅ **Cron-Container** für geplante Ausführung (alle 4 Stunden)
✅ **Management-Tools** zum Testen und Überwachen
✅ **Vollständige Dokumentation**

## Deployment auf den Server

### Option 1: Automatisches Deployment (Empfohlen)

```bash
# Auf dem VPS Server einloggen
ssh root@your-vps-ip

# Zum Projekt-Verzeichnis wechseln
cd /opt/blackfire_service  # oder wo auch immer dein Projekt liegt

# Neueste Änderungen pullen
git pull origin main

# Service deployen
./scripts/deploy-vps.sh
```

Das wars! Der Cron-Service wird automatisch gebaut und gestartet.

### Option 2: Manuelles Deployment

```bash
# Auf dem Server
cd /opt/blackfire_service

# Änderungen pullen
git pull origin main

# Nur den Cron-Service neu bauen
docker compose -f docker-compose.prod.yml build cron

# Cron-Service starten
docker compose -f docker-compose.prod.yml up -d cron

# Status prüfen
docker ps | grep cron
```

## Nach dem Deployment

### 1. Service-Status überprüfen

```bash
./scripts/manage-symbols.sh status
```

Oder direkt:

```bash
docker ps --filter name=blackfire-cron
```

### 2. Logs anschauen

```bash
./scripts/manage-symbols.sh logs
```

Oder direkt:

```bash
# Live-Logs folgen
docker logs -f blackfire-cron

# Cron-Execution Logs
docker exec blackfire-cron tail -f /var/log/blackfire/cron.log
```

### 3. Ersten manuellen Test durchführen

```bash
# Dry-Run Test (zeigt nur was gemacht würde)
./scripts/manage-symbols.sh test

# Oder innerhalb des Containers
docker exec -it blackfire-cron python3 scripts/populate_symbols.py --dry-run --limit 10
```

### 4. Ersten Live-Run (optional)

Wenn der Dry-Run erfolgreich war:

```bash
# Manuell die ersten 50 Symbole befüllen
docker exec -it blackfire-cron python3 scripts/populate_symbols.py --limit 50
```

## Was passiert automatisch?

Nach dem Deployment läuft der Service automatisch:

1. **Alle 4 Stunden**: Symbol Population
   - Sucht nach Companies ohne Symbol
   - Extrahiert Symbol aus extra_data, WKN, ISIN
   - Updated die Datenbank

2. **Alle 12 Stunden**: Excel → PostgreSQL Sync
   - Synced neue Daten aus Excel

3. **Stündlich (9-17 UTC, Mo-Fr)**: Stock Price Updates
   - Updated aktuelle Aktienkurse

## Zeitplan anpassen

Um die Häufigkeit zu ändern:

1. `crontab` Datei bearbeiten:

```bash
# Original: Alle 4 Stunden
0 */4 * * * cd /app && python3 scripts/populate_symbols.py

# Alternative: 3x täglich (8:00, 14:00, 20:00)
0 8,14,20 * * * cd /app && python3 scripts/populate_symbols.py

# Alternative: Alle 2 Stunden
0 */2 * * * cd /app && python3 scripts/populate_symbols.py
```

2. Service neu bauen und starten:

```bash
docker compose -f docker-compose.prod.yml build cron
docker compose -f docker-compose.prod.yml up -d cron
```

## Monitoring

### Performance überwachen

```bash
# Container-Ressourcen
docker stats blackfire-cron

# Logs nach Errors durchsuchen
docker logs blackfire-cron | grep -i error

# Erfolgreich befüllte Symbole zählen
docker logs blackfire-cron | grep "Symbols Populated"
```

### Datenbank-Status prüfen

```bash
# Anzahl Companies ohne Symbol
docker exec blackfire-postgres psql -U blackfire_user -d blackfire -c \
  "SELECT COUNT(*) FROM companies WHERE symbol IS NULL;"

# Anzahl Companies mit Symbol
docker exec blackfire-postgres psql -U blackfire_user -d blackfire -c \
  "SELECT COUNT(*) FROM companies WHERE symbol IS NOT NULL;"

# Beispiele von befüllten Symbolen
docker exec blackfire-postgres psql -U blackfire_user -d blackfire -c \
  "SELECT name, symbol FROM companies WHERE symbol IS NOT NULL LIMIT 10;"
```

## Troubleshooting

### Container läuft nicht

```bash
# Status prüfen
docker ps -a | grep cron

# Container-Logs ansehen
docker logs blackfire-cron

# Container neustarten
docker restart blackfire-cron
```

### Cron läuft nicht

```bash
# Cron-Prozess im Container prüfen
docker exec blackfire-cron ps aux | grep cron

# Crontab ansehen
docker exec blackfire-cron crontab -l

# Manuelle Test-Ausführung
docker exec -it blackfire-cron bash
cd /app
python3 scripts/populate_symbols.py --dry-run
```

### Symbole werden nicht befüllt

1. Prüfe ob Daten in extra_data vorhanden sind:

```sql
SELECT name, extra_data FROM companies WHERE symbol IS NULL LIMIT 5;
```

2. Prüfe welche Felder in extra_data sind:

```sql
SELECT DISTINCT jsonb_object_keys(extra_data) FROM companies LIMIT 20;
```

3. Teste Script manuell:

```bash
docker exec -it blackfire-cron python3 scripts/populate_symbols.py --dry-run --limit 5
```

## Backup vor großen Änderungen

Vor dem ersten Live-Run (optional):

```bash
# Database Backup erstellen
docker exec blackfire-postgres pg_dump -U blackfire_user blackfire > backup_before_symbol_population.sql

# Oder mit dem Backup-Script
./scripts/backup-db.sh
```

## Support

Bei Problemen:

1. Logs prüfen: `./scripts/manage-symbols.sh logs`
2. Dokumentation lesen: `SYMBOL-POPULATION.md`
3. Manuellen Test durchführen: `./scripts/manage-symbols.sh test`

---

**Hinweis**: Der Service läuft vollständig automatisch. Du musst nichts weiter tun außer gelegentlich die Logs zu überprüfen.
