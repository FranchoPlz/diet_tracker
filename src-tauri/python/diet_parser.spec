# -*- mode: python ; coding: utf-8 -*-
# PyInstaller spec file for diet_parser sidecar binary

import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(SPEC))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..', '..'))

a = Analysis(
    [os.path.join(SCRIPT_DIR, 'diet_parser.py')],
    pathex=[SCRIPT_DIR],
    binaries=[],
    datas=[],
    hiddenimports=[
        'pdfminer',
        'pdfminer.high_level',
        'pdfminer.pdfpage',
        'pdfminer.pdfinterp',
        'pdfminer.converter',
        'pdfminer.layout',
        'pdfminer.pdfparser',
        'pdfminer.pdfdocument',
        'pdfminer.pdfdevice',
        'pdfminer.pdfcolor',
        'pdfminer.pdftypes',
        'pdfminer.utils',
        'pdfminer.cmapdb',
        'pdfminer.encodingdb',
        'pdfminer.fontmetrics',
        'pdfminer.image',
        'pdfminer.jbig2',
        'pdfminer.ascii85',
        'pdfminer.lzw',
        'PIL',
        'PIL.Image',
        'pdfplumber',
        'pdfplumber.page',
        'pdfplumber.utils',
        'pdfplumber.display',
    ],
    excludes=[
        'tkinter',
        'matplotlib',
        'numpy',
        'scipy',
        '_tkinter',
        'Tkinter',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='diet_parser',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
