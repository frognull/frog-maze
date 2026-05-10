## 技术栈

纯前端项目：HTML + 原生JS + CSS，无构建工具，直接打开 `index.html` 运行。

## 架构

`app.js` 包含5个核心类：
- `Maze`: 数据结构，cells数组存储每个单元格的四面墙状态
- `MazeRenderer`: Canvas渲染，线条形式绘制墙壁（非方块）
- `MazeGenerator`: 5种生成算法（递归回溯/Prim/Kruskal/Eller/递归分割）
- `MazeSolver`: 5种求解算法（BFS/DFS/A*/Dijkstra/墙跟随）
- `App`: 主控制器，协调各组件

## 关键约定

- 墙壁用线条绘制，每单元格有 `walls: {top, right, bottom, left}`
- 求解路径用青色连线显示，遍历单元格用半透明蓝色背景标记
- 默认动画速度100（最快），速度值越大动画越快
- `.maze` 文件格式为JSON，包含width/height/start/end/walls

## 注意事项

- A*算法使用 `closedSet` 和 `inOpenSet` 集合而非 `visited` 标记
- Eller算法需正确传递集合编号到下一行
- 递归分割停止条件是 `w <= 1 || h <= 1`
- 墙跟随算法用 `cameFrom` 记录首次访问路径，`visitedCells` 记录所有遍历