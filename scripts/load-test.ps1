param(
  [string]$BaseUrl = "http://localhost:8080",
  [int]$UserCount = 100,
  [int]$ConcurrencyUsers = 20,
  [int]$FlowDayOffset = 365,
  [int]$ConcurrencyDayOffset = 390
)

$ErrorActionPreference = "Stop"

function Invoke-ApiJson {
  param(
    [string]$Method,
    [string]$Url,
    [object]$Body,
    [Microsoft.PowerShell.Commands.WebRequestSession]$Session
  )

  $jsonBody = $null
  if ($null -ne $Body) {
    $jsonBody = ($Body | ConvertTo-Json -Depth 6)
  }

  try {
    if ($null -ne $Session) {
      return Invoke-RestMethod -Method $Method -Uri $Url -Body $jsonBody -ContentType "application/json" -WebSession $Session
    }
    return Invoke-RestMethod -Method $Method -Uri $Url -Body $jsonBody -ContentType "application/json"
  } catch {
    $resp = $_.Exception.Response
    if ($null -ne $resp) {
      $sr = New-Object System.IO.StreamReader($resp.GetResponseStream())
      $respBody = $sr.ReadToEnd()
      throw "HTTP $([int]$resp.StatusCode) $Url :: $respBody"
    }
    throw
  }
}

function New-UserFlow {
  param(
    [int]$Index,
    [string]$RunTag
  )

  $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $email = "load-$RunTag-$Index@test.com"
  $password = "Pass!23456"
  $today = Get-Date
  $checkInDate = $today.AddDays($FlowDayOffset + ($Index % 14)).ToString("yyyy-MM-dd")
  $checkOutDate = $today.AddDays($FlowDayOffset + 1 + ($Index % 14)).ToString("yyyy-MM-dd")
  $bucket = [math]::Floor(($Index - 1) / 14)
  $roomId = if ((($Index + $bucket) % 2) -eq 0) { 1 } else { 2 }

  $signupPayload = @{
    name = "load-user-$Index"
    email = $email
    password = $password
    phone = ("010-9{0:D3}-{1:D4}" -f ($Index % 1000), ($Index % 10000))
    address = "Seoul load test $Index"
  }

  $loginPayload = @{
    email = $email
    password = $password
  }

  $petPayload = @{
    name = "pet-$Index"
    breed = if (($Index % 2) -eq 0) { "Maltese" } else { "Poodle" }
    weightKg = if (($Index % 2) -eq 0) { 4.0 } else { 7.2 }
    birthDate = "2021-01-0$((($Index % 9) + 1))"
    notes = "load test"
  }

  Invoke-ApiJson -Method POST -Url "$BaseUrl/api/users/signup" -Body $signupPayload -Session $null | Out-Null
  Invoke-ApiJson -Method POST -Url "$BaseUrl/api/users/login" -Body $loginPayload -Session $session | Out-Null
  $pet = Invoke-ApiJson -Method POST -Url "$BaseUrl/api/pets" -Body $petPayload -Session $session

  $reservationPayload = @{
    roomId = $roomId
    checkInDate = $checkInDate
    checkOutDate = $checkOutDate
    visitTime = "10:00:00"
    guardianName = "guardian-$Index"
    guardianPhone = ("010-8{0:D3}-{1:D4}" -f ($Index % 1000), ($Index % 10000))
    petId = $pet.id
  }

  $reservation = Invoke-ApiJson -Method POST -Url "$BaseUrl/api/reservations" -Body $reservationPayload -Session $session
  return @{
    email = $email
    password = $password
    reservationCode = $reservation.reservationCode
    ok = $true
  }
}

