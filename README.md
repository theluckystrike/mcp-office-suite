# MCP Office Suite

<!-- mirror-seo:start -->

**MCP server for small business accounting and paperwork: invoices, PDFs, spreadsheets, Word documents, time tracking and expenses.** One local config entry for invoicing, documents, time tracking and supplier checks.

Works with Claude Desktop, Claude Code, Cursor and any Model Context Protocol client. Runs on your own machine: this one has no hosted endpoint, so install it from the bundle or from source.

Product page: <https://mcp.zovo.one/s/office-suite> — capabilities, free limits and supported installation paths.

## Install

**Claude Desktop, one click.** Download `office-suite.mcpb` from the [bundle catalog](https://mcp.zovo.one/downloads#office-suite) and double-click it.

**From source.** The mirror is self-contained: every `@theluckystrike/*` dependency is vendored, so a fresh clone builds with no extra setup.

```sh
git clone https://github.com/theluckystrike/mcp-office-suite.git
cd mcp-office-suite
npm install && npm run build
```

Then point your client at the built entry point:

```json
{
  "mcpServers": {
    "office-suite": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-office-suite/dist/index.js"]
    }
  }
}
```

> `@theluckystrike/mcp-office-suite` is **not published on npm yet**, so an `npx -y @theluckystrike/mcp-office-suite` command will fail. The three paths above are the working ones and each is exercised by CI.

![office-suite demo](https://raw.githubusercontent.com/theluckystrike/mcp-servers/main/assets/demo-office-suite.gif)

Read-only mirror of [mcp-servers/servers/office-suite](https://github.com/theluckystrike/mcp-servers/tree/main/servers/office-suite). See [MIRROR.md](MIRROR.md).

<!-- mirror-seo:end -->

Run the freelancer office from one MCP config entry. The v0.22.8 bundle initializes 49 local child servers and exposes 447 tools, measured over MCP on 2026-10-16. It includes time tracking, invoices, spreadsheets, quotes, expenses and the supplier-invoice three-way matcher and duplicate invoice candidate review. The proxy forwards tools, resources and prompts to the child that owns them; each child keeps its own storage and free tier.

Built by [theluckystrike](https://github.com/theluckystrike). MIT. Support: support@zovo.one.

## Install

For Claude Desktop, download [office-suite.mcpb v0.22.8](https://github.com/theluckystrike/mcp-servers/releases/download/v0.22.8/office-suite.mcpb) and open it. SHA-256: `7f50d6d16d445dddcee054b24e8586de4daff9d91b77d22a28730647305cc91d`.

The [download catalog](https://mcp.zovo.one/downloads#office-suite) lists explicit archive versions. The latest GitHub release is not a complete collection of all server bundles. This proxy is local stdio only; it has no hosted endpoint. Its npm package and internal dependencies are not published, so use the bundle or build from source.

Source installation requires Node.js 22 or newer for the current repository build tooling:

```sh
git clone https://github.com/theluckystrike/mcp-servers.git
cd mcp-servers
npm install
npm run build
```

The root build bootstraps the license/timezone engine dependency and builds the child servers. Use your checkout's absolute path in the config. For Claude Desktop, merge this entry into `mcpServers` in its config file:

```json
{
  "mcpServers": {
    "office-suite": {
      "command": "node",
      "args": ["/absolute/path/mcp-servers/servers/office-suite/dist/index.js"]
    }
  }
}
```

For Cursor, merge the same entry into `.cursor/mcp.json` or your user MCP config. For Claude Code:

```sh
claude mcp add office-suite -- node /absolute/path/mcp-servers/servers/office-suite/dist/index.js
```

Restart the client, call `license_status`, and read `office://tools_map` to discover the children and exact exposed tool names. A successful tools list confirms discovery; run a real task to verify the workflow you need.

## Tools and collision names

| Entry | Behavior |
| --- | --- |
| Child tools | The child's own tools, arguments and free/Pro rules. |
| `license_status` | Per-child license state and the bundle checkout URL. |
| `license_activate` | Forwards a key to every connected child and reports every result. |
| `office://tools_map` resource | Maps exposed tool names to their child and original name. |

When child names collide, the proxy exposes names prefixed with the child, such as `invoice_business_set`. Child result payloads, including JSON source records, raw CSV, HTML and prose, retain their original values. Each forwarded result adds collision mappings under `_meta["office-suite/tool-names"]` and points to `office://tools_map`; explicit retrieval tool hints in matcher report envelopes use the exposed names. Read the runtime map rather than guessing a prefix or relying on an older static tool table.

The v0.22.8 manifest's 447 names and descriptions match the actual running bundle, including collision prefixes. [Measured inventory](https://github.com/theluckystrike/mcp-servers/blob/main/data/office-suite-tool-inventory.json) and [artifact evidence](https://github.com/theluckystrike/mcp-servers/blob/main/intel/R37-patch-release-integration.md) are available. This verifies discovery and matcher delivery through the proxy; it is not a feature test of every child tool.

## Free and Pro

| Free | Pro bundle |
| --- | --- |
| Each child's documented free tier; no subscription required | $39 one time, removes the applicable limits across the children |

[Get the $39 bundle](https://mcp.zovo.one/buy/bundle), then call `license_activate` with the bundle key or set `MCP_LICENSE_KEY` in the server environment. Keys verify offline. A $19 single-server key upgrades its own product; it does not unlock the whole suite.

Activation returns an error if any connected child rejects the key, with an OK/FAILED result for each child. Accepted activations are not rolled back: use the result table and `license_status`, correct the key or failing child, and retry. Do not interpret a partial activation as all children being Pro.

## Local execution and privacy

Every child runs as its own stdio process and stores its documents under its own data directory, normally `${XDG_DATA_HOME:-~/.local/share}/mcp-servers/<name>/`. The proxy adds no document store. Individual tools may make public network requests, for example price, currency or backlink checks; read the relevant child's documentation. Your AI client or model provider has its own data handling.

Child stderr is drained into the proxy's stderr with the child name. An unexpected child exit rejects pending requests and gets one restart attempt; an interrupted mutation must be checked before retrying it.
