#!/bin/sh
# RepoPulse installer — drops the RepoPulse agent skill into this project so your
# AI coding agent can wire up analytics and report back to the dashboard.
#
# Usage:
#   curl -fsSL https://repo-pulse-eta.vercel.app/install.sh | sh
#   curl -fsSL https://repo-pulse-eta.vercel.app/install.sh | sh -s -- rp_pub_yourkey
set -e

BASE_URL="https://repo-pulse-eta.vercel.app"
KEY="$1"

# Install the skill where common AI agents look for it.
SKILL_DIRS=".claude/skills/repopulse .cursor/skills/repopulse .windsurf/skills/repopulse"

printf "\nInstalling the RepoPulse skill...\n"

INSTALLED=""
for dir in $SKILL_DIRS; do
  parent=$(dirname "$(dirname "$dir")")
  # Only create the skill for agents whose top-level dir already exists,
  # plus always install for Claude Code (.claude).
  if [ "$parent" = ".claude" ] || [ -d "$parent" ]; then
    mkdir -p "$dir"
    if curl -fsSL "$BASE_URL/cli/SKILL.md" -o "$dir/SKILL.md"; then
      printf "  ✓ %s/SKILL.md\n" "$dir"
      INSTALLED="yes"
    fi
  fi
done

if [ -z "$INSTALLED" ]; then
  mkdir -p ".claude/skills/repopulse"
  curl -fsSL "$BASE_URL/cli/SKILL.md" -o ".claude/skills/repopulse/SKILL.md"
  printf "  ✓ .claude/skills/repopulse/SKILL.md\n"
fi

if [ -n "$KEY" ]; then
  printf "%s\n" "$KEY" > .repopulse-key
  printf "  ✓ saved project key to .repopulse-key\n"
fi

cat <<'EOF'

RepoPulse skill installed.

Next step — open your AI coding agent (Claude Code, Cursor, Windsurf, …) in this
project and say:

    Set up RepoPulse analytics

The agent will detect your framework, wire in the snippet, and report the install
back to your RepoPulse dashboard. If you didn't pass a key, it'll ask for your
rp_pub_ project key (copy it from the RepoPulse onboarding or repository settings).

EOF
