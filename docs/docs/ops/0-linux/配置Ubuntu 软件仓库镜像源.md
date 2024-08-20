# 配置 Ubuntu 软件仓库镜像源

## 清华源

https://mirrors.tuna.tsinghua.edu.cn/help/ubuntu/

### Ubuntu 24.04 之前版本

```
tee -a /etc/apt/sources.list <<< "deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ noble main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ noble-updates main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ noble-backports main restricted universe multiverse"
```

### Ubuntu 24.04 后版本

```
tee -a /etc/apt/sources.list.d/ubuntu.sources <<< "Types: deb
URIs: https://mirrors.tuna.tsinghua.edu.cn/ubuntu
Suites: noble noble-updates noble-backports
Components: main restricted universe multiverse
Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg
Types: deb
URIs: http://security.ubuntu.com/ubuntu/
Suites: noble-security
Components: main restricted universe multiverse
Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg"
```
