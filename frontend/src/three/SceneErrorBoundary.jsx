import { Component } from 'react'

// Catches anything a Three.js scene component throws during setup that
// isn't the WebGL-context failure already handled via onUnavailable (e.g.
// an unexpected geometry/runtime error) so it degrades to the same
// fallback instead of an uncaught error blanking the view.
export class SceneErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onError?.()
  }

  render() {
    if (this.state.failed) return null
    return this.props.children
  }
}
