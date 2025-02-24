# DockerCE 安装

## 脚本安装 Docker

```
curl -fsSL https://get.docker.com -o get-docker.sh
sudo DOWNLOAD_URL=https://mirrors.ustc.edu.cn/docker-ce sh get-docker.sh
```

## 配置 docker 镜像源

```
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": ["镜像源地址"]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```
