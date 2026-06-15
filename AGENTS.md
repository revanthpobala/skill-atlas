<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Skill Atlas - Agent Directives

## Core Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Graph Engine:** React Flow (`@xyflow/react`)
- **State Management:** Zustand (see `src/store/graphStore.ts`)
- **IDE Engine:** Monaco Editor (`@monaco-editor/react`)
- **Markdown Parsing:** `remark`, `remark-gfm`
- **Authentication:** NextAuth.js (GitHub OAuth)
- **Styling:** Vanilla CSS (`globals.css`) - **Do NOT use Tailwind.**

## Codebase Structure
- `/src/lib/parser.ts`: Core ingestion engine that parses Markdown skills, extracts YAML frontmatter, and builds the Directed Acyclic Graph (DAG).
- `/src/lib/ai.ts`: The AI suggestion engine that communicates with the local LLM.
- `/src/store/graphStore.ts`: Global state for nodes, edges, selections, and tracked staging modifications.
- `/src/components/SkillGraph.tsx`: The visual canvas mapping the knowledge graph.
- `/src/components/EditorPanel.tsx`: The Monaco text editor and Notebook renderer.
- `/src/components/PRModal.tsx`: The commit and Diff Viewer handler.

## Engineering Directives
- **Direct Communication:** No conversational filler, no sycophancy, no apologies. Deliver objective technical analysis.
- **Evidence-Based:** Back every logic claim with reasoning based on the execution engine.
- **Visual Design:** We use a strict dark-mode premium aesthetic aligned with GitHub's Dark Dimmed palette (`#0d1117`, `#161b22`, `#58a6ff`, `#30363d`). Do not inject light themes or generic bright colors.
- **Tooling Efficiency:** Prioritize using explicit tool commands (e.g., `view_file`, `replace_file_content`) over nesting generic terminal commands like `cat` or `grep`.
