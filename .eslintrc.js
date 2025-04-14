// https://eslint.org/docs/user-guide/configuring

module.exports = {
  root: true,
  parserOptions: {
    parser: 'babel-eslint'
  },
  env: {
    browser: true,
  },
  extends: [
    // https://github.com/vuejs/eslint-plugin-vue#priority-a-essential-error-prevention
    // consider switching to `plugin:vue/strongly-recommended` or `plugin:vue/recommended` for stricter rules.
    'plugin:vue/essential',
    // https://github.com/standard/standard/blob/master/docs/RULES-en.md
    'standard'
  ],
  // required to lint *.vue files
  plugins: [
    'vue'
  ],
  // add your custom rules here
  rules: {
    // allow async-await
    // 禁用所有规则
    "no-eval": 0,
    
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'indent': [2, 2], //缩进风格
    "no-unused-vars": 0,
    "no-console": "off",
    "no-multiple-empty-lines": [1, {"max": 2}], //空行最多不能超过2行
    "camelcase": 2, //强制驼峰法命名
    "init-declarations": 0, //声明时必须赋初值
    "space-before-function-paren": [2, "always"], //函数定义时括号前面要不要有空格
    "no-spaced-func": 2, //函数调用时 函数名与()之间不能有空格
    "no-undef": 1, //不能有未定义的变量
    "no-redeclare": 2,//禁止重复声明变量
    "eqeqeq": [2, "allow-null"], // 使用 === 替代 ==
    "quotes": [ 2, "double"], // 使用双引号
    "semi": [2, "never"], // 不使用分号
    'vue/no-parsing-error': [2, { "x-invalid-end-tag": false }] //vue将标签渲染为原生html标签时，由于这些标签是自闭合的，所以有end标签会报错
  }
}
