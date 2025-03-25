// 隐藏screen-inspector的节点
GM_addStyle(
  `
    .base-node{
      display: none;
    }
    .node-item[data-label="字体"],
    .node-item[data-label="段落对齐"],
    .node-item[data-label="垂直对齐"],
    .node-item[data-label="字号"],
    .node-item[data-label="字重"],
    .node-item[data-label="行高"],
    .node-item[data-label="颜色"],
    .node-item[data-label="宽度"]
    {
      display: none !important;
    }
    // .node-box{
    //   display: none !important;
    // }
    .node-box:last-child{
      display: block !important;
    }
    .node-item {
      margin-bottom: 2px !important;
    }
    .node-box {
      margin-bottom: 0px !important;
    }
    `,
)
