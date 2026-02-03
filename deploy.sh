#!/bin/bash

# Motorlab.uz Deploy Script
# Bu scriptni serverda ishlatish uchun: chmod +x deploy.sh && ./deploy.sh

echo "🚀 Motorlab.uz Deploy boshlandi..."

# Ranglar
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Loyiha papkasi
PROJECT_DIR="/var/www/motorlab"

# Git dan yangi kodlarni olish
echo -e "${YELLOW}📥 Git dan yangi kodlar olinmoqda...${NC}"
cd $PROJECT_DIR
git pull origin main

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Git pull xato!${NC}"
    exit 1
fi

# Backend deploy
echo -e "${YELLOW}🔧 Backend deploy qilinmoqda...${NC}"
cd $PROJECT_DIR/backend

# Dependencies o'rnatish
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backend npm install xato!${NC}"
    exit 1
fi

# Build qilish
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backend build xato!${NC}"
    exit 1
fi

# PM2 restart
pm2 restart motorlab-backend

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backend restart xato!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backend muvaffaqiyatli deploy qilindi!${NC}"

# Frontend deploy
echo -e "${YELLOW}🎨 Frontend deploy qilinmoqda...${NC}"
cd $PROJECT_DIR/front

# Dependencies o'rnatish
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend npm install xato!${NC}"
    exit 1
fi

# Build qilish
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend build xato!${NC}"
    exit 1
fi

# PM2 restart
pm2 restart motorlab-frontend

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend restart xato!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend muvaffaqiyatli deploy qilindi!${NC}"

# PM2 statusni ko'rsatish
echo -e "${YELLOW}📊 PM2 Status:${NC}"
pm2 status

echo -e "${GREEN}🎉 Deploy muvaffaqiyatli tugadi!${NC}"
echo -e "${YELLOW}📝 Loglarni ko'rish: pm2 logs${NC}"
