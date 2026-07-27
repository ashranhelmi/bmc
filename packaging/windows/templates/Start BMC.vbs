' Start BMC.vbs
' Double-click entry point for non-technical users. No console window is ever shown.
' Boots the app's web server + realtime server hidden, then opens the browser.

Option Explicit

Dim fso, shell, wmi, startup, baseDir, appDir, phpExe, phpIni, stateDir, pidFile
Dim serverCmd, reverbCmd, serverPid, reverbPid, f, i

Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

baseDir = fso.GetParentFolderName(WScript.ScriptFullName)
appDir = baseDir & "\app"
phpExe = baseDir & "\php-runtime\php.exe"
phpIni = baseDir & "\php-runtime\php.ini"
stateDir = baseDir & "\state"

If Not fso.FileExists(phpExe) Then
    MsgBox "Could not find the app's PHP runtime." & vbCrLf & _
           "Expected: " & phpExe & vbCrLf & vbCrLf & _
           "Try re-downloading BMC.", vbCritical, "BMC could not start"
    WScript.Quit 1
End If

If Not fso.FileExists(appDir & "\artisan") Then
    MsgBox "Could not find the app files." & vbCrLf & _
           "Expected: " & appDir & "\artisan" & vbCrLf & vbCrLf & _
           "Try re-downloading BMC.", vbCritical, "BMC could not start"
    WScript.Quit 1
End If

If Not fso.FolderExists(stateDir) Then
    fso.CreateFolder(stateDir)
End If

Set wmi = GetObject("winmgmts:\\.\root\cimv2")
Set startup = wmi.Get("Win32_ProcessStartup").SpawnInstance_
startup.ShowWindow = 0 ' hidden, no console window at all

' Already running? Don't start a second copy.
pidFile = stateDir & "\pids.txt"
If fso.FileExists(pidFile) Then
    Dim alreadyRunning, lines, pid
    alreadyRunning = False
    Set f = fso.OpenTextFile(pidFile, 1)
    Do Until f.AtEndOfStream
        pid = Trim(f.ReadLine)
        If pid <> "" And IsProcessRunning(pid) Then
            alreadyRunning = True
        End If
    Loop
    f.Close
    If alreadyRunning Then
        shell.Run "http://localhost:8000", 1, False
        WScript.Quit 0
    End If
End If

Dim extDir
extDir = baseDir & "\php-runtime\ext"

' extension_dir in php.ini is a relative path ("ext"), which PHP resolves
' against the process's *working directory* (appDir here), not against the
' ini file's own folder - so it must be overridden with an absolute path on
' the command line, or every extension (pdo_sqlite, mbstring, etc.) silently
' fails to load and Laravel fatals out before the server ever binds its port.
serverCmd = """" & phpExe & """ -c """ & phpIni & """ -d extension_dir=""" & extDir & """ artisan serve --host=0.0.0.0 --port=8000"
reverbCmd = """" & phpExe & """ -c """ & phpIni & """ -d extension_dir=""" & extDir & """ artisan reverb:start --host=0.0.0.0"

serverPid = SpawnHidden(serverCmd, appDir, startup)
reverbPid = SpawnHidden(reverbCmd, appDir, startup)

Set f = fso.CreateTextFile(pidFile, True)
f.WriteLine serverPid
f.WriteLine reverbPid
f.Close

' Give both processes a moment to bind their ports before opening the browser.
' (Generous on purpose - first run can be slower while antivirus scans the
' freshly extracted php.exe before letting it execute.)
WScript.Sleep 6000

shell.Run "http://localhost:8000", 1, False

Function SpawnHidden(cmdLine, workDir, startupObj)
    Dim procClass, newPid, result
    Set procClass = wmi.Get("Win32_Process")
    result = procClass.Create(cmdLine, workDir, startupObj, newPid)
    If result <> 0 Then
        MsgBox "BMC failed to start (error code " & result & ")." & vbCrLf & _
               "Command: " & cmdLine, vbCritical, "BMC could not start"
        WScript.Quit 1
    End If
    SpawnHidden = newPid
End Function

Function IsProcessRunning(pid)
    Dim results
    Set results = wmi.ExecQuery("SELECT ProcessId FROM Win32_Process WHERE ProcessId = " & pid)
    IsProcessRunning = (results.Count > 0)
End Function
