param(
  [string]$BaseUrl = "http://localhost:8080",
  [int]$UserCount = 100,
  [int]$ConcurrencyUsers = 20,
  [int]$FlowDayOffset = 365,
  [int]$ConcurrencyDayOffset = 800,
  [int]$DateSpreadDays = 180,
  [int]$MaxReservationRetries = 14,
  [switch]$AutoShiftDates = $true
)

$ErrorActionPreference = "Stop"

$runDateShift = 0
if ($AutoShiftDates) {
  # 누적 테스트 데이터와 충돌하지 않도록 실행마다 날짜 슬롯을 이동한다.
  $runDateShift = Get-Random -Minimum 0 -Maximum 3000
}
$script:EffectiveFlowDayOffset = $FlowDayOffset + $runDateShift
$script:EffectiveConcurrencyDayOffset = $ConcurrencyDayOffset + $runDateShift

function Get-ErrorMessage {
  param([object]$ExceptionObject)

  $resp = $ExceptionObject.Exception.Response
  if ($null -eq $resp) {
    return ($ExceptionObject.Exception.Message)
  }

  try {
    $sr = New-Object System.IO.StreamReader($resp.GetResponseStream())
    $respBody = $sr.ReadToEnd()
    return "HTTP $([int]$resp.StatusCode) :: $respBody"
  } catch {
    return "HTTP error (response body unavailable)"
  }
}

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
    throw (Get-ErrorMessage -ExceptionObject $_)
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
  $dateSlot = ($Index - 1) % $DateSpreadDays
  $checkInBase = $today.AddDays($script:EffectiveFlowDayOffset + $dateSlot)
  $checkOutBase = $today.AddDays($script:EffectiveFlowDayOffset + $dateSlot + 1)
  $bucket = [math]::Floor(($Index - 1) / $DateSpreadDays)
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

  $reservation = $null
  $lastError = ""
  for ($attempt = 0; $attempt -le $MaxReservationRetries; $attempt++) {
    $checkInDate = $checkInBase.AddDays($attempt).ToString("yyyy-MM-dd")
    $checkOutDate = $checkOutBase.AddDays($attempt).ToString("yyyy-MM-dd")

    $reservationPayload = @{
      roomId = $roomId
      checkInDate = $checkInDate
      checkOutDate = $checkOutDate
      visitTime = "10:00:00"
      guardianName = "guardian-$Index"
      guardianPhone = ("010-8{0:D3}-{1:D4}" -f ($Index % 1000), ($Index % 10000))
      petId = $pet.id
    }

    try {
      $reservation = Invoke-ApiJson -Method POST -Url "$BaseUrl/api/reservations" -Body $reservationPayload -Session $session
      break
    } catch {
      $lastError = $_.Exception.Message
      if ($lastError -notmatch "잔여 객실이 없습니다") {
        break
      }
    }
  }

  if ($null -eq $reservation) {
    throw $lastError
  }

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

  $checkInDate = (Get-Date).AddDays($script:EffectiveConcurrencyDayOffset).ToString("yyyy-MM-dd")
  $checkOutDate = (Get-Date).AddDays($script:EffectiveConcurrencyDayOffset + 1).ToString("yyyy-MM-dd")
  $usersSlice = $Users | Select-Object -First $ConcurrencyUsers
  $jobs = @()

  foreach ($u in $usersSlice) {
    $jobs += Start-Job -ScriptBlock {
      param($BaseUrlInner, $UserInner, $RoomIdInner, $InDateInner, $OutDateInner)
      $ErrorActionPreference = "Stop"
      $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

      function Get-ErrorMessageInner {
        param([object]$ExceptionObject)
        $resp = $ExceptionObject.Exception.Response
        if ($null -eq $resp) {
          return ($ExceptionObject.Exception.Message)
        }
        try {
          $sr = New-Object System.IO.StreamReader($resp.GetResponseStream())
          $respBody = $sr.ReadToEnd()
          return "HTTP $([int]$resp.StatusCode) :: $respBody"
        } catch {
          return "HTTP error (response body unavailable)"
        }
      }

      function Invoke-ApiJsonInner {
        param([string]$Method, [string]$Url, [object]$Body, [Microsoft.PowerShell.Commands.WebRequestSession]$Session)
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
          throw (Get-ErrorMessageInner -ExceptionObject $_)
        }
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
        return @{ ok = $true; code = $res.reservationCode; errorMessage = "" }
      } catch {
        $detail = $_.ErrorDetails.Message
        if ([string]::IsNullOrWhiteSpace($detail)) {
          $detail = $_.Exception.Message
        }
        if ([string]::IsNullOrWhiteSpace($detail)) {
          $detail = (Get-ErrorMessageInner -ExceptionObject $_)
        }
        if ([string]::IsNullOrWhiteSpace($detail)) {
          $detail = ($_ | Out-String).Trim()
        }
        return @{ ok = $false; code = ""; errorMessage = $detail }
      }
    } -ArgumentList $BaseUrl, $u, $RoomId, $checkInDate, $checkOutDate
  }

  Wait-Job -Job $jobs | Out-Null
  $results = $jobs | ForEach-Object { Receive-Job -Job $_ }
  $jobs | Remove-Job -Force | Out-Null

  $successCount = ($results | Where-Object { $_.ok }).Count
  $failCount = ($results | Where-Object { -not $_.ok }).Count
  $errors = $results | Where-Object { -not $_.ok } | Group-Object -Property errorMessage | Sort-Object Count -Descending

  return @{
    success = $successCount
    fail = $failCount
    errors = $errors
    checkInDate = $checkInDate
    checkOutDate = $checkOutDate
  }
}

Write-Host "Load test start: users=$UserCount concurrency=$ConcurrencyUsers spreadDays=$DateSpreadDays retries=$MaxReservationRetries"
Write-Host "Date shift: flowOffset=$($script:EffectiveFlowDayOffset) concurrencyOffset=$($script:EffectiveConcurrencyDayOffset)"

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
