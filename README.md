# AirSIM for MU300 — OpenWrt LuCI 通话网关插件

将运行 **mu300-linux OpenWrt** 的 U30 Air / ZTE F50（MU300）接入 [AirSIM](https://github.com/kai-wu-cortex/AirSIM) 的独立硬件适配项目。

项目类型：**LuCI 管理插件 + Linux Agent 适配层 + 蜂窝通话 PCM 音频桥**。它不是 Android APK、iOS 客户端，也不是完整 Linux 固件；不负责刷机或解锁设备。

[下载 Release](https://github.com/kai-wu-cortex/airsim-mu300/releases) · [快速安装](#快速安装) · [AI Agent 硬件适配指南](HARDWARE_ADAPTATION.md) · [问题反馈](https://github.com/kai-wu-cortex/airsim-mu300/issues)

> **开发预览版 v0.1.0-r12。** 已验证安装、配对协议、拨号/接听控制、短时 PCM 和部分实机语音。iPhone 端到端双向语音、多路呼叫等待、长通话及反复挂断尚未完成完整验收。不要用于紧急呼叫或依赖高可用性的业务。

## 功能

- LuCI 展示服务、SIM 本机号码、网络、通话和音频状态。
- 启动/关闭服务并显示确认结果；获取六位配对码时开启 120 秒 Bonjour 发现。
- 复用 AirSIM 配对与 VoWLAN 协议，提供经过身份验证的局域网通话网关。
- 通过 MU300 SIM 拨号、选择具体来电接听、选择具体通话挂断。
- 将硬件通话音频转换为 AirSIM PCM，兼容现有云端 Relay 媒体链路。
- 在状态卡下方查看短信、未读数量、全文及发送短信，发送前二次确认。
- 固定上游 Agent 提交，在隔离副本应用 MU300 补丁，**不修改 AirSIM iOS / Android 项目**。

### 当前边界

| 功能 | 状态与限制 |
| --- | --- |
| LuCI 通话控制 | 网页不提供麦克风/扬声器，不自动建立客户端媒体会话 |
| SIM 本机号码 | 从 SIM / 基带读取；未存储时显示未提供，不推测号码 |
| 通话身份 | UUID 与操作回执；基带快照短暂缺失下的 ID 连续性仍需实机回归，多路验收未完成 |
| 呼叫等待 | 定向接听/挂断与保持策略；不是会议通话或完整多路切换 UI |
| PCM | 单媒体会话；当前网络音频为 8 kHz、单声道、S16LE |
| 短信 | 仅 LuCI 管理；每条最多 70 字，不支持 emoji、长短信拆分或 AirSIM 客户端转发 |
| 远程访问 | 需要兼容 AirSIM 客户端/Relay；不应把 LuCI、SSH 或裸 PCM 暴露到公网 |

## 支持环境

自动安装只放行以下**实际验证过的组合**：

| 项目 | 验证值 |
| --- | --- |
| 实机 | U30 Air（MU300 平台） |
| 系统 | mu300-linux `v2026.10.26.1`，OpenWrt `25.12.6` |
| 架构 | Linux `aarch64` / 软件包 `aarch64_generic` |
| 内核 | `5.4.254-gb50db5b6224c` |
| 音频 | mu300-audio `v1.0.5`，匹配此内核的模块 |
| 包管理 | APK v3；**不是 Android APK**，不能安装到 Android |

F50、其他内核、Ubuntu、其他 OpenWrt 版本尚未完成本插件验收。上游系统支持不等于本 Release 可直接安装。新设备请从 [硬件适配指南](HARDWARE_ADAPTATION.md) 开始，不要强装内核模块。

## 快速安装

前提：设备已运行匹配的 mu300-linux OpenWrt、SIM 能注册网络，电脑可通过 SSH / LuCI 访问设备。安装前结束全部电话和短信发送任务。首次启动可能下载上游 DSP 固件，需要联网；**本项目不分发专有固件或厂商参数文件**。

### 方式一：设备端安装脚本

在 **MU300 的 SSH 终端**执行，不是在电脑终端直接安装：

```sh
cd /tmp
wget -O airsim-install.sh https://github.com/kai-wu-cortex/airsim-mu300/releases/download/v0.1.0-r12/install.sh
less airsim-install.sh
sh airsim-install.sh --check
sh airsim-install.sh --install
```

没有 `less` 可用 `cat` 查看。脚本固定版本，检查设备/内核、空闲通话及短信任务，校验下载和固定公钥指纹，再通过 APK 签名检查安装；不使用 `--allow-untrusted`，不自动拨号、发送短信或开启服务。下载失败不更改软件源。

这是本项目的**开发签名公钥**，不是 OpenWrt 官方软件源密钥。公钥 SHA-256：

```text
0ce703e76ea4b702194c54b90534d7127874bb38ecda17f7ed6b1add2d2cf1de
```

SHA256SUMS 用于完整性检查；首次信任来自核对的仓库与公钥指纹，同一下载源的校验文件不是独立的真实性证明。

### 方式二：LuCI 手动安装

1. 从同一 [Release](https://github.com/kai-wu-cortex/airsim-mu300/releases/tag/v0.1.0-r12) 下载 `luci-app-airsim-0.1.0-r12.apk`、`airsim-dev.pem`、`SHA256SUMS`。
2. 核对文件哈希与公钥指纹，在 OpenWrt 软件包/公钥管理中导入公钥。
3. 上传安装 APK，不使用忽略签名或强制依赖选项。
4. 刷新 LuCI，进入 **服务 → AirSIM**；会话过期时重新登录。

### 启动与配对

1. 点击“启动服务”，等待文字提示成功；首次 DSP 初始化可能需要约一分钟。
2. 将 iPhone 与 MU300 放在同一局域网，点击“获取配对码”。
3. 120 秒内在 AirSIM 添加自动发现的 `AirSIM-MU300-*`，输入六位码。
4. 使用获准拨打的测试号码验证通话，再由另一部电话打入验证接听与双向声音。

配对成功不等于媒体通过验收。“Relay 已配置”不等于公网通话可用。不要为了配对关闭身份验证或扩大防火墙开放范围。

### 升级、回退与卸载

- 升级前结束通话，保存前一版本 APK 和必要配置的私有备份；不要上传配对密钥。
- 当前版本保留配置与配对状态；很早的 r5 之前配对记录可能需要重新配对。
- 回退：空闲时安装保存且签名可信的旧包；涉及数据格式变化时先读对应 Release，不能假设任意版本可回退。
- 卸载：停止服务，通过 LuCI 删除 `luci-app-airsim`，或执行 `apk del luci-app-airsim`。钩子尝试恢复接管的上游语音启动项；私有数据目录保留，不自动擦除。

## 工作原理

```text
AirSIM 客户端 ── 加密配对 / 签名 VoWLAN ── MU300 网关
                                               ├─ Agent → mu300-atd → 基带 / SIM
                                               └─ PCM 桥 → mu300-audio → ALSA / DSP
LuCI ── 登录会话 + rpcd ACL ── 服务控制 / 配对 / 通话 / 原生短信服务
```

`mu300-atd` 独占 AT 串口；插件不抢占串口、不套用其他设备的 USB 恢复/刷写逻辑。信令、媒体和发现服务分层，“AT 能拨号”不代表“有双向声音”。

| 接口 | 默认地址 | 用途 |
| --- | --- | --- |
| Agent | `127.0.0.1:8575` | 内部状态和控制 |
| PCM 桥 | `127.0.0.1:7580` | 内部音频，不直接向 LAN 开放 |
| 管理后端 | `127.0.0.1:7581` | LuCI / rpcd 操作 |
| 配对 | LAN `8580` | 限时 Bonjour 配对窗口 |
| VoWLAN | LAN `8581` / `8582` | 签名控制 / 认证 PCM |

配对加密与请求认证不意味着全部媒体使用 TLS 加密；当前局域网 PCM 会话认证后传输原始音频。仅在可信 LAN 使用，跨不可信网络需安全隧道或经审查的传输设计。

## 源码与构建

需要 Git、Go 1.24+、Node.js（测试）、Docker、curl、OpenSSL。

```sh
git clone https://github.com/kai-wu-cortex/airsim-mu300.git
git clone https://github.com/kai-wu-cortex/AirSIM.git
cd airsim-mu300
go test -race ./...
go vet ./...
node --test scripts/overview.test.mjs scripts/sms.test.mjs scripts/install.test.mjs
AGENT_TREE=$(sh scripts/prepare-agent.sh)
(cd "$AGENT_TREE/module/module-agent" && go test -race ./... && go vet ./...)
docker pull node:22-alpine
sh scripts/package-apk.sh
```

Agent 固定到 [`cc2ade3124ac34bec7d8c441f4b66a57a6dfec62`](https://github.com/kai-wu-cortex/AirSIM/commit/cc2ade3124ac34bec7d8c441f4b66a57a6dfec62)，见 `patches/AIRSIM_BASE`。构建器只读提交，将补丁应用到 `out/` 隔离副本，不修改相邻主项目。

`AIRSIM_UPSTREAM_REPO` 指定只读上游 Git 仓库；`AIRSIM_PACKAGE_KEY` 指定签名私钥。默认密钥仅存在本机 `out/signing/`。**自行构建的公钥与本 Release 不同，不要沿用发布安装脚本的固定公钥指纹。**

```text
HARDWARE_ADAPTATION.md   给 AI Agent / 开发者的跨硬件通话适配指南
cmd/airsim-mu300d/       管理服务、配对入口、设备集成
internal/audio/         PCM 协议、重采样、ALSA 会话生命周期
internal/gateway/       VoWLAN 签名、路由和媒体网关
internal/pairing/       加密配对会话
patches/                固定上游版本及 MU300 专用 Agent 补丁
packaging/openwrt/      LuCI、rpcd ACL、procd、APK 钩子
scripts/                构建、安装、测试与发布辅助
docs/                   实施证据、验收边界与历史设计
```

## 排障与安全

- 启动失败：核对镜像/内核、音频依赖、DSP 固件，以及是否有其他进程占用语音场景。
- 能拨号但无声音：分别检查基带状态、客户端路由、PCM 握手、采集/播放帧数，不能只看注册状态或声卡。
- 号码未提供：SIM 可能未存储本机号码，不能用来电号码、IMSI 或测试号码替代。
- 短信接口缺失：需要固件 `mu300dash` 短信服务，不回退到冲突的 AT 编码流程。
- 请自行设置 LuCI 管理密码；脚本不修改凭据。勿开放 WAN 管理。
- 提交日志时去除号码、IMSI/IMEI、短信正文、配对码、密钥和音频。

详见 [实施记录](docs/MU300_PLUGIN_IMPLEMENTATION.md) 和 [呼叫等待说明](docs/MU300_R9_CALL_WAITING.md)。U30 Air 整体设计与 UFI Tools 文档属于历史探索，不代表当前已发布功能。

## 上游、Fork / 镜像关系与致谢

本仓库是**独立集成与适配工程**，不是 mu300-linux 或 mu300-audio 的官方发布，也不是它们的 GitHub Fork。

| 项目 | 如何使用 | 作者与来源 |
| --- | --- | --- |
| [AirSIM](https://github.com/kai-wu-cortex/AirSIM) | 固定 Agent 基线、配对/VoWLAN/Relay 协议；设备专用补丁 | AirSIM contributors |
| [mu300-linux](https://github.com/dikeckaan/mu300-linux) | Linux/OpenWrt、AT 服务、原生短信与设备基础设施 | **dikeckaan** 及贡献者 |
| [mu300-audio 原项目](https://github.com/dikeckaan/mu300-audio) | 音频驱动、DSP 场景与工具，固定 `v1.0.5` | **dikeckaan** 及贡献者 |
| [mu300-audio 源码镜像](https://github.com/kai-wu-cortex/mu300-audio) | 原仓库不可访问时保存源码与标签 | 不改变原作者署名；当前 GitHub 元数据不是 Fork 关系 |
| [OpenWrt / LuCI](https://openwrt.org/) 与 [ALSA](https://www.alsa-project.org/) | 管理界面、包管理与音频工具 | 各上游贡献者 |

感谢 **dikeckaan** 在 MU300 Linux 与通话音频栈上的工作，也感谢音频上游注明的 **kano / kanoqwq、Enceka、e5-linux** 及 Unisoc 驱动贡献者。上游引用不代表作者对本插件的背书或支持承诺。

2026-10-31 发布准备时，原 mu300-audio URL 返回 404；镜像仍可访问。Release 保留固定版本音频依赖、源码与校验信息，不把镜像描述为官方新版本。

## 许可证

本项目自身代码沿用非商业定位，见 [LICENSE](LICENSE)、[NOTICE](NOTICE)。AirSIM Agent 使用 **PolyForm Noncommercial 1.0.0**；mu300-audio 按文件采用 **GPL-2.0 / MIT**；ALSA 按组件采用 **LGPL-2.1-or-later / GPL-2.0-or-later**。各组件保留各自权利，不以单一许可证覆盖整包。

这是 **source-available（源码可用）非商业项目**，不能把整包称为无商业限制的开源软件。商业使用需分别取得相关许可。依赖与对应源码说明见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) 和 [SOURCES.md](SOURCES.md)。
