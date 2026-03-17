#!/usr/bin/env bash
set -e

echo "📦 Instalando dependências do frontend..."
cd frontend
npm install --include=dev
echo "🔨 Buildando frontend..."
npm run build

echo "📦 Instalando dependências do backend..."
cd ../backend
npm install --include=dev
echo "🔨 Copiando dist do frontend para backend/public..."
rm -rf public
cp -r ../frontend/dist public
echo "🔨 Buildando backend (tsc)..."
npm run build
echo "📁 Verificando dist/:"
ls -la dist/ || echo "❌ PASTA dist NÃO EXISTE!"
echo "🗄️  Gerando Prisma Client..."
npx prisma generate

echo "✅ Build completo! (migrations rodam no start)"
