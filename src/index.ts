import Graphin from './Graphin';
import registerGraphinForce from './layout/inner/registerGraphinForce';
import registerPresetLayout from './layout/inner/registerPresetLayout';
import { registerGraphinCircle, registerGraphinLine } from './shape';
// const { data } = require('../public/data.json')
const data = require('../public/data.js')

/** 注册 Graphin force 布局 */
registerGraphinForce();
/** 注册 Graphin preset 布局 */
registerPresetLayout();

/** 注册 Graphin Circle Node */
registerGraphinCircle();

/** 注册 Graphin line Edge */
registerGraphinLine();

const element = document.getElementById('graph') as HTMLDivElement;
const graph = new Graphin({
  container: element,
  data,
  modes: {
    default: ['drag-canvas', 'zoom-canvas', 'drag-node']
  },
  layout: {
    // type: 'force'
    type: 'graphin-force'
  }
})

graph.graph.on('node:dragend', () => {
  console.log(graph);
  graph.layout.changeLayout();
})

// console.log(graph);
// console.log(Graphin);
// console.log(graph instanceof Graphin);


// const graph = new G6.Graph({
//   container: element,
//   // width: 1200,
//   // height: 800,
//   layout: {
//     type: 'graphin-force',
//     // type: 'force',
//     // preventOverlap: true,
//     // nodeSpacing: 10
//   },
//   modes: {
//     default: ['drag-canvas', 'zoom-canvas', 'drag-node']
//   }
// })

// graph.data(data)

// console.log(graph, 'graph');


// graph.render()
// console.log(graph);
