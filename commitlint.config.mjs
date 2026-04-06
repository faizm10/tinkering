export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "refactor",
        "docs",
        "test",
        "chore",
        "build",
        "ci",
        "style",
        "perf",
        "revert",
      ],
    ],
    "subject-case": [0],
  },
};
