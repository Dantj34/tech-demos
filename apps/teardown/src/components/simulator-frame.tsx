type SimulatorFrameProps = {
  title: string
  src?: string
  srcDoc?: string
  sandboxed?: boolean
}

export function SimulatorFrame({ title, src, srcDoc, sandboxed = false }: SimulatorFrameProps) {
  return (
    <iframe
      title={title}
      src={src}
      srcDoc={srcDoc}
      className="h-full w-full border-0 bg-[#ecedef]"
      allow={sandboxed ? undefined : 'fullscreen'}
      sandbox={sandboxed ? 'allow-scripts' : undefined}
      referrerPolicy="no-referrer"
    />
  )
}
