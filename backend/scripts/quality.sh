#!/bin/bash
set -e

echo "🔍 Ejecutando verificación de calidad del backend Arte Católica..."
echo "─────────────────────────────────────────────"

composer format
vendor/bin/phpcbf || true

if composer lint; then
  echo "✅ PHPCS — sin errores de estilo"
else
  echo "⚠️  PHPCS — errores de estilo detectados"
fi

if composer analyse; then
  echo "✅ PHPStan — sin errores de análisis"
else
  echo "❌ PHPStan — errores detectados"
  exit 1
fi

if composer test; then
  echo "✅ PHPUnit — todas las pruebas pasaron"
else
  echo "❌ PHPUnit — fallos en tests"
  exit 1
fi

echo ""
echo "🎉 Todo correcto — calidad del código OK ✅"
exit 0
