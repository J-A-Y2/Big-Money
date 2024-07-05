# Build stage
FROM node:20-alpine as build

# Working directory 설정
WORKDIR /usr/src/app

# Package 파일을 복사하고 의존성 설치
COPY package*.json ./
RUN npm install

# 소스 코드를 복사하고 빌드
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine as production

# Working directory 설정
WORKDIR /usr/src/app

# 빌드 단계에서 생성된 파일을 복사
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/package*.json ./

# 프로덕션 의존성만 설치 (불필요한 파일 제거 -> 파일 용량 줄임)
RUN npm install --only=production

# 포트 노출
EXPOSE 3000

# 애플리케이션 실행
CMD ["node", "dist/main"]
