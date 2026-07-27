' Stop BMC.vbs
' Cleanly stops only the two processes this app started (by PID), never a
' blanket "kill all php.exe" - other unrelated apps on the same machine are
' left untouched.

Option Explicit

Dim fso, shell, wmi, baseDir, stateDir, pidFile, f, pid, stoppedAny

Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")
Set wmi = GetObject("winmgmts:\\.\root\cimv2")

baseDir = fso.GetParentFolderName(WScript.ScriptFullName)
stateDir = baseDir & "\state"
pidFile = stateDir & "\pids.txt"

stoppedAny = False

If fso.FileExists(pidFile) Then
    Set f = fso.OpenTextFile(pidFile, 1)
    Do Until f.AtEndOfStream
        pid = Trim(f.ReadLine)
        If pid <> "" Then
            If TerminateByPid(pid) Then stoppedAny = True
        End If
    Loop
    f.Close
    fso.DeleteFile(pidFile)
End If

If stoppedAny Then
    MsgBox "BMC has been stopped.", vbInformation, "BMC"
Else
    MsgBox "BMC wasn't running.", vbInformation, "BMC"
End If

Function TerminateByPid(pid)
    Dim results, proc, found
    found = False
    Set results = wmi.ExecQuery("SELECT * FROM Win32_Process WHERE ProcessId = " & pid)
    For Each proc In results
        proc.Terminate()
        found = True
    Next
    TerminateByPid = found
End Function
