@echo off
title AZUR Termine entfernen
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup\uninstall.ps1"
pause
