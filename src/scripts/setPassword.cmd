@echo off
:: script.cmd

:: Prompt for input and set the environment variable
set /p "INPUT_PASSWORD=Enter the password (input will be hidden): "

:: Remove the input echo
echo.

:: Set the environment variable
set "ENV_ENC_PASSWORD=%INPUT_PASSWORD%"

:: Start a new Command Prompt session to avoid storing the variable in history
start cmd.exe

:: Clear the variable from the current session
set "ENV_ENC_PASSWORD="
