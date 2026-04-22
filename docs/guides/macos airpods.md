深入排查「单击无暂停」的三条思路

你现在确认「降噪 / 通透」切换正常，说明 AirPods 的按压动作已经传到 macOS；但 Play/Pause 这一媒体遥控信号没有被系统里的播放器接住。最常见的原因有三类：
 • 焦点 App 不接管媒体遥控
 • 系统的 MediaRemote 服务被第三方软件“拦截”
 • 蓝牙数据库损坏导致 Play/Pause 映射丢失

下面按易→难给出针对性排错步骤。做完任意一条后务必重新测试：用「音乐」App 播一首歌，然后按压一下耳机，看能否暂停。

1 确认是“播放器”问题还是系统级问题
 1. 打开「音乐」或「TV」这类 Apple 原生 App 播放音频。
 2. 保持该 App 处于前台并在播放状态，按压 AirPods。
 ▫ 若此时能暂停 ➜ 说明手势没问题，只是 浏览器 / 第三方 App 没正确实现媒体遥控事件。
 ⁃ Chrome/Edge 请在地址栏输入 ‎⁠chrome://flags#hardware-media-key-handling⁠ 并设为 Enabled。
 ⁃ Safari 只能等网页本身支持 Media Session API；YouTube、Apple TV+ 已支持，Bilibili 网页版暂不支持。
 ▫ 若原生 App 也无法暂停 ➜ 继续看下一步。

2 排除第三方常驻工具的冲突

某些软件（键盘映射、音量增强、屏幕录像等）会注册系统级媒体键，导致 Music 收不到遥控。常见嫌疑：
 • Karabiner-Elements
 • BetterTouchTool / Logitech Options
 • Boom 3D / BackgroundMusic
 • OBS / ScreenFlow 等截获音频的软件

做法：完全退出上述工具后再试；若恢复正常，给它们加个排除规则或升级到最新版本。

3 重建 macOS 蓝牙数据库（10 分钟搞定）

有时系统会把「Play/Pause」记录成无效值，表现就是你描述的“磅磅”声却无动作。
 1. 备份：‎⁠sudo cp /Library/Preferences/com.apple.Bluetooth.plist ~/Desktop/⁠
 2. 删除并重启：sudo rm /Library/Preferences/com.apple.Bluetooth.plist
sudo shutdown -r now

 3. 系统重启后，重新配对 AirPods（务必在 Mac 上点「忽略此设备」→ AirPods 机盖开着按住背部按钮 15 秒，直到白灯快闪，再配对）。

该文件仅保存蓝牙映射，删除不会影响键盘/鼠标配对；最坏情况就是各设备需要重新连一次。

4 升级固件与系统（若仍无解）
 • AirPods 固件 ≥ 6F7
 • macOS ≥ 14.5（Sonoma）或公测 15.0（Sequoia）

用 iPhone 在「设置 ▶︎ 蓝牙 ▶︎ AirPods ▶︎ 关于本机」可看固件版本；如低于 6F7，把 AirPods 放入充电盒、接电源，放在 iPhone 旁静置 30 分钟即可自动升级。

5 备份方案：Raycast「Now Playing」+ 快捷指令

既然你日常离不开终端 / Raycast，可以：
 • 在 Raycast Store 搜索 Now Playing，装好后 ‎⁠⌘Space⁠ → ‎⁠np⁠，用空格键播放/暂停；
 • 用 Shortcuts 「播放/暂停当前音频」动作做成快捷指令，设成 ⌥⌘P 全局快捷键；当 AirPods 偶尔掉链子时，一键补救不中断工作流。

按照 1→3 的顺序大多能找出元凶；如果重建蓝牙数据库后原生 App 仍无法暂停，请把 Mac 的具体系统版本与 AirPods 型号、固件号贴上来，我们再做更底层的诊断。祝排障顺利！ ​⁠Apple Support (https://support.apple.com/guide/airpods/use-controls-and-gestures-with-your-airpods-devb2c431317/web) ​⁠Apple Support (https://support.apple.com/en-us/108764)