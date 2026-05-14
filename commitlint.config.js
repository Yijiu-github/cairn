// Conventional Commits 校验
// 文档：https://commitlint.js.org

const hasBilingualSubjectInOrder = (subject) => {
  const separator = ' / ';
  const index = subject.indexOf(separator);
  if (index <= 0) {
    return false;
  }

  const chinesePart = subject.slice(0, index).trim();
  const englishPart = subject.slice(index + separator.length).trim();

  return /\p{Script=Han}/u.test(chinesePart) && /^[A-Za-z]/.test(englishPart);
};

/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        'bilingual-subject-order': (parsed) => {
          const subject = parsed.subject || '';
          if (!subject) {
            return [true];
          }
          const ok = hasBilingualSubjectInOrder(subject);
          return [
            ok,
            'subject must be bilingual in the form `中文摘要 / English summary` with Chinese first and English second',
          ];
        },
      },
    },
  ],
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
    'bilingual-subject-order': [2, 'always'],
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
