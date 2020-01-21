import getSubstitutions from '../get-substitutions'
import { Project, ScriptTarget } from 'ts-morph'
import typescript from 'typescript'

const project = new Project({
  compilerOptions: {
    target: ScriptTarget.ES2020
  }
})

function testSubstitution(text: string): string {
  const sourceFile = project.createSourceFile('', text, { overwrite: true })
  const checker = project.getTypeChecker()
  const node = sourceFile.getDescendantsOfKind(typescript.SyntaxKind.TemplateExpression)
  if (!node.length) {
    throw new Error('No template expression found.')
  }
  return getSubstitutions(checker.compilerObject, node[0].compilerNode)
}

describe('getSubstitutions', () => {
  it('substitutes null for ${null}', () => {
    const substitution = testSubstitution('`${null}`')
    expect(substitution).toBe('null   ')
  })

  it('substitutes 11111 for ${30}', () => {
    const substitution = testSubstitution('`${30}`')
    expect(substitution).toBe('11111')
  })

  it('substitutes "xxxxxxxxx" for ${"steven"}', () => {
    const substitution = testSubstitution('`${"steven"}`')
    expect(substitution).toBe('"xxxxxxxxx"')
  })

  it('substitutes true    for ${true}', () => {
    const substitution = testSubstitution('`${true}`')
    expect(substitution).toBe('true   ')
  })

  it('substitutes true    for ${false}', () => {
    const substitution = testSubstitution('`${false}`')
    expect(substitution).toBe('true    ')
  })
})
