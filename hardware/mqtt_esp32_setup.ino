#include <PubSubClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>


// WiFi Configuration
const char *ssid = "YOUR_WIFI_SSID";
const char *password = "YOUR_WIFI_PASSWORD";

// HiveMQ Cloud Configuration
const char *mqtt_server = "YOUR_CLUSTER_ID.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char *mqtt_user = "YOUR_USERNAME";
const char *mqtt_password = "YOUR_PASSWORD";
const char *mqtt_topic = "nutriroot/soil_data";

WiFiClientSecure espClient;
PubSubClient client(espClient);

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
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());

  // Set as insecure for simple setup OR use Root CA
  espClient.setInsecure();
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
    if (client.connect("ESP32_NutriRoot", mqtt_user, mqtt_password)) {
      Serial.println("connected");
      client.subscribe(mqtt_topic);
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
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Example: Publish test data every 10 seconds
  static unsigned long lastMsg = 0;
  unsigned long now = millis();
  if (now - lastMsg > 10000) {
    lastMsg = now;
    String payload = "{\"nitrogen\": 45, \"phosphorus\": 30, \"potassium\": "
                     "50, \"ph\": 6.5}";
    client.publish(mqtt_topic, payload.c_str());
    Serial.println("Data published to HiveMQ");
  }
}
