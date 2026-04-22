---
title: "技能与专长"
description: "我的核心技能与专业领域，涵盖水利工程专业技能和信息技术能力"
anchor: "SkillsVisual"  # 锚点标识，用于URL定位
categories:
  - name: "水利工程专业技能"
    skills:
      - name: "水资源管理与规划"
        level: 95
        years: 5
        description: "水资源承载力评价、优化调度、区域规划"
        projects: ["绍兴水资源承载力评价", "数字孪生浙东引水工程"]
      - name: "水文预测与模拟"
        level: 95
        years: 5
        description: "降雨分析、径流预测、水文模型构建"
        projects: ["浙东引水工程降雨预测", "用水量预测研究"]
      - name: "数字孪生与智慧水利"
        level: 90
        years: 3
        description: "数字孪生系统设计、智能决策支持"
        projects: ["数字孪生浙东引水工程"]
      - name: "河网水动力模拟"
        level: 85
        years: 5
        description: "河网水流模拟、泥沙输移计算"
        projects: ["河网非均匀沙输移研究", "秀山大桥海域潮流模型"]
      - name: "GIS 空间分析"
        level: 90
        years: 5
        description: "ArcGIS、QGIS、空间数据处理"
        projects: ["钱塘江岸线规划"]
      - name: "水力仿真建模 (WNTR)"
        level: 85
        years: 2
        description: "供水管网水力仿真、正反算分析、管网优化"
        projects: ["缙云县水资源数字化端到端治理"]
      - name: "多目标优化"
        level: 85
        years: 2
        description: "多目标优化算法、成本最小化与压力保障联合优化"
        projects: ["缙云管网优化", "梯级水库联合调度"]
      - name: "生态流量核定"
        level: 85
        years: 2
        description: "Tennant法、QP法、生态流量泄放设施改造方案"
        projects: ["浙江省小型水库生态流量核定"]
        
  - name: "机器学习与数据科学"
    skills:
      - name: "LSTM 深度学习"
        level: 95
        years: 3
        description: "时间序列预测、用水量预测、降雨预测"
        projects: ["浙江省用水量预测", "浙东引水工程降雨预测"]
      - name: "时间序列分析"
        level: 95
        years: 5
        description: "Mann-Kendall、Sen's斜率、ARIMA、Informer"
        projects: ["用水量变化趋势分析", "降雨多尺度变异性研究"]
      - name: "多准则决策方法"
        level: 90
        years: 3
        description: "AHP、CRITIC、TOPSIS 综合评价"
        projects: ["水资源承载力评价"]
      - name: "Python 数据分析"
        level: 95
        years: 5
        description: "Pandas、NumPy、Scikit-learn、TensorFlow"
        projects: ["所有数据分析项目"]
      - name: "数据可视化"
        level: 90
        years: 5
        description: "Matplotlib、Seaborn、Plotly、ECharts"
        projects: ["可视化决策支持系统"]
        
  - name: "软件开发"
    skills:
      - name: "Python"
        level: 95
        years: 5
        description: "数据分析、机器学习、Web 开发、自动化脚本"
        projects: ["水资源模型软件", "数据分析工具"]
      - name: "TypeScript/JavaScript"
        level: 85
        years: 3
        description: "Web 前端开发、全栈开发"
        projects: ["个人网站", "岸线管理系统"]
      - name: "React/Next.js"
        level: 90
        years: 2
        description: "现代前端框架、SSR、全栈应用"
        projects: ["个人网站", "可视化决策系统"]
      - name: "Fortran"
        level: 85
        years: 5
        description: "数值计算、水文模型开发、高性能计算"
        projects: ["河网水动力模型", "泥沙输移模型"]
      - name: "数据库"
        level: 80
        years: 5
        description: "PostgreSQL、MySQL、PostGIS 空间数据库"
        projects: ["岸线资源数据库", "水资源管理系统"]
      - name: "Git/GitHub"
        level: 95
        years: 5
        description: "版本控制、代码协作、开源贡献"
        
  - name: "专业工具"
    skills:
      - name: "ArcGIS/QGIS"
        level: 95
        years: 5
        description: "空间分析、岸线规划、资源评价"
        projects: ["钱塘江岸线规划"]
      - name: "MIKE 系列"
        level: 80
        years: 5
        description: "MIKE 11、MIKE 21、水动力模拟"
      - name: "Neovim"
        level: 95
        years: 4
        description: "高效文本编辑、配置定制化"
      - name: "Docker"
        level: 75
        years: 3
        description: "容器化部署、环境管理"
tracks:
  ai:
    categoryOrder: ["机器学习与数据科学", "软件开发"]
    hiddenCategories: ["水利工程专业技能", "专业工具"]
    extraCategories:
      - name: "AI & LLM 工程"
        skills:
          - name: "Claude Code Harness"
            level: 95
          - name: "Prompt Engineering"
            level: 90
          - name: "MCP 生态集成"
            level: 90
          - name: "AI Agent 工作流"
            level: 85
  devtools:
    categoryOrder: ["软件开发"]
    hiddenCategories: ["水利工程专业技能", "机器学习与数据科学"]
    extraCategories:
      - name: "开发者工具"
        skills:
          - name: "CLI 工具链设计"
            level: 95
          - name: "Raycast 集成"
            level: 95
          - name: "自动化工作流"
            level: 90
          - name: "VPS 运维"
            level: 85
  indie:
    categoryOrder: ["软件开发"]
    hiddenCategories: ["水利工程专业技能", "机器学习与数据科学", "专业工具"]
    extraCategories:
      - name: "产品与运营"
        skills:
          - name: "端到端产品交付"
            level: 95
          - name: "VPS/Docker 部署"
            level: 90
          - name: "域名/CDN/SSL"
            level: 90
          - name: "产品设计"
            level: 80
      - name: "量化投资"
        skills:
          - name: "期权策略 (Covered Call)"
            level: 90
          - name: "跨境资产配置"
            level: 90
          - name: "Greeks 风控"
            level: 85
          - name: "Streamlit 仪表盘"
            level: 90
---

我的专业技能横跨**水利工程**与**信息技术**两大领域，通过**跨学科融合**，解决行业实际问题。

**核心优势**：
- 🎓 完成博士级别课程学习，具备深厚的理论基础
- 💻 精通 Python、TypeScript、Fortran 等多种编程语言
- 🤖 擅长将机器学习技术应用于水利工程实践
- 🛠️ 开发多款专业软件系统，获得 3 项软件著作权
- 📊 丰富的数据分析与可视化经验
- 🌐 全栈开发能力，能够独立完成完整项目
