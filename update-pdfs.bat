@echo off
title Maths Manthan - PDF Auto Sync Engine
echo ========================================================
echo         MATHS MANTHAN - PDF AUTO SYNC ENGINE
echo ========================================================
echo.
echo Scanning chapter and book folders for new PDFs...
python sync-pdfs.py
echo.
echo ========================================================
echo PDF Catalog updated successfully!
echo You can now refresh your browser to see your updated PDFs.
echo ========================================================
echo.
pause
