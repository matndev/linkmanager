@ECHO ON
SET SourceDir=%userprofile%\Downloads
SET CopyDir=%~dp0\assets\favicon
SET FilePatterName=lm-*.ico

FOR %%A IN ("%SourceDir%\%FilePatterName%") DO (
    ECHO F | XCOPY /Y /F "%%~A" "%CopyDir%\"
    DEL /Q /F "%%~A"
)
GOTO EOF

REM https://superuser.com/a/1023697
REM C:\development\web\LinkManager\assets\test