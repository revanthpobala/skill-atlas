export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateSkill(
  frontmatter: any, 
  path: string, 
  content: string,
  allFiles: { path: string }[]
): ValidationResult {
  const errors: string[] = [];
  
  const pathParts = path.split('/');
  const fileName = pathParts.pop() || '';
  const folderName = pathParts.pop() || '';

  // 1. File Naming
  if (fileName !== 'SKILL.md') {
    errors.push(`Main skill file must be named exactly 'SKILL.md'. Found '${fileName}'.`);
  }

  // 2. Folder Naming
  const isKebabCase = (str: string) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(str);
  if (!isKebabCase(folderName)) {
    errors.push(`Skill folder name '${folderName}' must be strict kebab-case (no spaces, capitals, or underscores).`);
  }

  // 3. No README.md in skill folder
  const skillDirPath = path.split('/').slice(0, -1).join('/');
  const hasReadme = allFiles.some(f => 
    f.path.startsWith(skillDirPath + '/') && 
    f.path.split('/').pop()?.toLowerCase() === 'readme.md' &&
    f.path.split('/').length === pathParts.length + 2 // Ensure it's in the root of the skill folder
  );
  
  if (hasReadme) {
    errors.push(`Skill folder must not contain a README.md file. Use SKILL.md for documentation.`);
  }

  // 4. Frontmatter Name Field
  if (!frontmatter || !frontmatter.name) {
    errors.push(`YAML frontmatter must contain a 'name' field.`);
  } else {
    const name = frontmatter.name;
    if (name !== folderName) {
      errors.push(`Frontmatter name '${name}' must exactly match the folder name '${folderName}'.`);
    }
    if (!isKebabCase(name)) {
      errors.push(`Frontmatter name '${name}' must be strict kebab-case.`);
    }
    if (name.includes('claude') || name.includes('anthropic')) {
      errors.push(`Frontmatter name cannot contain the reserved words 'claude' or 'anthropic'.`);
    }
  }

  // 5. Frontmatter Description Field
  if (!frontmatter || !frontmatter.description) {
    errors.push(`YAML frontmatter must contain a 'description' field.`);
  } else {
    const description = frontmatter.description;
    if (description.length >= 1024) {
      errors.push(`Description must be under 1024 characters. Current length: ${description.length}.`);
    }
    if (description.includes('<') || description.includes('>')) {
      errors.push(`Description cannot contain XML angle brackets (< or >).`);
    }
  }

  // 6. Size and Atomicity check
  const lines = content.split('\n').length;
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const tokens = Math.ceil(words * 1.3);

  if (tokens > 5000 || lines > 800) {
    errors.push(`Skill is too large (${tokens} tokens, ${lines} lines). Skills must be highly atomic and focused. Break this down into smaller, composable skills.`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
