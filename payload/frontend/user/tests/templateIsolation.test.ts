import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import postcss from 'postcss'

// Lazy-loaded CSS remains in the document after navigation. Every rule must
// therefore stop matching when classic or the reseller console is active.
for (const stylesheet of ['storefront.css', 'templates/kaxiaopu/styles/vault.css']) {
  test(`${stylesheet} cannot style the classic template or its teleported dialogs`, () => {
    const css = postcss.parse(readFileSync(new URL('../src/' + stylesheet, import.meta.url), 'utf8'))
    let count = 0
    css.walkRules(rule => {
      for (const selector of rule.selectors) {
        assert.ok(selector.includes('[data-storefront-template="kaxiaopu"]'), selector)
        count++
      }
    })
    assert.ok(count > 0)
  })
}

test('the new font does not replace the classic Inter fallback globally', () => {
  const css = postcss.parse(readFileSync(new URL('../src/assets/fonts/inter.css', import.meta.url), 'utf8'))
  css.walkAtRules('font-face', rule => {
    const families: string[] = []
    rule.walkDecls('font-family', declaration => { families.push(declaration.value) })
    assert.deepEqual(families, ['KaxiaopuInter'])
  })
})
