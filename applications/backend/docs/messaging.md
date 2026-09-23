# Messaging transport standard

The message registry owns user-facing copy and stable `MSG.*.V1` identifiers.
The notification registry owns recipient, channel, and template policy under
`NTF.*.V1`. Brokers transport work; they do not contain or select display copy.

Kafka carries durable domain facts such as `EVT.BOOKING.CONFIRMED.V1`. Producers
use the aggregate identifier as the Kafka key so events for one aggregate retain
their order. Consumers commit only after their handler completes and must store
the transport `message_id` before applying side effects to provide idempotency.

RabbitMQ carries commands and delivery jobs such as
`CMD.NOTIFICATION.DELIVER.V1`. Exchanges, queues, and messages are durable;
publisher confirms are required. Failed messages are rejected into the
`fixo.events.dead` exchange for inspection and controlled replay.

Every broker payload uses `MessageEnvelope`. The payload references catalogue
IDs and parameters, never duplicated title/body text. Database state and an
outbox row must be committed in one transaction before a relay publishes the
envelope. A broker publish must never be the only record of a business change.

For local infrastructure, start the optional messaging profile:

```powershell
docker compose --profile messaging up -d rabbitmq kafka
```

Set the API container values when the relay/worker process is enabled:

```text
RABBITMQ_URL=amqp://fixo:fixo_dev_password@rabbitmq:5672/
KAFKA_BROKERS=kafka:9092
```

RabbitMQ management is available at `http://localhost:15672`. Kafka is exposed
on `localhost:9092` for local tooling and as `kafka:9092` inside Compose.
