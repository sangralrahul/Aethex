@echo off
rem Uploads the Cadus installers in desktop\release to Cloudflare R2 (bucket aethex-downloads),
rem where https://downloads.aethex.in serves them. Run from the Aethex folder:  desktop\upload-r2.cmd
setlocal
set VER=1.0.3
set B=aethex-downloads/cadus/%VER%
set R=desktop\release
call npx wrangler r2 object put %B%/Cadus-Setup-%VER%-x64.exe --file %R%\Cadus-Setup-%VER%-x64.exe --content-type application/vnd.microsoft.portable-executable --content-disposition "attachment; filename=Cadus-Setup-%VER%-x64.exe" --remote || goto :fail
call npx wrangler r2 object put %B%/Cadus-Setup-%VER%-arm64.exe --file %R%\Cadus-Setup-%VER%-arm64.exe --content-type application/vnd.microsoft.portable-executable --content-disposition "attachment; filename=Cadus-Setup-%VER%-arm64.exe" --remote || goto :fail
call npx wrangler r2 object put %B%/Cadus-%VER%-x86_64.AppImage --file %R%\Cadus-%VER%-x86_64.AppImage --content-type application/octet-stream --content-disposition "attachment; filename=Cadus-%VER%-x86_64.AppImage" --remote || goto :fail
call npx wrangler r2 object put %B%/Cadus-%VER%-amd64.deb --file %R%\Cadus-%VER%-amd64.deb --content-type application/vnd.debian.binary-package --content-disposition "attachment; filename=Cadus-%VER%-amd64.deb" --remote || goto :fail
call npx wrangler r2 object put %B%/SHA256SUMS.txt --file %R%\SHA256SUMS.txt --content-type "text/plain; charset=utf-8" --remote || goto :fail
echo.
echo All Cadus %VER% files are on R2. Check: https://downloads.aethex.in/cadus/%VER%/SHA256SUMS.txt
exit /b 0
:fail
echo.
echo An upload failed. Check that you are logged in (npx wrangler login) and that the bucket aethex-downloads exists.
exit /b 1
