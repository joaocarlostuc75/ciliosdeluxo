import React, { ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
    children: ReactNode;
    sectionName?: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null
        };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`Uncaught error in ${this.props.sectionName || 'component'}:`, error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 text-center border-2 border-red-500/20 rounded-xl bg-red-500/5 my-4">
                    <span className="material-symbols-outlined text-red-500 text-4xl mb-2">error</span>
                    <h3 className="text-red-500 font-bold mb-2 uppercase tracking-widest text-xs">
                        Erro ao carregar {this.props.sectionName || 'esta seção'}
                    </h3>
                    <p className="text-xs text-stone-500 font-mono bg-white/50 p-2 rounded mb-4 overflow-auto max-w-full">
                        {this.state.error?.message || 'Erro desconhecido'}
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        className="px-6 py-2 bg-stone-900 text-white rounded-lg text-xs font-bold uppercase hover:bg-stone-800 transition-colors"
                    >
                        Tentar Novamente
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
