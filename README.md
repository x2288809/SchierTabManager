# SchierTabManager
管理、导入、导出网站标签的浏览器插件，也可作为导航网站使用

## 混肴代码
前置操作：
在开始菜单搜索 PowerShell
右键 → 以管理员身份运行
粘贴下面这行命令，回车：
```
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```
提示时输入 Y 回车确认

重启 VS Code，在终端（Ctrl + ~），执行：
```
npm install -g javascript-obfuscator
```

进入你的项目根目录，执行下面命令批量混淆：
（混淆当前文件夹所有 .js 文件，输出到 dist 文件夹）
```
javascript-obfuscator "./" --output "./dist"
```

## 更新记录

v1.0.1 2026-04-10
1.已打开标签中的 添加到分组 和 关闭标签 的按钮，当鼠标移到tab-item上时要悬浮在标签tab-item上，这样tab-item就能小一些了；包含分组中的编辑和删除按钮也要悬浮在tab-item上  
2.分组内的标签tab-item如果很少，高度会自动跟窗口大小适配，这很奇怪，应该要固定高度大小  
3.优化导入导出按钮，颜色更有辨识度  
4.现在通过快捷键Ctrl+Q只能打开，要变成Ctrl+Q只控制打开和关闭标签管理页；
5.管理页中的窗口固定比例大小；
6.管理页中的 导入数据 导出数据 功能放在页面右上方；