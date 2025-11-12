/**
 * @author claude
 * @date 2020/04/26
 * @description 注册工厂函数
 */

import shape from './shapes/exports.js';
import behavior from './behavior/exports.js';
import registerEdges from './shapes/edges/base-edge.js';

export default G6 => {
  // 注册图形
  shape(G6);
  // 注册行为
  behavior(G6);
  // 注册边
  registerEdges(G6);
};