#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import { visit } from 'unist-util-visit';
import { parse as parseYaml } from 'yaml';
import { validateSkill } from '../src/lib/validator';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BLUE = '\x1b[34m';
const BOLD = '\x1b[1m';

function walkDir(dir: string, fileList: string[] = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git') continue;
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walkDir(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

async function main() {
  const targetDir = process.argv[2] || '.';
  const absoluteTargetDir = path.resolve(targetDir);

  if (!fs.existsSync(absoluteTargetDir)) {
    console.error(`${RED}Error: Directory '${targetDir}' does not exist.${RESET}`);
    process.exit(1);
  }

  console.log(`${BLUE}${BOLD}Skill Atlas CLI${RESET} - Scanning ${absoluteTargetDir}...\n`);

  const allFilePaths = walkDir(absoluteTargetDir);
  const allFiles = allFilePaths.map(p => ({ path: p.replace(/\\/g, '/') }));

  const skillFiles = allFilePaths.filter(p => p.toLowerCase().endsWith('skill.md'));

  let totalErrors = 0;
  let totalValid = 0;

  for (const filePath of skillFiles) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    // Extract frontmatter
    const tree = unified()
      .use(remarkParse)
      .use(remarkFrontmatter)
      .parse(content);

    let frontmatter: any = {};
    visit(tree, (node: any) => {
      if (node.type === 'yaml' && node.value) {
        try {
          frontmatter = parseYaml(node.value) || {};
        } catch (e) {
          // parse errors caught later or ignored
        }
      }
    });

    const result = validateSkill(frontmatter, normalizedPath, content, allFiles);

    if (result.isValid) {
      totalValid++;
      console.log(`${GREEN}✓ PASS${RESET} ${normalizedPath}`);
    } else {
      totalErrors++;
      console.log(`${RED}✗ FAIL${RESET} ${normalizedPath}`);
      result.errors.forEach(err => {
        console.log(`  ${YELLOW}- ${err}${RESET}`);
      });
      console.log('');
    }
  }

  console.log('--------------------------------------------------');
  if (totalErrors > 0) {
    console.log(`${RED}${BOLD}Validation Failed: ${totalErrors} skill(s) have errors.${RESET}`);
    console.log(`\n${BOLD}[FIX] Open your repository in Skill Atlas to visualize the graph and use the AI Copilot to refactor your skills:${RESET}`);
    console.log(`${BLUE}👉 Web App: https://atlas-skills.netlify.app${RESET}`);
    console.log(`${BLUE}👉 GitHub:  https://github.com/revanthpobala/skill-atlas${RESET}\n`);
    process.exit(1);
  } else {
    console.log(`${GREEN}${BOLD}Success: All ${totalValid} skill(s) passed validation.${RESET}\n`);
    process.exit(0);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
