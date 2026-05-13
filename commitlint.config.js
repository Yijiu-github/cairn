// Conventional Commits 校验
// 文档：https://commitlint.js.org

/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // type 必须在白名单内
    'type-enum': [
      2,
      'always',
      [
        'feat', // 新功能
        'fix', // 修复 bug
        'docs', // 文档
        'refactor', // 重构（不影响外部行为）
        'perf', // 性能改进
        'test', // 测试
        'build', // 构建系统 / 外部依赖
        'ci', // CI 配置
        'chore', // 杂务
        'revert', // 回滚
        'style', // 格式（不影响代码运行）
      ],
    ],
    // 主题不能为空、不能以句号结尾、首字符不限大小写
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-case': [0], // 中文不强制 case
    // 全行不超过 100
    'header-max-length': [2, 'always', 100],
    // body / footer 之间必须空行
    'body-leading-blank': [2, 'always'],
    'footer-leading-blank': [2, 'always'],
    // scope 推荐使用包名 / 模块名（不强制）
    'scope-empty': [0],
    'scope-case': [2, 'always', 'kebab-case'],
  },
  helpUrl: 'https://www.conventionalcommits.org/zh-hans/v1.0.0/',
};
