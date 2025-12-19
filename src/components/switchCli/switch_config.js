// switch_config.js
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

export const SwitchFunction = {
  parseConfigState(textUntilPosition, switch_tree){
    const state = {
      currentNode: switch_tree,
      NodeStack:[],
    };

    const lines = textUntilPosition.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trimStart();
      const prefix_array = trimmedLine.split(/\s+/);
      if(["return", "end"].indexOf(prefix_array[0])>-1){
        state["NodeStack"]=[]
        state["currentNode"] = switch_tree
      }else if(["exit", "quit"].indexOf(prefix_array[0])>-1){
        let _node = state["NodeStack"].pop()
        if(_node){
          state["currentNode"] = _node
        }
      }else{
        //根据视图切换节点，旧节点入栈存储
        if(state["currentNode"]&&state["currentNode"]["children"]){
          let _node = null
          for (const child of state["currentNode"]["children"]){
            let regx = new RegExp("^"+child["label"].replace(/\s+/, '\\s+'), 'i')
            if(child["type"]=="view"&&regx.test(trimmedLine)){
              _node = child
              break
            }
          }
          if(_node){
            state["NodeStack"].push(state["currentNode"])
            state["currentNode"] = _node
          }
        }

      }
    }
    return state;
  },
  genChainSuggestions(tree_node, text_prefix){
    const suggestions = []

    //先找到当前节点[ interface G x]
    let cur_node = tree_node
    let full_line = text_prefix.join(" ")
    console.log("去除undo 和 no ", full_line)

    if(cur_node&&cur_node["children"]){
      for(const child of cur_node["children"]){
        if(child["type"]=="node"||child["type"]=="view"){
          let regx = new RegExp("^"+child["label"].replace(/\s+/, '\\s+'), 'i')
          if(regx.test(full_line)==true){
            cur_node = child
            full_line = full_line.replace(regx, "").trimStart()
            break
          }
        }
      }
    }else{
      return []
    }
    console.log("获取当前节点==", cur_node)

    //去除已输入的当前节点的内容[ "" G x]
    let cur_regexp = new RegExp("^"+cur_node["label"].replace(/\s+/, '\\s+'), 'i')
    full_line = full_line.replace(cur_regexp, "").trimStart()

    //开始定位剩余节点位置 [ "" G x]
    while(full_line!=""){
      let match_flag = false
      let cache_node
      if(cur_node["chain"]){
        for(const chain of cur_node["chain"]){
          let regx_chain = new RegExp("^"+chain["label"].replace(/\s+/, '\\s+'), 'i')
          // console.log("尝试匹配===", chain, full_line)
          if(chain["type"]=="node"){
            if(regx_chain.test(full_line)==true){
              cache_node = chain
              full_line = full_line.replace(regx_chain, "").trimStart()
              match_flag = true
              break
            }
          }else if(chain["type"]=="param"){
            if(full_line!=""){
              let sum_params = chain["label"].split(/\s+/)
              cache_node = chain
              for(let i=0;i<sum_params.length;i++){
                full_line = full_line.replace(/^\S+/, "").trimStart()
              }
              match_flag = true
              break
            }
          }
        }
      }
      if(match_flag==false){
        full_line = ""
        return []
      }else{
        cur_node = cache_node
      }
    }
    // console.log("定位到位置节点", cur_node)
    //定位到位置节点 开始输出  [x]
    if(cur_node["chain"]){
      for(const chain of cur_node["chain"]){
        if(chain["type"]=="node"){
          let insertLabel = chain["label"] === '<cr>' ? '\n' : chain["label"]
          suggestions.push({
            label: chain["label"],
            kind: monaco.languages.CompletionItemKind.Text,
            insertText: insertLabel,
            documentation: chain["desc"],
            detail:chain["desc"],
          })
        }else if(chain["type"]=="param"){
          let insertLabel = chain["label"] === '<cr>' ? '\n' : chain["label"]
          suggestions.push({
            label: chain["label"],
            kind: monaco.languages.CompletionItemKind.Text,
            insertText: insertLabel,
            documentation: chain["desc"],
            detail:chain["desc"],
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
          })
        }
      }
    }
    return suggestions
  },
  genChildrenSuggestions(tree_node){

    const suggestions = []
    if(tree_node&&tree_node["children"]){
      for (const child of tree_node["children"]){
        if(child["type"]=="node"||child["type"]=="view"){
          let insertLabel = child["label"] === '<cr>' ? '\n' : child["label"]
          suggestions.push({
            label: child["label"],
            kind: monaco.languages.CompletionItemKind.Text,
            insertText: insertLabel,
            detail:child["desc"],
            documentation: child["desc"],
          })
        }else if(child["type"]=="template"){
          suggestions.push({
            label: child["label"],
            kind: monaco.languages.CompletionItemKind.Text,
            insertText: child["detail"],
            documentation: child["desc"],
            detail:child["desc"],
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
          });
        }
      }
    }

    let padding_suggestion = ["quit", "exit", "return"]
    for(const key_word of padding_suggestion){
      suggestions.push({
        label: key_word,
        kind: monaco.languages.CompletionItemKind.Text,
        insertText: key_word,
        documentation: "keyword",
        detail:"keyword",
      });
    }

    return suggestions
  },

};

