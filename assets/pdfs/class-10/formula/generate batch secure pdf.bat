@echo off
setlocal enabledelayedexpansion
title MathsManthan - Batch PDF Securer ^& Compressor

:: बैच फ़ाइल के वर्तमान फ़ोल्डर में जाएं
cd /d "%~dp0"

:: ==============================================================================
:: टूल्स के पाथ और सेटिंग्स
:: ==============================================================================
set "GS_PATH=C:\Program Files\gs\gs10.08.0\bin\gswin64c.exe"
set "QPDF_PATH=C:\Program Files\qpdf 12.4.2\bin\qpdf.exe"
set "OWNER_PASS=ManthanMathsSecure2026"

set "OUTPUT_DIR=%~dp0Secured_PDFs"
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

set /a total=0
set /a success=0

echo ============================================================
echo       MATHSMANTHAN - BATCH PDF SECURE ^& COMPRESSOR
echo ============================================================
echo Destination: "%OUTPUT_DIR%"
echo.

:: अगर फ़ाइलें ड्रैग-एंड-ड्रॉप की गई हैं तो सीधे ड्रॉप लूप पर जाएं
if not "%~1"=="" goto handle_drag_drop

:: अगर डबल-क्लिक किया गया है तो पूरे फ़ोल्डर की सभी PDF प्रोसेस करें
echo Current folder ke sabhi PDF process ho rahe hain...
echo.
for %%F in ("%~dp0*.pdf") do (
    call :ProcessFile "%%~fF"
)
goto finish

:handle_drag_drop
echo Chuni hui files process ho rahi hain...
echo.
:loop_files
if "%~1"=="" goto finish
call :ProcessFile "%~f1"
shift
goto loop_files

:finish
echo ============================================================
echo   Processing Complete!
echo   Total Files: !total! ^| Successfully Secured: !success!
echo   Output Folder: "%OUTPUT_DIR%"
echo ============================================================
echo.
pause
exit /b 0

:: ==============================================================================
:: सिंगल फ़ाइल कम्प्रेशन और सिक्योरिटी सब-रूटीन
:: ==============================================================================
:ProcessFile
set "INFILE=%~1"
set "FNAME=%~nx1"
set "EXT=%~x1"

if /i not "%EXT%"==".pdf" exit /b
if /i "%~n1"=="temp_outlined" exit /b

set /a total+=1
echo [!total!] Securing ^& Compressing: "%FNAME%" ...

:: 1. घोस्टस्क्रिप्ट: 150 DPI बैकग्राउंड इमेज + वेक्टर फॉन्ट आउटलाइन्स
"%GS_PATH%" -sDEVICE=pdfwrite -dCompatibilityLevel=1.5 -dPDFSETTINGS=/ebook -dDetectDuplicateImages=true -dColorImageResolution=150 -dAutoFilterColorImages=true -dColorImageFilter=/DCTEncode -dCompressPages=true -dUseFlateCompression=true -dNOPAUSE -dQUIET -dBATCH -dNoOutputFonts -sOutputFile="%TEMP%\temp_outlined.pdf" "%INFILE%" > nul 2>&1

if not exist "%TEMP%\temp_outlined.pdf" (
    echo     [ERROR] Ghostscript process fail ho gaya "%FNAME%" par.
    echo.
    exit /b
)

:: 2. QPDF: ऑब्जेक्ट स्ट्रीम्स लेवल 9 कम्प्रेशन + 256-बिट लॉक (बिना लीनियर ओवरहेड)
"%QPDF_PATH%" --object-streams=generate --recompress-flate --compression-level=9 --encrypt "" "%OWNER_PASS%" 256 --modify=none --extract=n --annotate=n -- "%TEMP%\temp_outlined.pdf" "%OUTPUT_DIR%\%FNAME%" > nul 2>&1

del /q "%TEMP%\temp_outlined.pdf" 2>nul

if exist "%OUTPUT_DIR%\%FNAME%" (
    set /a success+=1
    echo     [OK] Secured and Compressed.
) else (
    echo     [ERROR] QPDF lock fail ho gaya "%FNAME%" par.
)
echo.
exit /b