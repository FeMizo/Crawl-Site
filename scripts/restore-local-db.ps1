$ErrorActionPreference = "Stop"

param(
  [string]$DumpPath = "backup_neon.dump",
  [switch]$SkipGenerate
)

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$dumpFile = Join-Path $projectRoot $DumpPath

if (-not (Test-Path $dumpFile)) {
  throw "No se encontro el dump: $dumpFile"
}

$containerName = "seo_crawler_db"
$dbUser = "seo_user"
$dbName = "seo_crawler"
$dumpTarget = "/tmp/backup_neon.dump"

Write-Host "Levantando Postgres local..."
docker compose up -d db | Out-Host

Write-Host "Esperando a que Postgres responda..."
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
  docker exec $containerName pg_isready -U $dbUser -d $dbName *> $null
  if ($LASTEXITCODE -eq 0) {
    $ready = $true
    break
  }
  Start-Sleep -Seconds 2
}

if (-not $ready) {
  throw "Postgres local no estuvo listo a tiempo."
}

Write-Host "Copiando dump al contenedor..."
docker cp $dumpFile "${containerName}:${dumpTarget}" | Out-Host

Write-Host "Recreando base local..."
docker exec $containerName psql -U $dbUser -d postgres -v ON_ERROR_STOP=1 -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${dbName}' AND pid <> pg_backend_pid();" | Out-Host
docker exec $containerName psql -U $dbUser -d postgres -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS `"${dbName}`";" | Out-Host
docker exec $containerName psql -U $dbUser -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE `"${dbName}`";" | Out-Host

Write-Host "Restaurando dump..."
docker exec $containerName pg_restore -U $dbUser -d $dbName --clean --if-exists --no-owner --no-privileges $dumpTarget | Out-Host

Write-Host "Validando tablas restauradas..."
docker exec $containerName psql -U $dbUser -d $dbName -v ON_ERROR_STOP=1 -c '\dt' | Out-Host
docker exec $containerName psql -U $dbUser -d $dbName -v ON_ERROR_STOP=1 -c 'SELECT COUNT(*) AS users FROM "User";' | Out-Host
docker exec $containerName psql -U $dbUser -d $dbName -v ON_ERROR_STOP=1 -c 'SELECT COUNT(*) AS projects FROM "Project";' | Out-Host
docker exec $containerName psql -U $dbUser -d $dbName -v ON_ERROR_STOP=1 -c 'SELECT COUNT(*) AS crawl_runs FROM "CrawlRun";' | Out-Host
docker exec $containerName psql -U $dbUser -d $dbName -v ON_ERROR_STOP=1 -c 'SELECT COUNT(*) AS crawl_run_pages FROM "CrawlRunPage";' | Out-Host
docker exec $containerName psql -U $dbUser -d $dbName -v ON_ERROR_STOP=1 -c 'SELECT COUNT(*) AS crawl_run_duplicates FROM "CrawlRunDuplicate";' | Out-Host

if (-not $SkipGenerate) {
  Write-Host "Regenerando Prisma Client..."
  Push-Location $projectRoot
  try {
    npx prisma generate | Out-Host
  } finally {
    Pop-Location
  }
}

Write-Host ""
Write-Host "Listo. La app en desarrollo usara la base local definida en .env."