function Invoke-ConcurrencyReservationTest {
  param(
    [array]$Users,
    [string]$RunTag,
    [int]$RoomId
  )

  $checkInDate = (Get-Date).AddDays($ConcurrencyDayOffset).ToString("yyyy-MM-dd")
  $checkOutDate = (Get-Date).AddDays($ConcurrencyDayOffset + 1).ToString("yyyy-MM-dd")
  $usersSlice = $Users | Select-Object -First $ConcurrencyUsers
  $jobs = @()

  foreach ($u in $usersSlice) {
    $jobs += Start-Job -ScriptBlock {
      param($BaseUrlInner, $UserInner, $RoomIdInner, $InDateInner, $OutDateInner)
      $ErrorActionPreference = "Stop"
      $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

      function Invoke-ApiJsonInner {
        param([string]$Method, [string]$Url, [object]$Body, [Microsoft.PowerShell.Commands.WebRequestSession]$Session)
        $jsonBody = $null
        if ($null -ne $Body) {
          $jsonBody = ($Body | ConvertTo-Json -Depth 6)
        }
        if ($null -ne $Session) {
          return Invoke-RestMethod -Method $Method -Uri $Url -Body $jsonBody -ContentType "application/json" -WebSession $Session
        }
        return Invoke-RestMethod -Method $Method -Uri $Url -Body $jsonBody -ContentType "application/json"
      }

      try {
        Invoke-ApiJsonInner -Method POST -Url "$BaseUrlInner/api/users/login" -Body @{ email = $UserInner.email; password = $UserInner.password } -Session $session | Out-Null
        $pets = Invoke-ApiJsonInner -Method GET -Url "$BaseUrlInner/api/pets/me" -Body $null -Session $session
        $petId = $pets[0].id
        $body = @{
          roomId = $RoomIdInner
          checkInDate = $InDateInner
          checkOutDate = $OutDateInner
          visitTime = "10:00:00"
          guardianName = "stress-$($UserInner.email)"
          guardianPhone = "010-7777-7777"
          petId = $petId
        }
        $res = Invoke-ApiJsonInner -Method POST -Url "$BaseUrlInner/api/reservations" -Body $body -Session $session
        return @{ ok = $true; code = $res.reservationCode; error = "" }
      } catch {
        return @{ ok = $false; code = ""; error = $_.Exception.Message }
      }
    } -ArgumentList $BaseUrl, $u, $RoomId, $checkInDate, $checkOutDate
  }

  Wait-Job -Job $jobs | Out-Null
  $results = $jobs | ForEach-Object { Receive-Job -Job $_ }
  $jobs | Remove-Job -Force | Out-Null

  $successCount = ($results | Where-Object { $_.ok }).Count
  $failCount = ($results | Where-Object { -not $_.ok }).Count
  $errors = $results | Where-Object { -not $_.ok } | Group-Object -Property error | Sort-Object Count -Descending

  return @{
    success = $successCount
    fail = $failCount
    errors = $errors
    checkInDate = $checkInDate
    checkOutDate = $checkOutDate
  }
}

Write-Host "Load test start: users=$UserCount concurrency=$ConcurrencyUsers"

$runTag = Get-Date -Format "yyyyMMddHHmmss"
$users = @()
$flowErrors = @()

for ($i = 1; $i -le $UserCount; $i++) {
  try {
    $users += New-UserFlow -Index $i -RunTag $runTag
  } catch {
    $flowErrors += "user-$i :: $($_.Exception.Message)"
  }
}

$flowSuccess = $users.Count
$flowFail = $flowErrors.Count

Write-Host "Flow result: success=$flowSuccess fail=$flowFail"
if ($flowFail -gt 0) {
  Write-Host "Flow errors (top 10):"
  $flowErrors | Select-Object -First 10 | ForEach-Object { Write-Host $_ }
}

if ($users.Count -ge 1) {
  $concurrency = Invoke-ConcurrencyReservationTest -Users $users -RunTag $runTag -RoomId 1
  Write-Host "Concurrency result(room=1 in=$($concurrency.checkInDate)): success=$($concurrency.success) fail=$($concurrency.fail)"
  if ($concurrency.errors.Count -gt 0) {
    Write-Host "Concurrency errors:"
    $concurrency.errors | ForEach-Object { Write-Host "count=$($_.Count) error=$($_.Name)" }
  }
} else {
  Write-Host "Concurrency test skipped: no successful users in flow."
}

Write-Host "DONE"
