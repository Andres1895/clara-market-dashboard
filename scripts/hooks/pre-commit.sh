#!/bin/bash

# ── Config ──────────────────────────────────────────────
MAX_FILES=10
MAX_LINES=400
MAX_FILE_LINES=200

VALID_TYPES="feat|fix|chore|test|refactor|docs|style|perf"
VALID_SCOPES="setup|types|api|hooks|market-table|detail-panel|ui|tests"
# ────────────────────────────────────────────────────────

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

COMMIT_MSG=$(cat ".git/COMMIT_EDITMSG" 2>/dev/null || echo "")
STAGED_FILES=$(git diff --cached --name-only | grep -v "package-lock.json\|yarn.lock\|pnpm-lock.yaml")
FILE_COUNT=$(echo "$STAGED_FILES" | grep -c .)
LINES_ADDED=$(git diff --cached --numstat | awk '{ add += $1 } END { print add+0 }')
LINES_REMOVED=$(git diff --cached --numstat | awk '{ del += $2 } END { print del+0 }')
TOTAL_LINES=$((LINES_ADDED + LINES_REMOVED))

ERRORS=0

# ── Rule 1: Conventional Commits ──────────────────────
echo ""
echo -e "${CYAN}── Conventional Commit Check ──────────────────────${NC}"

CONVENTIONAL_PATTERN="^($VALID_TYPES)(\(($VALID_SCOPES)\))!?: .{1,72}$"

if [[ ! "$COMMIT_MSG" =~ $CONVENTIONAL_PATTERN ]]; then
  echo -e "${RED}✖ Commit message does not follow Conventional Commits${NC}"
  echo ""
  echo -e "  ${YELLOW}Format:${NC} ${CYAN}type(scope): description${NC}"
  echo ""
  echo -e "  ${YELLOW}Valid types:${NC}"
  echo -e "    feat · fix · chore · test · refactor · docs · style · perf"
  echo ""
  echo -e "  ${YELLOW}Valid scopes for this project:${NC}"
  echo -e "    setup · types · api · hooks"
  echo -e "    market-table · detail-panel · ui · tests"
  echo ""
  echo -e "  ${YELLOW}Examples:${NC}"
  echo -e "    ${GREEN}feat(market-table): add sortable columns${NC}"
  echo -e "    ${GREEN}fix(api): handle 429 rate limit response${NC}"
  echo -e "    ${GREEN}test(hooks): add useMarketData unit tests${NC}"
  echo -e "    ${GREEN}chore(setup): scaffold Vite project${NC}"
  echo ""
  echo -e "  ${YELLOW}Your message:${NC} ${RED}${COMMIT_MSG}${NC}"
  ERRORS=1
else
  echo -e "${GREEN}✔ Commit message is valid${NC}"
fi

# ── Rule 2: Commit size ────────────────────────────────
echo ""
echo -e "${CYAN}── Commit Size Check ──────────────────────────────${NC}"
echo -e "  Files changed : ${FILE_COUNT} / ${MAX_FILES}"
echo -e "  Lines changed : ${TOTAL_LINES} / ${MAX_LINES} (+${LINES_ADDED} / -${LINES_REMOVED})"
echo -e "${CYAN}───────────────────────────────────────────────────${NC}"

if [ "$FILE_COUNT" -gt "$MAX_FILES" ]; then
  echo ""
  echo -e "${RED}✖ Too many files staged: ${FILE_COUNT} (max ${MAX_FILES})${NC}"
  echo -e "${YELLOW}  Suggested order: types → api → hooks → components → tests${NC}"
  ERRORS=1
fi

if [ "$TOTAL_LINES" -gt "$MAX_LINES" ]; then
  echo ""
  echo -e "${RED}✖ Too many lines changed: ${TOTAL_LINES} (max ${MAX_LINES})${NC}"
  echo -e "${YELLOW}  Break this into smaller commits per scope.${NC}"
  ERRORS=1
fi

while IFS= read -r file; do
  if [ -z "$file" ]; then continue; fi
  FILE_LINES=$(git diff --cached --numstat -- "$file" | awk '{ print $1+$2 }')
  if [ "${FILE_LINES:-0}" -gt "$MAX_FILE_LINES" ]; then
    echo ""
    echo -e "${RED}✖ ${file}: ${FILE_LINES} lines changed (max ${MAX_FILE_LINES} per file)${NC}"
    echo -e "${YELLOW}  This file may be doing too much. Consider splitting it.${NC}"
    ERRORS=1
  fi
done <<< "$STAGED_FILES"

# ── Rule 3: Mixed concerns warning ────────────────────
HAS_TYPES=$(echo "$STAGED_FILES" | grep -c "types/\|\.types\.ts" || true)
HAS_TESTS=$(echo "$STAGED_FILES" | grep -c "\.test\.\|\.spec\.\|__tests__" || true)
HAS_COMPONENTS=$(echo "$STAGED_FILES" | grep -c "components/\|pages/" || true)
HAS_API=$(echo "$STAGED_FILES" | grep -c "api/\|services/\|hooks/" || true)

CONCERN_COUNT=0
for c in $HAS_TYPES $HAS_TESTS $HAS_COMPONENTS $HAS_API; do
  [ "${c:-0}" -gt 0 ] && CONCERN_COUNT=$((CONCERN_COUNT + 1))
done

if [ "$CONCERN_COUNT" -ge 3 ] && [ "$FILE_COUNT" -gt 4 ]; then
  echo ""
  echo -e "${YELLOW}⚠ Mixed concerns detected — consider splitting by layer:${NC}"
  [ "${HAS_TYPES:-0}" -gt 0 ]      && echo -e "    ${CYAN}·${NC} types/interfaces"
  [ "${HAS_API:-0}" -gt 0 ]        && echo -e "    ${CYAN}·${NC} api/hooks"
  [ "${HAS_COMPONENTS:-0}" -gt 0 ] && echo -e "    ${CYAN}·${NC} components"
  [ "${HAS_TESTS:-0}" -gt 0 ]      && echo -e "    ${CYAN}·${NC} tests"
fi

# ── Result ─────────────────────────────────────────────
echo ""
if [ "$ERRORS" -ne 0 ]; then
  echo -e "${RED}✖ Commit blocked. Fix the issues above.${NC}"
  echo -e "${YELLOW}  To bypass (use sparingly): git commit --no-verify${NC}"
  echo ""
  exit 1
fi

echo -e "${GREEN}✔ All checks passed.${NC}"
echo ""
exit 0
