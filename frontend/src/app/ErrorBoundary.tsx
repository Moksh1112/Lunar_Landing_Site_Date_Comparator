import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { failed: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main role="alert">
        <h1>Something went wrong</h1>
        <p>The page hit an unexpected error. Reloading usually fixes it.</p>
        <button type="button" onClick={() => window.location.reload()}>
          Reload
        </button>
      </main>
    );
  }
}
