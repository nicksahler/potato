@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "%~dp0\node_modules\potato\bin\bootstrap" %*
) ELSE (
  node  "%~dp0\node_modules\potato\bin\bootstrap" %*
)