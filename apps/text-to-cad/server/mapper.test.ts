import { describe, expect, test } from 'bun:test'
import { mapPrompt } from './mapper.ts'

describe('mapPrompt', () => {
  test('maps a cube with a hole and dimensions', () => {
    const mapped = mapPrompt('a 20mm cube with a 5mm hole')
    expect(mapped.kind).toBe('cube_with_hole')
    expect(mapped.params.size).toBe(20)
    expect(mapped.params.hole).toBe(5)
    expect(mapped.guessed).toBe(false)
  })

  test('maps a simple bracket to defaults', () => {
    const mapped = mapPrompt('a simple bracket')
    expect(mapped.kind).toBe('bracket')
    expect(mapped.params.width).toBe(40)
    expect(mapped.params.hole).toBe(6)
  })

  test('maps a cylinder with diameter and height', () => {
    const mapped = mapPrompt('30mm cylinder 10mm tall')
    expect(mapped.kind).toBe('cylinder')
    expect(mapped.params.diameter).toBe(30)
    expect(mapped.params.height).toBe(10)
  })

  test('maps a washer from OD/ID language', () => {
    const mapped = mapPrompt('washer 25mm OD 8mm ID')
    expect(mapped.kind).toBe('washer')
    expect(mapped.params.od).toBe(25)
    expect(mapped.params.id).toBe(8)
  })

  test('maps a flange with bolt count', () => {
    const mapped = mapPrompt('50mm flange with 4 M6 holes')
    expect(mapped.kind).toBe('flange')
    expect(mapped.params.od).toBe(50)
    expect(mapped.params.bolt_count).toBe(4)
    expect(mapped.params.bolt).toBe(6)
  })

  test('empty prompt falls back to the demo cube', () => {
    const mapped = mapPrompt('   ')
    expect(mapped.kind).toBe('cube_with_hole')
    expect(mapped.guessed).toBe(true)
  })
})
