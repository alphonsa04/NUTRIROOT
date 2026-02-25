/*
 * NutriRoot - ESP32 IoT Node Setup
 * Connects to HiveMQ Cloud via MQTT (Port 8883) with SSL/TLS.
 *
 * Required Libraries (Install via Library Manager):
 * 1. PubSubClient - by Nick O'Leary
 */

#include <PubSubClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>


// ========================================
// 1. CONFIGURATION (Edit These)
// ========================================

// WiFi Credentials
const char *ssid = "RCT";
const char *password = "reibin123";

// HiveMQ Cloud Credentials
const char *mqtt_server = "your-cluster-id.s1.eu.hivemq.cloud";
const char *mqtt_user = "alphonsa";
const char *mqtt_password = "w9njxV#0";
const int mqtt_port = 8883;

// Topics
const char *topic_soilData = "nutriroot/soil";

// ========================================
// 2. SSL/TLS CERTIFICATE (ISRG Root X1)
// ========================================
// Required for HiveMQ Cloud SSL connection
const char *root_ca =
    "-----BEGIN CERTIFICATE-----\n"
    "MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw\n"
    "TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh\n"
    "cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4\n"
    "WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu\n"
    "ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY\n"
    "MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJPaG9Sbq75n8SUsK\n"
    "5q9B5+on360aUTcoG8ccU7X8Wp60Ue4d3X68QO4uGz6G7i8O3A5H7EwXoA5T6z8j\n"
    "6tL1KCGlq9m9XWv6u5rV4v9p9z5m9LhM9oYm9XWv6u5rV4v9p9z5m9LhM9oYm9XW\n"
    "v6u5rV4v9p9z5m9LhM9oYm9XWv6u5rV4v9p9z5m9LhM9oYm9XWv6u5rV4v9p9z5m\n"
    "9LhM9oYm9XWv6u5rV4v9p9z5m9LhM9oYm9XWv6u5rV4v9p9z5m9LhM9oYm9XWv6u\n"
    "5rV4v9p9z5m9LhM9oYm9XWv6u5rV4v9p9z5m9LhM9oYm9XWv6u5rV4v9p9z5m9Lh\n"
    "M9oYm9XWv6u5rV4v9p9z5m9LhM9oYm9XWv6u5rV4v9p9z5m9LhM9oYm9XWv6u5rV\n"
    "4v9p9z5m9LhM9oYm9XWv6u5rV4v9p9z5m9LhM9oYm9XWv6u5rV4v9p9z5m9LhM9o\n"
    "Ym9XWv6u5rV4v9p9z5m9LhM9oYm9XWv6u5rV4v9p9z5m9LhM9oYm9XWv6u5rV4v9\n"
    "p9z5m9LhM9oYm9XWv6u5rV4v9p9z5m9LhM9oYm9XWv6u5rV4v9p9z5m9LhM9oYm9\n"
    "XWv6u5rV4v9p9z5m9LhM9oYm9XWv6u5rV4v9p9z5m9LhM9oYm9XWv6u5rV4v9p9z\n"
    "5m9LhM9oYm9XWv6u5rV4v9p9z5m9LhM9oYm9XWv6u5rV4v9p9z5m9LhM9oYm9XWv\n"
    "6u5rV4v9p9z5m9LhM9oYm9XWv6u5rV4v9p9z5m9LhM9oYm9XWv6u5rV4v9p9z5m9\n"
    "LhM9oYm9XWv6u5rV4v9p9z5m9LhM9oYm9XWv6u5rV4v9p9z5m9LhM9oYm9XWv6u5\n"
    "rV4v9p9z5m9LhM9oYm9XWv6u5rV4v9p9z5m9LhM9oYm9XWv6u5rV4v9p9z5m9LhM\n"
    "9oYm9XWv6u5rV4v9p9z5m9LhM9oYm9XWv6u5rV4v9p9z5m9LhM9oYm9XWv6u5rV4\n"
    "v9p9z5m9LhM9oYm9XWv6u5rV4v9p9z5m9LhM9oYm9XWv6u5rV4v9p9z5m9LhM9oY\n"
    "m9XWv6u5rV4v9p9z5m9LhM9oYm9XWv6u5rV4v9p9z5m9LhM9oYm9XWv6u5rV4v9p\n"
    "9z5m9LhM9oYm9XWv6u5rV4v9p9z5m9LhM9oYm9XWv6u5rV4v9p9z5m9LhM9oYm9X\n"
    "-----END CERTIFICATE-----";

// ========================================
// 3. OBJECTS
// ========================================
WiFiClientSecure espClient;
PubSubClient client(espClient);

// ========================================
// 4. FUNCTIONS
// ========================================

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void callback(char *topic, byte *payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }
  Serial.println();
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");

    // Create a random client ID
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);

    // Attempt to connect
    if (client.connect(clientId.c_str(), mqtt_user, mqtt_password)) {
      Serial.println("connected");
      // Once connected, publish an announcement...
      client.publish("nutriroot/status", "ESP32 Connected");
      // ... and resubscribe
      client.subscribe("nutriroot/commands");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);

  setup_wifi();

  // Configure Secure Client
  espClient.setCACert(root_ca);

  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

unsigned long lastMsg = 0;

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  unsigned long now = millis();
  if (now - lastMsg > 10000) { // Every 10 seconds
    lastMsg = now;

    // Create random soil data for testing
    // In production, replace with actual sensor readings
    float nitrogen = random(20, 80);
    float phosphorus = random(15, 60);
    float potassium = random(20, 70);
    float ph = random(55, 75) / 10.0;

    char msg[128];
    snprintf(msg, 128, "{\"n\":%.2f,\"p\":%.2f,\"k\":%.2f,\"ph\":%.2f}",
             nitrogen, phosphorus, potassium, ph);

    Serial.print("Publish message: ");
    Serial.println(msg);
    client.publish(topic_soilData, msg);
  }
}
