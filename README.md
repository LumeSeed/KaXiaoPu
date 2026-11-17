# kaxiaopu Theme

为 [Dujiao-Next](https://github.com/dujiao-next/dujiao-next) 制作的独立前台模板：分类侧栏、紧凑商品列表、移动端布局与深浅色模式。

基于 **v1.5.2**。模板标识为 **`kaxiaopu`**，安装后可在后台切换，原有 `classic` / `vault` 模板独立保留。

## 免责声明与来源说明

1. **第三方项目**：本模板基于 Dujiao-Next 开源代码进行修改，并非官方产品，与上游项目及界面参考站点无隶属、合作或背书关系。
2. **许可与归属**：原始代码版权归各自作者所有，衍生代码沿用上游 GPL-3.0 许可；具体权利、义务及免责条款以随包许可证为准。第三方字体按其附带许可使用。
3. **使用与维护**：项目按现状提供，不承诺兼容所有系统版本、第三方插件或部署环境。使用前应自行备份、测试并核对配置；模板展示正常不代表订单、支付和发货流程已验证。
4. **经营内容**：本项目提供界面模板，不提供商品、账号、支付服务或运营资质，也不为使用者发布的内容或交易作出背书。使用者应确保自己的部署与经营活动符合适用要求。
5. **品牌与素材**：站点品牌、商标及自行上传的素材，其使用权需由使用者确认；代码许可不代表获得第三方商标或素材授权。
6. **问题反馈**：如发现代码、素材来源或权利归属问题，请通过仓库 Issue 提供文件位置和说明；涉及个人信息或凭据时请勿公开提交。

## 效果与功能

| 位置 | 调整 |
| --- | --- |
| 商品分类 | 左侧分类导航、选中状态、商品数量 |
| 商品列表 | 紧凑列表，展示价格、库存与购买入口 |
| 商品详情 | 保留标题图标、规格与购买区域，移除独立大图模块 |
| 个人中心 | 移动端使用侧栏菜单 |
| 页脚 | 移动端三列导航 |
| 外观 | 深色 / 浅色，桌面与手机适配 |
| 站点信息 | 站名、Logo、商品和分类读取系统配置与接口 |

沿用原系统的业务接口；未单独定制的页面使用系统原页面。包内不附带商品数据、订单、账号、支付配置或品牌扫光动图。

## 安装原理

Dujiao-Next v1.5.2 的模板需要在源码中注册，不能把一个新目录上传到服务器后自动识别。

本包负责接入三部分：

```text
用户前台 → 新增 kaxiaopu 模板及注册
管理后台 → 新增 kaxiaopu 模板选择项
后端配置 → 接受并返回 kaxiaopu 模板标识
```

接入后重新编译一体化程序。部署仍沿用原站点，不需要另开一个前端服务。

## 包内文件

```text
.
├── README.md               模板介绍与快速安装
├── INSTALL.md              详细构建、部署、恢复和排错
├── LICENSE                 上游 GPL-3.0 许可证
├── THIRD_PARTY_NOTICES.txt  来源与第三方字体说明
├── install.py              检查、安装和恢复工具
├── manifest.json           兼容版本与文件校验
├── payload/                按原项目目录组织的接入文件
│   ├── frontend/user/      前台模板及接入改动
│   ├── frontend/admin/     后台模板选项及文案
│   └── internal/           后端配置支持及相关测试
├── integration.patch       供开发者手工合并的文本补丁
├── validation.json         验证记录
└── SHA256SUMS.txt           发布校验清单
```

说明文件需与完整模板接入包一同使用。`payload/` 不能单独作为完整项目运行。

## 快速安装

准备 **Dujiao-Next v1.5.2 完整源码**和本模板接入包，分别解压。原项目根目录应包含 `go.mod` 和 `frontend/`。

在模板包目录运行，将路径替换为你的源码目录：

```bash
# 检查版本与文件冲突
python3 install.py check --project /path/to/dujiao-next

# 检查通过后安装
python3 install.py install --project /path/to/dujiao-next
```

Windows 可使用 `python`：

```powershell
python install.py check --project "D:\projects\dujiao-next"
python install.py install --project "D:\projects\dujiao-next"
```

安装工具自动将文件放到对应位置，原文件备份在 `.kaxiaopu-template-backups/`。新模板主体位于 `frontend/user/src/templates/kaxiaopu/`，无需手动搬移整个前台目录。

遇到版本或定制代码冲突时会停止，不要强行覆盖。手工合并可参考 `integration.patch`，二进制字体需从 `payload/` 对照接入。

## 编译与启用

安装后按以下顺序构建：

1. 构建 `frontend/user` 用户前台。
2. 以 `VITE_FULLSTACK=1` 构建 `frontend/admin` 管理后台。
3. 将两个 `dist/` 的内容分别复制到 `internal/web/dist/user/` 与 `internal/web/dist/admin/`。
4. 带 `release,fullstack` 标签编译 Go 程序，备份后按原部署方式发布。
5. 后台进入 **系统设置 → 模板与展示 → 店面模板**，选择 **kaxiaopu** 并保存。

**可直接复制的 Windows / Linux 完整命令见 [安装文档](INSTALL.md#编译一体化程序)。**

构建环境：Python 3.9+、Node.js 24.x、pnpm **10.34.3**、Go **1.26.5** 或兼容版本。其他系统版本需要另行适配。

## 预览与切换

```text
/?template=kaxiaopu   预览新模板
/?template=classic    预览经典模板
/?template=vault      预览 vault
/?template=reset      取消预览，跟随后台设置
```

URL 预览只对当前浏览器生效，正式启用请在后台保存。无需修改数据库。

## 卸载与更新

临时停用：后台切换回 `classic` 或 `vault`。

撤销源码：使用安装时生成的备份目录运行 `install.py restore`，然后重新编译部署。具体命令见 [恢复与重新安装](INSTALL.md#恢复与重新安装)。

升级 Dujiao-Next 前，需将模板合入目标版本重新验证；不要直接将旧版文件覆盖到新版源码。

## 常见问题

- **能直接上传 ZIP 安装吗？** 不能，当前是源码接入包，需要重新构建。
- **只上传前台 dist 可以吗？** 不足以完成后台切换接入，需要部署包含前台、后台和配置支持的一体化程序。
- **后台没有新模板？** 检查是否构建了管理后台并部署了新程序。
- **切换后没变化？** 访问 `/?template=reset`，刷新并检查后台是否保存成功。
- **原模板会被替换吗？** 不会，三套模板使用独立标识；共享接入文件会有必要调整。

更多排错与测试边界见 [安装文档](INSTALL.md)。前后台构建、相关测试及 Linux amd64 编译已验证；全量 Go 测试未全部通过，通用包未做真实支付验证，详见配套 `validation.json`。

## 来源与许可

本项目是基于 Dujiao-Next 的第三方衍生模板，与上游无官方隶属或背书关系。原始代码版权归原作者所有，源码沿用上游 GPL-3.0 许可；分发时保留 `LICENSE`、来源说明及字体 OFL 文件。

发布文件中不应包含运行配置、密钥、数据库、线上上传文件或安装备份。详细来源见 `THIRD_PARTY_NOTICES.txt`。

