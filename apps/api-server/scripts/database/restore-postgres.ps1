param(
  [Parameter(Mandatory = $true)]
  [string]$BackupFile,
  [string]$DatabaseUrl = $env:DATABASE_URL,
  [string]$DockerComposeService = "",
  [string]$ContainerDatabaseUrl = "",
  [switch]$Clean
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
  Write-Error "DATABASE_URL is required. Pass -DatabaseUrl or set the DATABASE_URL environment variable."
}

if (!(Test-Path $BackupFile)) {
  Write-Error "Backup file does not exist: $BackupFile"
}

if (!(Get-Command pg_restore -ErrorAction SilentlyContinue) -and [string]::IsNullOrWhiteSpace($DockerComposeService)) {
  Write-Error "pg_restore was not found. Install PostgreSQL client tools or pass -DockerComposeService postgres."
}

$cleanArgs = @()
if ($Clean) {
  $cleanArgs = @("--clean", "--if-exists")
}

if ([string]::IsNullOrWhiteSpace($DockerComposeService)) {
  pg_restore @cleanArgs --no-owner --no-acl --dbname $DatabaseUrl $BackupFile
} else {
  $restoreDatabaseUrl = if ([string]::IsNullOrWhiteSpace($ContainerDatabaseUrl)) { $DatabaseUrl } else { $ContainerDatabaseUrl }
  $containerFile = "/tmp/$(Split-Path -Leaf $BackupFile)"
  docker compose cp $BackupFile "${DockerComposeService}:$containerFile"
  docker compose exec -T $DockerComposeService pg_restore @cleanArgs --no-owner --no-acl --dbname $restoreDatabaseUrl $containerFile
  docker compose exec -T $DockerComposeService rm -f $containerFile
}

Write-Host "Restore completed from: $BackupFile"