export const SwitchConfig_h3c = {
  // 命令树结构
  tree: {
    type: "view",
    label: "",
    desc: "根节点",
    chain: [], // 无后续参数
    children: [
      { type: "view", label: "system-view", desc: "进入系统视图",
        chain: [], // 无后续参数
        children: [
          { type: "view", label: "interface", desc: "接口视图",
            chain: [
              { type: "node",label: "Bridge-Aggregation", desc: "聚合二层接口",
                chain: [
                  { type: "param", label: "${1:interface-id}", desc: "聚合口编号，物理口序号+50",chain: []},
                ]
              },
              { type: "node",label: "Route-Aggregation", desc: "聚合三层接口",
                chain: [
                  { type: "param", label: "${1:interface-id}", desc: "聚合口编号，物理口序号+50", chain: []},
                ]
              },
              { type: "node",label: "FortyGigE", desc: "接口类型",
                chain: [
                  { type: "param", label: "${1:interface-id}", desc: "接口编号，如0/0/1", chain: []},
                ]
              },
              { type: "node",label: "Ten-GigabitEthernet", desc: "10G接口",
                chain: [
                  { type: "param", label: "${1:interface-id}", desc: "接口编号，如0/0/1", chain: []},
                ]
              },
              { type: "node",label: "GigabitEthernet", desc: "接口类型",
                chain: [
                  { type: "param", label: "${1:interface-id}", desc: "接口编号，如0/0/1", chain: []},
                ]
              },
              { type: "node",label: "M-GigabitEthernet", desc: "管理口",
                chain: [
                  { type: "param", label: "${1:interface-id}", desc: "接口编号，如0/0/0", chain: []},
                ]
              },
              { type: "node",label: "NULL", desc: "null0接口",
                chain: [
                  { type: "param", label: "${1:interface-id}", desc: "接口编号，如0", chain: []},
                ]
              },

              { type: "node",label: "Vlanif", desc: "华为Vlan接口",
                chain: [
                  { type: "param", label: "${1:vlan-id}", desc: "VLAN ID (1-4094)", chain: []},
                ]
              },
              { type: "node",label: "Vlan-interface", desc: "华三Vlan接口",
                chain: [
                  { type: "param", label: "${1:vlan-id}", desc: "VLAN ID (1-4094)", chain: []},
                ]
              },
              { type: "node",label: "Tunnel", desc: "隧道",
                chain: [
                  { type: "param", label: "${1:interface-id}", desc: "接口编号，如0", chain: []},
                ]
              },
              { type: "node",label: "LoopBack", desc: "本地环回接口",
                chain: [
                  { type: "param", label: "${1:interface-id}", desc: "接口编号，如0", chain: []},
                ]
              },
              { type: "node",label: "range", desc: "批量接口",
                chain: [
                  { type: "param", label: "${1:interface-name}", desc: "接口全称",
                    chain: [
                      { type: "node", label: "to", desc: "范围",
                        chain: [
                          { type: "param", label: "${1:interface-name}", desc: "接口全称", chain: []}
                        ]
                      },
                      { type: "param", label: "${1:interface-name}", desc: "接口全称", chain: []}
                    ]
                  },
                ]
              },
            ],
            children: [
              { type: "node", label: "port", desc: "设置端口链路类型",
                chain: [
                  { type: "node", label: "link-type", desc: "设置端口链路类型",
                    chain: [
                      { type: "node", label: "access", desc: "access", chain: []},
                      { type: "node", label: "trunk", desc: "trunk", chain: []},
                      { type: "node", label: "hybrid", desc: "混合", chain: []},
                    ]
                  },
                  { type: "node", label: "link-mode", desc: "设置链路模式",
                    chain: [
                      { type: "node", label: "bridge", desc: "二层口", chain: []},
                      { type: "node", label: "route", desc: "三层口", chain: []},
                    ]
                  },
                  { type: "node", label: "link-aggregation group", desc: "设置链路聚合",
                    chain: [
                      { type: "param", label: "${1:bagg}", desc: "聚合口序号 如 1", chain: []}
                    ]
                  },
                ],
                children: []
              },
              { type: "node", label: "ipv6 address", desc: "",
                chain: [
                  { type: "param",label: "${1:ipv6-address}", desc: "IPv6地址，如fe80::1",
                    chain: [
                      { type: "param", label: "${1:mask}", desc: "子网掩码，如64 128",chain: []}
                    ]
                  }
                ],
                children: []
              },
              { type: "node", label: "ip address", desc: "",
                chain: [
                  { type: "param",label: "${1:ip-address}", desc: "IP地址，如192.168.1.1",
                    chain: [
                      { type: "param", label: "${1:mask}", desc: "子网掩码，如255.255.255.0",
                        chain: [
                          { type: "node", label: "sub", desc: "配置多地址", chain: []},
                          { type: "node", label: "<cr>", desc: "", chain: []}
                        ],
                      }
                    ]
                  }
                ],
                children: []
              },
              { type: "node", label: "ip binding vpn-instance", desc: "",
                chain: [
                  { type: "param",label: "${1:vpn-name}", desc: "vpn名称",chain: []}
                ],
                children: []
              },
              { type: "node", label: "description", desc: "接口描述",
                chain: [
                  { type: "param", label: "${1:dT}:${2:lldp-name}:(local)${3:port-name}", desc: "pT:NHZ07_M04_R10C09_5130_OB_ASW_52.232:(local)GE0/0/0",chain: []}
                ],
                children: []
              },
              { type: "node", label: "shutdown", desc: "关闭接口",chain:[],children: []},

            ]
          },
          { type: "view", label: "vlan", desc: "配置VLAN",
            chain: [
              { type: "param", label: "${1:vlan-id}", desc: "VLAN ID (1-4094)", chain: []}
            ],
            children: [
              { type: "node", label: "name", desc: "设置VLAN名称",
                chain: [
                  { type: "param", label: "${1:vlan-name}", desc: "VLAN名称", chain: []}
                ],
                children: []
              },
              { type: "node", label: "description", desc: "设置VLAN描述",
                chain: [
                  { type: "param", label: "For_${1:description}", desc: "VLAN描述信息", chain: []}
                ],
                children: []
              }
            ]
          },
          { type: "view", label: "ip vpn-instance", desc: "配置vpn",
            chain: [
              { type: "param", label: "${1:vpn-name}", desc: "vpn名称",chain: []}
            ],
            children: [
              { type: "node", label: "route-distinguisher", desc: "设置rt",
                chain: [
                  { type: "param", label: "${1:rt-label1}:${2:rt-label2}", desc: "rt值",chain: []}
                ],
                children: []
              },
              { type: "node", label: "vpn-target", desc: "设置rt",
                chain: [
                  { type: "param", label: "${1:rt-label1}:${2:rt-label2}", desc: "rt值",
                    chain: [
                      { type: "node", label: "import-extcommunity", desc: "import",chain: []},
                      { type: "node", label: "export-extcommunity", desc: "export",chain: []}
                    ],
                  }
                ],
                children: []
              },
            ]
          },
          { type: "node", label: "ip route-static", desc: "配置静态路由",
            chain: [
              { type: "node", label: "vpn-instance", desc: "vpn路由",
                chain: [
                  { type: "param", label: "${1:vpn-name}", desc: "名称",
                    chain: [
                      { type: "param", label: "${1:net} ${2:mask} ${3:interface-name} ${4:nexthop} description ${5:desc-text}", desc: "网段 掩码 出接口 下一跳地址 描述",chain: []}
                    ],
                  }
                ],
              },
              { type: "param", label: "${1:net} ${2:mask} ${3:interface-name} ${4:nexthop} description ${5:desc-text}", desc: "网段 掩码 出接口 下一跳地址 描述",chain: []}
            ],
            children:[],
          },
          { type: "node", label: "ipv6 route-static", desc: "配置ipv6静态路由",
            chain: [
              { type: "node", label: "vpn-instance", desc: "vpn路由",
                chain: [
                  { type: "param", label: "${1:vpn-name}", desc: "名称",
                    chain: [
                      { type: "param", label: "${1:net} ${2:mask} ${3:interface-name} ${4:nexthop}", desc: "网段 掩码 出接口 下一跳地址",chain: []}
                    ],
                  }
                ],
              },
              { type: "param", label: "${1:net} ${2:mask} ${3:interface-name} ${4:nexthop}", desc: "网段 掩码 出接口 下一跳地址",chain: []}
            ],
            children:[],
          },
          { type: "node", label: "ipv6 prefix-list", desc: "配置ipv6地址前缀",
            chain: [
              { type: "param", label: "${1:prefix-name} index ${2:index-num} permit ${3:ipv6-net} ${4:ipv6-mask}", desc: "前缀名称 index 网段 掩码",
                chain: [
                  { type: "node", label: "<cr>", desc: "",chain: []},
                  { type: "param", label: "greater-equal ${1:ge} less-equal ${2:le}", desc: "附加条件",chain: []},
                ],
              }
            ],
            children:[],
          },
          { type: "node", label: "ip prefix-list", desc: "配置ip地址前缀",
            chain: [
              { type: "param", label: "${1:prefix-name} index ${2:index-num} permit ${3:ip-net} ${4:ip-mask}", desc: "前缀名称 index 网段 掩码",
                chain: [
                  { type: "node", label: "<cr>", desc: "",chain: []},
                  { type: "param", label: "greater-equal ${1:ge} less-equal ${2:le}", desc: "附加条件",chain: []},
                ],
              }
            ],
            children:[],
          },
          { type: "view", label: "bgp", desc: "BGP视图",
            chain: [
              { type: "param", label: "${1:bgp-as}", desc: "进程号", chain: []}
            ],
            children:[
              { type: "node", label: "router-id", desc: "bgp router id",
                chain: [
                  { type: "param",label: "${1:router-id}", desc: "router-id",chain: []}
                ],
                children: []
              },
              { type: "node", label: "group", desc: "设置分组",
                chain: [
                  { type: "param",label: "${1:group-name}", desc: "分组名称",
                    chain: [
                      { type: "node",label: "internal", desc: "iBGP",chain: []},
                      { type: "node",label: "external", desc: "eBGP",chain: []}
                    ],
                  }
                ],
                children: []
              },
              { type: "node", label: "peer", desc: "邻居配置",
                chain: [
                  { type: "param",label: "${1:peer-name}", desc: "邻居IP或邻居分组",
                    chain: [
                      { type: "node",label: "as-number", desc: "配置as号",
                        chain: [
                          { type: "param",label: "${1:asn}", desc: "as号",chain: []}
                        ],
                      },
                      { type: "node",label: "connect-interface", desc: "建连接口",
                        chain: [
                          { type: "param",label: "${1:port-name}", desc: "接口名 如LoopBack0",chain: []}
                        ],
                      },
                      { type: "node",label: "description", desc: "描述",
                        chain: [
                          { type: "param",label: "${1:desc-text}", desc: "描述 如邻居名称",chain: []}
                        ],
                      },
                      { type: "node",label: "group", desc: "设置组",
                        chain: [
                          { type: "param",label: "${1:group-name}", desc: "分组名称",chain: []}
                        ],
                      },
                      { type: "node",label: "bfd multi-hop", desc: "设置bfd", chain: []},
                    ],
                  }
                ],
                children: []
              },
              { type: "view", label: "address-family ipv4 unicast", desc: "ipv4地址族",
                chain:[],
                children: [
                  { type: "node", label: "peer", desc: "邻居配置",
                    chain: [
                      { type: "param",label: "${1:peer-name}", desc: "邻居IP或邻居分组",
                        chain: [
                          { type: "node",label: "enable", desc: "启用",chain: []},
                          { type: "node",label: "advertise-community", desc: "启用community",chain: []},
                          { type: "node",label: "reflect-client", desc: "启用rr",chain: []},
                          { type: "node",label: "next-hop-local", desc: "启用next-hop-local",chain: []},
                          { type: "node",label: "route-policy", desc: "路由策略",
                            chain: [
                              { type: "param",label: "${1:policy-name}", desc: "策略名称",
                                chain: [
                                  { type: "node",label: "import", desc: "引入",chain: []},
                                  { type: "node",label: "export", desc: "发出",chain: []},
                                ],
                              }
                            ],
                          },
                        ],
                      }
                    ],
                    children: []
                  },
                  { type: "node", label: "network", desc: "发布路由",
                    chain: [
                      { type: "param",label: "${1:net} ${2:mask}", desc: "路由",chain: []}
                    ],
                    children: []
                  },
                ],
              },
              { type: "view", label: "address-family ipv6 unicast", desc: "ipv6地址族",
                chain:[],
                children: [
                  { type: "node", label: "peer", desc: "邻居配置",
                    chain: [
                      { type: "param",label: "${1:peer-name}", desc: "邻居IP或邻居分组",
                        chain: [
                          { type: "node",label: "enable", desc: "启用",chain: []},
                          { type: "node",label: "advertise-community", desc: "启用community",chain: []},
                          { type: "node",label: "reflect-client", desc: "启用rr",chain: []},
                          { type: "node",label: "next-hop-local", desc: "启用next-hop-local",chain: []},

                          { type: "node",label: "route-policy", desc: "路由策略",
                            chain: [
                              { type: "param",label: "${1:policy-name}", desc: "策略名称",
                                chain: [
                                  { type: "node",label: "import", desc: "引入",chain: []},
                                  { type: "node",label: "export", desc: "发出",chain: []},
                                ],
                              }
                            ],
                          },
                        ],
                      }
                    ],
                    children: []
                  },
                  { type: "node", label: "network", desc: "发布路由",
                    chain: [
                      { type: "param",label: "${1:net} ${2:mask}", desc: "路由",chain: []}
                    ],
                    children: []
                  },
                ],
              },
              { type: "view", label: "ip vpn-instance", desc: "bgp vpn配置",
                chain:[
                  { type: "param", label: "${1:vpn-name}", desc: "vpn名称", chain: []}
                ],
                children:[
                  { type: "node", label: "group", desc: "设置分组",
                    chain: [
                      { type: "param",label: "${1:group-name}", desc: "分组名称",
                        chain: [
                          { type: "node",label: "internal", desc: "iBGP",chain: []},
                          { type: "node",label: "external", desc: "eBGP",chain: []}
                        ],
                      }
                    ],
                    children: []
                  },
                  { type: "node", label: "peer", desc: "邻居配置",
                    chain: [
                      { type: "param",label: "${1:peer-name}", desc: "邻居IP或邻居分组",
                        chain: [
                          { type: "node",label: "as-number", desc: "配置as号",
                            chain: [
                              { type: "param",label: "${1:asn}", desc: "as号",chain: []}
                            ],
                          },
                          { type: "node",label: "connect-interface", desc: "建连接口",
                            chain: [
                              { type: "param",label: "${1:port-name}", desc: "接口名 如LoopBack0",chain: []}
                            ],
                          },
                          { type: "node",label: "description", desc: "描述",
                            chain: [
                              { type: "param",label: "${1:desc-text}", desc: "描述 如邻居名称",chain: []}
                            ],
                          },
                          { type: "node",label: "group", desc: "设置组",
                            chain: [
                              { type: "param",label: "${1:group-name}", desc: "分组名称",chain: []}
                            ],
                          },
                          { type: "node",label: "bfd multi-hop", desc: "设置bfd", chain: []},
                        ],
                      }
                    ],
                    children: []
                  },
                  { type: "view", label: "address-family ipv4 unicast", desc: "ipv4地址族",
                    chain:[],
                    children: [
                      { type: "node", label: "peer", desc: "邻居配置",
                        chain: [
                          { type: "param",label: "${1:peer-name}", desc: "邻居IP或邻居分组",
                            chain: [
                              { type: "node",label: "enable", desc: "启用",chain: []},
                              { type: "node",label: "advertise-community", desc: "启用community",chain: []},
                              { type: "node",label: "reflect-client", desc: "启用rr",chain: []},
                              { type: "node",label: "next-hop-local", desc: "启用next-hop-local",chain: []},
                              { type: "node",label: "route-policy", desc: "路由策略",
                                chain: [
                                  { type: "param",label: "${1:policy-name}", desc: "策略名称",
                                    chain: [
                                      { type: "node",label: "import", desc: "引入",chain: []},
                                      { type: "node",label: "export", desc: "发出",chain: []},
                                    ],
                                  }
                                ],
                              },
                            ],
                          }
                        ],
                        children: []
                      },
                      { type: "node", label: "network", desc: "发布路由",
                        chain: [
                          { type: "param",label: "${1:net} ${2:mask}", desc: "路由",chain: []}
                        ],
                        children: []
                      },
                    ],
                  },
                  { type: "view", label: "address-family ipv6 unicast", desc: "ipv6地址族",
                    chain:[],
                    children: [
                      { type: "node", label: "peer", desc: "邻居配置",
                        chain: [
                          { type: "param",label: "${1:peer-name}", desc: "邻居IP或邻居分组",
                            chain: [
                              { type: "node",label: "enable", desc: "启用",chain: []},
                              { type: "node",label: "advertise-community", desc: "启用community",chain: []},
                              { type: "node",label: "reflect-client", desc: "启用rr",chain: []},
                              { type: "node",label: "next-hop-local", desc: "启用next-hop-local",chain: []},
                              { type: "node",label: "route-policy", desc: "路由策略",
                                chain: [
                                  { type: "param",label: "${1:policy-name}", desc: "策略名称",
                                    chain: [
                                      { type: "node",label: "import", desc: "引入",chain: []},
                                      { type: "node",label: "export", desc: "发出",chain: []},
                                    ],
                                  }
                                ],
                              },
                            ],
                          }
                        ],
                        children: []
                      },
                      { type: "node", label: "network", desc: "发布路由",
                        chain: [
                          { type: "param",label: "${1:net} ${2:mask}", desc: "路由",chain: []}
                        ],
                        children: []
                      },
                    ],
                  },
                ]
              },
            ],
          },
          { type: "node",label: "commit",desc: "提交配置", chain:[], children:[]},
        ]
      },
      { type: "view", label: "configure terminal", desc: "进入系统视图",
        chain: [], // 无后续参数
        children: [
          { type: "view", label: "interface", desc: "接口视图",
            chain: [
              { type: "node",label: "ethernet", desc: "接口",
                chain: [
                  { type: "param", label: "${1:interface-id}", desc: "聚合口编号，物理口序号+50",chain: []},
                ]
              },
              { type: "node",label: "loopback", desc: "本地接口",
                chain: [
                  { type: "param", label: "${1:loopback-id}", desc: "逻辑接口",chain: []},
                ]
              },
              { type: "node",label: "mgmt", desc: "管理口",
                chain: [
                  { type: "param", label: "${1:mgmt-id}", desc: "mgmt 0",chain: []},
                ]
              },
              { type: "node",label: "port-channel", desc: "聚合口二层",
                chain: [
                  { type: "param", label: "${1:po-id}", desc: "聚合口编号，物理口序号+50",chain: []},
                ]
              },
              { type: "node",label: "vlan", desc: "vlan id",
                chain: [
                  { type: "param", label: "${1:vlan-id}", desc: "vlan 号",chain: []},
                ]
              },
            ],
            children: [
              { type: "node", label: "switchport", desc: "二层口",
                chain: [
                  { type: "node", label: "mode", desc: "设置端口链路类型",
                    chain: [
                      { type: "node", label: "access", desc: "access", chain: []},
                      { type: "node", label: "trunk", desc: "trunk", chain: []},
                      { type: "node", label: "<cr>", desc: "", chain: []}
                    ]
                  },
                  { type: "param", label: "channel-group ${1:bagg} mode active", desc: "设置链路聚合",chain: []},
                  { type: "node", label: "trunk", desc: "设置trunk",
                    chain: [
                      { type: "param", label: "native vlan ${1:vlan-id}", desc: "设置native vlan", chain: []},
                      { type: "param", label: "add allowed vlan ${1:vlan-id1},${2:vlan-id2}-${3:vlan-id3}", desc: "设置trunk vlan", chain: []},
                    ]
                  },
                ],
                children: []
              },
              { type: "node", label: "ipv6 address", desc: "",
                chain: [
                  { type: "param",label: "${1:ipv6-mask}", desc: "IPv6地址，如fe80::1/64",chain: []}
                ],
                children: []
              },
              { type: "node", label: "ip address", desc: "",
                chain: [
                  { type: "param",label: "${1:ip-mask}", desc: "IP地址，如1.1.1.1/32",chain: []}
                ],
                children: []
              },
              { type: "node", label: "vrf member", desc: "",
                chain: [
                  { type: "param",label: "${1:vpn-name}", desc: "vpn名称",chain: []}
                ],
                children: []
              },
              { type: "node", label: "description", desc: "接口描述",
                chain: [
                  { type: "param", label: "${1:dT}:${2:lldp-name}:(local)${3:port-name}", desc: "pT:NHZ07_M04_R10C09_5130_OB_ASW_52.232:(local)GE0/0/0",chain: []}
                ],
                children: []
              },
              { type: "node", label: "shutdown", desc: "关闭接口",chain:[],children: []},
            ]
          },
          { type: "view", label: "vlan", desc: "配置VLAN",
            chain: [
              { type: "param", label: "${1:vlan-id}", desc: "VLAN ID (1-4094)", chain: []}
            ],
            children: [
              { type: "node", label: "name", desc: "设置VLAN名称",
                chain: [
                  { type: "param", label: "${1:vlan-name}", desc: "VLAN名称", chain: []}
                ],
                children: []
              },
              { type: "node", label: "description", desc: "设置VLAN描述",
                chain: [
                  { type: "param", label: "For_${1:description}", desc: "VLAN描述信息", chain: []}
                ],
                children: []
              }
            ]
          },
          { type: "view", label: "vrf context", desc: "配置vpn",
            chain: [
              { type: "param", label: "${1:vpn-name}", desc: "vpn名称",chain: []}
            ],
            children: [
              { type: "node", label: "ip route", desc: "配置静态路由",
                chain: [
                  { type: "node", label: "vrf", desc: "vpn路由",
                    chain: [
                      { type: "param", label: "${1:vpn-name}", desc: "名称",
                        chain: [
                          { type: "param", label: "${1:net-mask} ${2:interface-name} ${3:nexthop} name ${4:desc}", desc: "网段/掩码 出接口 下一跳地址 描述",chain: []}
                        ],
                      }
                    ],
                  },
                  { type: "param", label: "${1:net-mask} ${2:interface-name} ${3:nexthop} name ${4:desc}", desc: "网段/掩码 出接口 下一跳地址 描述",chain: []}
                ],
                children:[],
              },
            ]
          },
          { type: "node", label: "ip route", desc: "配置静态路由",
            chain: [
              { type: "node", label: "vrf", desc: "vpn路由",
                chain: [
                  { type: "param", label: "${1:vpn-name}", desc: "名称",
                    chain: [
                      { type: "param", label: "${1:net-mask} ${2:interface-name} ${3:nexthop} name ${4:desc}", desc: "网段/掩码 出接口 下一跳地址 描述",chain: []}
                    ],
                  }
                ],
              },
              { type: "param", label: "${1:net-mask} ${2:interface-name} ${3:nexthop} name ${4:desc}", desc: "网段/掩码 出接口 下一跳地址 描述",chain: []}
            ],
            children:[],
          },
          { type: "node", label: "ipv6 route", desc: "配置静态路由",
            chain: [
              { type: "node", label: "vrf", desc: "vpn路由",
                chain: [
                  { type: "param", label: "${1:vpn-name}", desc: "名称",
                    chain: [
                      { type: "param", label: "${1:net-mask} ${2:interface-name} ${3:nexthop} name ${4:desc}", desc: "网段/掩码 出接口 下一跳地址 描述",chain: []}
                    ],
                  }
                ],
              },
              { type: "param", label: "${1:net-mask} ${2:interface-name} ${3:nexthop} name ${4:desc}", desc: "网段/掩码 出接口 下一跳地址 描述",chain: []}
            ],
            children:[],
          },
          { type: "node", label: "ip prefix-list", desc: "配置ip地址前缀",
            chain: [
              { type: "param", label: "${1:prefix-name} seq ${2:index-num} permit ${3:ip-mask}", desc: "前缀名称 index 网段/掩码",
                chain: [
                  { type: "node", label: "<cr>", desc: "",chain: []},
                  { type: "param", label: "ge ${1:ge} le ${2:le}", desc: "附加条件",chain: []},
                ],
              }
            ],
            children:[],
          },
          { type: "node", label: "ipv6 prefix-list", desc: "配置ip地址前缀",
            chain: [
              { type: "param", label: "${1:prefix-name} seq ${2:index-num} permit ${3:ip-mask}", desc: "前缀名称 index 网段/掩码",
                chain: [
                  { type: "node", label: "<cr>", desc: "",chain: []},
                  { type: "param", label: "ge ${1:ge} le ${2:le}", desc: "附加条件",chain: []},
                ],
              }
            ],
            children:[],
          },
          { type: "view", label: "router bgp", desc: "BGP视图",
            chain: [
              { type: "param", label: "${1:bgp-as}", desc: "进程号", chain: []}
            ],
            children:[
              { type: "node", label: "router-id", desc: "bgp router id",
                chain: [
                  { type: "param",label: "${1:router-id}", desc: "router-id",chain: []}
                ],
                children: []
              },
              { type: "node", label: "neighbor", desc: "设置分组",
                chain: [
                  { type: "param",label: "${1:group-name}", desc: "分组名称",
                    chain: [
                      { type: "node",label: "peer group", desc: "设置组",
                        chain: [
                          { type: "param", label: "${1:group-name}", desc: "组名", chain: []},
                          { type: "node", label: "<cr>", desc: "",chain: []},
                        ],
                      },
                      { type: "node",label: "send-community", desc: "发送community",chain: []},
                      { type: "node",label: "bfd", desc: "设置bfd",chain: []},
                      { type: "node",label: "next-hop-self", desc: "设置next-hop-self",chain: []},
                      { type: "node",label: "out-delay 0", desc: "设置out-delay",chain: []},
                      { type: "param",label: "maximum-routes ${1:route-sum}", desc: "路由总数",chain: []},
                      { type: "node",label: "remote-as", desc: "eBGP 设置as号",
                        chain: [
                          { type: "param", label: "${1:bgp-as}", desc: "进程号", chain: []}
                        ],
                      },
                      { type: "node",label: "route-map", desc: "路由策略",
                        chain: [
                          { type: "param", label: "${1:map-name}", desc: "策略名称",
                            chain: [
                              { type: "node", label: "in", desc: "引入", chain: []},
                              { type: "node", label: "out", desc: "发出", chain: []}
                            ],
                          }
                        ],
                      },

                    ],
                  }
                ],
                children: []
              },

              { type: "view", label: "address-family ipv4", desc: "ipv4地址族",
                chain:[
                  { type: "node",label: "<cr>", desc: "",chain: []},
                  { type: "node",label: "unicast", desc: "",chain: []},
                ],
                children: [
                  { type: "node", label: "neighbor", desc: "邻居配置",
                    chain: [
                      { type: "param",label: "${1:peer-name}", desc: "邻居IP或邻居分组",
                        chain: [
                          { type: "node",label: "activate", desc: "启用",chain: []},
                        ],
                      }
                    ],
                    children: []
                  },
                  { type: "node", label: "network", desc: "发布路由",
                    chain: [
                      { type: "param",label: "${1:ip-mask}", desc: "路由",chain: []}
                    ],
                    children: []
                  },

                ],
              },

              { type: "view", label: "address-family ipv6", desc: "ipv4地址族",
                chain:[
                  { type: "node",label: "<cr>", desc: "",chain: []},
                  { type: "node",label: "unicast", desc: "",chain: []},
                ],
                children: [
                  { type: "node", label: "neighbor", desc: "邻居配置",
                    chain: [
                      { type: "param",label: "${1:peer-name}", desc: "邻居IP或邻居分组",
                        chain: [
                          { type: "node",label: "activate", desc: "启用",chain: []},
                        ],
                      }
                    ],
                    children: []
                  },
                  { type: "node", label: "network", desc: "发布路由",
                    chain: [
                      { type: "param",label: "${1:ip-mask}", desc: "路由",chain: []}
                    ],
                    children: []
                  },
                ],
              },

              { type: "view", label: "vrf", desc: "bgp vpn配置",
                chain:[
                  { type: "param", label: "${1:vpn-name}", desc: "vpn名称", chain: []}
                ],
                children:[
                  { type: "node", label: "rd", desc: "设置vpn rd",
                    chain: [
                      { type: "param",label: "${1:rd}:${2:rd}", desc: "rd值",chain: []}
                    ],
                    children: []
                  },
                  { type: "node", label: "router-id", desc: "bgp router id",
                    chain: [
                      { type: "param",label: "${1:router-id}", desc: "router-id",chain: []}
                    ],
                    children: []
                  },
                  { type: "node", label: "neighbor", desc: "设置分组",
                    chain: [
                      { type: "param",label: "${1:group-name}", desc: "分组名称",
                        chain: [
                          { type: "node",label: "peer group", desc: "设置组",
                            chain: [
                              { type: "param", label: "${1:group-name}", desc: "组名", chain: []},
                              { type: "node", label: "<cr>", desc: "",chain: []},
                            ],
                          },
                          { type: "node",label: "send-community", desc: "发送community",chain: []},
                          { type: "node",label: "bfd", desc: "设置bfd",chain: []},
                          { type: "node",label: "next-hop-self", desc: "设置next-hop-self",chain: []},
                          { type: "node",label: "out-delay 0", desc: "设置out-delay",chain: []},
                          { type: "param",label: "maximum-routes ${1:route-sum}", desc: "路由总数",chain: []},
                          { type: "node",label: "remote-as", desc: "eBGP 设置as号",
                            chain: [
                              { type: "param", label: "${1:bgp-as}", desc: "进程号", chain: []}
                            ],
                          },
                          { type: "node",label: "route-map", desc: "路由策略",
                            chain: [
                              { type: "param", label: "${1:map-name}", desc: "策略名称",
                                chain: [
                                  { type: "node", label: "in", desc: "引入", chain: []},
                                  { type: "node", label: "out", desc: "发出", chain: []}
                                ],
                              }
                            ],
                          },

                        ],
                      }
                    ],
                    children: []
                  },
                  { type: "view", label: "address-family ipv4", desc: "ipv4地址族",
                    chain:[],
                    children: [
                      { type: "node", label: "neighbor", desc: "邻居配置",
                        chain: [
                          { type: "param",label: "${1:peer-name}", desc: "邻居IP或邻居分组",
                            chain: [
                              { type: "node",label: "activate", desc: "启用",chain: []},
                            ],
                          }
                        ],
                        children: []
                      },
                      { type: "node", label: "network", desc: "发布路由",
                        chain: [
                          { type: "param",label: "${1:ip-mask}", desc: "路由",chain: []}
                        ],
                        children: []
                      },
                    ],
                  },
                  { type: "view", label: "address-family ipv6", desc: "ipv4地址族",
                    chain:[],
                    children: [
                      { type: "node", label: "neighbor", desc: "邻居配置",
                        chain: [
                          { type: "param",label: "${1:peer-name}", desc: "邻居IP或邻居分组",
                            chain: [
                              { type: "node",label: "activate", desc: "启用",chain: []},
                            ],
                          }
                        ],
                        children: []
                      },
                      { type: "node", label: "network", desc: "发布路由",
                        chain: [
                          { type: "param",label: "${1:ip-mask}", desc: "路由",chain: []}
                        ],
                        children: []
                      },
                    ],
                  },
                ]
              },

              { type: "view", label: "template peer", desc: "peer 分组",
                chain: [
                  {type: "param",label: "${1:group-name}", desc: "分组名称",chain:[]},
                ],
                children: [
                  { type: "node", label: "remote-as", desc: " asn",
                    chain: [
                      { type: "param",label: "${1:asn}", desc: "asn",chain: []}
                    ],
                    children: []
                  },
                  { type: "view", label: "address-family ipv4 unicast", desc: "ipv4地址族",
                    chain:[],
                    children: [
                      { type: "node", label: "send-community", desc: "发布community",chain: [],children: []},
                      { type: "node", label: "route-reflector-client", desc: "rr",chain: [],children: []},
                      { type: "node", label: "next-hop-self", desc: "next-hop-self",chain: [],children: []},
                      { type: "node", label: "route-map", desc: "策略",
                        chain: [
                          { type: "param",label: "${1:map-name}", desc: "策略名称",
                            chain: [
                              { type: "node",label: "in", desc: "引入",chain: []},
                              { type: "node",label: "out", desc: "发出",chain: []},
                            ],
                          }
                        ],
                        children: [],
                      },
                    ],
                  },
                  { type: "view", label: "address-family ipv6 unicast", desc: "ipv6地址族",
                    chain:[],
                    children: [
                      { type: "node", label: "send-community", desc: "发布community",chain: [],children: []},
                      { type: "node", label: "route-reflector-client", desc: "rr",chain: [],children: []},
                      { type: "node", label: "next-hop-self", desc: "next-hop-self",chain: [],children: []},
                      { type: "node", label: "route-map", desc: "策略",
                        chain: [
                          { type: "param",label: "${1:map-name}", desc: "策略名称",
                            chain: [
                              { type: "node",label: "in", desc: "引入",chain: []},
                              { type: "node",label: "out", desc: "发出",chain: []},
                            ],
                          }
                        ],
                        children: [],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          { type: "node",label: "commit",desc: "提交配置", chain:[], children:[]},
        ],
      },
      { type: "node",label: "copy running-config startup-config",desc: "保存配置", chain:[], children:[]},
      { type: "node",label: "save",desc: "保存配置",
        chain:[
          { type: "node", label: "force", desc: "",chain: []},
          { type: "node", label: "<cr>", desc: "",chain: []},

        ],
        children:[],
      },
      { type: "node",label: "display",desc: "查询信息",
        chain: [
          { type: "node",label: "current-configuration",desc: "显示当前配置",chain: []},
          { type: "node", label: "interface", desc: "显示接口信息",
            chain: [
              {
                type: "param",
                label: "${1:interface-type}",
                desc: "接口类型，如GigabitEthernet",
                chain: [
                  {
                    type: "param",
                    label: "${1:interface-id}",
                    desc: "接口编号，如0/0/1",
                    chain: []
                  }
                ]
              }
            ]
          },
          { type: "node",label: "acl",desc: "",
            chain: [
              { type: "node",label: "all", desc: "",chain: []},
              { type: "node",label: "ipv6", desc: "",
                chain: [
                  { type: "node",label: "all", desc: "",chain: []},
                  { type: "param",label: "${1:acl-number}",desc: "",chain: []},
                ],
              },
              { type: "param",label: "${1:acl-number}",desc: "",chain: []},

            ],
          },
        ],
        children: []
      },
      { type: "node",label: "show",desc: "查询信息",
        chain: [
          { type: "node",label: "running-config",desc: "显示当前配置",chain: []},
          { type: "node", label: "interface", desc: "显示接口信息",
            chain: [
              {
                type: "param",
                label: "${1:interface-type}",
                desc: "接口类型，如GigabitEthernet",
                chain: [
                  {
                    type: "param",
                    label: "${1:interface-id}",
                    desc: "接口编号，如0/0/1",
                    chain: []
                  }
                ]
              }
            ]
          },
          { type: "node",label: "access-lists",desc: "",
            chain: [
              { type: "node",label: "summary", desc: "",chain: []},
              { type: "node",label: "<cr>", desc: "",chain: []},
              { type: "param",label: "${1:acl-number}",desc: "",chain: []},
            ],
          },
        ],
        children: []
      },
      { type: "template",
        label: "ifcondition",
        desc: "测试模板",
        detail: [
                  "if ${1:condition}:",
                  "\tpass",
                  "else:",
                  "\tpass",
                  "",
                ].join("\n"),
        chain: [],
        children:[]
      },
      { type: "template",
        label: "interfaceVrrp",
        desc: "接口vrrp配置模板",
        detail: [
                  "vlan ${1:vlanid}",
                  "\texit",
                  "interface Vlan${1:vlanid}",
                  "\tdescription For_${2:desc}",
                  "\tmtu 9000",
                  "\tip address ${3:ip-addr}",
                  "\tip virtual-router address ${4:gate}",
                  "\tmac address virtual-router",
                  "\tip proxy-arp",
                  "\tip local-proxy-arp",
                  "\tarp gratuitous accept",
                  "\tarp aging timeout 60",
                  "\tarp monitor mac-address",
                  "\tip attached-host route export 1",
                  "\tno shutdown",
                  "\texit",
                ].join("\n"),
        chain: [],
        children:[]
      },

    ]
  },

  // 关键字列表（用于基础补全）
  keywords: [
    // 全局配置命令
    'system-view', 'return', 'quit', 'save', 'display', 'undo',
    'configure', 'terminal',
    // 接口相关
    'port', 'access', 'trunk', 'link-type', 'link-mode', 'mode',
    'switchport','description', 'speed', 'duplex','link-aggregation',
    // VLAN相关
    'vlan batch', 'vlan', 'name', 'description',
    // IP相关
    'ip', 'ipv6', 'address', 'route-static', 'vrf',
    // 路由协议
    'ospf', 'bgp', 'isis', 'rip', 'area', 'network', 'peer', 'group', 'router', 'route',
    // 用户和认证
    'local-user', 'service-type', 'password', 'authorization-attribute',
    // QoS相关
    'qos', 'traffic classifier', 'traffic behavior', 'traffic policy',
    // 安全相关
    'firewall zone', 'assign interface', 'rule', 'acl', 'match', 'number',
    // 系统参数
    'sysname', 'domain-name', 'clock timezone', 'ntp-service',
    'binding', 'vpn-instance', 'vrf',
  ],

  // 警告词（用于命令校验）
  warning_words: [
    'enable', 'shutdown', 'undo', 'interface', 'Vlan', 'no'
  ],
};
