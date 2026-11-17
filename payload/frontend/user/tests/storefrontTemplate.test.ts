import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeStorefrontTemplate, STOREFRONT_TEMPLATES } from '../src/utils/storefrontTemplate.ts'

test('storefront identifiers expose classic, original vault and kaxiaopu', () => {
  assert.deepEqual(STOREFRONT_TEMPLATES, ['classic', 'vault', 'kaxiaopu'])
  assert.equal(normalizeStorefrontTemplate(' kaxiaopu '), 'kaxiaopu')
  assert.equal(normalizeStorefrontTemplate('classic'), 'classic')
})

test('vault site settings and preview hints retain their own identity', () => {
  assert.equal(normalizeStorefrontTemplate('vault'), 'vault')
  assert.equal(normalizeStorefrontTemplate(' vault '), 'vault')
})

test('unknown and missing template hints do not override site settings', () => {
  for (const value of [undefined, null, '', 'unknown', 1, {}, ['kaxiaopu']]) {
    assert.equal(normalizeStorefrontTemplate(value), null)
  }
})
