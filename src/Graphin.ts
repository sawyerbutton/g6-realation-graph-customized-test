import G6, { Graph as IGraph, GraphData, GraphOptions, TreeGraphData } from '@antv/g6';

/** 内置API */
import ApiController from './apis';
import { ApisType } from './apis/types';

import { DEFAULT_TREE_LATOUT_OPTIONS, TREE_LAYOUTS } from './consts';

// import './index.less';
/** 内置布局 */
import LayoutController from './layout';
import { getDefaultStyleByTheme, ThemeData } from './theme/index';
/** types  */
import { GraphinData, GraphinProps, GraphinTreeData, IconLoader } from './typings/type';
import cloneDeep from './utils/cloneDeep';
/** utils */
// import shallowEqual from './utils/shallowEqual';
import deepEqual from './utils/deepEqual';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DiffValue = any;

export interface GraphinState {
  isReady: boolean;
  context: {
    graph: IGraph;
    apis: ApisType;
    theme: ThemeData;
    layout: LayoutController;
  };
}

export interface RegisterFunction {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (name: string, options: { [key: string]: any }, extendName?: string): void;
}

class Graphin {
  static registerNode: RegisterFunction = (nodeName, options, extendedNodeName) => {
    G6.registerNode(nodeName, options, extendedNodeName);
  };

  static registerEdge: RegisterFunction = (edgeName, options, extendedEdgeName) => {
    G6.registerEdge(edgeName, options, extendedEdgeName);
  };

