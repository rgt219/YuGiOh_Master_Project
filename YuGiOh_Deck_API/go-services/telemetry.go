package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.43.0"
)

const serviceName = "go-worker"

// setupTelemetry makes the worker part of the same traces as the .NET services.
//
// Incoming requests continue the caller's trace (W3C traceparent header), and every outbound HTTP call the
// scrapers make becomes a child span. Spans are only exported when OTEL_EXPORTER_OTLP_ENDPOINT is set
// (docker-compose points it at the local Grafana stack); without it the trace context is still passed on.
func setupTelemetry(ctx context.Context) func(context.Context) error {
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(propagation.TraceContext{}, propagation.Baggage{}))

	// The scrapers build their own http.Clients with no Transport, which means they use http.DefaultTransport.
	http.DefaultTransport = otelhttp.NewTransport(http.DefaultTransport)

	if os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT") == "" {
		return func(context.Context) error { return nil }
	}

	exporter, err := otlptracehttp.New(ctx) // endpoint and headers come from the standard OTEL_* env vars
	if err != nil {
		log.Printf("Tracing disabled, could not create the OTLP exporter: %v", err)
		return func(context.Context) error { return nil }
	}

	res, _ := resource.Merge(resource.Default(), resource.NewWithAttributes(semconv.SchemaURL,
		semconv.ServiceName(serviceName),
		semconv.ServiceInstanceID(hostname()),
	))

	provider := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(res),
	)
	otel.SetTracerProvider(provider)
	return provider.Shutdown
}

func hostname() string {
	name, _ := os.Hostname()
	return name
}
