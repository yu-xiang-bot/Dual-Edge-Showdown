# 邮箱验证码服务配置说明

## 功能说明

已将注册功能改为使用邮箱验证码注册,用户注册时会收到一封包含6位数字验证码的邮件,验证码有效期为5分钟。

## 快速开始

### 1. 安装依赖

```bash
pip install flask flask-cors
```

### 2. 配置邮箱

编辑 `send_email.py` 文件,填写你的邮箱配置:

```python
EMAIL_CONFIG = {
    'smtp_server': 'smtp.qq.com',  # SMTP服务器地址
    'smtp_port': 587,              # SMTP端口
    'sender_email': 'your_email@qq.com',  # 你的邮箱
    'sender_password': 'your_authorization_code',  # 邮箱授权码
    'sender_name': '双锋对决游戏'
}
```

### 3. 获取邮箱授权码

#### QQ邮箱
1. 登录QQ邮箱网页版
2. 点击 "设置" -> "账户"
3. 找到 "POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务"
4. 开启 "POP3/SMTP服务"
5. 点击 "生成授权码"
6. 按提示发送短信获取授权码

#### 163网易邮箱
1. 登录163邮箱网页版
2. 点击 "设置" -> "POP3/SMTP/IMAP"
3. 开启 "POP3/SMTP服务"
4. 按提示发送短信获取授权码

#### Gmail
1. 开启两步验证
2. 生成应用专用密码
3. 使用该密码作为授权码

### 4. 启动邮件服务

```bash
python send_email.py
```

服务将在 `http://localhost:5000` 启动

### 5. 启动前端服务器

```bash
python server.py
```

前端将在 `http://localhost:8000` 启动

## API 接口

### 发送验证码

**请求:**
```
POST /api/send-verification-email
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**响应:**
```json
{
  "success": true,
  "message": "验证码已发送到您的邮箱",
  "expires_in": 300
}
```

### 验证验证码

**请求:**
```
POST /api/verify-code
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456"
}
```

**响应:**
```json
{
  "success": true,
  "message": "验证成功"
}
```

## 邮件模板

验证码邮件采用HTML格式,包含:
- 游戏logo和品牌
- 6位验证码(大号显示)
- 有效期提示
- 安全警告
- 页脚信息

## 安全特性

1. **验证码有效期**: 5分钟后自动过期
2. **一次性使用**: 验证成功后立即删除
3. **自动清理**: 后台线程每分钟清理过期验证码
4. **邮箱格式验证**: 前端和后端双重验证
5. **防重复发送**: 60秒倒计时防止频繁发送

## 生产环境建议

1. **使用Redis**: 将验证码存储在Redis中,支持分布式部署
2. **限流**: 添加IP限流,防止恶意攻击
3. **SSL**: 使用HTTPS加密传输
4. **日志**: 记录发送日志,便于追踪
5. **监控**: 监控邮件发送成功率
6. **备用邮箱**: 配置多个发件邮箱,提高可靠性

## 故障排查

### 邮件发送失败
- 检查SMTP服务器配置
- 确认邮箱授权码正确
- 检查网络连接
- 查看防火墙设置

### 验证码验证失败
- 确认验证码输入正确
- 检查验证码是否过期(5分钟有效期)
- 确认邮箱地址一致

### CORS错误
- 确保邮件服务已启动
- 检查前端API地址配置

## 测试模式

在开发过程中,如果不想配置真实的邮箱发送,可以临时修改 `login.html` 中的代码:

```javascript
// 在 sendVerificationCode 函数中,直接显示验证码(不发送邮件)
verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
console.log('测试验证码:', verificationCode);
alert(`测试验证码: ${verificationCode}`);
```

## 联系方式

如有问题,请联系开发团队。
