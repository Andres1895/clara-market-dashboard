#!/bin/bash

GREEN='\033[0;32m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

HOOKS_DIR=".git/hooks"
SCRIPTS_DIR="scripts/hooks"

if [ ! -d "$HOOKS_DIR" ]; then
  echo -e "${RED}✖ Not a git repository. Run this from your project root.${NC}"
  exit 1
fi

echo ""
echo -e "${CYAN}── Installing Claude Code git hooks ───────────────${NC}"

# pre-commit
ln -sf "../../${SCRIPTS_DIR}/pre-commit.sh" "${HOOKS_DIR}/pre-commit"
chmod +x "${HOOKS_DIR}/pre-commit"
echo -e "${GREEN}✔ pre-commit${NC}  → blocks oversized commits"

# post-commit
ln -sf "../../${SCRIPTS_DIR}/post-commit.sh" "${HOOKS_DIR}/post-commit"
chmod +x "${HOOKS_DIR}/post-commit"
echo -e "${GREEN}✔ post-commit${NC} → Claude doc agent runs after each commit"

# Create docs dir if it doesn't exist
mkdir -p docs

# Seed CHANGELOG if it doesn't exist
if [ ! -f "docs/CHANGELOG.md" ]; then
  echo "# Changelog" > docs/CHANGELOG.md
  echo "" >> docs/CHANGELOG.md
  echo -e "${GREEN}✔ Created docs/CHANGELOG.md${NC}"
fi

echo -e "${CYAN}───────────────────────────────────────────────────${NC}"
echo ""
echo -e "  Config lives in ${CYAN}scripts/hooks/pre-commit.sh${NC}:"
echo -e "    MAX_FILES      = 10   (files per commit)"
echo -e "    MAX_LINES      = 400  (total lines changed)"
echo -e "    MAX_FILE_LINES = 200  (lines per file)"
echo ""
echo -e "  Doc agent skill: ${CYAN}.claude/skills/doc-agent.md${NC}"
echo -e "  Doc agent log:   ${CYAN}tail -f /tmp/claude-doc-agent.log${NC}"
echo ""
echo -e "  To bypass pre-commit (use sparingly):"
echo -e "    ${CYAN}git commit --no-verify${NC}"
echo ""
