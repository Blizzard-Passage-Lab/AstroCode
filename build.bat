@echo off
:: 强制设置控制台为 UTF-8 编码，解决中文乱码问题
chcp 65001

title My Project Builder

:: 切换到脚本文件所在的目录
cd /d "%~dp0"

echo ==================================
echo  开始执行构建和打包任务
echo ==================================
echo.

:: 检查 CLI 目录是否存在
if not exist "CLI" (
    echo 错误：找不到 CLI 目录！
    echo 请确保此脚本与 CLI 目录在同一父目录下。
    goto :error
)

echo 正在进入 CLI 目录...
cd CLI
echo.

echo [1/2] 正在执行 npm run build... 请稍候...
call npm run build

:: 检查上一条命令 (build) 是否成功
if %ERRORLEVEL% neq 0 (
    echo.
    echo 错误：npm run build 执行失败！
    goto :error
)

echo.
echo npm run build 完成！
echo.

echo [2/2] 正在执行 npm run bundle... 请稍候...
call npm run bundle

:: 检查上一条命令 (bundle) 是否成功
if %ERRORLEVEL% neq 0 (
    echo.
    echo 错误：npm run bundle 执行失败！
    goto :error
)

goto :success

:success
echo.
echo ==================================
echo  所有任务成功完成！
echo ==================================
goto :end

:error
echo.
echo !!! 脚本执行过程中发生错误，已中止。 !!!

:end
echo.
pause