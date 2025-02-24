# 配置 Ubuntu 软件仓库镜像源

## 清华源

https://mirrors.tuna.tsinghua.edu.cn/help/ubuntu/

```
sudo tee /etc/apt/sources.list <<< "deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ noble main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ noble-updates main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ noble-backports main restricted universe multiverse"
```
