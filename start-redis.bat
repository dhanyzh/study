@echo off
echo Starting Redis Server...
cd redis_bin
start /B redis-server.exe redis.windows.conf
echo Redis is running!
cd ..
