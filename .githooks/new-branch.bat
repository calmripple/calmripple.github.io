@echo off
REM 自动创建带日期前缀的分支 (Windows 版本)
REM 用法: git new-branch <branch-name>

setlocal enabledelayedexpansion

REM 获取日期时间前缀
for /f "tokens=2 delims==" %%i in ('"wmic os get localdatetime /value"') do set "dt=%%i"
set "prefix=%dt:~0,4%/%dt:~4,2%/%dt:~6,2%/%dt:~8,2%%dt:~10,2%-"

set "branch_name=%prefix%%1"

if "%1"=="" (
    echo 用法: git new-branch ^<分支名^>
    echo 示例: git new-branch my-feature
    echo 将创建分支: %prefix%my-feature
    exit /b 1
)

echo 创建分支: %branch_name%
git switch -c "%branch_name%"
echo 已切换到分支: %branch_name%
