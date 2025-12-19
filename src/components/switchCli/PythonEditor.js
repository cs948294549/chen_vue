// src/components/PythonEditor.js
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

export default {
  name: 'PythonEditor',
  mounted() {
    // 1. 注册自定义 Python 语言
    this.registerPythonLanguage();

    // 2. 注册 Python 自动补全功能（添加在这里！）
    this.registerPythonCompletions();

    // 3. 定义自定义主题（可选）
    this.defineCustomTheme();

    // 4. 创建编辑器
    this.createEditor();
  },
  methods: {
    registerPythonLanguage() {
      monaco.languages.register({ id: 'custom-python' });

      // 定义词法分析规则
      monaco.languages.setMonarchTokensProvider('custom-python', {
        keywords: [
          'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue',
          'def', 'del', 'elif', 'else', 'except', 'False', 'finally', 'for', 'from',
          'global', 'if', 'import', 'in', 'is', 'lambda', 'None', 'nonlocal', 'not',
          'or', 'pass', 'raise', 'return', 'True', 'try', 'while', 'with', 'yield'
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
            [/\d+\.?\d*/, 'number'],

            // 关键字
            [/[a-zA-Z_$][a-zA-Z0-9_$]*/, {
              cases: {
                '@keywords': 'keyword',
                '@default': 'identifier'
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

    registerPythonCompletions(){
      monaco.languages.registerCompletionItemProvider('custom-python', {
        // 触发字符（输入这些字符时会自动提示）
        triggerCharacters: ['.', ' '],

        // 提供补全项的核心函数
        provideCompletionItems(model, position) {
          try {

            // 获取光标前的单词
            const textUntilPosition = model.getValueInRange({
              startLineNumber: position.lineNumber,
              startColumn: 1,
              endLineNumber: position.lineNumber,
              endColumn: position.column
            });

            // 提取当前正在输入的单词（处理前缀匹配）
            const wordAtPosition = model.getWordAtPosition(position);

            console.log("-=触发=", wordAtPosition)

            const currentWord = wordAtPosition
              ? textUntilPosition.substring(wordAtPosition.startColumn - 1, wordAtPosition.endColumn - 1)
              : '';

            // 基于前缀的过滤函数
            const filterSuggestions = (suggestions) => {
              return suggestions.filter(item =>
                item.label.toLowerCase().startsWith(currentWord.toLowerCase())
              );
            };

            // Python 基本关键字
            const keywords = [
              'and', 'as', 'assert', 'async', 'await', 'break', 'class',
              'continue', 'def', 'del', 'elif', 'else', 'except', 'False',
              'finally', 'for', 'from', 'global', 'if', 'import', 'in',
              'is', 'lambda', 'None', 'nonlocal', 'not', 'or', 'pass',
              'raise', 'return', 'True', 'try', 'while', 'with', 'yield','interface'
            ];

            // 生成关键字补全项
            const keywordSuggestions = keywords.map(keyword => ({
              label: keyword,
              kind: monaco.languages.CompletionItemKind.Keyword,
              detail: 'Python 关键字',
              insertText: keyword
            }));

            var word = model.getWordUntilPosition(position);
            console.log("new word===", word)
            var range = {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endColumn: word.endColumn,
            };

            const suggests = [
              {
                label: "simpleText",
                kind: monaco.languages.CompletionItemKind.Text,
                insertText: "simpleText",
                range: range,
              },
              {
                label: "testing",
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: "testing(${1:condition})",
                insertTextRules:
                  monaco.languages.CompletionItemInsertTextRule
                    .InsertAsSnippet,
                range: range,
              },
              {
                label: "ifelse",
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: [
                  "if ${1:condition}:",
                  "\tpass",
                  "else:",
                  "\tpass",
                  "",
                ].join("\n"),
                insertTextRules:
                  monaco.languages.CompletionItemInsertTextRule
                    .InsertAsSnippet,
                documentation: "If-Else Statement",
                range: range,
              },
            ]
            for(const item of suggests){
              keywordSuggestions.push(item)
            }

            const propertyAccessMatch = /interface/.test(currentWord)
            console.log("匹配特殊===", propertyAccessMatch, currentWord)
            if(propertyAccessMatch){
              keywordSuggestions.push({
                label: "interfaceEth",
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: "interface Eth ${1:x/x}\n\tdescrib ${2:xxx}",
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
              },)
            }


            // 过滤与当前输入匹配的建议
            const filteredSuggestions = filterSuggestions(keywordSuggestions);

            return {
              suggestions: keywordSuggestions
            };




          }catch (error) {
            console.error('补全项生成失败:', error);
            return { suggestions: [] }; // 返回空数组避免崩溃
          }
        }
      });
    },

    defineCustomTheme() {
      monaco.editor.defineTheme('python-theme', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'keyword', foreground: '569cd6' },          // 关键字：蓝色
          { token: 'string', foreground: 'ce9178' },           // 字符串：橙色
          { token: 'comment', foreground: '6a9955' },          // 注释：绿色
          { token: 'number', foreground: 'b5cea8' },           // 数字：浅绿
          { token: 'operator', foreground: 'd4d4d4' },         // 运算符：白色
          { token: 'identifier', foreground: '9cdcfe' }        // 标识符：青色
        ],
        colors: {
          'editor.background': '#1e1e1e',
          'editor.foreground': '#d4d4d4'
        }
      });
    },

    createEditor() {
      this.editor = monaco.editor.create(document.getElementById('editor-container'), {
        value: this.value, // 初始值来自 props,
        language: 'custom-python',  // 使用自定义语言
        theme: 'python-theme',      // 使用自定义主题
        fontSize: 14,
        readOnly: this.readonly,
        lineNumbers: true,
        minimap: { enabled: false }
      });

      // 监听编辑器内容变化，触发外部事件
      this.editor.onDidChangeModelContent(() => {
        this.emitContentChange(); // 调用组件中定义的事件触发方法
      });
    }
  },
  beforeDestroy() {
    if (this.editor) {
      this.editor.dispose();
    }
  }
};
