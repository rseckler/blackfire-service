# 🚀 Deployment Workflow - Blackfire Service

## ⚠️ WICHTIG: Immer Vercel verwenden!

**Standard-Deployment-Plattform**: Vercel
**Produktions-URL**: https://blackfire-service.vercel.app

---

## ✅ Standard Deployment Prozess

### Schritt 1: Änderungen machen
```bash
# Arbeite normal an den Dateien
```

### Schritt 2: Commit
```bash
git add -A
git commit -m "Beschreibung der Änderungen"
```

### Schritt 3: Push zu GitHub
```bash
git push origin main
```

### Schritt 4: Warten auf Vercel
- Vercel deployed automatisch (2-3 Minuten)
- Kein manueller Eingriff nötig
- Status: https://vercel.com/dashboard

### Schritt 5: Testen auf Vercel
```
https://blackfire-service.vercel.app
```

**NICHT** auf localhost:3000 testen!

---

## 🗄️ Datenbank (Supabase)

**URL**: https://lglvuiuwbrhiqvxcriwa.supabase.co
**Dashboard**: https://supabase.com/dashboard/project/lglvuiuwbrhiqvxcriwa

### Migration anwenden:
1. Supabase Dashboard öffnen
2. SQL Editor → New Query
3. SQL aus `supabase/migrations/` einfügen
4. "Run" klicken

**Datenbank ist IMMER produktiv** - keine Trennung zwischen local/staging/production!

---

## 🎯 Nach jeder Feature-Implementation

### Checklist:
- [ ] Code lokal getestet (falls möglich)
- [ ] Git commit erstellt
- [ ] Push zu GitHub: `git push origin main`
- [ ] Warte 2-3 Minuten auf Vercel Deployment
- [ ] Teste auf Vercel URL: https://blackfire-service.vercel.app
- [ ] Falls DB-Änderungen: Migration über Supabase Dashboard
- [ ] Teile Vercel URL mit User (NICHT localhost!)

---

## ❌ Was NICHT zu tun ist

### Lokal testen (localhost:3000)
- ❌ Oft funktioniert es lokal nicht richtig
- ❌ Environment-Variablen können fehlen
- ❌ Unterschiede zwischen Dev und Production
- ✅ **Immer auf Vercel testen!**

### VPS verwenden (72.62.148.205)
- ❌ Nur als Backup
- ❌ Nicht für normale Entwicklung
- ✅ **Nur wenn User explizit VPS anfragt**

### Direkt auf Production DB testen
- ❌ Keine Test-Daten in Production einfügen ohne Abstimmung
- ✅ **Teste mit bestehenden Daten**

---

## 📋 Environment Setup

### Vercel Environment Variables
Werden in Vercel Dashboard gesetzt:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- Weitere Secrets

### Lokal (.env.local)
Nur für lokale Entwicklung, falls nötig.
**Wird NICHT committet!**

---

## 🔍 Deployment Status prüfen

### Vercel Dashboard
https://vercel.com/dashboard
- Zeigt Deployment-Status
- Build-Logs
- Fehler

### Vercel URL testen
```bash
curl https://blackfire-service.vercel.app
```

Sollte 200 oder 307 zurückgeben.

---

## 🚨 Troubleshooting

### "Es funktioniert nicht lokal"
✅ **Normal!** Teste auf Vercel.

### "Änderungen sind nicht live"
1. Check: Git push erfolgreich?
2. Check: Vercel Dashboard - Deployment laufend?
3. Warte 2-3 Minuten
4. Hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)

### "API gibt 401 zurück"
✅ **Normal!** Bedeutet API funktioniert, Authentication erforderlich.
Logge dich auf Vercel URL ein.

### "Datenbank-Änderungen nicht sichtbar"
1. Check: Migration in Supabase Dashboard ausgeführt?
2. Check: Richtige Datenbank? (Production, nicht lokal)

---

## 📚 Wichtige Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard/project/lglvuiuwbrhiqvxcriwa
- **GitHub Repo**: https://github.com/rseckler/blackfire-service
- **Production URL**: https://blackfire-service.vercel.app

---

## 🎯 Zusammenfassung

**IMMER**:
1. ✅ Commit zu Git
2. ✅ Push zu GitHub
3. ✅ Warte auf Vercel
4. ✅ Teste auf https://blackfire-service.vercel.app
5. ✅ Teile Vercel URL mit User

**NIEMALS**:
- ❌ Lokal testen und sagen "es funktioniert"
- ❌ VPS verwenden ohne explizite Anfrage
- ❌ localhost URL teilen

---

**Merke**: Vercel ist Production. Immer. Punkt. 🎯
