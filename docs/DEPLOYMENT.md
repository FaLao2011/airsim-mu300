# AirSIM for MU300 部署手册

> [!WARNING]
> **安装前必须按系统版本选包：R16 仅适用于 1031 之后的新系统版本；R12 仅适用于 1031 之前的旧系统版本。不得跨版本线混装，也不要仅因 R16 更新就升级旧系统。**
> 这里的 1031 指 mu300-linux 系统版本线，不是插件下载或安装日期。无法确认所属版本线时，先核对系统发布说明再安装；音频模块还必须通过内核、配置与 ABI 检查。

## 一、安装前必须选择正确版本

| 设备当前 mu300-linux 系统版本线 | 插件版本 | Release |
| --- | --- | --- |
| 1031 之后的新系统版本 | **R16** | [下载 R16](https://github.com/kai-wu-cortex/airsim-mu300/releases/tag/v0.1.0-r16) |
| 1031 之前的旧系统版本 | **R12** | [下载 R12](https://github.com/kai-wu-cortex/airsim-mu300/releases/tag/v0.1.0-r12) |

**这是必读的部署要求。** 先在系统信息页或系统发布说明中核对版本线，再下载插件。不能用插件发布日期、安装器预检通过或“有新版本”提示代替这一步；未确认版本归属时不要安装。R15 已撤回，不作为安装选择。

每次安装、升级或回退都需结束电话和短信任务，保留原配置及可信回退包。不要混用不同 Release 的安装器、APK、校验清单；不要忽略签名、依赖或音频 ABI 检查。

## R16：新系统

**仅适用于 1031 之后的新系统版本。1031 之前的系统不得执行本节命令。**

在设备的 SSH 终端中执行：

```sh
cd /tmp
wget -O airsim-install.sh https://github.com/kai-wu-cortex/airsim-mu300/releases/download/v0.1.0-r16/install.sh
cat airsim-install.sh
sh airsim-install.sh --check
sh airsim-install.sh --install
```

插件与音频恢复扩展分开安装。已有匹配音频栈时保留它；缺失音频时先读 [R16 音频恢复和回退说明](RELEASE_v0.1.0-r16.md)，核对内核、配置和 ABI，再单独安排恢复。系统版本线正确也不能代替模块兼容性检查。不要装入 R12 的旧音频模块，不使用 ANY_BUILD 绕过检查。

## R12：旧系统

**仅适用于 1031 之前的旧系统版本。1031 之后的系统不得执行本节命令。**

在设备的 SSH 终端中执行：

```sh
cd /tmp
wget -O airsim-install.sh https://github.com/kai-wu-cortex/airsim-mu300/releases/download/v0.1.0-r12/install.sh
cat airsim-install.sh
sh airsim-install.sh --check
sh airsim-install.sh --install
```

R12 原安装器、平台检查与音频依赖保持原样，仍需满足其具体支持条件。若预检拒绝，不要强制安装。详见 [R12 发布说明](RELEASE_v0.1.0-r12.md)。旧系统看到 R16 更新提示时，也必须保持 R12；插件升级不会自动将旧系统变为新系统。

## 安装后验证与回退

1. 在 LuCI → 服务 → AirSIM 检查插件版本、服务及音频依赖状态。
2. 配对后，由用户手动测试双向声音并挂断；拨号成功或帧计数增长不等于音频通过。
3. 如需回退，使用符合当前系统版本线的可信包并保留配置；音频扩展的回退另按其指南执行。

R16 为开发预览，已确认一台 U30 Air 的短时局域网双向声音；长通话、多路、其他硬件及公网通话仍未完整验收。适用范围不是对所有设备音频兼容性的保证。
