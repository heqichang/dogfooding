import * as SourceMap from 'source-map';
import { ASTNode, traverse } from '../core/astVisitor';

interface NodeLocation {
  line: number;
  column: number;
}

interface NodeMapping {
  node: ASTNode;
  originalLine: number;
  originalColumn: number;
  generatedLine: number;
  generatedColumn: number;
}

export class SourceMapGenerator {
  private originalSource: string;
  private sourceFileName: string;
  private mappings: NodeMapping[] = [];
  private lineOffsets: number[] = [];

  constructor(originalSource: string, sourceFileName: string = 'source.js') {
    this.originalSource = originalSource;
    this.sourceFileName = sourceFileName;
    this.calculateLineOffsets();
  }

  private calculateLineOffsets(): void {
    this.lineOffsets = [0];
    for (let i = 0; i < this.originalSource.length; i++) {
      if (this.originalSource[i] === '\n') {
        this.lineOffsets.push(i + 1);
      }
    }
  }

  private getLineAndColumn(offset: number): { line: number; column: number } {
    let line = 0;
    while (line < this.lineOffsets.length - 1 && this.lineOffsets[line + 1] <= offset) {
      line++;
    }
    const column = offset - this.lineOffsets[line];
    return { line: line + 1, column };
  }

  private collectNodeLocations(ast: ASTNode): void {
    this.mappings = [];
    
    traverse(ast, {
      enter: (node) => {
        if (node.loc && node.loc.start) {
          const originalPos = {
            line: node.loc.start.line,
            column: node.loc.start.column
          };
          
          this.mappings.push({
            node,
            originalLine: originalPos.line,
            originalColumn: originalPos.column,
            generatedLine: 0,
            generatedColumn: 0
          });
        }
      }
    });
  }

  async generate(
    generatedCode: string,
    ast: ASTNode,
    targetFileName: string = 'obfuscated.js'
  ): Promise<string> {
    this.collectNodeLocations(ast);

    const generator = new SourceMap.SourceMapGenerator({
      file: targetFileName,
      sourceRoot: ''
    });

    generator.setSourceContent(this.sourceFileName, this.originalSource);

    const generatedLines = generatedCode.split('\n');
    let currentLine = 1;
    let currentColumn = 0;

    for (let i = 0; i < generatedLines.length; i++) {
      const line = generatedLines[i];
      const lineLength = line.length;

      for (const mapping of this.mappings) {
        if (mapping.originalLine > 0) {
          const nodeType = mapping.node.type;
          
          const keywords = [
            'function', 'var', 'let', 'const', 'if', 'else', 'for', 'while',
            'return', 'switch', 'case', 'break', 'continue', 'try', 'catch',
            'throw', 'new', 'typeof', 'instanceof'
          ];

          let foundInLine = false;
          if (mapping.node.type === 'Identifier' && mapping.node.name) {
            const nameIndex = line.indexOf(mapping.node.name);
            if (nameIndex !== -1) {
              foundInLine = true;
              generator.addMapping({
                generated: { line: currentLine, column: nameIndex },
                original: { line: mapping.originalLine, column: mapping.originalColumn },
                source: this.sourceFileName
              });
            }
          } else if (mapping.node.type === 'Literal' && mapping.node.value !== undefined) {
            const valueStr = String(mapping.node.value);
            const valueIndex = line.indexOf(valueStr);
            if (valueIndex !== -1) {
              foundInLine = true;
              generator.addMapping({
                generated: { line: currentLine, column: valueIndex },
                original: { line: mapping.originalLine, column: mapping.originalColumn },
                source: this.sourceFileName
              });
            }
          } else {
            for (const keyword of keywords) {
              if (nodeType.toLowerCase().includes(keyword) || keyword.includes(nodeType.toLowerCase())) {
                const keywordIndex = line.indexOf(keyword);
                if (keywordIndex !== -1) {
                  foundInLine = true;
                  generator.addMapping({
                    generated: { line: currentLine, column: keywordIndex },
                    original: { line: mapping.originalLine, column: mapping.originalColumn },
                    source: this.sourceFileName
                  });
                  break;
                }
              }
            }
          }
        }
      }

      currentLine++;
      currentColumn = 0;
    }

    const firstMapping = this.mappings.find(m => m.originalLine > 0);
    if (firstMapping) {
      generator.addMapping({
        generated: { line: 1, column: 0 },
        original: { line: firstMapping.originalLine, column: firstMapping.originalColumn },
        source: this.sourceFileName
      });
    }

    return generator.toString();
  }
}

export async function generateSourceMap(
  originalSource: string,
  generatedCode: string,
  ast: ASTNode,
  sourceFileName: string = 'source.js',
  targetFileName: string = 'obfuscated.js'
): Promise<string> {
  const generator = new SourceMapGenerator(originalSource, sourceFileName);
  return generator.generate(generatedCode, ast, targetFileName);
}
