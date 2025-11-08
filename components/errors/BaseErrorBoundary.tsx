"use client";

import React from "react";
import { logAppError } from "@/lib/services/error-logging-service";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
}

export default class BaseErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to our centralized logging service
    logAppError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: 'BaseErrorBoundary'
    });

    // Call optional custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center h-screen text-center bg-[#FAF8F3]">
            <h2 className="text-lg font-semibold mb-4">
              Oops! Something went wrong 😔
            </h2>
            <button
              onClick={this.resetErrorBoundary}
              className="px-4 py-2 bg-[#10B981] text-white rounded-lg shadow-md hover:opacity-90 transition"
            >
              Try Again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

