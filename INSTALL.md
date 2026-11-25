# kaxiaopu 安装与维护文档

[返回模板介绍](README.md)

适用于 **Dujiao-Next v1.6.1** 的独立前台模板，提供移动端适配、深浅色外观和分类侧栏。安装后可在管理后台切换，原有 `classic`、`vault` 和 `atelier` 模板继续保留。

本项目是基于 [Dujiao-Next](https://github.com/dujiao-next/dujiao-next) 的第三方模板接入包，不是官方发行版。

> **安装方式：将模板接入原版源码，重新编译一体化程序，再到后台启用。**
> 当前不支持在后台上传 ZIP 直接安装，也不能只上传 `frontend/user` 文件夹完成接入。

## 功能特点

- 独立模板标识 `kaxiaopu`，可与 `classic`、`vault`、`atelier` 切换。
- 适配桌面与手机，支持深色、浅色模式。
- 商品分类侧栏、分类商品数量和商品列表布局。
- 移动端个人中心侧栏、三列页脚导航。
- 商品详情保留标题图标、规格和购买区域，移除独立大图展示模块。
- 网站名称、Logo、商品和分类等读取目标系统配置与接口。
- 沿用系统业务接口；未单独定制的页面继续使用系统原页面。

模板包不包含数据库、商品图片、订单、账号、服务器配置或访问密钥。商品购买权限等业务设置由目标系统管理，不随模板安装改变。

## 兼容版本

| 项目 | 版本 / 要求 |
| --- | --- |
| Dujiao-Next | v1.6.1 |
| 已验证基线提交 | `f7b4354f121bae4f265724c687042ebea1a5934a` |
| 模板包 | 1.1.0 |
| Python | 3.9 或更高版本，用于安装工具 |
| Node.js | 24.x，构建环境依据原项目要求 |
| pnpm | **10.34.3**，与项目 `packageManager` 一致 |
| Go | 1.26.5 或兼容版本，以项目 `go.mod` 为准 |

其他版本或已修改过的源码需要先评估差异，不保证直接安装。不要通过升级依赖或强行覆盖文件解决安装冲突。

## 文件结构

发布模板接入包时，将本说明放在以下目录的根目录：

```text
kaxiaopu-reusable-v1.6.1/
├── README.md               本说明
├── install.py              检查、安装、恢复源码
├── manifest.json           兼容基线与文件校验信息
├── payload/                模板及必要的接入文件
├── integration.patch       供开发者审查、手工合并的文本补丁
├── validation.json         验证记录与已知限制
├── LICENSE                 原项目许可证
├── THIRD_PARTY_NOTICES.txt  第三方来源说明
└── SHA256SUMS.txt           发布文件校验值
```

**只有 README.md 无法安装模板。** 请同时取得 `install.py`、`manifest.json` 和完整 `payload/` 等配套文件。

## 快速安装：已有原版完整源码

先确认原包中同时存在 `go.mod`、`cmd/server` 和 `frontend`。如果只有可执行文件及配置文件，那是运行包，需要另外取得对应版本源码。

### 1. 解压到两个独立目录

以 Windows 为例：

```text
D:\projects\dujiao-next\                 原版 v1.6.1 源码
D:\templates\kaxiaopu-reusable-v1.6.1\    模板接入包
```

在源码副本或独立分支中操作，保留原始源码。无需手工将整个前台目录拖入原项目。

### 2. 检查并导入模板

Windows / PowerShell：

```powershell
Set-Location "D:\templates\kaxiaopu-reusable-v1.6.1"
python install.py check --project "D:\projects\dujiao-next"
python install.py install --project "D:\projects\dujiao-next"
```

Linux：

```bash
cd /opt/templates/kaxiaopu-reusable-v1.6.1
python3 install.py check --project /opt/build/dujiao-next
python3 install.py install --project /opt/build/dujiao-next
```

`--project` 必须指向原项目根目录，而不是 `frontend/user`。

安装工具会校验兼容性，将模板文件放入对应位置，并接入前台模板注册、后台选项与后端配置支持。新模板主体位于：

```text
frontend/user/src/templates/kaxiaopu/
```

`check` 不修改源码。`install` 会先备份受影响文件到项目的 `.kaxiaopu-template-backups/时间戳/`，并输出备份路径。保留该路径以便恢复。重复安装相同文件会跳过；发现版本或自定义代码冲突时会停止。

> 不要直接用 `payload/` 全量覆盖项目。发生冲突时，应由开发者参照 `integration.patch` 合并。补丁已包含字体的 Git 二进制差异。

## 编译一体化程序

需要依次构建 **用户前台、管理后台、Go 程序**。后台也增加了模板选项，因此不能只构建用户前台。

以下命令面向 Linux x86_64 服务器，使用干净的构建副本。每一步成功后再执行下一步；测试失败时先处理原因。

### Linux 构建

```bash
cd /opt/build/dujiao-next

# 1. 用户前台；确认版本输出为 10.34.3
cd frontend/user
corepack pnpm --version
corepack pnpm install --frozen-lockfile
corepack pnpm run test
corepack pnpm run build
cd ../..

# 2. 管理后台
cd frontend/admin
corepack pnpm install --frozen-lockfile
corepack pnpm run test
VITE_FULLSTACK=1 corepack pnpm run build
cd ../..

# 3. 将两个前端的构建产物放入后端嵌入目录
mkdir -p internal/web/dist/user internal/web/dist/admin build
cp -a frontend/user/dist/. internal/web/dist/user/
cp -a frontend/admin/dist/. internal/web/dist/admin/

# 4. 检查后端并编译
go vet ./...
go test ./...
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
  -tags release,fullstack \
  -ldflags '-s -w -X github.com/dujiao-next/internal/version.Version=v1.6.1-kaxiaopu-template-1.1.0' \
  -o build/dujiao-next ./cmd/server
```

### Windows / PowerShell 构建

```powershell
Set-Location "D:\projects\dujiao-next"

Push-Location frontend/user
corepack pnpm --version
corepack pnpm install --frozen-lockfile
corepack pnpm run test
corepack pnpm run build
Pop-Location

Push-Location frontend/admin
corepack pnpm install --frozen-lockfile
corepack pnpm run test
$env:VITE_FULLSTACK='1'
corepack pnpm run build
Remove-Item Env:VITE_FULLSTACK
Pop-Location

New-Item -ItemType Directory -Force internal/web/dist/user,internal/web/dist/admin,build
Copy-Item frontend/user/dist/* internal/web/dist/user -Recurse -Force
Copy-Item frontend/admin/dist/* internal/web/dist/admin -Recurse -Force

go vet ./...
go test ./...

$env:CGO_ENABLED='0'
$env:GOOS='linux'
$env:GOARCH='amd64'
go build -tags release,fullstack -ldflags '-s -w -X github.com/dujiao-next/internal/version.Version=v1.6.1-kaxiaopu-template-1.1.0' -o build/dujiao-next ./cmd/server
Remove-Item Env:GOOS,Env:GOARCH,Env:CGO_ENABLED
```

最终产物为 `build/dujiao-next`，已包含前台和后台资源，不需要单独部署一个前端服务。以上 Windows 命令生成的也是 **Linux 程序**，不能直接在 Windows 运行。

如使用 ARM64 服务器，将 `GOARCH` 改为 `arm64` 并在目标环境验证。重复构建建议使用干净副本，避免嵌入目录残留旧资源。若 `corepack` 不可用，请先按原项目要求准备 pnpm 10.34.3，不要自动改用其他主版本。

## 部署与后台启用

1. 备份现有程序、配置和一致性数据库快照。
2. 将新程序上传为候选文件，沿用现有部署流程完成停服、替换、启动和健康检查。
3. 保留原有数据库、上传目录、配置文件和反向代理设置。
4. 在管理后台打开 **系统设置 → 模板与展示 → 店面模板**，选择 `kaxiaopu` 并保存。
5. 访问前台 `/?template=reset`，取消当前浏览器的模板预览覆盖。

不要通过上传文件覆盖正在运行的程序，也不要用 v1.6.1 程序直接降级较新系统。安装工具只备份源码，不负责备份线上数据库。

可使用以下地址预览不同模板：

| 路径 | 效果 |
| --- | --- |
| `/?template=kaxiaopu` | 当前浏览器预览 kaxiaopu |
| `/?template=classic` | 当前浏览器预览经典模板 |
| `/?template=vault` | 当前浏览器预览 vault |
| `/?template=reset` | 取消预览覆盖，跟随后台设置 |

上线前请在测试环境检查：首页、分类、商品详情与规格、购物车、订单、登录及个人中心、移动端菜单、深浅色和四套模板切换。支付流程需要按目标系统的配置单独验证。

## 恢复与重新安装

只想换回原外观，在后台切换 `classic`、`vault` 或 `atelier` 即可。

如需撤销源码修改，先在后台切回原模板，再使用安装时输出的实际备份目录：

```powershell
python install.py restore --project "D:\projects\dujiao-next" --backup "D:\projects\dujiao-next\.kaxiaopu-template-backups\实际时间戳"
```

Linux 使用 `python3` 和对应的 Linux 路径。恢复后需要重新构建、部署。恢复工具遇到安装后的文件被再次修改时会停止，以免覆盖后续工作。

以后重新添加时，重复“检查 → 安装 → 构建 → 部署 → 后台启用”即可。官方升级可能覆盖自定义程序，升级前需要将模板合入目标版本并重新验证。

## 常见问题

**前台的包到底放在哪里？**

安装时由 `install.py` 将源码放入正确目录。编译后，`frontend/user/dist/` 的内容放入 `internal/web/dist/user/`；后台产物同样放入 `internal/web/dist/admin/`，最后编译 Go 一体化程序。

**后台没有 kaxiaopu，或保存后又变回原模板？**

确认已接入后台选项与后端配置支持，并部署了重新编译的完整程序。仅上传用户前台资源不足以完成安装。

**切换后页面没有变化？**

访问 `/?template=reset` 后刷新，确认后台设置已保存，并检查浏览器资源缓存。

**安装提示 Custom changes/version conflict？**

目标源码与支持的基线不一致。保留现有修改，手工审查合并补丁，不要删除冲突文件或强行覆盖。

**页面空白或资源 404？**

检查两个前端是否构建成功、产物是否复制到嵌入目录，以及 Go 构建是否包含 `fullstack` 标签。fullstack 后台产物不能直接当作独立根目录静态站点使用。

## 验证范围

模板接入包曾在干净的官方 v1.6.1 基线上验证：

- 用户前台 87 项测试、管理后台 55 项测试通过。
- 前台与 fullstack 后台构建通过。
- 设置相关测试、公开配置接口测试、架构检查及 `go vet` 通过。
- Linux amd64 一体化编译通过。
- 安装工具的重复安装、恢复和修改冲突保护通过。

全量 `go test ./...` 在验证时**未全部通过**，涉及 Windows/CGO 环境及数据库集成测试，具体以配套 `validation.json` 为准。通用包未做真实支付验证；上述结果不代表任意版本、环境或自定义源码都已验证。

## 开源与分发

源码及衍生模板沿用原项目的 GPL-3.0 许可，详见发布包中的 `LICENSE`。第三方来源见 `THIRD_PARTY_NOTICES.txt`，Inter 字体保留其 OFL 许可文件。分发时请一并保留许可证和来源说明。

发布到 GitHub 时只提交模板接入文件与说明，不要提交 `.env`、运行配置、数据库、访问密钥、线上上传文件、`node_modules/` 或 `.kaxiaopu-template-backups/`。新增或修改发布文件后，应同步更新校验清单。
