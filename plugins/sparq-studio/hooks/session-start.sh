#!/usr/bin/env bash
# SPARQ Studio: short context for Claude at session start (no network, < 1 s).
NODE="$(command -v node || true)"
if [ -z "$NODE" ]; then
  echo "SPARQ Studio: Node.js не найден — встроенный сервер Figma не запустится. Предложи пользователю установить Node.js LTS (nodejs.org) и перезапустить Claude Desktop."
  exit 0
fi
V="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null)"
if [ -n "$V" ] && [ "$V" -lt 18 ]; then echo "SPARQ Studio: Node.js $V слишком старый (нужен 18+)."; exit 0; fi
TOKEN="нет (комментарии Figma недоступны, см. /sparq-studio:setup)"
[ -s "$HOME/.sparq-studio/figma-token" ] && TOKEN="есть"
echo "SPARQ Studio установлен. Для работы с Figma начинай с sparq_status (скилл sparq-studio); режимы: презентации — sparq-deck, карточки — sparq-cards, вычитка — sparq-editor. Токен Figma: $TOKEN."
