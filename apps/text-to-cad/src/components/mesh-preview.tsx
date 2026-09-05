import { Bounds, Center, OrbitControls, useGLTF } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'

function LoadedMesh({ url }: { url: string }) {
  const gltf = useGLTF(url)
  return <primitive object={gltf.scene} />
}

export function MeshPreview({ url }: { url: string | null }) {
  if (!url) {
    return (
      <div className="flex h-full min-h-80 items-center justify-center bg-muted/40 text-muted-foreground">
        Generate a part to preview the mesh.
      </div>
    )
  }

  return (
    <Canvas
      key={url}
      camera={{ position: [90, 70, 90], fov: 40, near: 0.1, far: 2000 }}
      className="h-full min-h-80 w-full"
    >
      <color attach="background" args={['#f4f4f5']} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[60, 80, 40]} intensity={1.15} />
      <directionalLight position={[-40, 20, -30]} intensity={0.35} />
      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.35}>
          <Center>
            <LoadedMesh url={url} />
          </Center>
        </Bounds>
      </Suspense>
      <gridHelper args={[120, 12, '#d4d4d8', '#e4e4e7']} />
      <OrbitControls makeDefault enableDamping />
    </Canvas>
  )
}