  static registerCombo: RegisterFunction = (comboName, options, extendedComboName) => {
    G6.registerCombo(comboName, options, extendedComboName);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static registerBehavior(behaviorName: string, behavior: any) {
    G6.registerBehavior(behaviorName, behavior);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static registerFontFamily(iconLoader: IconLoader): { [icon: string]: any } {
    /**  注册 font icon */
    const iconFont = iconLoader();
    const { glyphs, fontFamily } = iconFont;
    const icons = glyphs.map(item => {
      return {
        name: item.name,
        unicode: String.fromCodePoint(item.unicode_decimal),
      };
    });

    return new Proxy(icons, {
      get: (target, propKey: string) => {
        const matchIcon = target.find(icon => {
          return icon.name === propKey;
        });
        if (!matchIcon) {
          console.error(`%c fontFamily:${fontFamily},does not found ${propKey} icon`);
          return '';
        }
        return matchIcon?.unicode;
      },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static registerLayout(layoutName: string, layout: any) {
    G6.registerLayout(layoutName, layout);
  }

  /** Graph的DOM */
  graphDOM: HTMLDivElement | null = null;

  /** G6 instance */
  graph: IGraph;

  /** layout */
  layout: LayoutController;

  layoutCache: boolean;

  width: number;

  height: number;

  /** 是否为 Tree Graph */
  isTree: boolean;

  /** G6实例中的 nodes,edges,combos 的 model，会比props.data中多一些引用赋值产生的属性，比如node中的 x,y */
  data: GraphinTreeData | GraphinData | undefined;

  options: GraphOptions;

  apis: ApisType;

  theme: ThemeData;
  
  state: any;
  props: any;
  setState: any;

  constructor(props: GraphinProps) {
    this.props = props;
    const { data, layout, width, height, layoutCache, container, ...otherOptions } = props;
    this.graphDOM = container
    this.data = data;
    this.isTree =
      Boolean(props.data && (props.data as GraphinTreeData).children) ||
      TREE_LAYOUTS.indexOf(String(layout && layout.type)) !== -1;
    this.graph = {} as IGraph;
    this.height = Number(height);
    this.width = Number(width);

    this.theme = {} as ThemeData;
    this.apis = {} as ApisType;
    this.layoutCache = layoutCache;
    this.layout = {} as LayoutController;

    this.options = { ...otherOptions } as GraphOptions;

    this.state = {
      isReady: false,
      context: {
        graph: this.graph,
        apis: this.apis,
        theme: this.theme,
        layout: this.layout,
      },
    };

    this.initGraphInstance();
    
  }

  initData = (data: GraphinProps['data']) => {
    if ((data as GraphinTreeData).children) {
      this.isTree = true;
    }
    this.data = cloneDeep(data);
  };

  initGraphInstance = () => {
    const {
      theme,
      data,
      layout,
      width,
      height,
      defaultCombo = { style: {}, type: 'graphin-combo' },
      defaultEdge = { style: {}, type: 'graphin-line' },
      defaultNode = { style: {}, type: 'graphin-circle' },
      nodeStateStyles,
      edgeStateStyles,
      comboStateStyles,
      modes = { default: [] },
      animate,
      handleAfterLayout,
      ...otherOptions
    } = this.props;
    if (modes.default.length > 0) {
      // TODO :给用户正确的引导，推荐使用Graphin的Behaviors组件
      console.info('%c suggestion: you can use @antv/graphin Behaviors components', 'color:lightgreen');
    }
    /**  width and height */
    const { clientWidth, clientHeight } = this.graphDOM as HTMLDivElement;
    /** shallow clone */
    this.initData(data);

    /** 重新计算宽度 */
    this.width = Number(width) || clientWidth || 500;
    this.height = Number(height) || clientHeight || 500;

    const themeResult = getDefaultStyleByTheme(theme);
    
    const {
      defaultNodeStyle,
      defaultEdgeStyle,
      defaultComboStyle,
      defaultNodeStatusStyle,
      defaultEdgeStatusStyle,
      defaultComboStatusStyle,
      ...otherTheme
    } = themeResult;

    /** graph type */
    this.isTree =
      Boolean((data as GraphinTreeData).children) || TREE_LAYOUTS.indexOf(String(layout && layout.type)) !== -1;

    const finalStyle = {
      defaultNode: { style: { ...defaultNode.style, _theme: theme }, type: defaultNode.type || 'graphin-circle' }, // isGraphinNodeType ? deepMix({}, defaultNodeStyle, defaultNode) : defaultNode,
      defaultEdge: { style: { ...defaultEdge.style, _theme: theme }, type: defaultEdge.type || 'graphin-line' }, // isGraphinEdgeType ? deepMix({}, defaultEdgeStyle, defaultEdge) : defaultEdge,
      defaultCombo: { style: { ...defaultCombo.style, _theme: theme }, type: defaultCombo.type || 'combo' }, // deepMix({}, defaultComboStyle, defaultCombo), // TODO:COMBO的样式需要内部自定义
      /** status 样式 */
      nodeStateStyles, // isGraphinNodeType ? deepMix({}, defaultNodeStatusStyle, nodeStateStyles) : nodeStateStyles,
      edgeStateStyles, // isGraphinEdgeType ? deepMix({}, defaultEdgeStatusStyle, edgeStateStyles) : edgeStateStyles,
      comboStateStyles, // deepMix({}, defaultComboStatusStyle, comboStateStyles),
    };
    // @ts-ignore
    this.theme = { ...finalStyle, ...otherTheme } as ThemeData;

    this.options = {
      container: this.graphDOM,
      renderer: 'canvas',
      width: this.width,
      height: this.height,
      animate: animate !== false,
      ...finalStyle,
      modes,
      ...otherOptions,
    } as GraphOptions;

    if (this.isTree) {
      this.options.layout = layout || DEFAULT_TREE_LATOUT_OPTIONS;
      this.graph = new G6.TreeGraph(this.options);
    } else {
      this.graph = new G6.Graph(this.options);
    }

    /** 内置事件:AfterLayout 回调 */
    this.graph.on('afterlayout', () => {
      if (handleAfterLayout) {
        handleAfterLayout(this.graph);
      }
    });

    /** 装载数据 */
    this.graph.data(this.data as GraphData | TreeGraphData);
    /** 初始化布局：仅限网图 */
    if (!this.isTree) {
      this.layout = new LayoutController(this);
      this.layout.start();
    }

    // this.graph.get('canvas').set('localRefresh', true);

    /** 渲染 */
    this.graph.render();
    /** FitView 变为组件可选 */

    /** 初始化状态 */
    this.initStatus();
    /** 生成API */
    this.apis = ApiController(this.graph);
    // /** 设置Context */
    // this.setState({
    //   isReady: true,
    //   context: {
    //     graph: this.graph,
    //     apis: this.apis,
    //     theme: this.theme,
    //     layout: this.layout,
    //   },
    // });
  };

  updateLayout = () => {
    this.layout.changeLayout();
  };

  /**
   * 组件更新的时候
   * @param prevProps
   */
  updateOptions = () => {
    const { ...options } = this.props;
    return options;
  };

  /** 初始化状态 */
  initStatus = () => {
    if (!this.isTree) {
      const { data } = this.props;
      const { nodes = [], edges = [] } = data as GraphinData;
      nodes.forEach(node => {
        const { status } = node;
        if (status) {
          Object.keys(status).forEach(k => {
            this.graph.setItemState(node.id, k, Boolean(status[k]));
          });
        }
      });
      edges.forEach(edge => {
        const { status } = edge;
        if (status) {
          Object.keys(status).forEach(k => {
            this.graph.setItemState(edge.id, k, Boolean(status[k]));
          });
        }
      });
    }
  };

  componentDidUpdate(prevProps: GraphinProps) {
    // console.time('did-update');
    const isDataChange = this.shouldUpdate(prevProps, 'data');
    const isLayoutChange = this.shouldUpdate(prevProps, 'layout');
    const isOptionsChange = this.shouldUpdate(prevProps, 'options');
    const isThemeChange = this.shouldUpdate(prevProps, 'theme');
    // console.timeEnd('did-update');
    const { data, layoutCache, layout } = this.props;
    this.layoutCache = layoutCache;
    const isGraphTypeChange = (prevProps.data as GraphinTreeData).children !== (data as GraphinTreeData).children;

    if (isThemeChange) {
      // TODO :Node/Edge/Combo 批量调用 updateItem 来改变
    }

    /** 图类型变化 */
    if (isGraphTypeChange) {
      console.error(
        'The data types of pervProps.data and props.data are inconsistent,Graphin does not support the dynamic switching of TreeGraph and NetworkGraph',
      );
      return;
    }
    /** 配置变化 */
    if (isOptionsChange) {
      // this.updateOptions();
    }

    /** 数据变化 */
    if (isDataChange) {
      this.initData(data);
      this.layout.changeLayout();
      this.graph.data(this.data as GraphData | TreeGraphData);
      this.graph.changeData(this.data as GraphData | TreeGraphData);
      this.initStatus();
      this.apis = ApiController(this.graph);
      // console.log('%c isDataChange', 'color:grey');
      this.setState(
        (preState: any) => {
          return {
            ...preState,
            context: {
              graph: this.graph,
              apis: this.apis,
              theme: this.theme,
              layout: this.layout,
            },
          };
        },
        () => {
          this.graph.emit('graphin:datachange');
          if (isLayoutChange) {
            this.graph.emit('graphin:layoutchange', { prevLayout: prevProps.layout, layout });
          }
        },
      );
      return;
    }
    /** 布局变化 */
    if (isLayoutChange) {
      if (this.isTree) {
        // @ts-ignore
        // eslint-disable-next-line react/destructuring-assignment
        this.graph.updateLayout(this.props.layout);
        return;
      }
      /**
       * TODO
       * 1. preset 前置布局判断问题
       * 2. enablework 问题
       * 3. G6 LayoutController 里的逻辑
       */
      /** 数据需要从画布中来 */
      // @ts-ignore
      this.data = this.layout.getDataFromGraph();
      this.layout.changeLayout();
      this.layout.refreshPosition();

      /** 走G6的layoutController */
      // this.graph.updateLayout();
      // console.log('%c isLayoutChange', 'color:grey');
      this.graph.emit('graphin:layoutchange', { prevLayout: prevProps.layout, layout });
    }
  }

  /**
   * 组件移除的时候
   */
  componentWillUnmount() {
    this.clear();
  }

  /**
   * 组件崩溃的时候
   * @param error
   * @param info
   */
  componentDidCatch(error: Error, info: any) {
    console.error('Catch component error: ', error, info);
  }

  clear = () => {
    if (this.layout && this.layout.destroy) {
      this.layout.destroy(); // tree graph
    }
    this.layout = {} as LayoutController;
    this.graph!.clear();
    this.data = { nodes: [], edges: [], combos: [] };
    this.graph!.destroy();
  };

  shouldUpdate(prevProps: GraphinProps, key: string) {
    /* eslint-disable react/destructuring-assignment */
    const prevVal = prevProps[key];
    const currentVal = this.props[key] as DiffValue;
    const isEqual = deepEqual(prevVal, currentVal);
    return !isEqual;
  }

  render() {
    const { isReady } = this.state;
    const { modes, style } = this.props;

    return ;
  }
}
export default Graphin;
