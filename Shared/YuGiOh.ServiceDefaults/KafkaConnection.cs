using Confluent.Kafka;
using Microsoft.Extensions.Configuration;

namespace YuGiOh.ServiceDefaults
{
    // How every producer and consumer reaches the broker.
    //   Azure (default): Event Hubs' Kafka endpoint, SASL/SSL with the Event Hubs connection string as the password.
    //   Local:           a plain Kafka broker (docker-compose), when Kafka:SecurityProtocol is "Plaintext".
    public static class KafkaConnection
    {
        // Enough settings to reach a broker? Services that find none keep running and just skip Kafka.
        public static bool IsConfigured(IConfiguration config) =>
            !string.IsNullOrWhiteSpace(config["Kafka:BootstrapServers"]) &&
            (UsesPlaintext(config) || !string.IsNullOrWhiteSpace(config["Kafka:ConnectionString"]));

        public static T Apply<T>(T clientConfig, IConfiguration config) where T : ClientConfig
        {
            clientConfig.BootstrapServers = config["Kafka:BootstrapServers"];

            if (UsesPlaintext(config))
            {
                clientConfig.SecurityProtocol = SecurityProtocol.Plaintext;
                return clientConfig;
            }

            clientConfig.SecurityProtocol = SecurityProtocol.SaslSsl;
            clientConfig.SaslMechanism = SaslMechanism.Plain;
            clientConfig.SaslUsername = "$ConnectionString";
            clientConfig.SaslPassword = config["Kafka:ConnectionString"];
            return clientConfig;
        }

        private static bool UsesPlaintext(IConfiguration config) =>
            string.Equals(config["Kafka:SecurityProtocol"], "Plaintext", StringComparison.OrdinalIgnoreCase);
    }
}
