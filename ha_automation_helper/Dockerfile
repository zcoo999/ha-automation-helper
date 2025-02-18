FROM node:16-alpine

# 安装必要的构建依赖
RUN apk add --no-cache \
    git \
    make \
    g++ \
    python3 \
    bash

# 设置工作目录
WORKDIR /build

# 复制项目文件
COPY package.json package-lock.json ./
COPY public ./public
COPY src ./src
COPY index.html ./
COPY tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY vite.config.ts postcss.config.js tailwind.config.js ./

# 设置 npm 配置以避免权限问题
RUN npm config set unsafe-perm true

# 安装依赖并构建
RUN npm install && \
    npm run build

# 创建运行目录
WORKDIR /app

# 复制构建后的文件
RUN cp -r /build/dist /app/dist && \
    rm -rf /build

# 安装 serve
RUN npm install -g serve

# 复制启动脚本
COPY ha_automation_helper/run.sh /app/run.sh

# 设置启动脚本权限
RUN chmod a+x /app/run.sh

# 暴露端口
EXPOSE 8099

# 启动服务
CMD [ "/app/run.sh" ] 
