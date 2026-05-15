# Detail Themes V1

> 状态：🟡 Draft  
> 最后更新：2026-05-15  
> 范围：补齐 V1 中尚未画细的主题级交互与图片示例。

---

## 1. 为什么补这组

前几版已经覆盖页面骨架，但还缺少一些会决定产品质感的细节主题：命令入口、危险确认、诊断导出、外观语言、空错态文案。这些不是独立页面，却会高频出现在真实使用中。

## 2. 图片示例

| 主题           | 示例                                                                                               | 关键点                                             |
| -------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 命令菜单       | [`design-assets/ui-v1-command-menu-zh.svg`](design-assets/ui-v1-command-menu-zh.svg)               | `⌘K` / `Ctrl+K` 搜索与命令入口，危险命令不直接执行 |
| 受保护动作确认 | [`design-assets/ui-v1-protected-action-zh.svg`](design-assets/ui-v1-protected-action-zh.svg)       | 明确目标、影响、仅本次批准、trace 记录             |
| 诊断导出       | [`design-assets/ui-v1-diagnostic-export-zh.svg`](design-assets/ui-v1-diagnostic-export-zh.svg)     | 展示包含内容，默认脱敏，提示本地路径风险           |
| 外观与语言     | [`design-assets/ui-v1-appearance-language-zh.svg`](design-assets/ui-v1-appearance-language-zh.svg) | 中文主界面、英文切换、浅色默认、深色预留           |
| 空错态细节     | [`design-assets/ui-v1-empty-error-detail-zh.svg`](design-assets/ui-v1-empty-error-detail-zh.svg)   | 空状态给下一步，错误状态给层级和恢复动作           |

## 3. 设计规则

### 3.1 命令菜单

- 打开方式：`⌘K` / `Ctrl+K`。
- 搜索范围：运行、任务、产物、命令、设置项。
- 危险命令只打开确认弹窗，不直接执行。
- 支持键盘：↑/↓ 选择，Enter 执行，Esc 关闭。

### 3.2 受保护动作确认

必须展示：

- 请求动作，例如 file.write。
- 目标对象，例如路径、run id、agent run id。
- 批准范围：默认只允许 `Approve once`。
- 批准后的效果：立即 resume、记录 `operatorActionId`。
- 拒绝后的效果：当前 agent 不执行该动作，可补充说明或取消 run。

### 3.3 诊断导出

必须展示：

- 包含内容清单。
- 明确说明 token 默认脱敏。
- 明确说明本地路径、文件名、日志片段仍可能包含个人信息。
- 主动作使用“导出脱敏诊断包”，不要只写“导出”。

### 3.4 外观与语言

- 默认语言：简体中文。
- 英文作为可切换 locale。
- R1 默认浅色主题；深色主题可先作为预留设计方向。
- Hover 动效未来应跟随系统 reduce motion 降低。

### 3.5 空错态

- 空状态：说明为什么空，并给自然下一步。
- 错误状态：说明错误层级和恢复动作。
- 不使用“暂无数据”“发生错误”作为唯一文案。

## 4. 变更历史

| 日期       | 变更                                                             |
| ---------- | ---------------------------------------------------------------- |
| 2026-05-15 | 初版：补命令菜单、受保护动作、诊断导出、外观语言、空错态细节主题 |
