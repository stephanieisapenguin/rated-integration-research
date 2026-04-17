#!/bin/bash

# ============================================
# Xcode CLI Tools Install Heartbeat Monitor
# ============================================

INTERVAL=10  # seconds between checks
LOG="$HOME/xcode_install_monitor.log"
START=$(date +%s)

echo "🔍 Starting Xcode CLI Tools install monitor..."
echo "📄 Logging to: $LOG"
echo "⏱  Checking every ${INTERVAL}s — press Ctrl+C to stop"
echo "-------------------------------------------"

# Kick off the install in background if not already running
if ! pgrep -f "xcode-select" > /dev/null; then
  echo "🚀 Launching xcode-select --install..."
  xcode-select --install 2>&1 &
  sleep 3
fi

log() {
  local msg="[$(date '+%H:%M:%S')] $1"
  echo "$msg" | tee -a "$LOG"
}

while true; do
  ELAPSED=$(( $(date +%s) - START ))
  MINS=$((ELAPSED / 60))
  SECS=$((ELAPSED % 60))

  # ---- 1. Is xcode-select process alive? ----
  if pgrep -f "xcode-select" > /dev/null; then
    PROC_STATUS="✅ xcode-select process ALIVE"
  else
    PROC_STATUS="⚠️  xcode-select process NOT found"
  fi

  # ---- 2. Is the installer running? ----
  if pgrep -f "InstallAssistant\|package\|installer\|xcode" > /dev/null; then
    INSTALLER_STATUS="📦 Installer process detected"
  else
    INSTALLER_STATUS="💤 No installer process found"
  fi

  # ---- 3. Check if tools already installed ----
  if xcode-select -p > /dev/null 2>&1; then
    INSTALL_PATH=$(xcode-select -p)
    log "🎉 DONE! Tools installed at: $INSTALL_PATH (took ${MINS}m ${SECS}s)"
    echo "✅ You can now run: npm install -g @anthropic-ai/claude-code"
    exit 0
  fi

  # ---- 4. Ping Apple to check network ----
  if ping -c 1 -W 2 swdist.apple.com > /dev/null 2>&1; then
    NET_STATUS="🌐 Network: Apple CDN reachable"
  else
    NET_STATUS="❌ Network: Apple CDN UNREACHABLE — possible ghost hang!"
  fi

  # ---- 5. Check disk activity (is anything being written?) ----
  DISK_WRITE=$(iostat -d 1 1 2>/dev/null | tail -1 | awk '{print $3}')
  if [ -n "$DISK_WRITE" ] && [ "$DISK_WRITE" != "0.00" ]; then
    DISK_STATUS="💾 Disk writes happening (${DISK_WRITE} KB/s) — progress!"
  else
    DISK_STATUS="😴 No disk activity detected"
  fi

  # ---- 6. Check tmp for partial downloads ----
  PARTIAL=$(ls /tmp/*.pkg /tmp/*.dmg 2>/dev/null | wc -l | tr -d ' ')
  if [ "$PARTIAL" -gt 0 ]; then
    PKG_STATUS="📥 Partial download files found in /tmp: $PARTIAL file(s)"
  else
    PKG_STATUS="📭 No partial downloads in /tmp"
  fi

  # ---- Print heartbeat ----
  log "⏱  Elapsed: ${MINS}m ${SECS}s"
  log "$PROC_STATUS"
  log "$INSTALLER_STATUS"
  log "$NET_STATUS"
  log "$DISK_STATUS"
  log "$PKG_STATUS"

  # ---- Ghost detection ----
  if [ "$ELAPSED" -gt 300 ] && ! pgrep -f "xcode-select\|InstallAssistant\|installer" > /dev/null; then
    log "👻 GHOST DETECTED — No process running after 5+ mins. Try: sudo xcode-select --reset"
  fi

  echo "-------------------------------------------"
  sleep $INTERVAL
done

