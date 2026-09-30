import { Button, Spinner } from 'react-bootstrap';

export function LoadingBlock({ label }) {
    return (
        <div className="text-center py-5" role="status">
            <Spinner animation="border" variant="info" />
            <div className="text-info mt-3">{label}</div>
        </div>
    );
}

export function ErrorBlock({ message, onRetry }) {
    return (
        <div className="text-center py-5" role="alert">
            <div className="text-warning fw-bold mb-3">{message}</div>
            {onRetry && (
                <Button variant="outline-info" size="sm" onClick={() => onRetry()}>
                    Try again
                </Button>
            )}
        </div>
    );
}
