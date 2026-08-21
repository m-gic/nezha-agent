# Nezha Agent 运行器

轻量级 Node.js 运行器，用于 [Nezha Agent](https://github.com/nezhahq/agent)，**无外部依赖**（除 `yauzl` 用于流式解压）。专为资源受限环境设计。

## 特性
- 从 GitHub Releases 自动下载最新 Nezha Agent 二进制。
- 流式下载与**逐条目解压**（内存占用极低）。
- 后台运行 Agent，配置简单。
- 30 分钟后自动清理文件。
- 内置 HTTP 服务用于健康检查。

## 环境变量
| 变量名         | 必需 | 默认值  | 说明                         |
|----------------|------|---------|------------------------------|
| `NEZHA_SERVER` | **是** | –     | Nezha 服务端地址（例如 `example.com:5555`） |
| `NEZHA_KEY`    | **是** | –     | Nezha 客户端密钥             |
| `UUID`         | 否   | `''`    | 可选的 Agent UUID            |
| `FILE_PATH`    | 否   | `.npm`  | 存放 Agent 二进制和配置的目录 |
| `PORT`         | 否   | `3000`  | 内置 HTTP 健康检查服务端口   |

## 安装

```bash
npm install
