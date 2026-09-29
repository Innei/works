import type { ThreeElements } from '@react-three/fiber'
import { useMemo } from 'react'
import type { IUniform } from 'three'

type ShaderProps = Omit<ThreeElements['shaderMaterial'], 'args' | 'uniforms'> & {
  vertexShader: string
  fragmentShader: string
  uniforms: Record<string, IUniform>
}

// R3F copies a `uniforms` prop into fresh objects; constructor args keep the reference that scenes mutate per frame.
export function Shader({ vertexShader, fragmentShader, uniforms, ...props }: ShaderProps) {
  const args = useMemo(() => [{ vertexShader, fragmentShader, uniforms }] as const, [vertexShader, fragmentShader, uniforms])
  return <shaderMaterial args={args} {...props} />
}
