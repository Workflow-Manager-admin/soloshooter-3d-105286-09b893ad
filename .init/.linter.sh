#!/bin/bash
cd /home/kavia/workspace/code-generation/soloshooter-3d-105286-09b893ad/game_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

