# Tasks
- [x] Task 1: 定义留存循环的数据模型与规则
  - [x] SubTask 1.1: 定义每日委托、星路节点、主题解锁和推荐目标的数据类型
  - [x] SubTask 1.2: 设计每日委托生成与进度更新规则，保证同一天结果稳定且无需后端
  - [x] SubTask 1.3: 设计星路累计与主题解锁规则，并明确默认主题与解锁阈值

- [x] Task 2: 扩展本地存档与应用层状态
  - [x] SubTask 2.1: 为档案增加每日委托进度、星路总星数、已解锁主题和当前主题
  - [x] SubTask 2.2: 为旧存档提供兼容默认值和安全归一化
  - [x] SubTask 2.3: 在应用层统一计算“当前最推荐的下一个目标”

- [x] Task 3: 完善首页的重复游玩入口
  - [x] SubTask 3.1: 在首页加入每日委托摘要卡片，展示完成数和关键进度
  - [x] SubTask 3.2: 在首页加入星路进度展示，突出下一个主题解锁节点
  - [x] SubTask 3.3: 保持现有模式入口和每日挑战入口可见，不让新信息挤压主玩法入口

- [x] Task 4: 完善结算页的复玩引导
  - [x] SubTask 4.1: 在结算页展示本局推动了哪些每日委托和星路进度
  - [x] SubTask 4.2: 增加“还差多少即可达成”的差一点反馈
  - [x] SubTask 4.3: 增加基于推荐模式的一键再来一局入口

- [x] Task 5: 在设置页加入主题切换
  - [x] SubTask 5.1: 展示默认主题与已解锁主题列表
  - [x] SubTask 5.2: 对未解锁主题显示解锁条件而不是允许直接切换
  - [x] SubTask 5.3: 让主题切换同步影响首页、局内和结算页的视觉变量

- [x] Task 6: 验证稳定性与兼容性
  - [x] SubTask 6.1: 为每日委托生成、星路解锁和存档兼容补充测试
  - [x] SubTask 6.2: 验证首页、结算页、设置页在移动端竖屏下仍然易读
  - [x] SubTask 6.3: 执行 `lint`、`test`、`build` 并完成至少一轮人工流程验收

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 1, Task 2]
- [Task 4] depends on [Task 1, Task 2]
- [Task 5] depends on [Task 1, Task 2]
- [Task 6] depends on [Task 3, Task 4, Task 5]
