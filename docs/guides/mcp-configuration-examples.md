# MCP 配置示例：按工作场景

本文档提供针对不同开发场景的 MCP（Model Context Protocol）配置推荐和完整示例。

---

## 📋 目录

1. [前端开发（React/Next.js）](#前端开发reactnextjs)
2. [后端开发（Node.js/Express + Supabase）](#后端开发nodejsexpress--supabase)
3. [全栈开发（Next.js + Supabase）](#全栈开发nextjs--supabase)
4. [Cloudflare Workers 开发](#cloudflare-workers-开发)
5. [数据科学/分析](#数据科学分析)
6. [嵌入式软件开发](#嵌入式软件开发mcuautosar)
7. [决策流程图](#决策流程图)

---

## 前端开发（React/Next.js）

### 场景描述
构建 React/Next.js/Vue/Svelte 应用，部署到 Vercel，使用 GitHub 进行版本控制。

### 推荐 MCP
- ✅ **memory** (必需) - 会话持久化
- ✅ **sequential-thinking** (必需) - 推理链
- ✅ **vercel** (部署管理) - 管理 Vercel 项目和部署
- ✅ **github** (可选) - PR review、issue 管理

### 配置示例

**~/.claude.json**：
```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "description": "Essential: Persistent memory"
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
      "description": "Essential: Chain-of-thought"
    },
    "vercel": {
      "type": "http",
      "url": "https://mcp.vercel.com",
      "description": "Vercel deployments and projects"
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_token_here"
      },
      "description": "GitHub PR/Issue operations"
    }
  }
}
```

### 上下文成本
- memory: ~1k tokens
- sequential-thinking: ~2k tokens
- vercel: ~2k tokens
- github: ~5k tokens
- **总计**: ~10k tokens（**5% of 200k**）✅ 健康范围

### 项目级禁用示例

某些前端项目不需要 GitHub 操作（如个人练习项目）：

**.claude/deployment.json**：
```json
{
  "mcp": {
    "disabledMcpServers": ["github"]
  }
}
```

**效果**：该项目只使用 3 个 MCP，成本降至 ~5k tokens。

### 使用场景
```bash
# 在 Claude Code 中
@planner 帮我规划实现暗黑模式功能

# 使用 Vercel MCP
/mcp vercel 查看最近的部署状态

# 使用 GitHub MCP（如果配置）
/mcp github 查看最近的 PR
```

---

## 后端开发（Node.js/Express + Supabase）

### 场景描述
后端 API 开发，使用 Supabase 作为数据库，部署到 Railway。

### 推荐 MCP
- ✅ **memory** (必需)
- ✅ **sequential-thinking** (必需)
- ✅ **supabase** (数据库操作)
- ✅ **railway** (部署管理)

### 配置示例

**~/.claude.json**：
```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-ref=abcdefghijk"
      ],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      },
      "description": "Supabase database operations"
    },
    "railway": {
      "command": "npx",
      "args": ["-y", "@railway/mcp-server"],
      "env": {
        "RAILWAY_TOKEN": "your_railway_token_here"
      },
      "description": "Railway deployment management"
    }
  }
}
```

### 上下文成本
- memory: ~1k tokens
- sequential-thinking: ~2k tokens
- supabase: ~4k tokens
- railway: ~3k tokens
- **总计**: ~10k tokens（**5% of 200k**）✅ 健康范围

### 获取环境变量

**Supabase**：
1. 登录 [Supabase Dashboard](https://app.supabase.com/)
2. 选择项目 → Settings → API
3. 复制 `Project URL` 和 `anon/public key`
4. Project Ref 在 URL 中（如 `https://abcdefghijk.supabase.co`，ref 是 `abcdefghijk`）

**Railway**：
1. 登录 [Railway](https://railway.app/)
2. Account Settings → Tokens
3. 创建新的 API Token

### 使用场景
```bash
# 数据库查询
/mcp supabase 查询 users 表的前 10 条记录

# 部署管理
/mcp railway 查看最近的部署日志
```

---

## 全栈开发（Next.js + Supabase）

### 场景描述
全栈应用，前端 Next.js（部署到 Vercel），后端 Supabase，GitHub 版本控制。

### 推荐 MCP
- ✅ **memory** (必需)
- ✅ **sequential-thinking** (必需)
- ✅ **github** (版本控制)
- ✅ **vercel** (前端部署)
- ✅ **supabase** (数据库)

### 配置示例

**~/.claude.json**：
```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_token_here"
      }
    },
    "vercel": {
      "type": "http",
      "url": "https://mcp.vercel.com"
    },
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-ref=your_project_ref"
      ],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_ANON_KEY": "your_anon_key"
      }
    }
  }
}
```

### 上下文成本
- memory: ~1k tokens
- sequential-thinking: ~2k tokens
- github: ~5k tokens
- vercel: ~2k tokens
- supabase: ~4k tokens
- **总计**: ~14k tokens（**7% of 200k**）✅ 健康范围

### ⚠️ 注意
已接近推荐上限（6 个 MCP）。如果性能下降，考虑：
1. 移除 github（改用 `gh` CLI）
2. 按项目禁用不需要的 MCP

### 项目级优化

**前端专用项目**（不需要直接数据库操作）：
```json
{
  "mcp": {
    "disabledMcpServers": ["supabase"]
  }
}
```

**后端 API 项目**（不需要 Vercel）：
```json
{
  "mcp": {
    "disabledMcpServers": ["vercel"]
  }
}
```

---

## Cloudflare Workers 开发

### 场景描述
开发 Cloudflare Workers/Pages，需要查文档、管理构建、配置 KV/D1/R2 绑定。

### 推荐 MCP
- ✅ **memory** (必需)
- ✅ **sequential-thinking** (必需)
- ✅ **cloudflare-docs** (文档搜索)
- ✅ **cloudflare-workers-builds** (构建管理)
- ⚠️ **cloudflare-workers-bindings** (仅配置绑定时)
- ⚠️ **cloudflare-observability** (仅调试生产问题时)

### 配置示例

**基础配置**（~/.claude.json）：
```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "cloudflare-docs": {
      "type": "http",
      "url": "https://docs.mcp.cloudflare.com/mcp",
      "description": "Cloudflare documentation search"
    },
    "cloudflare-workers-builds": {
      "type": "http",
      "url": "https://builds.mcp.cloudflare.com/mcp",
      "env": {
        "CLOUDFLARE_API_TOKEN": "your_api_token_here"
      },
      "description": "Cloudflare Workers builds management"
    }
  }
}
```

### 按需添加

**需要配置绑定时**：
```json
{
  "cloudflare-workers-bindings": {
    "type": "http",
    "url": "https://bindings.mcp.cloudflare.com/mcp",
    "env": {
      "CLOUDFLARE_API_TOKEN": "your_api_token_here"
    }
  }
}
```

**需要查日志时**：
```json
{
  "cloudflare-observability": {
    "type": "http",
    "url": "https://observability.mcp.cloudflare.com/mcp",
    "env": {
      "CLOUDFLARE_API_TOKEN": "your_api_token_here"
    }
  }
}
```

### 上下文成本
- **基础配置**: ~7k tokens（3.5%）✅ 极轻量
- **+ bindings**: ~9k tokens（4.5%）✅ 健康
- **+ observability**: ~12k tokens（6%）✅ 可接受

### 获取 Cloudflare API Token
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. My Profile → API Tokens
3. Create Token → 使用 "Edit Cloudflare Workers" 模板
4. 复制生成的 token

### 使用场景
```bash
# 查询文档
/mcp cloudflare-docs 如何配置 Workers KV

# 查看构建状态
/mcp cloudflare-workers-builds 最近的部署

# 配置绑定
/mcp cloudflare-workers-bindings 列出所有 KV 命名空间
```

---

## 数据科学/分析

### 场景描述
数据分析、ClickHouse OLAP 查询、频繁查技术文档（如 pandas、numpy）。

### 推荐 MCP
- ✅ **memory** (必需)
- ✅ **sequential-thinking** (必需)
- ✅ **clickhouse** (分析查询)
- ✅ **context7** (文档搜索)

### 配置示例

**~/.claude.json**：
```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "clickhouse": {
      "type": "http",
      "url": "https://mcp.clickhouse.cloud/mcp",
      "env": {
        "CLICKHOUSE_HOST": "your-cluster.clickhouse.cloud",
        "CLICKHOUSE_USER": "default",
        "CLICKHOUSE_PASSWORD": "your_password"
      },
      "description": "ClickHouse analytics queries"
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@context7/mcp-server"],
      "description": "Live documentation lookup"
    }
  }
}
```

### 上下文成本
- memory: ~1k tokens
- sequential-thinking: ~2k tokens
- clickhouse: ~4k tokens
- context7: ~3k tokens
- **总计**: ~10k tokens（**5% of 200k**）✅ 健康范围

### 获取 ClickHouse 凭据
1. 登录 [ClickHouse Cloud](https://clickhouse.cloud/)
2. 选择服务 → Connect
3. 复制 Host、User、Password

### 使用场景
```bash
# 数据分析
/mcp clickhouse 查询过去 7 天的用户增长趋势

# 查询技术文档
/mcp context7 pandas DataFrame merge 的用法
```

---

## 嵌入式软件开发（MCU/AUTOSAR）

### 场景描述
嵌入式 MCU 开发（如 S32K324）、自动驾驶控制器、AUTOSAR 应用，频繁查阅芯片手册和功能安全标准。

### 工作特点
- 主要使用 C/C++、汇编语言
- 频繁查阅：芯片手册、AUTOSAR 规范、ISO 26262 标准
- 版本控制：Git/GitHub
- 跨项目访问：共享驱动库、测试脚本

### 推荐 MCP
- ✅ **memory** (必需)
- ✅ **sequential-thinking** (必需)
- ✅ **github** (版本控制)
- ✅ **context7** (查询技术文档)
- ⚠️ **filesystem** (可选 - 跨项目文件访问)

### 不需要的 MCP
- ❌ vercel, railway, supabase（云服务，嵌入式不需要）
- ❌ clickhouse（数据分析，嵌入式侧重实时性能）
- ❌ cloudflare-*（前端开发）

### 配置示例

**~/.claude.json**：
```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_token_here"
      },
      "description": "Git version control and PR review"
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@context7/mcp-server"],
      "description": "Query S32K3xx manuals, AUTOSAR specs, ISO 26262"
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "D:/Workspace/shared-drivers",
        "D:/Workspace/test-scripts",
        "D:/Documents/datasheets"
      ],
      "description": "Access shared drivers, test scripts, datasheets"
    }
  }
}
```

### 上下文成本
- memory: ~1k tokens
- sequential-thinking: ~2k tokens
- github: ~5k tokens
- context7: ~3k tokens
- filesystem: ~2k tokens
- **总计**: ~13k tokens（**6.5% of 200k**）✅ 健康范围

### 项目级调整示例

不同 MCU 项目可能需要不同的文件系统路径：

**S32K324 控制器项目**（.claude/deployment.json）：
```json
{
  "mcp": {
    "disabledMcpServers": [],
    "projectSpecific": {
      "description": "S32K324 ADAS controller project",
      "filesystem_paths": [
        "D:/Workspace/s32k324-drivers",
        "D:/Workspace/autosar-bsw",
        "D:/Documents/datasheets/S32K3"
      ]
    }
  }
}
```

**STM32 项目**（不需要 filesystem）：
```json
{
  "mcp": {
    "disabledMcpServers": ["filesystem"]
  }
}
```

### 使用场景
```bash
# 查询芯片手册
/mcp context7 S32K324 ADC 配置方法

# 代码审查
/mcp github 查看最近的 PR 关于 CAN 驱动的修改

# 跨项目复用
/mcp filesystem 读取共享的 SPI 驱动代码

# 架构设计
@planner 使用 sequential-thinking 分析 AUTOSAR 架构设计选择
```

### 嵌入式特定 Skills 推荐

可添加到 `skills/` 目录：
- `embedded-review.md`：内存安全、实时性、中断优先级检查
- `autosar-guidelines.md`：AUTOSAR 架构设计规范
- `iso26262-checklist.md`：功能安全检查清单
- `can-debugging.md`：CAN 总线调试工作流

---

## 决策流程图

```
开始选择 MCP 配置
  │
  ├─ 第 1 步：安装核心 MCP（所有场景必需）
  │   ├─ memory（会话持久化）
  │   └─ sequential-thinking（推理链）
  │   成本: ~3k tokens
  │
  ├─ 第 2 步：根据项目类型选择
  │   ├─ 前端开发
  │   │   └─ + vercel + github
  │   │       成本: ~10k tokens
  │   │
  │   ├─ 后端开发
  │   │   └─ + supabase + railway
  │   │       成本: ~10k tokens
  │   │
  │   ├─ 全栈开发
  │   │   └─ + github + vercel + supabase
  │   │       成本: ~14k tokens ⚠️ 接近上限
  │   │
  │   ├─ Cloudflare 开发
  │   │   └─ + cloudflare-docs + cloudflare-workers-builds
  │   │       成本: ~7k tokens
  │   │
  │   ├─ 数据科学
  │   │   └─ + clickhouse + context7
  │   │       成本: ~10k tokens
  │   │
  │   └─ 嵌入式开发
  │       └─ + github + context7 + filesystem
  │           成本: ~13k tokens
  │
  ├─ 第 3 步：验证上下文成本
  │   ├─ < 10k tokens (< 5%) → ✅ 极佳
  │   ├─ 10-15k tokens (5-7.5%) → ✅ 健康
  │   ├─ 15-20k tokens (7.5-10%) → ⚠️ 可接受，注意监控
  │   └─ > 20k tokens (> 10%) → ❌ 过高，必须优化
  │
  ├─ 第 4 步：项目切换时调整
  │   ├─ 前端项目 → 禁用 supabase, railway
  │   ├─ 后端项目 → 禁用 vercel, magic
  │   └─ 嵌入式项目 → 禁用云服务 MCP
  │
  └─ 第 5 步：持续优化
      ├─ 性能下降 → 减少 MCP 数量
      ├─ 需要新功能 → 添加单个 MCP
      └─ 定期审查 → 移除不再使用的 MCP
```

---

## 📊 上下文成本对照表

| MCP Server | 成本估算 | 类别 | 认证需求 |
|-----------|---------|------|---------|
| memory | ~1k tokens | 核心 | ❌ |
| sequential-thinking | ~2k tokens | 核心 | ❌ |
| github | ~5k tokens | 版本控制 | ✅ PAT |
| vercel | ~2k tokens | 前端部署 | ❌ |
| supabase | ~4k tokens | 数据库 | ✅ URL + Key |
| railway | ~3k tokens | 后端部署 | ✅ Token |
| cloudflare-docs | ~2k tokens | 文档 | ❌ |
| cloudflare-workers-builds | ~3k tokens | 部署 | ✅ API Token |
| cloudflare-workers-bindings | ~2k tokens | 配置 | ✅ API Token |
| cloudflare-observability | ~3k tokens | 监控 | ✅ API Token |
| clickhouse | ~4k tokens | 数据分析 | ✅ Host + User + Pass |
| context7 | ~3k tokens | 文档搜索 | ❌ |
| magic | ~2k tokens | UI 组件 | ❌ |
| filesystem | ~2k tokens | 文件系统 | ❌ |
| firecrawl | ~3k tokens | 网页爬取 | ✅ API Key |

---

## 🎯 配置推荐总结

| 场景 | MCP 数量 | 总成本 | 状态 |
|-----|---------|--------|------|
| 最小核心 | 2 | ~3k tokens (1.5%) | ✅ 极轻量 |
| 前端开发 | 4 | ~10k tokens (5%) | ✅ 健康 |
| 后端开发 | 4 | ~10k tokens (5%) | ✅ 健康 |
| 全栈开发 | 5 | ~14k tokens (7%) | ✅ 健康 |
| Cloudflare | 4 | ~7k tokens (3.5%) | ✅ 极轻量 |
| 数据科学 | 4 | ~10k tokens (5%) | ✅ 健康 |
| 嵌入式开发 | 5 | ~13k tokens (6.5%) | ✅ 健康 |

**上下文窗口健康度**：
- ✅ **优秀**：< 5%（< 10k tokens）
- ✅ **健康**：5-10%（10-20k tokens）
- ⚠️ **警告**：10-15%（20-30k tokens）
- ❌ **危险**：> 15%（> 30k tokens）

---

## 🔧 快速配置命令

```bash
# 安装最小核心
claude-setup-mcp
# 选择：1. 安装核心 MCP

# 按项目类型配置
claude-setup-mcp
# 选择：2. 按项目类型选择 MCP

# 查看当前配置和成本
claude-setup-mcp
# 查看状态 → 显示成本估算

# 添加单个 MCP
claude-setup-mcp
# 选择：4. 添加单个 MCP

# 删除 MCP
claude-setup-mcp
# 选择：5. 删除 MCP
```

---

## 📚 相关文档

- **[快速开始指南](../QUICKSTART.md)**：完整设置流程
- **[部署设计文档](../design/DEPLOYMENT.md)**：架构和决策记录
- **[MCP 详细指南](mcp-guide.md)**：深入的 MCP 使用说明（即将推出）

---

**🎉 配置完成后，享受高效的 AI 辅助开发！**
