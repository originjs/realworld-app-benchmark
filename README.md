# realworld-benchmark

## git submodule初始化
```bash
git submodule init
git submodule update
```

## 使用本地服务器
- 启动服务器
```bash
cd server/realword-express-sequelize
pnpm i
pnpm dev
```
以上命令会在本地启动realword后端服务
- 修改hosts
修改C:\Windows\System32\drivers\etc\hosts 文件
```
127.0.0.1 api.realworld.io
127.0.0.1 demo.productionready.io
127.0.0.1 static.productionready.io
127.0.0.1 conduit.productionready.io
127.0.0.1 code.ionicframework.com
```
- 刷新DNS缓存
```
ipconfig /flushdns
```
- 将CA.crt证书加入系统‘受信任的根证书颁发机构’