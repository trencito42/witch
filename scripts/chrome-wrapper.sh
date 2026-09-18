#!/bin/bash
export LD_LIBRARY_PATH=/home/witch/browser-libs/extracted/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH
exec /home/witch/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome "$@"
