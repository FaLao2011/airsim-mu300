# U30 Air 电量接入（R19 开发预览）

2026-11-03：代码、自动化测试及签名候选包已完成；USB 未连接，尚未安装本次电量候选，真实读数、充放电变化及 AirSIM 显示待实机确认。用户随后明确要求将当前代码以 R19 开发预览发布；发布不代表实机验收通过。

## 已接入的现有接口

沿用 AirSIM 已实现的可选字段，无需修改其 iOS、Android 或 Relay 代码：

```json
{"battery":{"percent":82,"charging":false,"observed_at_ms":1800000000000}}
```

以上是格式示例，不是设备实测值。

- 局域网：MU300 Agent 的 `/api/health` 提供采样，设备网关经原有配对 HMAC 认证后，在 `/v1/health` 返回 `battery`。没有新增未认证电量接口。
- 云端：随 Agent 已有的 `/v1/events/heartbeat` 心跳携带同一格式，保持原有 30 秒心跳周期和云端开关/注册策略。纯本地模式不因电量上报而打开云端。
- 客户端继续使用对应已配对设备的电量样本和现有刷新逻辑。接收字段的类型名虽为 `AndroidBatteryReading`，线上字段并不要求伪装成 Android；设备仍声明 `agent_kind=mu300`。

## 电量来源与未知状态

仅在 `mu300-openwrt` 运行配置下读取原生系统电池。优先用 `/etc/mu300-device=u30air` 确认设备；标记缺失时，用原生 mu300-linux 同样采用的 U30 专属设备树节点 `/sys/firmware/devicetree/base/charger_policy_service` 识别。明确标记为其他设备或标记不可读时不猜测。

读取 `/sys/class/power_supply/battery` 下的 `type`、`present`（若存在）、`capacity` 和 `status`，不写 sysfs，不发 AT，不改变充电策略，不加载电池驱动。该路径来自保存的 mu300-linux U30 Air 5.4 适配资料；当前设备节点仍需连接后核对。

- `type` 必须为 Battery；`present` 若存在必须为 1。
- 百分比为 0–100 的整数，0% 有效。只读系统 `battery/capacity`，不读取原始 `sc27xx-fgu` 的十分之一百分比，不按电压估算。
- Charging / Full 对应 `charging=true`，与 AirSIM 现有 Android 发送端语义一致；Discharging / Not charging 对应 false。未知状态省略整个样本。
- 读取前后充电状态发生变化时省略该次样本，等待后续刷新。
- 采样时间使用设备本次读取时的 Unix 毫秒时间。没有持久化缓存；读取失败不会重用旧值或重新给旧值打时间戳。
- 网关再校验百分比、布尔字段与时间：超过或等于 5 分钟、超前超过 60 秒、缺字段或格式不正确均省略 `battery`，不影响其余健康响应。

F50/V50 可能暴露模拟电量，不纳入此功能。其他电池节点、AVF 虚拟机和其他硬件均不自动套用该来源。

## 修改与验证

修改仅在本 U30 Air 适配仓库：`internal/gateway/battery.go`、网关健康响应，以及 `patches/AirSIM-mu300.patch` 中的 MU300 电量读取、Agent 健康响应和原心跳字段。Agent 使用固定上游提交 `cc2ade3124ac34bec7d8c441f4b66a57a6dfec62` 的隔离导出副本；AirSIM 上游和客户端工作树未写入。保留此前早期媒体等未提交修改，生产早期媒体仍默认关闭。

通过：插件 Go race/vet、干净固定上游应用补丁后的 Agent Go race/vet、全部 29 项 Node 测试、linux/arm64 构建、APK 签名及内容核验、固定依赖/源码哈希检查、许可证检查。包内两个二进制的哈希与候选一致。

新增回归覆盖 0%、充电/满电/不充电、缺失和异常读数、原始十分之一单位值、非 U30/无电池设备、设备树回退、读取失败不保留旧样本、非 MU300 profile 隔离、健康接口认证与重放、异常电量不破坏健康响应、样本过期边界、原心跳携带字段以及云端关闭不发送。

R18 阶段的本地电量候选：`out/battery-candidate/`，包含签名 APK、配套公钥、校验清单、两个开发二进制和验证报告。该旧候选未上传，也未安装到设备。此前候选包已保留于该目录的 `previous-dist/`。R19 正式发布资产见 [Release](https://github.com/kai-wu-cortex/airsim-mu300/releases/tag/v0.1.0-r19)，以其同版签名包、源码及校验清单为准。

## 待实机验收

连接已有 OpenWrt 的 U30 Air 后，先只读核对设备标记、原生电池节点与时间。空闲安装候选后，将原生读数、认证健康响应、AirSIM 电量显示进行比较；再由用户改变供电状态，确认充电标志及刷新。云端仅在原配置已启用且允许的情况下核对，不为了验收打开云端。

这些检查不需要拨号、发送短信、录音或改变系统。设备未连接期间，不将模拟测试数据或旧资料当作实机通过证据。
