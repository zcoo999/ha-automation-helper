# 使用更稳定的 Node.js 版本
FROM node:16-alpine

# 安装必要的构建依赖
RUN apk add --no-cache \
    git \
    make \
    g++ \
    python3

# 设置工作目录
WORKDIR /app

# 复制项目文件
COPY . .

# 设置 npm 配置以避免权限问题
RUN npm config set unsafe-perm true

# 安装依赖
RUN npm install --production

# 构建项目
RUN npm run build

# 安装 serve 用于提供静态文件服务
RUN npm install -g serve

# 暴露端口
EXPOSE 8099

# 设置权限
RUN chmod +x /app/ha_automation_helper/run.sh

# 启动服务
CMD ["/app/ha_automation_helper/run.sh"] 
