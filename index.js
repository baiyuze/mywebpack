const fs = require('fs');
const path = require('path');
const babylon = require('babylon');
const traverse = require('babel-traverse').default;
const { transformFromAst }  = require('babel-core');

// 首先使用Babylon解析入口文件，生成抽象语法树ast，然后使用babel-traverse找出节点依赖关系，储存在数组中等待使用，
// 之后使用 babel-core 将ast解析成可读的Es5代码，命名code，return其参数
// 然后遍历所有子节点，调用createAsset，将所有代码合并到queue队列中，等待打包
// 最后写一个require函数，通过传入的queue和key来找到对应数组中的函数执行，同时对外输出export.default，等待调用。

let ID = 0;
function createAsset(fileName) {

  const content = fs.readFileSync(fileName, 'utf8');
  const ast = babylon.parse(content, {
    sourceType: 'module'
  });
  //储存依赖关系
  let dependencies = [];
  //寻找其依赖关系
  traverse(ast, {
    ImportDeclaration: ({ node }) => {
      dependencies.push(node.source.value);;
    }
  });

  //将抽象语法树转为数组
  
  const { code } = transformFromAst(ast, null, {
    presets: ['env']
  });
  const id = ID ++;
  return {
    id,
    fileName,
    dependencies,
    code
  }
}
/**
 * 拿到所有依赖的代码
 * @param {入口文件} entry 
 */
function createGraph(entry) {
  const mainAst = createAsset(entry);
  const queue = [mainAst];
  //创建一个拿到相互依赖关系的绝对定位
  for(let assets of queue) {
    //入口目录
    let dirname = path.dirname(assets.fileName);

    //查找相互依赖关系
    assets.dependencies.forEach((relativePath) => {
      //拿到子元素的代码取得绝对路径
      let absolutePath = path.join(dirname, relativePath);

      const child = createAsset(absolutePath);
      child.relativePath = relativePath;
      //继续查找是否有依赖关系
      queue.push(child);
    });
  }
  console.log(queue,'queue')
  return queue;

}

/**
 * 开始编译
 */
function bundle(graph) {
  let modules = '';
  graph.forEach((assets) => {
    let filePath = assets.relativePath || entry;
    modules += `'${filePath}': function(module, exports, require) {${assets.code}},\n`;
  })
  //创建一个自执行函数

  const result = `
(function(modules) {
  function require(id) {
    const module = { exports : {} }
    modules[id](module, module.exports, require)
    return module.exports
  }

  require('./src/test2.js');
})({${modules}});
`
  fs.writeFileSync('./bundle.js', result)
  return result;
}
const entry = './src/test2.js'
const graph = createGraph(entry);
const result = bundle(graph, entry);
