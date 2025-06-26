#!/bin/bash
cd /home/kavia/workspace/code-generation/linguaquest-91317-158d2f77/jeopardy_english_frontend_workspace/jeopardy_english_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

