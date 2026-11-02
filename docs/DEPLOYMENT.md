# AirSIM for MU300 一体部署手册（R17）

> 本手册下方下载地址仍指向已发布 R17。R18 本地候选新增 [固件离线回退](DSP_FIRMWARE_PROVENANCE.md)：上游获取失败或校验不符时，从包内固定副本恢复，仍检查同一 SHA-256；已有固件继续复用。R18 尚未发布，不将此能力归于原 R17 包。

> [!WARNING]
> 当前一体包只覆盖已验证 U30 Air 的 `5.4.254-gb50db5b6224c` 内核及配置 `1057cb97e0d2d7f26816e8bf7841faac1153833a01d4893cdc196b75ae6356b3`。F50 / 7.2.8 不在适用范围。U30 Air 的升级、重启自动准备及两通双向通话验收已通过，长通话仍未完整验收。

## 一次安装

先结束通话及短信任务，保存已有配置和可信回退包。软件包是 OpenWrt APK v3，不是 Android APK。

设备 SSH 中执行：

```sh
cd /tmp
wget -O airsim-install.sh https://github.com/kai-wu-cortex/airsim-mu300/releases/download/v0.1.0-r17/install.sh
cat airsim-install.sh
sh airsim-install.sh --check
sh airsim-install.sh --install
```

安装器先核对音频扩展匹配条件，验证固定公钥、哈希及 APK 签名，再安装同版包。插件、工具、音频扩展已合并，不再要求另下载恢复包或输入恢复命令。首次缺少 DSP 固件需联网访问上游固定来源；下载或校验失败时不报告可通话。

## LuCI 手动上传

从同一 Release 获取 `luci-app-airsim-0.1.0-r17.apk`、`airsim-dev.pem` 和校验清单。核对公钥 SHA-256 `0ce703e76ea4b702194c54b90534d7127874bb38ecda17f7ed6b1add2d2cf1de` 并导入公钥，验证 APK 后上传安装，不忽略签名或依赖。APK 钩子会执行同样的音频准备检查；必须以安装结果和 LuCI 准备状态判断是否完成，不能只看软件包出现在列表中。

## 看安装结果

| 状态 | 用户下一步 |
| --- | --- |
| 准备完成 | 刷新 LuCI → 服务 → AirSIM，启动服务、获取配对码并连接客户端 |
| 需重启完成安装 | 安排一次进入 OpenWrt 的重启，音频准备会自动继续，无需手工补装 |
| 准备未完成 | 查看安装错误；不要拨号验证，也不要强装驱动或绕过配置检查 |

部分 U30 Air 默认启动 Android。请使用设备原有的 Linux 启动入口返回 OpenWrt；普通 reboot 不保证返回 Linux，安装器不擅自更改默认启动选择。

配对完成后，由用户手动测试双向声音并挂断。安装成功、声卡存在或帧数增长都不能替代这项验收。

## 历史版本

此前约定 R16 面向 1031 之后的系统版本线，R12 面向 1031 之前的旧版本线；这些历史标签不能保证实际硬件和内核兼容。R16 是分步音频恢复方案，不具备本手册的一体安装流程。R15 已撤回。

- [R16 旧发布说明](RELEASE_v0.1.0-r16.md)
- [R12 旧发布说明](RELEASE_v0.1.0-r12.md)

## 回退

结束通话后使用与原设备兼容的可信包恢复插件，保留配对和配置。首次音频安装会保存原脚本、链接与启动项；音频回退按 [恢复指南](../packaging/openwrt-audio/README.md) 执行，已加载模块需安排重启才会改变。不要跨内核强行安装旧包。
