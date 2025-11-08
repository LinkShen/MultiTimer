# GitHub 上传指南

## 步骤 1: 在 GitHub 上创建仓库

1. 登录 GitHub (https://github.com)
2. 点击右上角的 "+" 按钮，选择 "New repository"
3. 填写仓库信息：
   - Repository name: `multi-timer` (或其他你喜欢的名称)
   - Description: `网页版多计时器应用`
   - 选择 Public 或 Private
   - **不要**勾选 "Initialize this repository with a README"（我们已经有了）
4. 点击 "Create repository"

## 步骤 2: 连接本地仓库到 GitHub

在终端中运行以下命令（将 `YOUR_USERNAME` 替换为你的 GitHub 用户名）：

```bash
cd /root/dev/multi-timer

# 添加远程仓库（替换 YOUR_USERNAME 和 REPO_NAME）
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# 推送代码到 GitHub
git push -u origin main
```

如果使用 SSH（需要配置 SSH 密钥）：

```bash
git remote add origin git@github.com:YOUR_USERNAME/REPO_NAME.git
git push -u origin main
```

## 步骤 3: 如果遇到身份验证问题

### 使用 Personal Access Token (推荐)

1. 在 GitHub 上生成 Personal Access Token:
   - 点击头像 -> Settings -> Developer settings -> Personal access tokens -> Tokens (classic)
   - 点击 "Generate new token (classic)"
   - 勾选 `repo` 权限
   - 复制生成的 token

2. 推送时使用 token 作为密码：
   ```bash
   git push -u origin main
   # 用户名: 你的 GitHub 用户名
   # 密码: 粘贴刚才生成的 token
   ```

### 或配置 SSH 密钥

```bash
# 生成 SSH 密钥（如果还没有）
ssh-keygen -t ed25519 -C "your_email@example.com"

# 复制公钥
cat ~/.ssh/id_ed25519.pub

# 在 GitHub 上添加 SSH 密钥:
# Settings -> SSH and GPG keys -> New SSH key
```

## 快速命令模板

如果你已经创建了 GitHub 仓库，直接运行：

```bash
cd /root/dev/multi-timer
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git push -u origin main
```

## 后续更新

以后更新代码时：

```bash
git add .
git commit -m "描述你的更改"
git push
```

