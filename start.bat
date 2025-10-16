@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM ===== 控制台与编码（避免中文乱码）=====
title Setup & Run AstroCode (UTF-8)
chcp 65001 >nul
set "PYTHONUTF8=1"
set "PYTHONIOENCODING=utf-8"

REM ===== 路径常量（根目录下 SandBox 与 CLI 为同级）=====
set "ROOT=%~dp0"
set "SBOX=%ROOT%SandBox"
set "CLI=%ROOT%CLI"
set "TARGET_JS=%CLI%\bundle\AstroCode.js"

set "VENV=%SBOX%\.venv"
set "PYPROJECT=%SBOX%\pyproject.toml"
set "PYVER=3.12.10"

REM 让 uv 的常见安装位置在 PATH 里
set "PATH=%USERPROFILE%\.local\bin;%USERPROFILE%\.cargo\bin;%PATH%"

echo [信息] 根目录：%ROOT%
echo [信息] SandBox：%SBOX%
echo [信息] CLI    ：%CLI%

REM ===== 基本检查 =====
if not exist "%PYPROJECT%" (
  echo [错误] 未找到 %PYPROJECT%
  goto :END
)

if not exist "%TARGET_JS%" (
  echo [错误] 未找到入口：%TARGET_JS%
  echo [提示] 请确认 CLI\bundle\AstroCode.js 是否存在。
  goto :END
)

REM ===== uv 检测 / 安装 =====
where uv >nul 2>nul
if errorlevel 1 (
  echo [提示] 未检测到 uv，正在安装...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "[Console]::OutputEncoding=[Text.Encoding]::UTF8; iwr https://astral.sh/uv/install.ps1 -UseBasicParsing | iex"
  if errorlevel 1 (
    echo [错误] uv 安装失败；可手动执行：iwr https://astral.sh/uv/install.ps1 -UseBasicParsing ^| iex
    goto :END
  )
  set "PATH=%USERPROFILE%\.local\bin;%USERPROFILE%\.cargo\bin;%PATH%"
)

for /f "delims=" %%P in ('where uv 2^>nul') do set "UV_PATH=%%P"
echo [信息] uv 路径：%UV_PATH%
call uv --version

REM ===== 确认 Python 3.12.10（由 uv 管理）=====
echo [信息] 确认 Python %PYVER%...
call uv python find %PYVER% >nul 2>nul
if errorlevel 1 (
  echo [提示] 安装 Python %PYVER%...
  call uv python install %PYVER%
  if errorlevel 1 (
    echo [错误] 安装 Python %PYVER% 失败。
    goto :END
  )
)

REM ===== 创建/检查 SandBox\.venv =====
if not exist "%VENV%\Scripts\python.exe" (
  echo [提示] 创建虚拟环境：%VENV%
  call uv venv "%VENV%" --python %PYVER%
  if errorlevel 1 (
    echo [错误] 创建虚拟环境失败：%VENV%
    goto :END
  )
)

REM ===== 同步依赖（基于 SandBox\pyproject.toml）=====
echo [信息] 正在校验/同步依赖（uv sync）...
call uv sync --project "%SBOX%" -p "%VENV%"
if errorlevel 1 (
  echo [错误] 依赖同步失败，请检查 pyproject/网络。
  goto :END
)

REM ===== 检查 Node.js =====
where node >nul 2>nul
if errorlevel 1 (
  echo [警告] 未检测到 node 命令。请先安装 Node.js 再启动。
  goto :END
)
for /f "tokens=*" %%v in ('node -v') do set "NODEVER=%%v"
echo [信息] Node 版本：%NODEVER%

REM ===== 以 SandBox 为工作目录启动 CLI 的 AstroCode.js =====
echo [信息] 工作目录：%SBOX%
echo [信息] 入口脚本：%TARGET_JS%
pushd "%SBOX%" >nul
node "%TARGET_JS%"
set "APP_RC=%ERRORLEVEL%"
popd >nul

if not "%APP_RC%"=="0" (
  echo [错误] 运行退出码：%APP_RC%
  goto :END
)

echo [完成] 程序已正常退出。

:END
echo.
echo 按任意键关闭窗口...
pause >nul
exit /b 0
