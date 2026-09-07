export function Wordmark({ visible }: { visible: boolean }) {
  return (
    <div className={visible ? 'wordmark is-visible' : 'wordmark'} aria-hidden={!visible}>
      nutmeg
    </div>
  )
}
