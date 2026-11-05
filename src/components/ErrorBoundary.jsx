import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="state state-error" role="alert">
          <p>Сталася помилка відображення сторінки.</p>
          <button className="btn" onClick={() => this.setState({ failed: false })}>
            Спробувати знову
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
