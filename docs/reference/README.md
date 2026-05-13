# Reference

回答："**当我忘了某个术语 / 命名约定 / 复盘模板，去哪查**"。

## 文件

| 文件 | 作用 | 状态 |
|---|---|---|
| `glossary.md` | 术语表（所有文档共用基础） | 🟡 Draft |
| `naming-conventions.md` | 代码 / 数据库 / 事件 / API 字段命名约定 | ⚪ TODO |
| `postmortem-template.md` | 故障复盘模板 | ⚪ TODO |
| `meeting-notes/` | 关键决策会议记录 / 个人 work log | ⚪ 按需 |

## 重要性排序

1. **`glossary.md` 是所有文档的地基**——任何术语在第一次使用时必须可在术语表中查到
2. `naming-conventions.md` 是 PR review 的快速依据
3. `postmortem-template.md` 在第一次事故后用，平时不打开
4. `meeting-notes/` 可选，但个人项目建议留 work log

## 维护原则

- 术语表条目变化时**所有引用文档必须同步**
- 术语表只接收**真正项目专属**或**有歧义**的词；通用工程术语不收
- 命名约定一旦确立，**修改成本极高**，请在 PR 中明确变更范围
