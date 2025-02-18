FROM node:16-alpine

# 安装必要的构建依赖
RUN apk add --no-cache \
    git \
    make \
    g++ \
    python3 \
    bash

# 设置工作目录
WORKDIR /app

# 复制项目文件
COPY . .

# 设置 npm 配置以避免权限问题
RUN npm config set unsafe-perm true

# 安装依赖并构建
RUN npm install && \
    npm run build

# 安装 serve
RUN npm install -g serve

# 暴露端口
EXPOSE 8099

# 设置启动脚本权限
RUN chmod a+x /app/run.sh

# 启动服务
CMD [ "/app/run.sh" ] 
