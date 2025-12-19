// src/components/SwitchEditor.js
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { SwitchConfig_h3c, SwitchFunction, ensureCompletionProvider,disposeAllCompletionProviders } from './switch_config';
const registeredLanguages = new WeakMap();

export default {
  name: 'SwitchEditor',
  mounted() {
    // 1. 注册自定义 交换机 语言
    this.switch_cfg =null
    if(this.devtype=='h3c'){
      this.switch_cfg = SwitchConfig_h3c
    }else{
      this.switch_cfg = SwitchConfig_h3c
    }

    this.completionDisposable = null

    this.registerCustomLanguage();

    // 2. 注册 Custom 自动补全功能（添加在这里！）
    this.registerCustomCompletions();

    // 3. 定义自定义主题（可选）
    this.defineCustomTheme();

    // 4. 创建编辑器
    this.createEditor();


  },
  methods: {
    registerCustomLanguage() {
      monaco.languages.register({ id: 'custom-switch' });

      // 设置语言配置
      monaco.languages.setLanguageConfiguration('custom-switch', {
        comments: {
          lineComment: '#'
        },
        brackets: [
          ['{', '}']
        ],
        autoClosingPairs: [
          { open: '{', close: '}' }
        ]
      });

      // 定义词法分析规则
      monaco.languages.setMonarchTokensProvider('custom-switch', {
        keywords: this.switch_cfg.keywords,
        warningwords:this.switch_cfg.warning_words,
        // 内置对象
        builtins: [
          // 接口类型
          'GE', 'XGigabitEthernet', 'Ten-GigabitEthernet', 'FortyGigabitEthernet',
          'HundredGigabitEthernet', 'Vlanif', 'LoopBack', 'NULL', 'MEth', 'Eth-Trunk',
          'M-GigabitEthernet',
          // 协议名称
          'direct', 'static', 'ospf', 'bgp', 'isis', 'rip',
          // 特殊名称
          'any', 'all', 'enable', 'disable', 'permit', 'deny', 'default'
        ],
        operators: [
          '=', '==', '!=', '<', '<=', '>', '>=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=', '**=', '//=',
          '+', '-', '*', '**', '/', '//', '%', '@', '&', '|', '^', '~', '<<', '>>',
          'in', 'not', 'is', 'and', 'or', 'not'
        ],
        symbols: /[=><!~?:&|+\-*\/\^%]+/,
        escapes: /\\(?:[abfnrtv"\']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

        tokenizer: {
          root: [
            // 注释
            [/#.*$/, 'comment'],

            // 字符串
            [/"([^"\\]|\\.)*$/, 'string.invalid'],  // 不完整的字符串
            [/"/, 'string', '@string'],

            // 数字
            [/\s*\d+\.?\d\s*/, 'number'],

            // 关键字
            [/[a-zA-Z_\-$][a-zA-Z0-9_\-$]*/, {
              cases: {
                '@warningwords': 'warningwords',
                '@keywords': 'keyword',
                '@builtins': 'builtins',
                '@default': 'identifier',
              }
            }],

            // 运算符
            [/@symbols/, {
              cases: {
                '@operators': 'operator',
                '@default': ''
              }
            }],

            // 括号
            [/[()\[\]{}]/, '@brackets']
          ],

          string: [
            [/[^\\"]+/, 'string'],
            [/@escapes/, 'string.escape'],
            [/\\./, 'string.escape.invalid'],
            [/"/, 'string', '@pop']
          ]
        }
      });
    },

    registerCustomCompletions(){
      this.completionDisposable = monaco.languages.registerCompletionItemProvider('custom-switch', {
        triggerCharacters: [' '],

        provideCompletionItems: (model, position) => {
          const currentLine = model.getLineContent(position.lineNumber);
          const currentWord = model.getWordUntilPosition(position);
          const prefix = currentLine.substring(currentWord.startColumn - 1, position.column - 1);

          // 获取当前行的第一个词
          const firstWord = currentLine.trim().split(/\s+/)[0] || '';
          const textUntilPosition = model.getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column
          });

          // console.log("currentLine", currentLine)
          // console.log("currentWord", currentWord)
          // console.log("prefix", prefix)
          // console.log("firstWord", firstWord)
          // console.log("textUntilPosition", textUntilPosition)
          const configState = SwitchFunction.parseConfigState(textUntilPosition, this.switch_cfg["tree"])

          // console.log("当前状态===", configState)

          var word = model.getWordUntilPosition(position);
          // console.log("new word===", word)
          var range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };

          // 生成补全建议
          let suggestions = [];
          let prefix_array = currentLine.replace(/^undo/i, "").replace(/^no/i, "").trimStart().split(/\s+/)
          if(prefix_array.length<=1){
            // console.log("设置children提示词")
            let new_suggest = SwitchFunction.genChildrenSuggestions(configState["currentNode"])
            suggestions = suggestions.concat(new_suggest);
          }else{
            // console.log("设置chain提示词")
            let new_suggest = SwitchFunction.genChainSuggestions(configState["currentNode"], prefix_array)
            suggestions = suggestions.concat(new_suggest);
          }

          return {suggestions}
        }
      });
    },

    defineCustomTheme() {
      monaco.editor.defineTheme('switch-theme', {
        base: 'vs',
        inherit: true,
        rules: [
          // { token: 'keyword', foreground: '569cd6' },          // 关键字：蓝色
          // { token: 'string', foreground: 'ce9178' },           // 字符串：橙色
          // { token: 'comment', foreground: '6a9955' },          // 注释：绿色
          // { token: 'number', foreground: 'b5cea8' },           // 数字：浅绿
          // { token: 'operator', foreground: 'd4d4d4' },         // 运算符：白色
          // { token: 'identifier', foreground: '9cdcfe' },        // 标识符：青色
          // { token: 'warningwords', foreground: 'F56C6C' },        // 高危字符: 红色
          // { token: 'builtins', foreground: 'E6A23C' },        // 高危字符: 红色
          
           // 语法高亮规则（保持清晰可读性）
          { token: 'comment', foreground: '#6A9955', fontStyle: 'italic' }, // 注释：绿色
          { token: 'keyword', foreground: '#0000FF', fontStyle: 'bold' },   // 关键字：蓝色加粗
          { token: 'string', foreground: '#C41A16' },                       // 字符串：红色
          { token: 'number', foreground: '#098658' },                       // 数字：深绿
          { token: 'operator', foreground: '#795E26' },                     // 函数：棕色
          { token: 'identifier', foreground: '#000000' },                     // 变量：黑色
          { token: 'builtins', foreground: '#267F99' },                         // 类型：青色
          { token: 'warningwords', foreground: '#AF00DB' }                      // 运算符：紫色
        ],
        // colors: {
        //   'editor.background': '#1e1e1e',
        //   'editor.foreground': '#d4d4d4'
        // },
        colors: {
            // 核心白色背景配置
            'editor.background': '#FFFFFF',                // 编辑器背景：纯白色
            'editor.foreground': '#000000',                // 文本颜色：纯黑色（高对比度）
            'editor.lineHighlightBackground': '#F5F5F5',   // 当前行高亮：浅灰色
            'editorCursor.foreground': '#000000',          // 光标颜色：黑色
            'editor.selectionBackground': '#C8E1FF',       // 选中内容背景：浅蓝色
            'editor.inactiveSelectionBackground': '#E8F4FF', // 非激活选中背景：更浅的蓝色

            // 辅助元素颜色
            'editorLineNumber.foreground': '#888888',      // 行号颜色：中灰色
            'editorLineNumber.activeForeground': '#000000',// 当前行号：黑色
            'editorIndentGuide.background': '#E0E0E0',     // 缩进线：浅灰色
            'editorWhitespace.foreground': '#E0E0E0',      // 空白字符：浅灰色
            'scrollbarSlider.background': '#CCCCCC',       // 滚动条滑块：灰色
            'scrollbarSlider.hoverBackground': '#AAAAAA',  // 滚动条滑块悬停：深灰色
            'editorRuler.foreground': '#E0E0E0',           //  rulers 线：浅灰色
            'minimap.background': '#FAFAFA',               // 迷你地图背景：近白色
          }
      });
    },


    createEditor() {

      this.editor = monaco.editor.create(document.getElementById(this.container), {
        value: this.value, // 初始值来自 props,
        language: 'custom-switch',  // 使用自定义语言
        theme: 'switch-theme',      // 使用自定义主题
        fontSize: 14,
        readOnly: this.readonly,
        lineNumbers: true,
        minimap: { enabled: false }
      });

      // 监听编辑器内容变化，触发外部事件
      this.editor.onDidChangeModelContent(() => {
        this.emitContentChange(); // 调用组件中定义的事件触发方法
      });
    },
  },
  beforeDestroy() {
    if (this.editor) {
      this.editor.dispose();
      this.completionDisposable.dispose();
      this.completionDisposable = null
    }
  }
};
