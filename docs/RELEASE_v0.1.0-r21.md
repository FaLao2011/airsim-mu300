# R21 · U30 Air 来电身份与短信接口兼容 · 开发预览

对齐已合并的 AirSIM PR #29，补齐设备端来电身份解析、通话历史确认及短信 SIM 字段。保留 R20 云模式重复配对修复和既有功能。**音频保持 8 kHz、单声道、16 位 PCM；不更换系统或内核，不修改 AirSIM 客户端代码。**

## 适用范围与版本选择

**历史版本必须区分：R16 适用于 1031 之后的系统版本线；R12 适用于 1031 之前的系统版本线，不得跨版本线混装。** 1031 指 mu300-linux 系统版本线，不是插件下载日期。

R21 沿用 R19 / R17 一体安装方案，只提供以下 U30 Air 音频扩展配置：

| 项目 | 范围 |
| --- | --- |
| 设备 | U30 Air，aarch64 |
| 基础系统 | mu300-linux v2026.10.30.1 / OpenWrt 25.12.6 |
| 内核 | `5.4.254-gb50db5b6224c` |
| 内核配置 SHA-256 | `1057cb97e0d2d7f26816e8bf7841faac1153833a01d4893cdc196b75ae6356b3` |
| 包格式 | OpenWrt APK v3，非 Android APK |

**F50 / 7.2.8、其他内核或配置尚未适配，不能仅凭“1031 之后”判断兼容。** 上游 v2026.11.02.1 只做了源码比较，不代表新版 ABI 或实机兼容已经验收。安装器保留音频模块匹配检查。

## 本次变化

- 新增经过现有配对签名认证的 `POST /api/calls/resolve`。严格校验实际推送的 call_id、call_uuid 和 generation，再确认真实本地通话；旧推送、结束通话和槽号复用不能映射到新通话。不按号码或时间猜测身份，不伪造接通状态。
- generation 必须显式给出，接受正整数 JSON 或十进制字符串；缺失、null、boolean、小数、溢出、非正值返回 409，绝不默认成 1。成功返回原 CallStatus 格式。
- 已接通或保持中的同一通话重复 answer 幂等成功，不再发送 ATA/CHLD，不交换保持状态或音轨。
- 局域网白名单增加 `POST /api/calls/history/ack`；保留签名、时间窗与 nonce 防重放。
- 原生单槽短信和 Relay 短信事件携带 `sim_slot: "SIM 1"`。云端 send_sms 接收可选 sim_account，缺省保持默认卡行为；显式句柄仅接受现有单槽 `"0"`，实际 SIM 不可用或未知句柄均拒绝，不静默回退到其他卡。

推送解析只支持当前保存的最近来电三元组；重启丢失映射或新来电替换记录后拒绝旧映射，不承诺多路云来电或跨重启恢复。U30 Air 不新增双卡或录音能力。详见 [接口兼容记录](https://github.com/kai-wu-cortex/airsim-mu300/blob/v0.1.0-r21/docs/PR29_AGENT_COMPATIBILITY.md)。

## 联合升级顺序

**兼容设备端 Agent → 支持短信字段的 Worker → 新版 iOS。** 本 Release 仅发布 U30 Air 插件，不部署 Worker 或客户端。

Relay 短信命令入口为 `POST /v1/commands/enqueue`（type=send_sms，可带 sim_account）；事件入口为 `POST /v1/events/sms`（可带 sim_slot）。旧 Worker 可能忽略选卡，不能仅凭本插件升级宣称云端选卡可用。网关升级后可重新启动 iOS，以清除旧历史确认接口 404 的进程内缓存。

## 验证与边界

源码验证覆盖插件与隔离 Agent 的 Go race/vet、29 项 Node 测试、严格身份及槽复用、保持通话重复接听、认证防重放、无卡/锁卡/未知句柄及短信去重。固定上游补丁可在全新隔离目录应用，Linux ARM64 编译通过。发布物另核验 APK 签名、依赖哈希、对应源码、许可证、一体安装及音频保护测试。

**R21 新接口、完整 APK 升级、真实 PushKit → LAN 接听和真实短信均未完成实机验收。** 此前 R20 配对候选通过两次云模式配对，R17 通过两通双向音频验收，不能替代 R21 联合版本验收。电量变化、离线固件恢复、完整挂断/重拨、长通话、多路和其他硬件仍待验证。普通安装的早期媒体试验入口仍默认关闭。维持 **Pre-release / 开发预览**。

## 安装与回退

先结束通话及短信任务，并保存原包和配置。在匹配上述环境的设备上执行：

```sh
cd /tmp
wget -O airsim-install.sh https://github.com/kai-wu-cortex/airsim-mu300/releases/download/v0.1.0-r21/install.sh
cat airsim-install.sh
sh airsim-install.sh --check
sh airsim-install.sh --install
```

安装器验证固定公钥、哈希和 APK 签名，检查设备空闲与音频条件，保留配对、配置和原短信。首次音频准备需要重启时，提示安排一次进入已有 OpenWrt 的重启，不修改默认启动系统。详见 [部署手册](https://github.com/kai-wu-cortex/airsim-mu300/blob/v0.1.0-r21/docs/DEPLOYMENT.md)。

附件：`luci-app-airsim-0.1.0-r21.apk`、`airsim-dev.pem`、`install.sh`、`airsim-mu300-0.1.0-r21-sources.tar.gz`、`SHA256SUMS`、`SHA256SUMS.sig`。

沿用发布公钥 SHA-256：`0ce703e76ea4b702194c54b90534d7127874bb38ecda17f7ed6b1add2d2cf1de`。缺失 DSP 固件时沿用固定上游和包内固定副本回退，已有固件保留。备用固件不来自用户设备；独立许可未明确，项目许可证不覆盖它，见 [来源说明](https://github.com/kai-wu-cortex/airsim-mu300/blob/v0.1.0-r21/docs/DSP_FIRMWARE_PROVENANCE.md)。

回退时先结束通话和短信任务，使用适配本设备的可信旧包；保留配对及持久状态，不跨内核强装音频模块。

本项目是独立集成，保留上游作者署名，**不是 MU300 Linux/Audio 官方发布**。发布物不包含用户设备状态、真实号码、短信、音频、配对凭据或签名私钥。
